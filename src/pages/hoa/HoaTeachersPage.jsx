import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminAPI from '../../api/admin.api';
import {
  UserCog, Search, Plus, Trash2, PauseCircle, PlayCircle,
  CheckCircle, XCircle, X, Eye, EyeOff, Smartphone,
} from 'lucide-react';
import { normalizeNigerianPhone, PHONE_VALIDATION_MESSAGE } from '../../utils/validation';

const TERMS = ['First Term', 'Second Term', 'Third Term'];

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

function CreateTeacherModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ fullname: '', email: '', password: '', subject: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    // A phone number is optional for staff, but when supplied it must be a
    // valid Nigerian number (stored normalized as +234...).
    const trimmedPhone = form.phone.trim();
    const normalizedPhone = trimmedPhone ? normalizeNigerianPhone(trimmedPhone) : '';

    if (trimmedPhone && !normalizedPhone) {
      toast.error(PHONE_VALIDATION_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      await adminAPI.createTeacher({ ...form, phone: normalizedPhone });
      toast.success('Teacher created');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Add New Teacher</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
            <input name="fullname" value={form.fullname} onChange={handle} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={handle} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <button type="button" onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject (optional)</label>
            <input name="subject" value={form.subject} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone (optional)</label>
            <input name="phone" type="tel" value={form.phone} onChange={handle}
              placeholder="e.g. 08012345678"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Staff live in one collection per role, so the role travels with the request.
// Accounts created before phone support simply start with an empty value and
// can be filled in here at any time.
function StaffPhoneModal({ staff, role, onClose, onSaved }) {
  const [phone, setPhone] = useState(staff.phone || '');
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
      const { data } = await adminAPI.assignStaffPhone(staff._id, role, normalized);
      toast.success(normalized ? 'Phone number saved' : 'Phone number cleared');
      onSaved(data.staff);
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
            {staff.phone ? 'Update Phone Number' : 'Assign Phone Number'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="font-semibold text-gray-900">{staff.fullname}</p>
            <p className="text-xs text-gray-500 mt-0.5">{staff.email}</p>
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
              Leave empty to remove the number. Staff numbers are never unique.
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

export default function HoaTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [term, setTerm]         = useState('');
  const [confirm, setConfirm]   = useState(null); // { id, name }
  const [showCreate, setShowCreate] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [phoneTarget, setPhoneTarget] = useState(null);
  const [onlyMissingPhone, setOnlyMissingPhone] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (term) params.term = term;
      const { data } = await adminAPI.getTeachersResultStatus(params);
      setTeachers(data.teachers || []);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, [term]);

  const handleSuspend = async (id) => {
    setActionId(id);
    try {
      const { data } = await adminAPI.suspendTeacher(id);
      toast.success(data.message);
      setTeachers(prev => prev.map(t => t._id === id ? { ...t, suspended: data.suspended } : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    const { id } = confirm;
    setConfirm(null);
    try {
      await adminAPI.deleteTeacher(id);
      toast.success('Teacher deleted');
      setTeachers(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = teachers.filter(t => {
    const matchSearch = `${t.fullname} ${t.email} ${t.subject || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchPhone = onlyMissingPhone ? !t.phone : true;
    return matchSearch && matchPhone;
  });

  return (
    <div className="space-y-5">
      {confirm && (
        <ConfirmDialog
          message={`Delete "${confirm.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {showCreate && (
        <CreateTeacherModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchTeachers(); }}
        />
      )}
      {phoneTarget && (
        <StaffPhoneModal
          staff={phoneTarget}
          role="teacher"
          onClose={() => setPhoneTarget(null)}
          onSaved={(updated) => {
            setTeachers(prev =>
              prev.map(t => (t._id === updated._id ? { ...t, ...updated } : t))
            );
            setPhoneTarget(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={22} className="text-teal-600" /> Teachers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage teachers, view result submissions, suspend or remove</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="sm:ml-auto flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teachers…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <select
          value={term} onChange={e => setTerm(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white min-w-[160px]"
        >
          <option value="">All Terms</option>
          {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
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
            ? `Missing phone (${teachers.filter(t => !t.phone).length})`
            : 'Show missing phone only'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16 border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <UserCog size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No teachers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Teacher</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Subject</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Class</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Phone</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Results</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t._id} className={`hover:bg-gray-50 transition ${t.suspended ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                          {t.fullname?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{t.fullname}</p>
                          <p className="text-xs text-gray-400 truncate">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 hidden sm:table-cell">{t.subject || '—'}</td>
                    <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{t.assignedClass?.name || '—'}</td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {t.phone ? (
                        <span className="font-mono text-xs text-gray-700">{t.phone}</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {t.hasSubmittedResults ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle size={12} /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                          <XCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {t.suspended ? (
                        <span className="inline-flex px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">Suspended</span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPhoneTarget(t)}
                          disabled={actionId === t._id}
                          title={t.phone ? 'Update phone number' : 'Assign phone number'}
                          className="p-2 rounded-lg bg-teal-100 text-teal-600 hover:bg-teal-200 transition disabled:opacity-50"
                        >
                          <Smartphone size={16} />
                        </button>
                        <button
                          onClick={() => handleSuspend(t._id)}
                          disabled={actionId === t._id}
                          title={t.suspended ? 'Unsuspend' : 'Suspend'}
                          className={`p-2 rounded-lg transition ${t.suspended ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'} disabled:opacity-50`}
                        >
                          {t.suspended ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                        </button>
                        <button
                          onClick={() => setConfirm({ id: t._id, name: t.fullname })}
                          title="Delete teacher"
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
            {filtered.length} teacher{filtered.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}
    </div>
  );
}
