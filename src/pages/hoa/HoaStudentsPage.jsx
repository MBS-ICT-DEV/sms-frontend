import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminAPI from '../../api/admin.api';
import { Users, Search, Trash2, X, Smartphone, Plus } from 'lucide-react';
import { normalizeNigerianPhone, PHONE_VALIDATION_MESSAGE } from '../../utils/validation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CreateStudentModal({ classes, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    classId: '',
  });
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find((c) => c._id === form.classId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Student name is required');
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!form.classId) {
      toast.error('Please assign the student to a class');
      return;
    }

    const normalizedPhone = normalizeNigerianPhone(form.phoneNumber);
    if (!normalizedPhone) {
      toast.error(PHONE_VALIDATION_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      const { data } = await adminAPI.createStudent({
        fullname: form.name.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
        classId: form.classId,
        sectionId: selectedClass?.section?._id || '',
        departmentId: selectedClass?.department?._id || '',
        phoneNumber: normalizedPhone,
      });
      toast.success(data.message || 'Student created successfully');
      onCreated(data.student);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Create New Student</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter student name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Class *</label>
            <select
              name="classId"
              value={form.classId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              All classes are available, including primary and secondary.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="e.g. 08012345678 or +2348012345678"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Used for attendance SMS alerts. Siblings may share one number.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Temporary Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Issue this securely to the student"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              A username is generated automatically from the student's surname.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PhoneModal({ student, onClose, onSaved }) {
  const [phone, setPhone] = useState(student.phoneNumber || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const trimmed = phone.trim();
    const normalized = trimmed ? normalizeNigerianPhone(trimmed) : '';

    if (trimmed && !normalized) {
      toast.error(PHONE_VALIDATION_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      const { data } = await adminAPI.updateStudent(student._id, {
        fullname: student.fullname,
        email: student.email,
        phoneNumber: normalized,
      });
      toast.success(
        normalized ? 'Phone number saved' : 'Phone number cleared'
      );
      onSaved(data.student);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save phone number');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            {student.phoneNumber ? 'Update Phone Number' : 'Assign Phone Number'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="font-semibold text-gray-900">{student.fullname}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{student.registrationNumber}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08012345678 or +2348012345678"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              The same number can be assigned to more than one student.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <p className="text-gray-800 font-medium text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function HoaStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses]   = useState([]);
  const [confirm, setConfirm]   = useState(null);
  const [phoneStudent, setPhoneStudent] = useState(null);
  const [onlyMissingPhone, setOnlyMissingPhone] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        adminAPI.getAllStudents(),
        adminAPI.getClasses(),
      ]);
      setStudents(sRes.data.students || []);
      setClasses(cRes.data.classes || []);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    const { id } = confirm;
    setConfirm(null);
    try {
      await adminAPI.deleteStudent(id);
      toast.success('Student deleted');
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = `${s.fullname} ${s.registrationNumber} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchClass  = classFilter ? s.class?._id === classFilter : true;
    const matchPhone  = onlyMissingPhone ? !s.phoneNumber : true;
    return matchSearch && matchClass && matchPhone;
  });

  return (
    <div className="space-y-5">
      {confirm && (
        <ConfirmDialog
          message={`Delete "${confirm.name}"? All their data will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {phoneStudent && (
        <PhoneModal
          student={phoneStudent}
          onClose={() => setPhoneStudent(null)}
          onSaved={(updated) => {
            setStudents(prev =>
              prev.map(s => (s._id === phoneStudent._id ? { ...s, ...updated } : s))
            );
            setPhoneStudent(null);
          }}
        />
      )}

      {showCreate && (
        <CreateStudentModal
          classes={classes}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchData();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-teal-600" /> Students
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">View all enrolled students and manage their records</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={16} /> Create Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reg number, email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <select
          value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white min-w-[160px]"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setOnlyMissingPhone(prev => !prev)}
          className={`border rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
            onlyMissingPhone
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {onlyMissingPhone
            ? `Missing phone (${students.filter(s => !s.phoneNumber).length})`
            : 'Show missing phone only'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16 border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No students found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Reg. Number</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Class</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Gender</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {s.fullname?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{s.fullname}</p>
                          <p className="text-xs text-gray-400 truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 hidden sm:table-cell font-mono text-xs">{s.registrationNumber}</td>
                    <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{s.class?.name || '—'}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {s.phoneNumber ? (
                        <span className="font-mono text-xs text-gray-700">{s.phoneNumber}</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 hidden lg:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {s.gender || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPhoneStudent(s)}
                          title={s.phoneNumber ? 'Update phone number' : 'Assign phone number'}
                          className="p-2 rounded-lg bg-teal-100 text-teal-600 hover:bg-teal-200 transition"
                        >
                          <Smartphone size={16} />
                        </button>
                        <button
                          onClick={() => setConfirm({ id: s._id, name: s.fullname })}
                          title="Delete student"
                          className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {students.length} student{students.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}
    </div>
  );
}
