const express = require('express')
const db = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/audit-logs  (supports ?action=&user=&dateFrom=&dateTo=)
router.get('/', auth, (req, res) => {
  const { action, user, dateFrom, dateTo } = req.query

  let query = 'SELECT * FROM audit_logs WHERE 1=1'
  const params = []

  if (action && action !== 'All') {
    query += ' AND action = ?'
    params.push(action)
  }
  if (user) {
    query += ' AND user_email LIKE ?'
    params.push(`%${user}%`)
  }
  if (dateFrom) {
    query += ' AND timestamp >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    query += ' AND timestamp <= ?'
    params.push(dateTo + ' 23:59:59')
  }

  query += ' ORDER BY id DESC LIMIT 1000'

  const logs = db.prepare(query).all(...params)
  res.json(logs)
})

// POST /api/audit-logs  (manual log entry from frontend)
router.post('/', auth, (req, res) => {
  const { action, resource, details, severity } = req.body
  const result = db
    .prepare(
      'INSERT INTO audit_logs (user_email, action, resource, details, severity) VALUES (?, ?, ?, ?, ?)'
    )
    .run(req.user.email, action, resource || '', details || '', severity || 'Info')

  const newLog = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(Number(result.lastInsertRowid))
  res.status(201).json(newLog)
})

// DELETE /api/audit-logs  (clear all logs)
router.delete('/', auth, (req, res) => {
  db.prepare('DELETE FROM audit_logs').run()
  res.json({ message: 'All audit logs cleared' })
})

// GET /api/audit-logs/export/csv
router.get('/export/csv', auth, (req, res) => {
  const { action, user, dateFrom, dateTo } = req.query

  let query = 'SELECT * FROM audit_logs WHERE 1=1'
  const params = []

  if (action && action !== 'All') { query += ' AND action = ?'; params.push(action) }
  if (user) { query += ' AND user_email LIKE ?'; params.push(`%${user}%`) }
  if (dateFrom) { query += ' AND timestamp >= ?'; params.push(dateFrom) }
  if (dateTo) { query += ' AND timestamp <= ?'; params.push(dateTo + ' 23:59:59') }

  query += ' ORDER BY id DESC'

  const logs = db.prepare(query).all(...params)

  const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Details', 'Severity']
  const rows = logs.map((l) => [
    l.id, l.timestamp, l.user_email, l.action, l.resource, l.details, l.severity
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"')
  res.send(csv)
})

module.exports = router
