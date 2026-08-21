-- Migration number: 0006 	 2026-08-21T18:00:00.000Z

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  package_qty REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'kg',
  package_price REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ingredients_user ON ingredients(user_id, name);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  yield_packages REAL NOT NULL DEFAULT 1,
  package_unit_name TEXT NOT NULL DEFAULT 'pacotes',
  extra_costs REAL NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,
  cost_per_package REAL NOT NULL DEFAULT 0,
  suggested_price REAL NOT NULL DEFAULT 0,
  items_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id, name);
