-- Migration number: 0002 	 2026-08-18T18:00:00.000Z

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  cost_price REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  stock_qty REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_products_user ON products(user_id, name);

ALTER TABLE transactions ADD COLUMN product_id TEXT;

CREATE INDEX idx_transactions_product ON transactions(user_id, product_id);
