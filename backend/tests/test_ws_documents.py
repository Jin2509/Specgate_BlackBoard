"""PDF and Word files in a private conversation or a channel: text extraction, limits, and what the agent reads."""

import io
import zipfile

from app.config import settings
from test_ws import add_member, api, ask, login, shared, with_key  # noqa: F401

DOCX_CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" '
    'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    "</Types>")
DOCX_RELS = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" '
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
    'Target="word/document.xml"/>'
    "</Relationships>")


def make_pdf(text: str) -> bytes:
    """A one-page PDF whose page shows `text` in Helvetica."""
    stream = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    out += b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets)
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n".encode()
    return bytes(out)


def make_docx(heading: str, paragraph: str) -> bytes:
    """A .docx with one Heading 1 and one paragraph."""
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
        f'<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>{heading}</w:t></w:r></w:p>'
        f"<w:p><w:r><w:t>{paragraph}</w:t></w:r></w:p>"
        "</w:body></w:document>")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", DOCX_CONTENT_TYPES)
        archive.writestr("_rels/.rels", DOCX_RELS)
        archive.writestr("word/document.xml", body)
    return buffer.getvalue()


def upload(c, h, conv_id, name, content):
    return c.post(f"/api/v1/conversations/{conv_id}/documents", headers=h, files={"file": (name, content)})


def new_conversation(c):
    h, _ = login(c, "lan-pham", "Lan")
    with_key(c, h)
    return h, c.post("/api/v1/conversations", headers=h, json={}).json()


def test_should_keep_pdf_text_and_send_it_to_the_agent(api):
    h, conv = new_conversation(api)
    r = upload(api, h, conv["id"], "de-bai.pdf", make_pdf("UIT student survey"))
    assert r.status_code == 201, r.text
    doc = r.json()
    assert doc["fileName"] == "de-bai.pdf" and doc["mediaType"] == "application/pdf" and not doc["truncated"]
    context = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=h).json()
    assert "## de-bai.pdf" in context["system"] and "UIT student survey" in context["system"]
    assert [d["id"] for d in context["documents"]] == [doc["id"]]
    assert "Mình đã đọc tài liệu đính kèm." in ask(api, h, conv["id"], "Tóm tắt file")["turn"]["text"]


def test_should_turn_word_headings_into_markdown(api):
    h, conv = new_conversation(api)
    assert upload(api, h, conv["id"], "plan.docx", make_docx("Muc tieu", "Khao sat sinh vien")).status_code == 201
    system = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=h).json()["system"]
    assert "# Muc tieu" in system and "Khao sat sinh vien" in system


def test_should_list_documents_with_the_conversation(api):
    h, conv = new_conversation(api)
    upload(api, h, conv["id"], "a.pdf", make_pdf("first"))
    full = api.get(f"/api/v1/conversations/{conv['id']}", headers=h).json()
    assert [d["fileName"] for d in full["documents"]] == ["a.pdf"]


def test_should_reject_files_that_are_not_pdf_or_docx(api):
    h, conv = new_conversation(api)
    assert upload(api, h, conv["id"], "notes.txt", b"plain text").json()["error"]["code"] == "DOCUMENT_TYPE_UNSUPPORTED"
    renamed = upload(api, h, conv["id"], "fake.pdf", b"not a pdf at all")
    assert renamed.status_code == 415


def test_should_report_a_damaged_pdf(api):
    h, conv = new_conversation(api)
    r = upload(api, h, conv["id"], "broken.pdf", b"%PDF-1.4\nnot really a pdf")
    assert r.status_code == 422 and r.json()["error"]["code"] in ("DOCUMENT_UNREADABLE", "DOCUMENT_NO_TEXT")


def test_should_report_a_pdf_without_text(api):
    h, conv = new_conversation(api)
    r = upload(api, h, conv["id"], "scan.pdf", make_pdf(""))
    assert r.status_code == 422 and r.json()["error"]["code"] == "DOCUMENT_NO_TEXT"


