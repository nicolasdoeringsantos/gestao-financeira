-- Migration number: 0003 	 2026-08-18T19:00:00.000Z

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_user ON categories(user_id, name);

ALTER TABLE products ADD COLUMN min_stock REAL NOT NULL DEFAULT 0;

ALTER TABLE transactions ADD COLUMN discount REAL NOT NULL DEFAULT 0;

CREATE TABLE cash_entries (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_cash_user ON cash_entries(user_id, date);