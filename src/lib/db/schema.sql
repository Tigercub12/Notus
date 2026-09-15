PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT,
    canvas_image_url TEXT,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned ON notes(user_id, is_pinned);

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#000000',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    note_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    end_date DATETIME,
    recurrence_rule TEXT,
    is_notified INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date_notified ON events(event_date, is_notified);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);