def test_should_reject_a_file_over_the_size_limit(api, monkeypatch):
    monkeypatch.setattr(settings, "document_size_max_bytes", 100)
    h, conv = new_conversation(api)
    r = upload(api, h, conv["id"], "big.pdf", make_pdf("x" * 200))
    assert r.status_code == 413 and r.json()["error"]["code"] == "DOCUMENT_TOO_LARGE"


def test_should_limit_documents_per_conversation(api, monkeypatch):
    monkeypatch.setattr(settings, "documents_per_conversation_max", 1)
    h, conv = new_conversation(api)
    assert upload(api, h, conv["id"], "a.pdf", make_pdf("one")).status_code == 201
    r = upload(api, h, conv["id"], "b.pdf", make_pdf("two"))
    assert r.status_code == 409 and r.json()["error"]["code"] == "DOCUMENT_LIMIT"


def test_should_cut_long_text_and_say_so_to_the_agent(api, monkeypatch):
    monkeypatch.setattr(settings, "document_chars_max", 10)
    h, conv = new_conversation(api)
    doc = upload(api, h, conv["id"], "long.pdf", make_pdf("abcdefghijklmnopqrstuvwxyz")).json()
    assert doc["truncated"] and doc["sentChars"] == 10 and doc["charCount"] == 26
    system = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=h).json()["system"]
    assert "abcdefghij" in system and "abcdefghijk" not in system and "chỉ 10 ký tự đầu" in system


def test_should_hide_documents_of_another_user(api):
    h, conv = new_conversation(api)
    doc = upload(api, h, conv["id"], "a.pdf", make_pdf("private")).json()
    other, _ = login(api, "long-tran", "Long")
    assert api.get(f"/api/v1/conversations/{conv['id']}/documents", headers=other).status_code == 404
    assert upload(api, other, conv["id"], "b.pdf", make_pdf("x")).status_code == 404
    assert api.delete(f"/api/v1/conversations/{conv['id']}/documents/{doc['id']}", headers=other).status_code == 404


def test_should_stop_sending_a_removed_document(api):
    h, conv = new_conversation(api)
    doc = upload(api, h, conv["id"], "a.pdf", make_pdf("gone soon")).json()
    assert api.delete(f"/api/v1/conversations/{conv['id']}/documents/{doc['id']}", headers=h).status_code == 204
    context = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=h).json()
    assert context["documents"] == [] and "gone soon" not in context["system"]


def test_should_delete_documents_with_their_conversation(api):
    h, conv = new_conversation(api)
    upload(api, h, conv["id"], "a.pdf", make_pdf("text"))
    assert api.delete(f"/api/v1/conversations/{conv['id']}", headers=h).status_code == 204
    assert api.get(f"/api/v1/conversations/{conv['id']}/documents", headers=h).status_code == 404


def test_should_place_documents_between_team_state_and_timeline(api):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    ws = shared(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={"workspaceId": ws["id"]}).json()
    upload(api, h, conv["id"], "a.pdf", make_pdf("attached"))
    system = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=h).json()["system"]
    assert system.index("## Đề bài") < system.index("attached") < system.index("## Dòng thời gian")



def test_should_return_the_markdown_read_from_an_attached_file(api):
    h, conv = new_conversation(api)
    doc = upload(api, h, conv["id"], "plan.docx", make_docx("Muc tieu", "Khao sat sinh vien")).json()
    r = api.get(f"/api/v1/conversations/{conv['id']}/documents/{doc['id']}", headers=h)
    assert r.status_code == 200
    assert r.json()["markdown"] == "# Muc tieu\n\nKhao sat sinh vien" and r.json()["fileName"] == "plan.docx"


