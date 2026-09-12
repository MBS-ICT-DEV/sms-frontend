import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminAPI from '../../api/admin.api';
import {
  Users, UserCog, BookOpen, CreditCard, DollarSign,
  CheckSquare, UserX, TrendingUp, ArrowRight,
  CalendarCheck,
} from 'lucide-react';
import AIAssistant from '../../components/AIAssistant';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, color }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <span className="font-medium text-gray-700 group-hover:text-teal-700 text-sm">{label}</span>
      <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-teal-500 transition" />
    </Link>
  );
}

export default function HoaDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getHoaStats()
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: Users,     label: 'Total Students',      value: stats?.totalStudents,      color: 'bg-blue-500',    sub: 'enrolled' },
    { icon: UserCog,   label: 'Total Teachers',       value: stats?.totalTeachers,      color: 'bg-indigo-500',  sub: `${stats?.suspendedTeachers ?? 0} suspended` },
    { icon: BookOpen,  label: 'Total Classes',        value: stats?.totalClasses,       color: 'bg-teal-500',    sub: 'active' },
    { icon: CreditCard,label: 'Students Paid',        value: stats?.totalPaid,          color: 'bg-green-500',   sub: 'fee payments' },
    { icon: DollarSign,label: 'Total Revenue',        value: stats?.totalRevenue != null ? `₦${stats.totalRevenue.toLocaleString()}` : '—', color: 'bg-emerald-500', sub: 'collected' },
    { icon: UserX,     label: 'Suspended Teachers',   value: stats?.suspendedTeachers,  color: 'bg-red-400',     sub: 'currently suspended' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Head of Activities</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.fullname}. Here's your school overview.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/hoa/teachers"   icon={UserCog}    label="Manage Teachers"   color="bg-indigo-500" />
          <QuickLink href="/hoa/students"   icon={Users}      label="Manage Students"   color="bg-blue-500" />
          <QuickLink href="/hoa/classes"    icon={BookOpen}   label="Manage Classes"    color="bg-teal-500" />
          <QuickLink href="/hoa/attendance" icon={CheckSquare}label="View Attendance"   color="bg-orange-500" />
          <QuickLink href="/hoa/fees"       icon={CreditCard} label="Fees & Payments"   color="bg-green-500" />
          <QuickLink href="/hoa/active-terms"       icon={CalendarCheck} label="Active Terms"   color="bg-green-500" />

          <QuickLink href="/hoa/teachers"   icon={TrendingUp} label="Results Status"    color="bg-purple-500" />
        </div>
      </div>
    </div>
  );
}
