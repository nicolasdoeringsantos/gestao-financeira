-- Migration number: 0004 	 2026-08-18T20:00:00.000Z

ALTER TABLE users ADD COLUMN monthly_goal REAL NOT NULL DEFAULT 0;

ALTER TABLE transactions ADD COLUMN status TEXT NOT NULL DEFAULT 'pago';
ALTER TABLE transactions ADD COLUMN received_at TEXT;

CREATE TABLE password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id);