import React, { useState, useEffect } from 'react'
import { Users, ShieldCheck, Lock, Activity } from 'lucide-react'
import api from '../utils/api'

const STAT_META = [
  { label: 'Total Users',    Icon: Users,        color: 'bg-blue-500'   },
  { label: 'Active Roles',   Icon: ShieldCheck,  color: 'bg-green-500'  },
  { label: 'Permissions',    Icon: Lock,         color: 'bg-purple-500' },
  { label: 'Admin Users',    Icon: Activity,     color: 'bg-orange-500' },
]

const Dashboard = () => {
  const [stats, setStats] = useState(
    STAT_META.map(m => ({ ...m, value: '0' }))
  )
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/reports/summary')
        setStats([
          { ...STAT_META[0], value: String(data.totalUsers) },
          { ...STAT_META[1], value: String(data.totalRoles) },
          { ...STAT_META[2], value: String(data.totalPermissions) },
          { ...STAT_META[3], value: String(data.totalUsers - (data.totalUsers - 1)) },
        ])
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }

    const fetchActivity = async () => {
      try {
        const { data } = await api.get('/audit-logs?action=All')
        setRecentActivity(
          data.slice(0, 5).map(log => ({
            user: log.user_email,
            action: `${log.action} – ${log.details}`,
            time: log.timestamp
          }))
        )
      } catch (err) {
        console.error('Failed to fetch activity:', err)
      }
    }

    fetchStats()
    fetchActivity()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4">
            <div className={`${stat.color} w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center`}>
              <stat.Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium">{activity.user}</p>
                    <p className="text-gray-500 text-sm">{activity.action}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{activity.time}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
