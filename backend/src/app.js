require('dotenv').config()
const express = require('express')
const cors = require('cors')

// Fallback defaults so the app works without a .env file
process.env.JWT_SECRET = process.env.JWT_SECRET || 'rbac_default_secret_key_change_in_production'
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/, credentials: true }))
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/roles', require('./routes/roles'))
app.use('/api/permissions', require('./routes/permissions'))
app.use('/api/audit-logs', require('./routes/auditLogs'))
app.use('/api/reports', require('./routes/reports'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`RBAC API running on http://localhost:${PORT}`)
})
