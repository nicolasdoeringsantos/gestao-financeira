-- Migration number: 0001 	 2026-08-18T14:48:02.181Z

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'venda',
  name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  quantity REAL NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE login_attempts (
  email TEXT NOT NULL,
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);

CREATE INDEX idx_transactions_user ON transactions(user_id, date);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_login_attempts ON login_attempts(email, attempted_at);