def test_should_hide_the_markdown_of_another_users_file(api):
    h, conv = new_conversation(api)
    doc = upload(api, h, conv["id"], "de-bai.pdf", make_pdf("Secret plan")).json()
    other, _ = login(api, "long-tran", "Long")
    assert api.get(f"/api/v1/conversations/{conv['id']}/documents/{doc['id']}", headers=other).status_code == 404


def channel_upload(c, h, ws, name, content, ch="chung"):
    return c.post(f"/api/v1/workspaces/{ws['id']}/channels/{ch}/documents", headers=h, files={"file": (name, content)})


def test_should_post_the_text_of_a_channel_file_as_a_message(api):
    lan, _ = login(api, "lan-pham", "Lan")
    long, _ = login(api, "long-tran", "Long")
    ws = shared(api, lan)
    add_member(api, lan, ws, long)
    r = channel_upload(api, long, ws, "de-bai.pdf", make_pdf("UIT student survey"))
    assert r.status_code == 201, r.text
    attachment = r.json()["messages"][0]["attachment"]
    assert attachment["type"] == "document" and attachment["fileName"] == "de-bai.pdf"
    assert attachment["markdown"] == "UIT student survey" and not attachment["truncated"]
    seen = api.get(f"/api/v1/workspaces/{ws['id']}/channels/chung/messages", headers=lan).json()["messages"]
    assert seen[-1]["attachment"]["markdown"] == "UIT student survey"


def test_should_cut_a_long_channel_file_and_say_so(api, monkeypatch):
    monkeypatch.setattr(settings, "document_chars_max", 5)
    lan, _ = login(api, "lan-pham", "Lan")
    ws = shared(api, lan)
    attachment = channel_upload(api, lan, ws, "de-bai.pdf", make_pdf("UIT student survey")).json()["messages"][0][
        "attachment"]
    assert attachment["markdown"] == "UIT s" and attachment["truncated"] and attachment["charCount"] == 18


def test_should_refuse_a_channel_file_from_a_non_member(api):
    lan, _ = login(api, "lan-pham", "Lan")
    stranger, _ = login(api, "trang@example.edu", "Trang", provider="google")
    ws = shared(api, lan)
    assert channel_upload(api, stranger, ws, "de-bai.pdf", make_pdf("x")).status_code == 403


def test_should_refuse_an_unsupported_channel_file(api):
    lan, _ = login(api, "lan-pham", "Lan")
    ws = shared(api, lan)
    r = channel_upload(api, lan, ws, "notes.txt", b"plain text")
    assert r.status_code == 415 and r.json()["error"]["code"] == "DOCUMENT_TYPE_UNSUPPORTED"


def test_should_give_the_uploaders_agent_only_a_marker_of_a_channel_file(api):
    lan, _ = login(api, "lan-pham", "Lan")
    with_key(api, lan)
    ws = shared(api, lan)
    channel_upload(api, lan, ws, "de-bai.pdf", make_pdf("UIT student survey"))
    conv = api.post("/api/v1/conversations", headers=lan, json={"workspaceId": ws["id"]}).json()
    system = api.get(f"/api/v1/conversations/{conv['id']}/context", headers=lan).json()["system"]
    assert "[Đã gửi tệp de-bai.pdf (18 ký tự) vào kênh]" in system and "UIT student survey" not in system


def test_should_drop_nul_characters_that_postgres_refuses(api):
    h, _ = login(api, "lan-pham", "Lan")
    with_key(api, h)
    conv = api.post("/api/v1/conversations", headers=h, json={}).json()
    r = api.post(f"/api/v1/conversations/{conv['id']}/documents", headers=h,
                 files={"file": ("de\x00bai.pdf", make_pdf("Muc tieu\x00 kiem chung"), "application/pdf")})
    assert r.status_code == 201, r.text
    doc = api.get(f"/api/v1/conversations/{conv['id']}/documents/{r.json()['id']}", headers=h).json()
    assert "\x00" not in doc["markdown"] and "\x00" not in doc["fileName"]
    assert doc["markdown"] == "Muc tieu kiem chung"
