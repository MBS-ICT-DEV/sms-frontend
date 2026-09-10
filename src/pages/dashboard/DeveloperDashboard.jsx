import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatCard, Button, Modal, PageHeader } from '../../components/common/UIComponents';
import { useApp } from '../../context/AppContext';
import { useForm } from '../../hooks/useForm';
import adminAPI from '../../api/admin.api';
import toast from 'react-hot-toast';
import { Building2, Users, CreditCard, TrendingUp, Plus, BarChart3, RefreshCw, Loader2 } from 'lucide-react';

<<<<<<< HEAD
const BAR_DATA = [
  { month: 'Jan', value: 65 }, { month: 'Feb', value: 72 }, { month: 'Mar', value: 80 },
  { month: 'Apr', value: 74 }, { month: 'May', value: 90 }, { month: 'Jun', value: 85 },
];

const FALLBACK_SCHOOLS = [
  { _id: '1', name: 'Greenwood High', location: 'Lagos', students: 1250, status: 'active', plan: 'Premium' },
  { _id: '2', name: 'Sunrise Academy', location: 'Abuja', students: 850, status: 'active', plan: 'Basic' },
  { _id: '3', name: 'Bright Future School', location: 'Kano', students: 650, status: 'trial', plan: 'Trial' },
  { _id: '4', name: 'Royal College', location: 'PH', students: 920, status: 'active', plan: 'Premium' },
];
=======


>>>>>>> a665f935 (Update school management frontend)

