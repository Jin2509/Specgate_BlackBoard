"""Files attached to a private conversation: upload a PDF or Word file, list them, read their text, remove them."""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.ws import documents as dc
from app.ws import models as m
from app.ws.deps import current_user, db, not_found, owned_conversation

router = APIRouter(prefix="/conversations/{conv_id}/documents", tags=["documents"])


@router.get("")
def list_documents(conv_id: str, user: m.User = Depends(current_user), s: Session = Depends(db)) -> list[dict]:
    conv = owned_conversation(s, conv_id, user)
    return [dc.document_out(d) for d in dc.list_documents(s, conv.id)]


@router.post("", status_code=201)
async def create_document(conv_id: str, file: UploadFile = File(...), user: m.User = Depends(current_user),
                          s: Session = Depends(db)) -> dict:
    """Keeps the file's text, cut at DOCUMENT_CHARS_MAX characters; every later answer reads it."""
    conv = owned_conversation(s, conv_id, user)
    # One byte over the limit is enough to refuse the file without reading all of it.
    content = await file.read(settings.document_size_max_bytes + 1)
    return dc.document_out(dc.create_document(s, conv, file.filename or "", content))


def _owned_document(s: Session, conv: m.Conversation, document_id: str) -> m.ConversationDocument:
    doc = s.get(m.ConversationDocument, document_id)
    if not doc or doc.conversation_id != conv.id:
        raise not_found("Không tìm thấy file.")
    return doc


@router.get("/{document_id}")
def get_document(conv_id: str, document_id: str, user: m.User = Depends(current_user),
                 s: Session = Depends(db)) -> dict:
    """The text read from the file, as Markdown: what the agent reads."""
    doc = _owned_document(s, owned_conversation(s, conv_id, user), document_id)
    return {**dc.document_out(doc), "markdown": doc.markdown}


@router.delete("/{document_id}", status_code=204)
def delete_document(conv_id: str, document_id: str, user: m.User = Depends(current_user),
                    s: Session = Depends(db)) -> None:
    doc = _owned_document(s, owned_conversation(s, conv_id, user), document_id)
    s.delete(doc)
    s.commit()
