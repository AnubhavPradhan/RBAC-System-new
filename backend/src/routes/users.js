const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/users
router.get('/', auth, (req, res) => {
  const users = db
    .prepare('SELECT id, name, username, email, role, status, created_at FROM users')
    .all()
  res.json(users)
})

// POST /api/users  (Admin only)
router.post('/', auth, (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' })
  const { name, username, email, password, role, status } = req.body
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' })
  }

  const hashed = bcrypt.hashSync(password || 'changeme123', 10)
  const result = db
    .prepare(
      'INSERT INTO users (name, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(name, username || null, email, hashed, role || 'Viewer', status || 'Active')

  const newUser = db
    .prepare('SELECT id, name, username, email, role, status, created_at FROM users WHERE id = ?')
    .get(Number(result.lastInsertRowid))

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Create', 'User', `Created user: ${email}`, 'Info')

  res.status(201).json(newUser)
})

// PUT /api/users/:id  (Admin only)
router.put('/:id', auth, (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' })
  const { name, username, email, password, role, status } = req.body
  const { id } = req.params

  const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
  if (!exists) return res.status(404).json({ error: 'User not found' })

  if (password && password.trim() !== '') {
    const hashed = bcrypt.hashSync(password, 10)
    db.prepare(
      'UPDATE users SET name = ?, username = ?, email = ?, password = ?, role = ?, status = ? WHERE id = ?'
    ).run(name, username || null, email, hashed, role, status, id)
  } else {
    db.prepare(
      'UPDATE users SET name = ?, username = ?, email = ?, role = ?, status = ? WHERE id = ?'
    ).run(name, username || null, email, role, status, id)
  }

  const updated = db
    .prepare('SELECT id, name, username, email, role, status, created_at FROM users WHERE id = ?')
    .get(id)

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Update', 'User', `Updated user: ${email}`, 'Info')

  res.json(updated)
})

// DELETE /api/users/:id  (Admin only)
router.delete('/:id', auth, (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' })
  const { id } = req.params
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  db.prepare('DELETE FROM users WHERE id = ?').run(id)

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Delete', 'User', `Deleted user: ${user.email}`, 'Warning')

  res.json({ message: 'User deleted successfully' })
})

module.exports = router
