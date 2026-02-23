import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { hasPermission, currentUser } = useAuth()

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '/icons/Dashboard.svg', permission: null },
    { path: '/users', name: 'Users', icon: '/icons/Users.svg', permission: 'manage_users' },
    { path: '/roles', name: 'Roles', icon: '/icons/Roles.png', permission: 'manage_roles' },
    { path: '/permissions', name: 'Permissions', icon: '/icons/Permissions.png', permission: 'manage_permissions' },
    { path: '/analytics', name: 'Analytics', icon: '/icons/Analytics.png', permission: 'view_analytics' },
    { path: '/reports', name: 'Reports', icon: '/icons/Reports.png', permission: 'view_reports' },
    { path: '/audit-logs', name: 'Audit Logs', icon: '/icons/AuditLogs.png', permission: 'view_audit_logs' },
    { path: '/settings', name: 'Settings', icon: '/icons/Settings.svg', permission: null },
  ]

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen fixed top-0 left-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">RBAC System</h1>
        <nav>
          <ul className="space-y-2">
            {visibleMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.icon.startsWith('/') ? (
                    <img src={item.icon} alt={item.name} className="w-5 h-5" />
                  ) : (
                    <span className="text-xl">{item.icon}</span>
                  )}
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
