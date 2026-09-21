import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Users, GraduationCap, BookOpen,
  Plus, UserPlus, X, Loader2, Edit2, UserCheck,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import principalAPI from '../api/principal.api';
import { normalizeNigerianPhone, PHONE_VALIDATION_MESSAGE } from '../utils/validation';

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

export default function PrincipalDashboard() {
  const [modal, setModal] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignTeacher, setAssignTeacher] = useState([]);

  const [studentForm, setStudentForm] = useState({ fullname: '', email: '', gender: '', classId: '', phoneNumber: '' });
  const [editForm, setEditForm] = useState({ fullname: '', gender: '', phoneNumber: '' });
  const [assignForm, setAssignForm] = useState({ classId: '', teacherId: '' });
  const [classForm, setClassForm] = useState({ name: '', capacity: '', sectionId: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, studentsRes, teachersRes] = await Promise.all([
        principalAPI.getMyClasses(),
        principalAPI.getMyStudents(),
        principalAPI.getSecondaryTeachers(),
      ]);
      setStudents(studentsRes.data.students || []);
      setClasses(classesRes.data.classes || []);
      setSections(classesRes.data.sections || []);
      setTeachers(teachersRes.data.teachers || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const closeModal = () => {
    setModal(null);
    setSelectedStudent(null);
    setStudentForm({ fullname: '', email: '', gender: '', classId: '', phoneNumber: '' });
    setEditForm({ fullname: '', gender: '', phoneNumber: '' });
    setAssignForm({ classId: '', teacherId: '' });
    setClassForm({ name: '', capacity: '', sectionId: '' });
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.fullname.trim()) return toast.error('Full name is required');
    if (!studentForm.email.trim()) return toast.error('Email is required');
    if (!studentForm.classId) return toast.error('Please select a class');
    // New students must carry a guardian number for attendance SMS alerts.
    if (!String(studentForm.phoneNumber || '').trim()) return toast.error('Phone number is required');
    const phoneNumber = normalizeNigerianPhone(studentForm.phoneNumber);
    if (!phoneNumber) return toast.error(PHONE_VALIDATION_MESSAGE);
    try {
      setSubmitting(true);
      const selectedClass = classes.find(c => c._id === studentForm.classId);
      const res = await principalAPI.createStudent({
        ...studentForm,
        fullname: studentForm.fullname.trim(),
        email: studentForm.email.trim(),
        phoneNumber,
        sectionId: selectedClass?.section?._id || '',
      });
      toast.success(res.data.message || 'Student created');
      setStudents(p => [res.data.student, ...p]);
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create student'); }
    finally { setSubmitting(false); }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!editForm.fullname.trim()) return toast.error('Full name is required');
    // Phone stays optional on edit so an incorrect number can be removed.
    const trimmedPhone = String(editForm.phoneNumber || '').trim();
    const phoneNumber = trimmedPhone ? normalizeNigerianPhone(trimmedPhone) : '';
    if (trimmedPhone && !phoneNumber) return toast.error(PHONE_VALIDATION_MESSAGE);
    try {
      setSubmitting(true);
      const res = await principalAPI.updateStudent(selectedStudent._id, { ...editForm, phoneNumber });
      toast.success('Student updated');
      setStudents(p => p.map(s => s._id === selectedStudent._id ? { ...s, ...res.data.student } : s));
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!assignForm.classId || !assignForm.teacherId) return toast.error('Select both class and teacher');
    try {
      setSubmitting(true);
      await principalAPI.assignTeacherToSecondaryClass({ classId: assignForm.classId, teacherId: assignForm.teacherId });
      toast.success('Teacher assigned');
      await loadData();
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
      const className = classForm.name.trim();
      if (!className) return toast.error('Class name is required');
      if (!/^(JSS|SS)\s*[1-3]$/i.test(className)) {
        return toast.error('Select a class from JSS 1-3 or SS 1-3');
      }
      if (!classForm.sectionId) return toast.error('Please select a section');
      try {

      setSubmitting(true);
      const res = await principalAPI.createSecondaryClass({ name: className, capacity: parseInt(classForm.capacity) || 30, sectionId: classForm.sectionId });
      toast.success(res.data.message || 'Class created');
      setClasses(p => [res.data.class, ...p]);
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const openEdit = (s) => { setSelectedStudent(s); setEditForm({ fullname: s.fullname, gender: s.gender || '', phoneNumber: s.phoneNumber || '' }); setModal('edit'); };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Principal Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Secondary school only: JSS 1-3 and SS 1-3</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModal('student')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
              <UserPlus size={15} /> Add Student
            </button>
            <button onClick={() => setModal('assign')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm">
              <UserCheck size={15} /> Assign Teacher
            </button>
            <button onClick={() => setModal('class')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition shadow-sm">
              <Plus size={15} /> New Class
            </button>
         
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard Icon={Users}         title="Secondary Students" value={loading ? '—' : students.length} color="text-blue-600"   bg="bg-blue-50" />
          <StatCard Icon={GraduationCap} title="Secondary Teachers" value={loading ? '—' : teachers.length} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard Icon={BookOpen}      title="Secondary Classes"  value={loading ? '—' : classes.length}  color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Students table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Students</h2>
              <button onClick={() => setModal('student')}
                className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:text-blue-700">
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-14"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
              ) : students.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <Users size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No students yet. Add one!</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="hidden sm:table-cell px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reg No.</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                      <th className="hidden md:table-cell px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Gender</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s._id || i} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-semibold text-gray-900">{s.fullname}</td>
                        <td className="hidden sm:table-cell px-5 py-3 text-gray-400 font-mono text-xs">{s.registrationNumber}</td>
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{s.class?.name || '—'}</span>
                        </td>
                        <td className="hidden md:table-cell px-5 py-3 text-gray-500">{s.gender || '—'}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition">
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right column: teachers + classes */}
          <div className="space-y-5">
            {/* Teachers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Teachers</h2>
                <button onClick={() => setModal('assign')} className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700">
                  <UserCheck size={14} /> Assign
                </button>
              </div>
              <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-blue-500" /></div>
                ) : teachers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No teachers found</div>
                ) : teachers.map((t, i) => (
                  <div key={t._id || i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.fullname}</p>
                      <p className="text-xs text-gray-400">{t.subject || 'No subject'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${t.assignedClass ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.assignedClass ? 'Assigned' : 'Free'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Classes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Classes</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin text-blue-500" /></div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No classes found</div>
                ) : classes.map((c, i) => (
                  <div key={c._id || i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.classTeacher?.fullname || 'No teacher'}</p>
                      <p className="text-xs text-gray-400">{c.section?.name || ''}{c.section?.code ? ` (${c.section.code})` : ''}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-semibold">
                      {c.studentCount ?? c.students?.length ?? 0} students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={modal === 'student'} onClose={closeModal} title="Add New Student">
        <form onSubmit={handleCreateStudent}>
          <Field label="Full Name *"><input className={inputCls} placeholder="e.g. John Doe" value={studentForm.fullname} onChange={e => setStudentForm(p => ({ ...p, fullname: e.target.value }))} /></Field>
          <Field label="Email *"><input className={inputCls} type="email" placeholder="student@school.edu" value={studentForm.email} onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={studentForm.gender} onChange={e => setStudentForm(p => ({ ...p, gender: e.target.value }))}>
              <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Assign to Class *">
            <select className={inputCls} value={studentForm.classId} onChange={e => setStudentForm(p => ({ ...p, classId: e.target.value }))}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Phone Number *">
            <input className={inputCls} type="tel" placeholder="e.g. 08012345678 or +2348012345678" value={studentForm.phoneNumber} onChange={e => setStudentForm(p => ({ ...p, phoneNumber: e.target.value }))} />
            <p className="mt-1 text-xs text-gray-500">Required. Used for attendance SMS alerts. Siblings may share one number.</p>
          </Field>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}{submitting ? 'Creating…' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'edit'} onClose={closeModal} title="Edit Student">
        <form onSubmit={handleEditStudent}>
          <Field label="Full Name *"><input className={inputCls} value={editForm.fullname} onChange={e => setEditForm(p => ({ ...p, fullname: e.target.value }))} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}>
              <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Phone Number">
            <input className={inputCls} type="tel" placeholder="e.g. 08012345678 or +2348012345678" value={editForm.phoneNumber} onChange={e => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))} />
            <p className="mt-1 text-xs text-gray-500">Leave empty to remove the number.</p>
          </Field>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}{submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'assign'} onClose={closeModal} title="Assign Teacher to Class">
        <form onSubmit={handleAssignTeacher}>
          <Field label="Select Class *">
            <select className={inputCls} value={assignForm.classId} onChange={e => setAssignForm(p => ({ ...p, classId: e.target.value }))}>
              <option value="">Choose a class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name} {c.classTeacher ? `(${c.classTeacher.fullname})` : '(No teacher)'}</option>)}
            </select>
          </Field>
          <Field label="Select Teacher *">
            <select className={inputCls} value={assignForm.teacherId} onChange={e => setAssignForm(p => ({ ...p, teacherId: e.target.value }))}>
              <option value="">Choose a teacher</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.fullname}{t.subject ? ` — ${t.subject}` : ''}</option>)}
            </select>
          </Field>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}{submitting ? 'Assigning…' : 'Assign Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'class'} onClose={closeModal} title="Create New Class">
        <form onSubmit={handleCreateClass}>
          <Field label="Class Name *"><input className={inputCls} placeholder="e.g. JSS 1 or SS 3" value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Capacity"><input className={inputCls} type="number" placeholder="e.g. 30" value={classForm.capacity} onChange={e => setClassForm(p => ({ ...p, capacity: e.target.value }))} /></Field>
          <Field label="Section *">
            <select className={inputCls} value={classForm.sectionId} onChange={e => setClassForm(p => ({ ...p, sectionId: e.target.value }))}>
              <option value="">Select secondary section</option>
              {sections.map(section => <option key={section._id} value={section._id}>{section.name} ({section.code})</option>)}
            </select>
          </Field>
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
