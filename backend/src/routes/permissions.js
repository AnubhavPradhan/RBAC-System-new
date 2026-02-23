const express = require('express')
const db = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

const getPermissionWithRoles = (id) => {
  const perm = db.prepare('SELECT * FROM permissions WHERE id = ?').get(id)
  if (!perm) return null

  const usedBy = db
    .prepare(
      `SELECT r.name FROM roles r
       JOIN role_permissions rp ON r.id = rp.role_id
       WHERE rp.permission_id = ?`
    )
    .all(id)
    .map((r) => r.name)

  return { ...perm, usedBy }
}

// GET /api/permissions
router.get('/', auth, (req, res) => {
  const permissions = db.prepare('SELECT * FROM permissions').all()
  const result = permissions.map((p) => getPermissionWithRoles(p.id))
  res.json(result)
})

// POST /api/permissions
router.post('/', auth, (req, res) => {
  const { name, description, category, status } = req.body
  if (!name) return res.status(400).json({ error: 'Permission name is required' })

  const existing = db.prepare('SELECT id FROM permissions WHERE name = ?').get(name)
  if (existing) return res.status(409).json({ error: 'Permission already exists' })

  const result = db
    .prepare(
      'INSERT INTO permissions (name, description, category, status) VALUES (?, ?, ?, ?)'
    )
    .run(name, description || '', category || 'General', status || 'Active')

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Create', 'Permission', `Created permission: ${name}`, 'Info')

  res.status(201).json(getPermissionWithRoles(Number(result.lastInsertRowid)))
})

// PUT /api/permissions/:id
router.put('/:id', auth, (req, res) => {
  const { name, description, category, status } = req.body
  const { id } = req.params

  const exists = db.prepare('SELECT * FROM permissions WHERE id = ?').get(id)
  if (!exists) return res.status(404).json({ error: 'Permission not found' })

  db.prepare(
    'UPDATE permissions SET name = ?, description = ?, category = ?, status = ? WHERE id = ?'
  ).run(name, description, category, status, id)

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Update', 'Permission', `Modified permission: ${name}`, 'Warning')

  res.json(getPermissionWithRoles(id))
})

// DELETE /api/permissions/:id
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params
  const perm = db.prepare('SELECT * FROM permissions WHERE id = ?').get(id)
  if (!perm) return res.status(404).json({ error: 'Permission not found' })

  db.prepare('DELETE FROM permissions WHERE id = ?').run(id)

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Delete', 'Permission', `Deleted permission: ${perm.name}`, 'Warning')

  res.json({ message: 'Permission deleted successfully' })
})

module.exports = router
