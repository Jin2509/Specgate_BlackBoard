-- Adds files attached to conversations (their text only) and the token counts each answer used.

CREATE TABLE ws_conversation_documents (
    id              varchar      PRIMARY KEY,
    conversation_id varchar      NOT NULL REFERENCES ws_conversations (id) ON DELETE CASCADE,
    owner_id        varchar      NOT NULL REFERENCES ws_users (id),
    file_name       varchar(200) NOT NULL,
    media_type      varchar(100) NOT NULL,
    size_bytes      integer      NOT NULL CHECK (size_bytes > 0),
    -- Text sent to the agent, cut at DOCUMENT_CHARS_MAX; char_count is the length before the cut.
    markdown        text         NOT NULL,
    char_count      integer      NOT NULL CHECK (char_count >= 0),
    created_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_ws_conversation_documents_conversation_id ON ws_conversation_documents (conversation_id);

ALTER TABLE ws_conversation_documents ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON public.ws_conversation_documents FROM anon, authenticated;
    END IF;
END $$;

ALTER TABLE ws_turns
    ADD COLUMN input_tokens        integer CHECK (input_tokens >= 0),
    ADD COLUMN cached_input_tokens integer CHECK (cached_input_tokens >= 0),
    ADD COLUMN cache_write_tokens  integer CHECK (cache_write_tokens >= 0),
    ADD COLUMN output_tokens       integer CHECK (output_tokens >= 0);
