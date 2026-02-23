# Enhanced RBAC System

A full-stack **Role-Based Access Control (RBAC)** system with a React frontend and Node.js/Express backend. Supports dynamic roles, permissions, user management, audit logging, and analytics.

## Project Structure

```
├── frontend/                  # React + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/        # Layout, Sidebar, ProtectedRoute
│   │   ├── context/           # AuthContext (auth + permission checks)
│   │   ├── pages/             # Dashboard, Users, Roles, Permissions,
│   │   │                      #   Analytics, Reports, AuditLogs, Settings
│   │   └── utils/             # Axios API client
│   ├── package.json
│   └── vite.config.js
└── backend/                   # Express REST API
    ├── src/
    │   ├── db/                # SQLite setup + seed data
    │   ├── middleware/        # JWT auth middleware
    │   └── routes/            # auth, users, roles, permissions,
    │                          #   auditLogs, reports
    ├── data/                  # SQLite database (auto-created, gitignored)
    ├── .env.example
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 22+ (required for built-in SQLite support)

### 1. Clone the repo
```bash
git clone https://github.com/AnubhavPradhan/Enhanced-RBAC-System.git
cd "Enhanced-RBAC-System"
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Optionally configure environment variables (the app works without this step — defaults are built in):
```bash
cp .env.example .env
# then edit .env to set your own JWT_SECRET and PORT
```

```bash
npm run dev
```
The API runs on `http://localhost:3001`. The SQLite database and default admin account are created automatically on first run.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or whichever port Vite picks).

## Default Admin Account

| Field    | Value             |
|----------|-------------------|
| Username | `admin`           |
| Email    | `admin@gmail.com` |
| Password | `admin123`        |

## Features

- **Dashboard** — Live stats (total users, roles, permissions) and recent activity feed
- **Users Management** — Add, edit, delete users with name, username, email, password, role, status (Admin only)
- **Roles Management** — Create roles with custom permission sets; dynamic role assignment
- **Permissions Management** — Define permissions by category; assign to roles
- **Analytics** — Role distribution and activity charts from live data
- **Reports** — System summary reports
- **Audit Logs** — Full action history with severity levels
- **Settings** — User profile settings
- **Authentication** — JWT-based login/signup, role-aware sidebar, protected routes

## Technologies

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios
- Vite

### Backend
- Node.js 22+ (built-in `node:sqlite`)
- Express 4
- JSON Web Tokens (JWT)
- bcryptjs
- dotenv
- nodemon

## License

MIT
