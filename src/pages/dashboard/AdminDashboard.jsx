import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users, GraduationCap, BookOpen, TrendingUp, Plus, UserPlus, X, Loader2 } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout';
import adminAPI from '../../api/admin.api';

const StatCard = ({ Icon, title, value, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [totalStudent, setTotalStudent] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [teacherForm, setTeacherForm] = useState({ fullname: '', email: '', password: '', subject: '', phone: '' });
  const [principalForm, setPrincipalForm] = useState({ fullname: '', email: '', password: '', schoolName: '', phone: '' });
  const [classForm, setClassForm] = useState({ name: '', capacity: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [totalStudentRes,teachersRes, classesRes] = await Promise.all([
        adminAPI.getAllStudents(),
        adminAPI.getAllTeachers(),
        adminAPI.getClasses(),
      ]);
      setTotalStudent(totalStudentRes.data.students || []);
      setTeachers(teachersRes.data.teachers || []);
      setClasses(classesRes.data.classes || []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setTeacherForm({ fullname: '', email: '', password: '', subject: '', phone: '' });
    setPrincipalForm({ fullname: '', email: '', password: '', schoolName: '', phone: '' });
    setClassForm({ name: '', capacity: '' });
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.fullname || !teacherForm.email || !teacherForm.password) return toast.error('Name, email and password are required');
    try {
      setSubmitting(true);
      const res = await adminAPI.createTeacher(teacherForm);
      toast.success(res.data.message || 'Teacher created');
      setTeachers(p => [res.data.teacher, ...p]);
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreatePrincipal = async (e) => {
    e.preventDefault();
    if (!principalForm.fullname || !principalForm.email || !principalForm.password) return toast.error('Name, email and password are required');
    try {
      setSubmitting(true);
      const res = await adminAPI.createPrincipal(principalForm);
      toast.success(res.data.message || 'Principal created');
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.name.trim()) return toast.error('Class name is required');
    try {
      setSubmitting(true);
      const res = await adminAPI.createClass({ name: classForm.name.trim(), capacity: parseInt(classForm.capacity) || 30 });
      toast.success(res.data.message || 'Class created');
      setClasses(p => [res.data.class, ...p]);
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your school system</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModal('teacher')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
              <UserPlus size={15} /> Add Teacher
            </button>
            <button onClick={() => setModal('principal')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm">
              <UserPlus size={15} /> Add Principal
            </button>
            <button onClick={() => setModal('class')}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition shadow-sm">
              <Plus size={15} /> New Class
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard Icon={Users}       title="Total Students"  value={loading ? '—' : totalStudent.length}             color="text-blue-600"   bg="bg-blue-50" />
          <StatCard Icon={GraduationCap} title="Teachers"      value={loading ? '—' : teachers.length} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard Icon={BookOpen}    title="Classes"         value={loading ? '—' : classes.length}  color="text-purple-600" bg="bg-purple-50" />
          <StatCard Icon={TrendingUp}  title="Avg Score"       value="78%"                             color="text-orange-600" bg="bg-orange-50" />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Teachers table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Teachers</h2>
              <button onClick={() => setModal('teacher')}
                className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:text-blue-700">
                <Plus size={15} /> Add
              </button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <GraduationCap size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No teachers yet. Add one to get started.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="hidden md:table-cell px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t, i) => (
                      <tr key={t._id || i} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-semibold text-gray-900">{t.fullname}</td>
                        <td className="px-5 py-3 text-gray-500 truncate max-w-[180px]">{t.email}</td>
                        <td className="hidden md:table-cell px-5 py-3">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{t.subject || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                { Icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50',   text: 'New teacher created', time: '5 min ago' },
                { Icon: BookOpen,    color: 'text-emerald-600',bg: 'bg-emerald-50',text: 'Class updated',        time: '1 hr ago' },
                { Icon: GraduationCap,color:'text-purple-600', bg: 'bg-purple-50', text: 'Principal assigned',   time: '3 hrs ago' },
                { Icon: TrendingUp,  color: 'text-orange-600', bg: 'bg-orange-50', text: 'Results approved',     time: '1 day ago' },
              ].map(({ Icon, color, bg, text, time }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classes table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Classes</h2>
            <button onClick={() => navigate('/admin/classes')}
              className="text-sm text-blue-600 font-semibold hover:text-blue-700">
              Manage →
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No classes created yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                    <th className="hidden md:table-cell px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Students</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c, i) => (
                    <tr key={c._id || i} className="border-t border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-semibold text-gray-900">{c.name}</td>
                      <td className="hidden md:table-cell px-5 py-3 text-gray-500">{c.classTeacher?.fullname || '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{c.capacity || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">{c.students?.length || 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Create Teacher Modal */}
      <Modal isOpen={modal === 'teacher'} onClose={closeModal} title="Add New Teacher">
        <form onSubmit={handleCreateTeacher}>
          <Field label="Full Name *"><input className={inputCls} placeholder="Mr. John Smith" value={teacherForm.fullname} onChange={e => setTeacherForm(p => ({ ...p, fullname: e.target.value }))} /></Field>
          <Field label="Email *"><input className={inputCls} type="email" placeholder="teacher@school.com" value={teacherForm.email} onChange={e => setTeacherForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label="Password *"><input className={inputCls} type="password" placeholder="Min. 6 characters" value={teacherForm.password} onChange={e => setTeacherForm(p => ({ ...p, password: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject"><input className={inputCls} placeholder="Mathematics" value={teacherForm.subject} onChange={e => setTeacherForm(p => ({ ...p, subject: e.target.value }))} /></Field>
            <Field label="Phone"><input className={inputCls} placeholder="+234..." value={teacherForm.phone} onChange={e => setTeacherForm(p => ({ ...p, phone: e.target.value }))} /></Field>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}{submitting ? 'Creating…' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Principal Modal */}
      <Modal isOpen={modal === 'principal'} onClose={closeModal} title="Add New Principal">
        <form onSubmit={handleCreatePrincipal}>
          <Field label="Full Name *"><input className={inputCls} placeholder="Mrs. Jane Doe" value={principalForm.fullname} onChange={e => setPrincipalForm(p => ({ ...p, fullname: e.target.value }))} /></Field>
          <Field label="Email *"><input className={inputCls} type="email" placeholder="principal@school.com" value={principalForm.email} onChange={e => setPrincipalForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label="Password *"><input className={inputCls} type="password" placeholder="Min. 6 characters" value={principalForm.password} onChange={e => setPrincipalForm(p => ({ ...p, password: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="School Name"><input className={inputCls} placeholder="School name" value={principalForm.schoolName} onChange={e => setPrincipalForm(p => ({ ...p, schoolName: e.target.value }))} /></Field>
            <Field label="Phone"><input className={inputCls} placeholder="+234..." value={principalForm.phone} onChange={e => setPrincipalForm(p => ({ ...p, phone: e.target.value }))} /></Field>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}{submitting ? 'Creating…' : 'Create Principal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Class Modal */}
      <Modal isOpen={modal === 'class'} onClose={closeModal} title="Create New Class">
        <form onSubmit={handleCreateClass}>
          <Field label="Class Name *"><input className={inputCls} placeholder="e.g. Form 1A or JSS 1" value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Capacity"><input className={inputCls} type="number" placeholder="30" value={classForm.capacity} onChange={e => setClassForm(p => ({ ...p, capacity: e.target.value }))} /></Field>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}{submitting ? 'Creating…' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
