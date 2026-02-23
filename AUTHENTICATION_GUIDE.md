# Authentication System - Quick Guide

## ✅ What's Been Implemented

A complete frontend-only authentication system with role-based access control (RBAC).

## 🚀 How to Use

### 1. Start the Application
```bash
cd frontend
npm run dev
```

### 2. Create Your First Account
- Go to `http://localhost:5173/login`
- Click "Sign Up"
- Fill in your details
- Choose a role: **Admin**, **Editor**, or **Viewer**
- Click "Sign Up"

### 3. Role Permissions

#### 👑 Admin
- Full access to everything
- Can manage users, roles, and permissions
- Can view analytics, reports, and audit logs

#### ✏️ Editor  
- Can manage users
- Can view analytics and reports
- Cannot manage roles or permissions
- Cannot view audit logs

#### 👁️ Viewer
- Can only view analytics and reports
- Cannot manage users, roles, or permissions
- Cannot view audit logs

### 4. Testing Different Roles

**Option 1: Create Multiple Accounts**
- Sign up with different emails and roles
- Logout and login with different credentials

**Option 2: Use the Users Page (Admin only)**
- Login as Admin
- Go to Users page
- Add users with different roles
- Logout and login as those users

## 🎯 Key Features

### ✨ Dynamic Sidebar
- Menu items automatically hide based on user permissions
- Users only see pages they have access to

### 🔒 Protected Routes
- Each page checks permissions before rendering
- Unauthorized access shows "Access Denied" message
- Automatic redirect to login if not authenticated

### 💾 Data Persistence
- All data stored in localStorage
- Login state persists across browser sessions
- Users remain logged in until they logout

### 🎨 User Interface
- Clean, modern login/signup page
- User info displayed in top bar
- Logout button in header
- Visual feedback for access denied

## 📋 Permission Mapping

| Page | Permission Required |
|------|-------------------|
| Dashboard | None (all users) |
| Users | `manage_users` |
| Roles | `manage_roles` |
| Permissions | `manage_permissions` |
| Analytics | `view_analytics` |
| Reports | `view_reports` |
| Audit Logs | `view_audit_logs` |
| Settings | None (all users) |

## 🧪 Test Scenarios

### Test 1: Admin Access
1. Sign up as Admin
2. You should see all menu items
3. You can access all pages

### Test 2: Editor Access
1. Sign up as Editor
2. You should see: Dashboard, Users, Analytics, Reports, Settings
3. Try to access `/roles` - you'll get "Access Denied"

### Test 3: Viewer Access
1. Sign up as Viewer
2. You should see: Dashboard, Analytics, Reports, Settings
3. Try to access `/users` - you'll get "Access Denied"

## 🔄 How Authentication Works

1. **Signup**: Creates user in localStorage with selected role
2. **Login**: Checks credentials against localStorage users
3. **Session**: Stores current user in localStorage
4. **Authorization**: Checks user role and permissions for each page
5. **Logout**: Removes current user from localStorage

## ⚠️ Important Notes

### Security (Frontend Only)
- **NOT production-ready** - passwords stored in plain text
- **NO server validation** - can be bypassed with browser tools
- **For development/demo purposes only**

### When to Add Backend
You need backend when you want:
- Real security with encrypted passwords
- Server-side validation
- Shared data across devices
- Persistent data that survives browser clear
- API-based authentication (JWT tokens)
- Production deployment

## 🐛 Troubleshooting

### Issue: Can't login after signup
- Check browser console for errors
- Clear localStorage: `localStorage.clear()` in browser console
- Refresh page and try again

### Issue: Sidebar shows all items regardless of role
- Check that roles have correct permissions in localStorage
- Default roles/permissions are auto-created on first load

### Issue: Getting "Access Denied" on allowed pages
- Check that your role has the required permission
- Verify permissions in `seedData.js` match route requirements

## 🎓 Next Steps

1. **Test the system** with different roles
2. **Customize permissions** in seedData.js
3. **Add more roles** through the Roles page
4. **When ready for production**: Request backend implementation

## 📱 Quick Commands

```bash
# Start dev server
npm run dev

# Clear all data (in browser console)
localStorage.clear()

# View current user (in browser console)
JSON.parse(localStorage.getItem('rbac-current-user'))

# View all users (in browser console)
JSON.parse(localStorage.getItem('rbac-users'))

# View all roles (in browser console)
JSON.parse(localStorage.getItem('rbac-roles'))
```
