"""Files attached to a private conversation: upload a PDF or Word file, list and remove them."""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
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
    if not content:
        raise ApiError(400, "File đang trống.", "EMPTY")
    return dc.document_out(dc.create_document(s, conv, file.filename or "", content))


@router.delete("/{document_id}", status_code=204)
def delete_document(conv_id: str, document_id: str, user: m.User = Depends(current_user),
                    s: Session = Depends(db)) -> None:
    conv = owned_conversation(s, conv_id, user)
    doc = s.get(m.ConversationDocument, document_id)
    if not doc or doc.conversation_id != conv.id:
        raise not_found("Không tìm thấy file.")
    s.delete(doc)
    s.commit()
