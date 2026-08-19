-- Migration number: 0005 	 2026-08-18T21:00:00.000Z

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_customers_user ON customers(user_id);

ALTER TABLE transactions ADD COLUMN customer_id INTEGER;

CREATE INDEX idx_transactions_customer ON transactions(customer_id);
