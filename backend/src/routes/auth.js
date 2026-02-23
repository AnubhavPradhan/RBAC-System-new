const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, email)

  if (!user || !bcrypt.compareSync(password, user.password)) {
    db.prepare(
      'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
    ).run(email, 'Failed Login', 'Auth', `Failed login attempt for: ${email}`, 'Warning')
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  if (user.status === 'Inactive') {
    return res.status(403).json({ error: 'Account is inactive. Contact administrator.' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(user.email, 'Login', 'Auth', `User logged in: ${user.email}`, 'Info')

  const { password: _, ...userWithoutPassword } = user

  const permissions = db.prepare(`
    SELECT p.name FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = ?
  `).all(user.role).map(p => p.name)

  res.json({ token, user: { ...userWithoutPassword, permissions } })
})

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, username, email, password, role } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? OR (username IS NOT NULL AND username = ?)')
    .get(email, username || '')
  if (existing) {
    return res.status(409).json({ error: 'Email or username already exists' })
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const result = db
    .prepare(
      'INSERT INTO users (name, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(name, username || null, email, hashedPassword, role || 'Viewer', 'Active')

  const newUser = db
    .prepare('SELECT id, name, username, email, role, status, created_at FROM users WHERE id = ?')
    .get(Number(result.lastInsertRowid))

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )

  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(newUser.email, 'Create', 'Auth', `New user registered: ${newUser.email}`, 'Info')

  const newUserPermissions = db.prepare(`
    SELECT p.name FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = ?
  `).all(newUser.role).map(p => p.name)

  res.status(201).json({ token, user: { ...newUser, permissions: newUserPermissions } })
})

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db
    .prepare('SELECT id, name, username, email, role, status, created_at FROM users WHERE id = ?')
    .get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// POST /api/auth/logout
router.post('/logout', auth, (req, res) => {
  db.prepare(
    'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.email, 'Logout', 'Auth', `User logged out: ${req.user.email}`, 'Info')
  res.json({ message: 'Logged out' })
})

module.exports = router