export const DeveloperDashboard = () => {
  const { schools, schoolsLoading, fetchSchools, createAdmin, analytics, fetchAnalytics } = useApp();
  const [modal, setModal] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', capacity: '', schoolName: '' });
  const { values, handleChange, reset, submit, loading } = useForm(
    { fullname: '', email: '', password: '', schoolName: '' },
    (v) => {
      const e = {};
      if (!v.fullname) e.fullname = 'Required';
      if (!v.email) e.email = 'Required';
      if (!v.password || v.password.length < 6) e.password = 'Min 6 characters';
      return e;
    }
  );

  useEffect(() => {
    fetchSchools().catch(() => {});
    fetchAnalytics().catch(() => {});
  }, []);

  const displaySchools = schools.length > 0 ? schools : FALLBACK_SCHOOLS;

  const stats = analytics ? [
<<<<<<< HEAD
    { icon: <Building2 size={20} />, title: 'Total Schools', value: analytics.totalSchools || displaySchools.length, change: '+12% this month', color: '#2563eb' },
    { icon: <Users size={20} />, title: 'Total Users', value: analytics.totalUsers || '1,248', change: '+8% this month', color: '#7c3aed' },
=======
   
>>>>>>> a665f935 (Update school management frontend)
    { icon: <CreditCard size={20} />, title: 'Subscriptions', value: analytics.activeSubscriptions || '18', change: '2 new', color: '#16a34a' },
    { icon: <TrendingUp size={20} />, title: 'Revenue', value: analytics.revenue || '₦2.4M', change: '+15% this month', color: '#d97706' },
  ] : [
    { icon: <Building2 size={20} />, title: 'Total Schools', value: displaySchools.length, change: '+12% this month', color: '#2563eb' },
    { icon: <Users size={20} />, title: 'Total Users', value: '1,248', change: '+8% this month', color: '#7c3aed' },
    { icon: <CreditCard size={20} />, title: 'Subscriptions', value: '18', change: '2 new', color: '#16a34a' },
    { icon: <TrendingUp size={20} />, title: 'Revenue', value: '₦2.4M', change: '+15% this month', color: '#d97706' },
  ];

  const handleCreateAdmin = () => submit(async (vals) => {
    await createAdmin(vals);
    reset();
    setModal(null);
  });

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.name.trim()) return toast.error('Class name is required');
    try {
      const res = await adminAPI.createClass({
        name: classForm.name.trim(),
        capacity: parseInt(classForm.capacity) || 30,
        schoolName: classForm.schoolName
      });
      toast.success(res.data.message || 'Class created successfully');
      setModal(null);
      setClassForm({ name: '', capacity: '', schoolName: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    }
  };

  return (
    <div>
      <PageHeader
        title="Developer Dashboard"
        subtitle="System overview and management"
        action={<Button variant="primary" onClick={() => setModal('admin')} className="flex items-center gap-2 justify-center"><Plus size={16} /> Create Admin</Button>}
      />

      <div className="sms-stats-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="sms-card">
          <div className="sms-card-header">
            <span className="sms-card-title flex items-center gap-2"><BarChart3 size={18} /> Monthly Growth</span>
            <span className="text-xs text-gray-500">2024</span>
          </div>
          <div className="sms-card-body">
            <div className="flex items-end gap-2 h-36">
              {BAR_DATA.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${d.value}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-md"
                  />
                  <span className="text-xs text-gray-500">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="sms-card">
          <div className="sms-card-header"><span className="sms-card-title flex items-center gap-2"><Plus size={18} /> Quick Actions</span></div>
          <div className="sms-card-body">
            <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Users size={20} />, label: 'Create Admin', color: '#7c3aed', action: () => setModal('admin') },
                  { icon: <Building2 size={20} />, label: 'Add School', color: '#2563eb', action: () => setModal('school') },
                  { icon: <BarChart3 size={20} />, label: 'Create Class', color: '#ec4899', action: () => setModal('class') },
                  { icon: <TrendingUp size={20} />, label: 'Analytics', color: '#0891b2', action: () => fetchAnalytics() },
                  { icon: <RefreshCw size={20} />, label: 'Refresh Data', color: '#16a34a', action: () => { fetchSchools(); toast.success('Data refreshed!'); } },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    className="p-4 rounded-lg border transition-all hover:shadow-md"
                    style={{ borderColor: a.color + '44', background: a.color + '08' }}
                    onMouseEnter={e => e.currentTarget.style.background = a.color + '15'}
                    onMouseLeave={e => e.currentTarget.style.background = a.color + '08'}
                  >
                    <div className="flex justify-center mb-2" style={{ color: a.color }}>
                      {a.icon}
                    </div>
                    <span className="text-xs font-semibold text-center block" style={{ color: a.color }}>{a.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Schools table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="sms-card">
        <div className="sms-card-header">
          <span className="sms-card-title flex items-center gap-2"><Building2 size={18} /> Registered Schools</span>
          <div className="flex gap-2 items-center">
            {schoolsLoading && <span className="text-xs text-gray-500">Loading...</span>}
            <Button variant="outline" size="sm" onClick={fetchSchools} className="flex items-center gap-1">
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </div>
        <div className="sms-table-wrap overflow-x-auto">
          <table className="sms-table w-full">
            <thead>
              <tr><th className="text-left">School</th><th className="text-left">Location</th><th className="text-center">Students</th><th className="text-left">Plan</th><th className="text-left">Status</th><th className="text-center">Action</th></tr>
            </thead>
            <tbody>
              {displaySchools.map((s, i) => (
                <tr key={s._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="font-semibold">{s.name}</td>
                  <td className="text-gray-500 dark:text-gray-400">{s.location}</td>
                  <td className="text-center font-semibold">{(s.students || 0).toLocaleString()}</td>
                  <td><span className={`sms-badge ${s.plan === 'Premium' ? 'sms-badge-purple' : s.plan === 'Trial' ? 'sms-badge-warning' : 'sms-badge-primary'}`}>{s.plan || 'Basic'}</span></td>
                  <td><span className={`sms-badge ${s.status === 'active' ? 'sms-badge-success' : 'sms-badge-warning'}`}>{s.status}</span></td>
                  <td className="text-center"><Button variant="ghost" size="sm">Manage</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Admin Modal */}
      <Modal isOpen={modal === 'admin'} onClose={() => { setModal(null); reset(); }} title="Create Admin Account" size="md">
        {[
          { label: 'Full Name', name: 'fullname', type: 'text', ph: 'Admin full name' },
          { label: 'Email Address', name: 'email', type: 'email', ph: 'admin@school.edu' },
          { label: 'School Name', name: 'schoolName', type: 'text', ph: 'Assign to school' },
          { label: 'Temporary Password', name: 'password', type: 'password', ph: 'Min 6 characters' },
        ].map(f => (
          <div key={f.name} className="sms-form-group">
            <label className="sms-label">{f.label}</label>
            <input className="sms-input w-full" type={f.type} name={f.name} placeholder={f.ph} value={values[f.name]} onChange={handleChange} />
          </div>
        ))}
        <div className="flex justify-end gap-3 mt-4 flex-col sm:flex-row">
          <Button variant="ghost" onClick={() => { setModal(null); reset(); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateAdmin} disabled={loading} className="flex items-center gap-2 justify-center">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Creating</> : 'Create Admin'}
          </Button>
        </div>
      </Modal>

      {/* Create Class Modal */}
      <Modal isOpen={modal === 'class'} onClose={() => setModal(null)} title="Create New Class" size="md">
        <form onSubmit={handleCreateClass}>
          <div className="sms-form-group">
            <label className="sms-label">Class Name *</label>
            <input className="sms-input w-full" placeholder="e.g. SS 3 Science" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
          </div>
          <div className="sms-form-group">
            <label className="sms-label">Capacity</label>
            <input className="sms-input w-full" type="number" placeholder="30" value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: e.target.value })} />
          </div>
          <div className="sms-form-group">
            <label className="sms-label">School Name (For Developer Override)</label>
            <input className="sms-input w-full" placeholder="Assign to school name" value={classForm.schoolName} onChange={e => setClassForm({ ...classForm, schoolName: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 mt-4 flex-col sm:flex-row">
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" type="submit">
              Create Class
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
