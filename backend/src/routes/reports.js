const express = require('express')
const db = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/reports/summary — dashboard-style overview
router.get('/summary', auth, (req, res) => {
  const totalUsers      = db.prepare('SELECT COUNT(*) as c FROM users').get().c
  const activeUsers     = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'Active'").get().c
  const totalRoles      = db.prepare('SELECT COUNT(*) as c FROM roles').get().c
  const totalPermissions = db.prepare('SELECT COUNT(*) as c FROM permissions').get().c
  const totalLogs       = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c
  const criticalEvents  = db.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE severity = 'Critical'").get().c
  const warningEvents   = db.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE severity = 'Warning'").get().c
  const failedLogins    = db.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE action = 'Failed Login'").get().c

  res.json({ totalUsers, activeUsers, totalRoles, totalPermissions, totalLogs, criticalEvents, warningEvents, failedLogins })
})

// GET /api/reports/user-activity
router.get('/user-activity', auth, (req, res) => {
  const { dateFrom, dateTo } = req.query
  let query = "SELECT * FROM audit_logs WHERE action IN ('Login', 'Logout', 'Failed Login')"
  const params = []
  if (dateFrom) { query += ' AND timestamp >= ?'; params.push(dateFrom) }
  if (dateTo)   { query += ' AND timestamp <= ?'; params.push(dateTo + ' 23:59:59') }
  query += ' ORDER BY id DESC LIMIT 500'
  res.json(db.prepare(query).all(...params))
})

// GET /api/reports/role-assignment
router.get('/role-assignment', auth, (req, res) => {
  const data = db.prepare(`
    SELECT r.name as role, r.description, COUNT(u.id) as user_count
    FROM roles r LEFT JOIN users u ON u.role = r.name
    GROUP BY r.id, r.name
  `).all()
  res.json(data)
})

// GET /api/reports/permission-audit
router.get('/permission-audit', auth, (req, res) => {
  const data = db.prepare(`
    SELECT p.name, p.description, p.category, p.status, COUNT(rp.role_id) as role_count
    FROM permissions p LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    GROUP BY p.id
  `).all()
  res.json(data)
})

// GET /api/reports/security-summary
router.get('/security-summary', auth, (req, res) => {
  const data = db.prepare(`
    SELECT action, severity, COUNT(*) as count
    FROM audit_logs
    WHERE severity IN ('Critical', 'Warning')
    GROUP BY action, severity
    ORDER BY count DESC
  `).all()
  res.json(data)
})

// GET /api/reports/system-usage
router.get('/system-usage', auth, (req, res) => {
  const data = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    GROUP BY action
    ORDER BY count DESC
  `).all()
  res.json(data)
})

// GET /api/reports/export/csv?type=user-activity|role-assignment|permission-audit|security-summary
router.get('/export/csv', auth, (req, res) => {
  const { type } = req.query
  let data = []
  let filename = 'report.csv'

  switch (type) {
    case 'user-activity':
      data = db.prepare("SELECT id, timestamp, user_email as user, action, resource, details, severity FROM audit_logs ORDER BY id DESC").all()
      filename = 'user-activity-report.csv'
      break
    case 'role-assignment':
      data = db.prepare(`
        SELECT r.name as role, r.description, COUNT(u.id) as user_count
        FROM roles r LEFT JOIN users u ON u.role = r.name
        GROUP BY r.id
      `).all()
      filename = 'role-assignment-report.csv'
      break
    case 'permission-audit':
      data = db.prepare(`
        SELECT p.name, p.description, p.category, p.status, COUNT(rp.role_id) as role_count
        FROM permissions p LEFT JOIN role_permissions rp ON p.id = rp.permission_id
        GROUP BY p.id
      `).all()
      filename = 'permission-audit-report.csv'
      break
    case 'security-summary':
      data = db.prepare(`
        SELECT action, severity, COUNT(*) as event_count
        FROM audit_logs WHERE severity IN ('Critical', 'Warning')
        GROUP BY action, severity ORDER BY event_count DESC
      `).all()
      filename = 'security-summary-report.csv'
      break
    case 'compliance':
      data = db.prepare(`
        SELECT u.name, u.email, u.role, u.status,
               COUNT(p.id) as permissions_count
        FROM users u
        LEFT JOIN roles r ON u.role = r.name
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        GROUP BY u.id
      `).all()
      filename = 'compliance-report.csv'
      break
    default:
      data = db.prepare('SELECT id, name, email, role, status, created_at FROM users').all()
      filename = 'users-report.csv'
  }

  if (data.length === 0) {
    return res.status(404).json({ error: 'No data available for this report' })
  }

  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(csv)
})

module.exports = router
