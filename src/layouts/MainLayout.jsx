import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  ClipboardList,
  BarChart3,
  UserCog,
  Award,
  Upload,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  User,
  School,
  ClipboardCheck,
  Megaphone,
  History,
  ArrowRightLeft,
  CalendarCheck,
} from 'lucide-react';

/* =========================================================
   NAVIGATION
========================================================= */

const NAV = {
  developer: [
    {
      label: 'Overview',
      href: '/developer/dashboard',
      Icon: LayoutDashboard,
    },
    {
      label: 'Analytics',
      href: '/developer/analytics',
      Icon: BarChart3,
    },
    {
      label: 'Schools',
      href: '/developer/schools',
      Icon: School,
    },
  ],

  admin: [
    {
      label: 'Overview',
      href: '/admin/dashboard',
      Icon: LayoutDashboard,
    },
    {
      label: 'Academic Classes',
      href: '/admin/classes',
      Icon: BookOpen,
    },
    { label: 'Students', href: '/admin/students', Icon: Users },
    { label: 'Teachers', href: '/admin/teachers', Icon: UserCog },
    { label: 'Academic Structure', href: '/admin/academic-management', Icon: School },
    {
      label: 'School Fees',
      href: '/admin/fees',
      Icon: CreditCard,
    },
    { label: 'Announcements', href: '/announcements', Icon: Megaphone },
  ],

  hoa: [
    {
      label: 'Overview',
      href: '/hoa/dashboard',
      Icon: LayoutDashboard,
    },
    {
      label: 'Academic Management',
      href: '/hoa/academic-management',
      Icon: BookOpen,
    },
    {
      label: 'Academic Classes',
      href: '/hoa/classes',
      Icon: BookOpen,
    },
    {
      label: 'Student Migration',
      href: '/hoa/migration',
      Icon: ArrowRightLeft,
    },
    { label: 'Announcements', href: '/announcements', Icon: Megaphone },
    {
      label: 'Faculty',
      href: '/hoa/teachers',
      Icon: UserCog,
    },
    {
      label: 'Learners',
      href: '/hoa/students',
      Icon: Users,
    },
    {
      label: 'Attendance',
      href: '/hoa/attendance',
      Icon: ClipboardCheck,
    },
    {
      label: 'Attendance History',
      href: '/hoa/dashboard/attendance-history',
      Icon: History,
    },
    {
      label: 'School Fees',
      href: '/hoa/fees',
      Icon: CreditCard,
    },
    {
      label: 'Set Terms',
      href:'/hoa/active-terms',
      Icon:CalendarCheck
    }
  ],

  secretary: [
    {
      label: 'Overview',
      href: '/secretary/dashboard',
      Icon: LayoutDashboard,
    },
    {
      label: 'School Fees',
      href: '/secretary/fees',
      Icon: CreditCard,
    },
  ],

  principal: [
    {
      label: 'Overview',
      href: '/principal/dashboard',
      Icon: LayoutDashboard,
    },
    {
      label: 'Learners',
      href: '/principal/students',
      Icon: Users,
    },
    { label: 'Teachers', href: '/principal/teachers', Icon: UserCog },
    { label: 'Classes', href: '/principal/classes', Icon: BookOpen },
    { label: 'Announcements', href: '/announcements', Icon: Megaphone },
    {
      label: 'School Fees',
      href: '/principal/fees',
      Icon: CreditCard,
    },
  
    {
      label: 'Academic Reports',
      href: '/principal/broadsheet',
      Icon: BarChart3,
    },
    {
      label: 'Cumulative Results',
      href: '/principal/cumulative',
      Icon: FileText,
    },
  ],

  teacher: [
    {
      label: 'Overview',
      href: '/teacher/dashboard',
      Icon: LayoutDashboard,
    },
    {
      label: 'Upload Results',
      href: '/teacher/upload-results',
      Icon: Upload,
    },
    {
      label: 'Assignments',
      href: '/teacher/assignments',
      Icon: ClipboardList,
    },
    {
      label: 'Attendance',
      href: '/teacher/attendance',
      Icon: ClipboardCheck,
    },
    { label: 'My Profile', href: '/profile', Icon: User },
    {
      label: 'Fee Status',
      href: '/teacher/fees',
      Icon: CreditCard,
    },
  ],

  student: [
    {
      label: 'Overview',
      href: '/student/dashboard',
      Icon: LayoutDashboard,
    },
    {
      label: 'My Results',
      href: '/student/results',
      Icon: FileText,
    },
    {
      label: 'My Fees',
      href: '/student/fees',
      Icon: CreditCard,
    },
    {
      label: 'Assignments',
      href: '/student/assignments',
      Icon: ClipboardList,
    },
    {
      label: 'Attendance',
      href: '/student/attendance',
      Icon: ClipboardCheck,
    },
    {
      label: 'Report Card',
      href: '/student/report-card',
      Icon: Award,
    },
  ],
};

