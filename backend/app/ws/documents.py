"""Turns attached PDF and Word files into Markdown text kept with a conversation and sent to the agent."""

import re
from io import BytesIO
from pathlib import PurePath

import mammoth
from markdownify import markdownify
from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.ws import models as m
from app.ws import service as sv

PDF_MEDIA_TYPE = "application/pdf"
DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PDF_MAGIC = b"%PDF"
ZIP_MAGIC = b"PK\x03\x04"
FILE_NAME_MAX_LENGTH = 200
BYTES_PER_MEGABYTE = 1024 * 1024
EXTRA_BLANK_LINES = re.compile(r"\n{3,}")


def _unreadable() -> ApiError:
    return ApiError(422, "Không đọc được file này. File có thể bị hỏng.", "DOCUMENT_UNREADABLE")


def _pdf_text(content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted and not reader.decrypt(""):
            raise ApiError(422, "File PDF có mật khẩu. Bỏ mật khẩu rồi tải lại.", "DOCUMENT_ENCRYPTED")
        pages = [(page.extract_text() or "").strip() for page in reader.pages]
    except ApiError:
        raise
    except Exception:  # pypdf raises many unrelated types on malformed files; all mean the same to the user
        raise _unreadable() from None
    return "\n\n".join(page for page in pages if page)


def _docx_text(content: bytes) -> str:
    try:
        html = mammoth.convert_to_html(BytesIO(content)).value
    except Exception:  # mammoth raises zip, XML and key errors on files that are not valid .docx
        raise _unreadable() from None
    return markdownify(html, heading_style="ATX", bullets="-")


def to_markdown(file_name: str, content: bytes) -> tuple[str, str]:
    """Return (media type, Markdown text) of a .pdf or .docx file; raise ApiError for anything else."""
    suffix = PurePath(file_name).suffix.lower()
    if suffix == ".pdf" and content.startswith(PDF_MAGIC):
        media_type, text = PDF_MEDIA_TYPE, _pdf_text(content)
    elif suffix == ".docx" and content.startswith(ZIP_MAGIC):
        media_type, text = DOCX_MEDIA_TYPE, _docx_text(content)
    else:
        raise ApiError(415, "Chỉ nhận file PDF hoặc Word (.docx).", "DOCUMENT_TYPE_UNSUPPORTED")
    text = EXTRA_BLANK_LINES.sub("\n\n", text).strip()
    if not text:
        raise ApiError(422, "File không có chữ để đọc, có thể là ảnh scan.", "DOCUMENT_NO_TEXT")
    return media_type, text


def list_documents(s: Session, conversation_id: str) -> list[m.ConversationDocument]:
    return list(s.scalars(select(m.ConversationDocument)
                          .where(m.ConversationDocument.conversation_id == conversation_id)
                          .order_by(m.ConversationDocument.created_at, m.ConversationDocument.id)))


def document_out(doc: m.ConversationDocument) -> dict:
    return {"id": doc.id, "fileName": doc.file_name, "mediaType": doc.media_type, "sizeBytes": doc.size_bytes,
            "charCount": doc.char_count, "sentChars": len(doc.markdown),
            "truncated": len(doc.markdown) < doc.char_count, "createdAt": sv.iso(doc.created_at)}


def context_rows(docs: list[m.ConversationDocument]) -> list[dict]:
    """The files as the system prompt renders them (context.render_documents)."""
    return [{"fileName": d.file_name, "markdown": d.markdown, "charCount": d.char_count,
             "truncated": len(d.markdown) < d.char_count} for d in docs]


def create_document(s: Session, conversation: m.Conversation, file_name: str, content: bytes) -> m.ConversationDocument:
    """Check the limits, read the file's text and keep it with the conversation (the file itself is dropped)."""
    if len(list_documents(s, conversation.id)) >= settings.documents_per_conversation_max:
        raise ApiError(409, f"Mỗi hội thoại đính kèm tối đa {settings.documents_per_conversation_max} file.",
                       "DOCUMENT_LIMIT")
    if len(content) > settings.document_size_max_bytes:
        size_mb = settings.document_size_max_bytes // BYTES_PER_MEGABYTE
        raise ApiError(413, f"File lớn hơn {size_mb} MB.", "DOCUMENT_TOO_LARGE")
    name = PurePath(file_name.replace("\\", "/")).name.strip()[:FILE_NAME_MAX_LENGTH]
    media_type, text = to_markdown(name, content)
    doc = m.ConversationDocument(conversation_id=conversation.id, owner_id=conversation.owner_id, file_name=name,
                                 media_type=media_type, size_bytes=len(content),
                                 markdown=text[:settings.document_chars_max], char_count=len(text))
    s.add(doc)
    conversation.updated_at = m.now()
    s.commit()
    return doc
