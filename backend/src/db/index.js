// node:sqlite is built-in to Node.js 22+ — no installation required
const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')

const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const DB_PATH = path.join(dataDir, 'rbac.db')
const db = new DatabaseSync(DB_PATH)

// Performance and integrity settings
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA foreign_keys = ON")

// ─── Create Tables ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    category    TEXT DEFAULT 'General',
    status      TEXT DEFAULT 'Active',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    username   TEXT UNIQUE,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT DEFAULT 'Viewer',
    status     TEXT DEFAULT 'Active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp  TEXT DEFAULT (datetime('now', 'localtime')),
    user_email TEXT DEFAULT 'system',
    action     TEXT NOT NULL,
    resource   TEXT DEFAULT '',
    details    TEXT DEFAULT '',
    severity   TEXT DEFAULT 'Info'
  );
`)

// ─── Helper: wrap run() so lastInsertRowid is always a Number ─────────────────
const runStmt = (sql, ...params) => {
  const result = db.prepare(sql).run(...params)
  return { ...result, lastInsertRowid: Number(result.lastInsertRowid) }
}
db.runStmt = runStmt

// ─── Seed Default Data ────────────────────────────────────────────────────────
const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count

if (roleCount === 0) {
  // Roles
  runStmt('INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)', 'Admin', 'Full system access with all permissions')
  runStmt('INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)', 'Editor', 'Can manage users and view analytics')
  runStmt('INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)', 'Viewer', 'Read-only access to analytics and reports')

  // Permissions
  const perms = [
    ['manage_users', 'Create, edit, and delete users', 'User Management'],
    ['manage_roles', 'Create, edit, and delete roles', 'User Management'],
    ['manage_permissions', 'Create, edit, and delete permissions', 'User Management'],
    ['view_analytics', 'View analytics dashboard', 'Analytics'],
    ['view_reports', 'View and download reports', 'Analytics'],
    ['view_audit_logs', 'View system audit logs', 'System'],
  ]
  perms.forEach(([name, desc, cat]) => {
    runStmt('INSERT OR IGNORE INTO permissions (name, description, category) VALUES (?, ?, ?)', name, desc, cat)
  })

  // Assign permissions to Admin (all)
  const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('Admin')
  const allPerms = db.prepare('SELECT id FROM permissions').all()
  allPerms.forEach(p => runStmt('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', Number(adminRole.id), Number(p.id)))

  // Editor perms
  const editorRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('Editor')
  const editorPerms = db.prepare("SELECT id FROM permissions WHERE name IN ('manage_users', 'view_analytics', 'view_reports')").all()
  editorPerms.forEach(p => runStmt('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', Number(editorRole.id), Number(p.id)))

  // Viewer perms
  const viewerRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('Viewer')
  const viewerPerms = db.prepare("SELECT id FROM permissions WHERE name IN ('view_analytics', 'view_reports')").all()
  viewerPerms.forEach(p => runStmt('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', Number(viewerRole.id), Number(p.id)))

  // Default admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  runStmt(
    'INSERT OR IGNORE INTO users (name, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
    'Admin', 'admin', 'admin@gmail.com', hashedPassword, 'Admin', 'Active'
  )

  console.log('Database seeded with default data.')
}

module.exports = db