/* =========================================================
   ROLE COLORS
========================================================= */

const ROLE_COLORS = {
  developer: 'bg-violet-600',
  admin: 'bg-blue-600',
  principal: 'bg-emerald-600',
  hoa: 'bg-cyan-600',
  secretary: 'bg-amber-500',
  teacher: 'bg-orange-500',
  student: 'bg-rose-500',
};

/* =========================================================
   SIDEBAR CONTENT
========================================================= */

function SidebarContent({
  collapsed = false,
  mobile = false,
  onClose,
  user,
  role,
  navItems,
  avatarColor,
  initials,
  onLogout,
}) {
  return (
    <aside
      className={[
        'relative flex flex-col h-full',
        'bg-white text-slate-900',
        'border-r border-slate-200',
        'transition-all duration-300 ease-in-out',
        mobile
          ? 'w-[280px]'
          : collapsed
            ? 'w-[76px]'
            : 'w-[264px]',
      ].join(' ')}
    >
      {/* =================================================
          BRAND
      ================================================= */}

      <div
        className={[
          'flex-shrink-0',
          'border-b border-slate-200',
          'bg-white',
          collapsed && !mobile
            ? 'h-[76px] px-3 flex items-center justify-center'
            : 'h-[76px] px-5 flex items-center',
        ].join(' ')}
      >
        <div
          className={[
            'flex items-center',
            collapsed && !mobile
              ? 'justify-center'
              : 'gap-3',
          ].join(' ')}
        >
          {/* Logo */}

          <div
            className="
              w-10
              h-10
              flex-shrink-0
              rounded-xl
              flex
              items-center
              justify-center
              overflow-hidden
              bg-blue-50
              border
              border-blue-100
            "
          >
            <img
              src="/logo.png"
              alt="MBS"
              className="w-8 h-8 object-contain"
            />
          </div>

          {/* Brand text */}

          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1
                  className="
                    text-[17px]
                    leading-none
                    font-extrabold
                    tracking-tight
                    text-slate-900
                  "
                >
                  MBS
                </h1>

                <span
                  className="
                    px-1.5
                    py-0.5
                    rounded-md
                    bg-blue-50
                    text-blue-600
                    text-[8px]
                    font-bold
                    uppercase
                  "
                >
                  SMS
                </span>
              </div>

              <p
                className="
                  mt-1
                  text-[10px]
                  font-medium
                  text-slate-400
                  truncate
                "
              >
                Mercan Brilliant School
              </p>
            </div>
          )}
        </div>

        {/* Mobile close */}

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              ml-auto
              w-9
              h-9
              rounded-lg
              border
              border-slate-200
              text-slate-500
              flex
              items-center
              justify-center
              hover:bg-slate-100
              hover:text-slate-900
              transition
            "
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* =================================================
          NAVIGATION LABEL
      ================================================= */}

      {(!collapsed || mobile) && (
        <div className="px-5 pt-5 pb-2">
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.12em]
              text-slate-400
            "
          >
            School Management
          </p>
        </div>
      )}

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav
        className="
          flex-1
          overflow-y-auto
          px-3
          pb-4
          space-y-1
          scrollbar-thin
        "
      >
        {navItems.map(({ label, href, Icon }) => (
          <NavLink
            key={href}
            to={href}
            title={
              collapsed && !mobile
                ? label
                : undefined
            }
            className={({ isActive }) =>
              [
                'group',
                'relative',
                'flex',
                'items-center',
                'transition-all',
                'duration-150',

                collapsed && !mobile
                  ? 'justify-center w-full h-11 px-0 rounded-xl'
                  : 'w-full min-h-[44px] px-3 rounded-xl',

                isActive
                  ? [
                      'bg-blue-50',
                      'text-blue-700',
                      'font-semibold',
                    ].join(' ')
                  : [
                      'text-slate-500',
                      'font-medium',
                      'hover:bg-slate-50',
                      'hover:text-slate-900',
                    ].join(' '),
              ].join(' ')
            }
          >
            {/* Active indicator */}

            <span
              className="
                absolute
                left-0
                top-1/2
                -translate-y-1/2
                w-[3px]
                h-5
                rounded-r-full
                bg-blue-600
                opacity-0
                group-[.active]:opacity-100
              "
            />

            {/* Icon */}

            <span
              className="
                w-8
                h-8
                flex
                items-center
                justify-center
                flex-shrink-0
              "
            >
              <Icon
                size={18}
                strokeWidth={2}
              />
            </span>

            {/* Label */}

            {(!collapsed || mobile) && (
              <span
                className="
                  ml-2
                  text-[13px]
                  truncate
                "
              >
                {label}
              </span>
            )}

            {/* Arrow */}

            {(!collapsed || mobile) && (
              <ChevronRight
                size={14}
                className="
                  ml-auto
                  text-slate-300
                  opacity-0
                  -translate-x-1
                  group-hover:opacity-100
                  group-hover:translate-x-0
                  transition-all
                "
              />
            )}
          </NavLink>
        ))}
      </nav>

      {/* =================================================
          ACADEMIC SESSION
      ================================================= */}

      {(!collapsed || mobile) && (
        <div className="px-4 pb-3">
          <div
            className="
              rounded-xl
              bg-slate-50
              border
              border-slate-200
              p-3
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-white
                  border
                  border-slate-200
                  flex
                  items-center
                  justify-center
                  text-blue-600
                "
              >
                <School size={17} />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Academic Session
                </p>

                <p className="text-xs font-semibold text-slate-700 truncate">
                  Current Session
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          USER PROFILE
      ================================================= */}

      <div
        className="
          flex-shrink-0
          border-t
          border-slate-200
          p-3
          bg-white
        "
      >
        <div
          className={[
            'flex items-center gap-3',
            collapsed && !mobile
              ? 'justify-center'
              : '',
          ].join(' ')}
        >
          {/* Avatar */}

          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Open my profile"
            className={`
              w-9
              h-9
              rounded-full
              ${avatarColor}
              flex
              items-center
              justify-center
              text-white
              text-xs
              font-bold
              flex-shrink-0
              ring-2
              ring-white
              shadow-sm
            `}
          >
            {initials || <User size={16} />}
          </button>

          {/* User info */}

          {(!collapsed || mobile) && (
            <div className="min-w-0 flex-1">
              <p
                className="
                  text-[13px]
                  font-semibold
                  text-slate-800
                  truncate
                "
              >
                {user?.fullname || 'User'}
              </p>

              <p
                className="
                  text-[10px]
                  font-medium
                  text-slate-400
                  capitalize
                  truncate
                "
              >
                {role}
              </p>
            </div>
          )}

          {/* Settings */}

          {(!collapsed || mobile) && (
            <button
              type="button"
              title="Settings"
              className="
                w-8
                h-8
                rounded-lg
                flex
                items-center
                justify-center
                text-slate-400
                hover:bg-slate-100
                hover:text-slate-700
                transition
              "
            >
              <Settings size={16} />
            </button>
          )}
        </div>

        {/* Logout */}

        <button
          type="button"
          onClick={onLogout}
          title={
            collapsed && !mobile
              ? 'Logout'
              : undefined
          }
          className={[
            'mt-2',
            'flex',
            'items-center',
            'gap-3',
            'w-full',
            'h-9',
            'rounded-lg',
            'text-[12px]',
            'font-medium',
            'text-slate-500',
            'hover:bg-red-50',
            'hover:text-red-600',
            'transition',

            collapsed && !mobile
              ? 'justify-center'
              : 'px-3',
          ].join(' ')}
        >
          <LogOut
            size={16}
            strokeWidth={2}
          />

          {(!collapsed || mobile) && (
            <span>Sign out</span>
          )}
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   MAIN LAYOUT
========================================================= */

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /* Close mobile sidebar after navigation */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* Handle window resize */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  /* User role */

  const role =
    user?.role?.toLowerCase() || 'student';

  /* Navigation */

  const navItems = NAV[role] || [];

  /* Avatar color */

  const avatarColor =
    ROLE_COLORS[role] || 'bg-blue-600';

  /* User initials */

  const initials = (user?.fullname || 'U')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  /* Logout */

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarProps = {
    user,
    role,
    navItems,
    avatarColor,
    initials,
    onLogout: handleLogout,
  };

  return (
    <div className="h-screen overflow-hidden flex bg-slate-50">

      {/* =================================================
          MOBILE BACKDROP
      ================================================= */}

      <div
        className={[
          'fixed inset-0',
          'bg-slate-900/40',
          'backdrop-blur-[2px]',
          'z-40',
          'lg:hidden',
          'transition-opacity duration-300',

          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      <div
        className={[
          'fixed inset-y-0 left-0',
          'z-50',
          'lg:hidden',
          'transition-transform duration-300',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarContent
          {...sidebarProps}
          mobile
          collapsed={false}
          onClose={() =>
            setMobileOpen(false)
          }
        />
      </div>

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

      <div className="hidden lg:flex flex-shrink-0">
        <SidebarContent
          {...sidebarProps}
          collapsed={collapsed}
          mobile={false}
        />
      </div>

      {/* =================================================
          SIDEBAR COLLAPSE BUTTON
      ================================================= */}

      <button
        type="button"
        onClick={() =>
          setCollapsed((current) => !current)
        }
        aria-label={
          collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
        }
        title={
          collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
        }
        className="
          hidden
          lg:flex
          fixed
          z-30
          items-center
          justify-center
          bottom-24
          w-7
          h-7
          rounded-full
          bg-white
          border
          border-slate-200
          text-slate-500
          shadow-sm
          hover:bg-blue-600
          hover:border-blue-600
          hover:text-white
          transition-all
          duration-200
        "
        style={{
          left: collapsed
            ? '62px'
            : '250px',
        }}
      >
        <ChevronLeft
          size={14}
          className={`
            transition-transform
            duration-300
            ${collapsed ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div
        className="
          flex-1
          flex
          flex-col
          overflow-hidden
          min-w-0
        "
      >

        {/* =================================================
            TOP NAVBAR
        ================================================= */}

        <header
          className="
            h-16
            flex-shrink-0
            bg-white
            border-b
            border-slate-200
            flex
            items-center
            px-4
            md:px-6
            gap-3
          "
        >
          {/* Mobile menu */}

          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() =>
              setMobileOpen(true)
            }
            className="
              lg:hidden
              w-9
              h-9
              rounded-lg
              border
              border-slate-200
              bg-white
              text-slate-500
              flex
              items-center
              justify-center
              hover:bg-slate-50
              hover:text-slate-900
              transition
            "
          >
            <Menu size={20} />
          </button>

          {/* Mobile brand */}

          <div className="lg:hidden flex items-center gap-2">
            <div
              className="
                w-7
                h-7
                rounded-lg
                bg-blue-50
                flex
                items-center
                justify-center
                overflow-hidden
              "
            >
              <img
                src="/logo.png"
                alt="MBS"
                className="w-5 h-5 object-contain"
              />
            </div>

            <span className="font-bold text-gray-800 text-base">
              MBS
            </span>
          </div>

          <div className="flex-1" />

          {/* Desktop user information */}

          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {user?.fullname || 'User'}
            </p>

            <p className="text-xs text-gray-400 capitalize">
              {role}
            </p>
          </div>

          {/* Top avatar */}

          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Open my profile"
            className={`
              w-9
              h-9
              rounded-full
              ${avatarColor}
              flex
              items-center
              justify-center
              text-white
              font-bold
              text-sm
              shadow
              border-0
              cursor-pointer
            `}
          >
            {initials || <User size={16} />}
          </button>
        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main
          className="
            flex-1
            overflow-y-auto
            p-4
            md:p-6
            lg:p-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
