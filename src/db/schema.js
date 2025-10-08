import initSqlJs from 'sql.js';

let db = null;
let SQL = null;

export async function initDatabase() {
  if (db) return db;

  SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  const savedDb = localStorage.getItem('qms_database');
  if (savedDb) {
    const buffer = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workcenters (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS part_numbers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      part_number TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inspection_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dmt_records (
      id TEXT PRIMARY KEY,
      workcenter_id TEXT REFERENCES workcenters(id),
      part_number_id TEXT REFERENCES part_numbers(id),
      operation TEXT DEFAULT '',
      employee_id TEXT REFERENCES employees(id),
      qty INTEGER DEFAULT 0,
      customer_id TEXT REFERENCES customers(id),
      shop_order TEXT DEFAULT '',
      serial_number TEXT DEFAULT '',
      inspection_item_id TEXT REFERENCES inspection_items(id),
      date TEXT DEFAULT (date('now')),
      prepared_by_id TEXT REFERENCES employees(id),
      defect_description TEXT DEFAULT '',
      car_type TEXT DEFAULT 'dmt',
      car_cycle INTEGER DEFAULT 1,
      car_second_cycle_date TEXT,
      disposition_approved_date TEXT,
      disposition_approved_by_id TEXT REFERENCES employees(id),
      sdr_number TEXT DEFAULT '',
      sdr_approve_date TEXT,
      dmt_closed INTEGER DEFAULT 0,
      car_closed_date TEXT,
      is_return INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
    CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
    CREATE INDEX IF NOT EXISTS idx_workcenters_code ON workcenters(code);
    CREATE INDEX IF NOT EXISTS idx_part_numbers_part_number ON part_numbers(part_number);
    CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
    CREATE INDEX IF NOT EXISTS idx_dmt_records_date ON dmt_records(date);
    CREATE INDEX IF NOT EXISTS idx_dmt_records_active ON dmt_records(is_active);
  `);

  saveDatabase();

  return db;
}

export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Array.from(data);
    localStorage.setItem('qms_database', JSON.stringify(buffer));
  }
}

export function getDatabase() {
  return db;
}

export function generateId() {
  return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}
