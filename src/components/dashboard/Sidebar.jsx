import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Home, BookOpen, Users, Settings, BarChart3, FileText, Menu, Sun, Moon, LogOut } from 'lucide-react';

const NAV = {
  developer: [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Manage Schools', path: '/developer/schools', icon: <BarChart3 size={18} /> },
    { name: 'Analytics', path: '/developer/analytics', icon: <BarChart3 size={18} /> },
    { name: 'Settings', path: '/developer/settings', icon: <Settings size={18} /> },
  ],
  ],  
  admin: [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Classes', path: '/admin/classes', icon: <BookOpen size={18} /> },
    { name: 'Students', path: '/admin/students', icon: <Users size={18} /> },
    { name: 'Teachers', path: '/admin/teachers', icon: <Users size={18} /> },
  ],
  principal: [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Register Student', path: '/principal/register-student', icon: <FileText size={18} /> },
    { name: 'Reports', path: '/principal/reports', icon: <BarChart3 size={18} /> },
  ],
  teacher: [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Assignments', path: '/teacher/assignments', icon: <FileText size={18} /> },
    { name: 'Results', path: '/teacher/results', icon: <FileText size={18} /> },
  ],
  student: [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'My Results', path: '/student/results', icon: <FileText size={18} /> },
    { name: 'Assignments', path: '/student/assignments', icon: <FileText size={18} /> },
  ],
};

const ROLE_COLORS = {
  developer: '#7c3aed',
  admin: '#2563eb',
  principal: '#0891b2',
  teacher: '#16a34a',
  student: '#d97706',
};

export const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const items = NAV[user?.role] || [];
  const roleColor = ROLE_COLORS[user?.role] || '#2563eb';
  const initials = (user?.fullname || user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)',
      minWidth: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', minHeight: 64 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, color: 'white' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', lineHeight: 1 }}>EduManage</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>School Portal</div>
            </div>
          </div>
        )}
        <button onClick={onToggle} className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition flex-shrink-0">
          {collapsed ? <Menu size={18} /> : <Menu size={18} className="rotate-180" />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: roleColor + '22', color: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, border: `2px solid ${roleColor}44` }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullname || user?.name || 'User'}</div>
              <div style={{ fontSize: '0.72rem', color: roleColor, fontWeight: 600, textTransform: 'capitalize', background: roleColor + '18', padding: '0.1rem 0.5rem', borderRadius: 99, display: 'inline-block', marginTop: 2 }}>{user?.role}</div>

              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullname || user?.name || 'User'}</div>

              <div style={{ fontSize: '0.72rem', color: roleColor, fontWeight: 600, textTransform: 'capitalize', background: roleColor + '18', padding: '0.1rem 0.5rem', borderRadius: 99, display: 'inline-block', marginTop: 2 }}>{user?.role}</div>
              
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: collapsed ? '0.7rem' : '0.65rem 0.85rem',
              borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: isActive ? roleColor + '18' : 'transparent',
              color: isActive ? roleColor : 'var(--text-muted)',
              borderLeft: isActive ? `3px solid ${roleColor}` : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ color: 'inherit', flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
        <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-none border-none cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-semibold text-sm justify-center lg:justify-start transition mb-2">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-none border-none cursor-pointer text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold text-sm justify-center lg:justify-start transition">
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
