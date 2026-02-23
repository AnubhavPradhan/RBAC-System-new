const express = require('express')
const db = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// Helper: get role with its permissions and user count
const getRoleWithPermissions = (id) => {
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id)
  if (!role) return null

  const permissions = db
    .prepare(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`
    )
    .all(id)
    .map((r) => r.name)

  const { count: users } = db
    .prepare('SELECT COUNT(*) as count FROM users WHERE role = ?')
    .get(role.name)

  return { ...role, permissions, users }
}

// GET /api/roles
router.get('/', auth, (req, res) => {
  const roles = db.prepare('SELECT * FROM roles').all()
  const result = roles.map((r) => getRoleWithPermissions(r.id))
  res.json(result)
})

// POST /api/roles
router.post('/', auth, (req, res) => {
  const { name, description, permissions = [] } = req.body
  if (!name) return res.status(400).json({ error: 'Role name is required' })

  const existing = db.prepare('SELECT id FROM roles WHERE name = ?').get(name)
  if (existing) return res.status(409).json({ error: 'Role already exists' })

  const result = db
    .prepare('INSERT INTO roles (name, description) VALUES (?, ?)')
    .run(name, description || '')

  const roleId = Number(result.lastInsertRowid)
  const insertRP = db.prepare(
    'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions WHERE name = ?'
  )
  permissions.forEach((p) => insertRP.run(roleId, p))

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Create', 'Role', `Created role: ${name}`, 'Info')

  res.status(201).json(getRoleWithPermissions(roleId))
})

// PUT /api/roles/:id
router.put('/:id', auth, (req, res) => {
  const { name, description, permissions = [] } = req.body
  const { id } = req.params

  const exists = db.prepare('SELECT * FROM roles WHERE id = ?').get(id)
  if (!exists) return res.status(404).json({ error: 'Role not found' })

  db.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?').run(name, description, id)

  // Replace permissions
  db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(id)
  const insertRP = db.prepare(
    'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions WHERE name = ?'
  )
  permissions.forEach((p) => insertRP.run(id, p))

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Update', 'Role', `Modified role: ${name}`, 'Warning')

  res.json(getRoleWithPermissions(id))
})

// DELETE /api/roles/:id
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id)
  if (!role) return res.status(404).json({ error: 'Role not found' })

  db.prepare('DELETE FROM roles WHERE id = ?').run(id)

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Delete', 'Role', `Deleted role: ${role.name}`, 'Warning')

  res.json({ message: 'Role deleted successfully' })
})

module.exports = router
