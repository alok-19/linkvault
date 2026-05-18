-- Add content column for full-text article extraction

ALTER TABLE links ADD COLUMN content TEXT DEFAULT '';
ALTER TABLE links ADD COLUMN reading_time INTEGER DEFAULT 0;
ALTER TABLE links ADD COLUMN is_broken INTEGER DEFAULT 0;
ALTER TABLE links ADD COLUMN last_checked TEXT;

CREATE INDEX IF NOT EXISTS idx_links_is_broken ON links(is_broken);
