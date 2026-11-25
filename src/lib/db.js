import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const DB_PATH = process.env.CRM_DB_PATH || path.join(process.cwd(), 'data', 'crm.db')
const DATA_DIR = path.dirname(DB_PATH)
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// Guard against multiple instances during Next.js hot reload
const globalForDb = globalThis
if (!globalForDb.__crmDb) {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'agent',
      branch TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket TEXT DEFAULT '',
      start_call TEXT DEFAULT '',
      second_call TEXT DEFAULT '',
      closing_date TEXT DEFAULT '',
      branch TEXT DEFAULT '',
      destination TEXT DEFAULT '',
      mobile_type TEXT DEFAULT '',
      sold_by TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',
      contact_number TEXT DEFAULT '',
      description TEXT DEFAULT '',
      final_conclusion TEXT DEFAULT '',
      status TEXT DEFAULT 'Pending',
      handled_by TEXT DEFAULT '',
      issue_code TEXT DEFAULT '',
      exception TEXT DEFAULT '',
      amount_refund TEXT DEFAULT '',
      refund_reason TEXT DEFAULT '',
      follow_up TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_by_id INTEGER,
      created_at TEXT NOT NULL,
      updated_by TEXT DEFAULT '',
      updated_at TEXT,
      source TEXT DEFAULT 'manual',
      deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      deleted_by TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_branch ON issues(branch);
    CREATE INDEX IF NOT EXISTS idx_issues_contact ON issues(contact_number);
    CREATE INDEX IF NOT EXISTS idx_issues_customer ON issues(customer_name);
    CREATE INDEX IF NOT EXISTS idx_issues_ticket ON issues(ticket);
    CREATE INDEX IF NOT EXISTS idx_issues_deleted ON issues(deleted);
    CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);

    CREATE TABLE IF NOT EXISTS issue_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      issue_ticket TEXT DEFAULT '',
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      changes TEXT DEFAULT '',
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_history_issue ON issue_history(issue_id);
  `)

  // Migration for existing databases: add refund_reason column if missing
  try {
    db.exec("ALTER TABLE issues ADD COLUMN refund_reason TEXT DEFAULT ''")
  } catch {
    // column already exists
  }

  // Seed first admin if no users exist — race-safe against parallel worker processes
  try {
    db.prepare(
      'INSERT OR IGNORE INTO users (username, name, role, password_hash, active, created_at) VALUES (?,?,?,?,1,?)'
    ).run('admin', 'Administrator', 'admin', bcrypt.hashSync('admin123', 10), new Date().toISOString())
  } catch {
    // another process already seeded — ignore
  }

  globalForDb.__crmDb = db
}

export function getDb() {
  return globalForDb.__crmDb
}

export function findUserByUsername(username) {
  return getDb()
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username)
}

export function findUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id)
}
