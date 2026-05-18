-- Add status column to links for read/unread/archive workflow

ALTER TABLE links ADD COLUMN status TEXT NOT NULL DEFAULT 'unread';

CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
