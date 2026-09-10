import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import adminAPI from '../../api/admin.api';
import { toast } from 'react-toastify';
import {
  Shield, Users, BarChart3, Settings, LayoutDashboard,
  KeyRound, Download, RefreshCw, Eye, EyeOff, TriangleAlert, Trash2, FileDown,
} from 'lucide-react';

const TABS = [
  { id: 'overview',   label: 'Overview',   Icon: LayoutDashboard },
  { id: 'key-access', label: 'Key Access', Icon: KeyRound },
  { id: 'export',     label: 'Export Staff', Icon: FileDown },
  { id: 'reset',      label: 'Reset',      Icon: TriangleAlert },
];

const ROLE_COLOR = {
  developer: 'bg-purple-100 text-purple-700',
  admin:      'bg-blue-100 text-blue-700',
  principal:  'bg-emerald-100 text-emerald-700',
  hoa:        'bg-teal-100 text-teal-700',
  secretary:  'bg-amber-100 text-amber-700',
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
<<<<<<< HEAD
          { label: 'Total Admins',   value: '—', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Schools', value: '—', color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Total Users',    value: '—', color: 'text-emerald-600',bg: 'bg-emerald-50' },
=======
          { label: 'Total Admins',   value: '1', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Branch', value: '1', color: 'text-blue-600',   bg: 'bg-blue-50' },
>>>>>>> a665f935 (Update school management frontend)
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xl font-bold ${color}`}>{value}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">System Panels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Manage Admins', desc: 'Create, view and manage admin accounts for each school.',   Icon: Shield,   color: 'text-purple-600', bg: 'bg-purple-50' },
            { title: 'System Users',  desc: 'View all registered users across all roles and schools.',   Icon: Users,    color: 'text-blue-600',   bg: 'bg-blue-50' },
            { title: 'Analytics',     desc: 'View system-wide usage metrics and performance reports.',   Icon: BarChart3,color: 'text-emerald-600',bg: 'bg-emerald-50' },
            { title: 'Settings',      desc: 'Configure system defaults, email and API integrations.',    Icon: Settings, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(({ title, desc, Icon, color, bg }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Key Access Tab ───────────────────────────────────────────────────────────
function KeyAccessTab() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);
  const [showHint, setShowHint] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getKeyUsers();
      setUsers(data.users || []);
      setFetched(true);
    } catch {
      toast.error('Failed to load key users');
    } finally {
      setLoading(false);
    }
  };

  const downloadTxt = () => {
    if (!users.length) return;

    const now = new Date().toLocaleString('en-NG', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

<<<<<<< HEAD
    const lines = [
      '╔══════════════════════════════════════════════════╗',
      '║         SCHOOLMS — KEY ACCESS CREDENTIALS        ║',
      '╚══════════════════════════════════════════════════╝',
      `  Generated: ${now}`,
      `  Total accounts: ${users.length}`,
      '',
      '  NOTE: Passwords shown are defaults from seeder.',
      '  Change them immediately in production.',
      '',
      '══════════════════════════════════════════════════',
      '',
    ];

=======
  
>>>>>>> a665f935 (Update school management frontend)
    const roleOrder = ['developer', 'admin', 'principal', 'hoa', 'secretary'];

    roleOrder.forEach(role => {
      const group = users.filter(u => u.role === role);
      if (!group.length) return;

      const roleLabel = role.toUpperCase().replace('HOA', 'HEAD OF ACTIVITIES').replace('SECRETARY', 'SECRETARY');
      lines.push(`── ${roleLabel} (${group.length}) ──────────────────────────`);
      lines.push('');

      group.forEach((u, i) => {
        lines.push(`  [${i + 1}] ${u.fullname}`);
        lines.push(`       Email    : ${u.email}`);
        lines.push(`       Role     : ${u.role}`);
        if (u.schoolName && u.schoolName !== 'Not Assigned') {
          lines.push(`       School   : ${u.schoolName}`);
        }
        lines.push(`       Password : 123456  (default — change if not updated)`);
        lines.push(`       Created  : ${new Date(u.createdAt).toLocaleDateString('en-NG')}`);
        lines.push('');
      });
    });

    lines.push('══════════════════════════════════════════════════');
    lines.push('  CONFIDENTIAL — Do not share outside dev team.');
    lines.push('══════════════════════════════════════════════════');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `schoolms-key-access-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header card */}
      <div className="bg-gradient-to-br from-purple-900 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <KeyRound size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Key Access</h2>
            <p className="text-purple-200 text-xs">Developer-only credential export</p>
          </div>
        </div>
        <p className="text-purple-100 text-sm leading-relaxed">
          View and download login credentials for all top-level system accounts —
          Developer, Admin, Principal, HOA and Secretary. Keep this file secure.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Loading…</>
            : <><RefreshCw size={15} /> {fetched ? 'Refresh' : 'Load Accounts'}</>
          }
        </button>

        {fetched && users.length > 0 && (
          <button
            onClick={downloadTxt}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold"
          >
            <Download size={15} /> Download .txt
          </button>
        )}
      </div>

      {/* Table */}
      {fetched && (
        users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <KeyRound size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No top-level accounts found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Password hint toggle */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {users.length} account{users.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowHint(h => !h)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                {showHint ? <EyeOff size={13} /> : <Eye size={13} />}
                {showHint ? 'Hide' : 'Show'} default password
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {users.map((u) => (
                <div key={u._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                    {(u.fullname || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{u.fullname}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  {/* School */}
                  {u.schoolName && u.schoolName !== 'Not Assigned' && (
                    <p className="text-xs text-gray-400 hidden md:block truncate max-w-[120px]">{u.schoolName}</p>
                  )}
                  {/* Default password */}
                  {showHint && (
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg flex-shrink-0">
                      123456
                    </span>
                  )}
                  {/* Role badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'hoa' ? 'HOA' : u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {!fetched && !loading && (
        <p className="text-sm text-gray-400 text-center pt-4">
          Click <strong>Load Accounts</strong> to fetch all top-level users.
        </p>
      )}
    </div>
  );
}

// ─── Export Staff Tab ─────────────────────────────────────────────────────────
const ROLE_LABEL = {
  developer: 'Developer', admin: 'Admin', principal: 'Principal',
  hoa: 'Head of Activities', secretary: 'Secretary', teacher: 'Teacher',
};

const ROLE_BG = {
  developer: 'FF7C3AED', admin: 'FF2563EB', principal: 'FF059669',
  hoa: 'FF0891B2', secretary: 'FFD97706', teacher: 'FFDC2626',
};

function ExportStaffTab() {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [filter, setFilter]   = useState('all');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAllStaff();
      setStaff(data.staff || []);
      setFetched(true);
      toast.success(`Loaded ${data.total} staff members`);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const roles    = ['all', ...new Set(staff.map(s => s.role))];
  const filtered = filter === 'all' ? staff : staff.filter(s => s.role === filter);

  const exportExcel = () => {
    if (!staff.length) return;

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: All Staff ───────────────────────────────────────────────────
    const allRows = staff.map((s, i) => ({
      'S/N':          i + 1,
      'Full Name':    s.fullname   || '—',
      'Email':        s.email      || '—',
      'Role':         ROLE_LABEL[s.role] || s.role,
      'School Name':  s.schoolName || '—',
      'Subject':      s.subject    || '—',
      'Date Created': s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-NG') : '—',
      'Default Password': '123456',
    }));

    const wsAll = XLSX.utils.json_to_sheet(allRows);
    wsAll['!cols'] = [4, 26, 30, 20, 28, 18, 16, 18].map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(wb, wsAll, 'All Staff');

    // ── Per-role sheets ──────────────────────────────────────────────────────
    const ORDER = ['developer', 'admin', 'principal', 'hoa', 'secretary', 'teacher'];
    ORDER.forEach(role => {
      const group = staff.filter(s => s.role === role);
      if (!group.length) return;

      const rows = group.map((s, i) => ({
        'S/N':          i + 1,
        'Full Name':    s.fullname   || '—',
        'Email':        s.email      || '—',
        'School Name':  s.schoolName || '—',
        'Subject':      s.subject    || '—',
        'Date Created': s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-NG') : '—',
        'Default Password': '123456',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [4, 26, 30, 28, 18, 16, 18].map(wch => ({ wch }));
      XLSX.utils.book_append_sheet(wb, ws, ROLE_LABEL[role] || role);
    });

    const now      = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Staff_Credentials_${now}.xlsx`);
    toast.success('Excel file downloaded');
  };

  const exportTxt = () => {
    if (!staff.length) return;
    const now = new Date().toLocaleString('en-NG', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const lines = [
      '╔══════════════════════════════════════════════════════════╗',
      '║           SCHOOLMS — COMPLETE STAFF CREDENTIALS          ║',
      '╚══════════════════════════════════════════════════════════╝',
      `  Generated : ${now}`,
      `  Total     : ${staff.length} staff member(s)`,
      '',
      '  NOTE: Default password is 123456. Change in production.',
      '',
      '════════════════════════════════════════════════════════════',
    ];

    const ORDER = ['developer', 'admin', 'principal', 'hoa', 'secretary', 'teacher'];
    ORDER.forEach(role => {
      const group = staff.filter(s => s.role === role);
      if (!group.length) return;
      lines.push('', `── ${(ROLE_LABEL[role] || role).toUpperCase()} (${group.length}) ${'─'.repeat(42 - (ROLE_LABEL[role] || role).length)}`);
      group.forEach((s, i) => {
        lines.push('');
        lines.push(`  [${i + 1}] ${s.fullname}`);
        lines.push(`       Email    : ${s.email}`);
        if (s.schoolName) lines.push(`       School   : ${s.schoolName}`);
        if (s.subject)    lines.push(`       Subject  : ${s.subject}`);
        lines.push(`       Created  : ${s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-NG') : '—'}`);
        lines.push(`       Password : 123456`);
      });
    });

    lines.push('', '════════════════════════════════════════════════════════════');
    lines.push('  CONFIDENTIAL — Do not share outside authorised personnel.');
    lines.push('════════════════════════════════════════════════════════════');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `Staff_Credentials_${Date.now()}.txt` });
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Text file downloaded');
  };

  return (
    <div className="max-w-5xl space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FileDown size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Export All Staff</h2>
            <p className="text-blue-200 text-xs">Developer, Admin, Principal, HOA, Secretary, Teachers</p>
          </div>
        </div>
        <p className="text-blue-100 text-sm">
          Export every staff member's credentials and details as Excel (.xlsx) or plain text (.txt).
        </p>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-3">
        <button onClick={fetchStaff} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Loading…</>
            : <><RefreshCw size={15} />{fetched ? 'Refresh' : 'Load All Staff'}</>}
        </button>

        {fetched && staff.length > 0 && (
          <>
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
              <Download size={15} /> Export Excel (.xlsx)
            </button>
            <button onClick={exportTxt}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition">
              <FileDown size={15} /> Export Text (.txt)
            </button>
          </>
        )}
      </div>

      {/* Filter pills */}
      {fetched && staff.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {roles.map(r => (
            <button key={r} onClick={() => setFilter(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                filter === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {r === 'all' ? `All (${staff.length})` : `${ROLE_LABEL[r] || r} (${staff.filter(s => s.role === r).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {fetched && (
        filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Users size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No staff found for this filter</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400">Default password: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">123456</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Full Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">School</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Subject</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((s, i) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                            {(s.fullname || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">{s.fullname}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR[s.role] || 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_LABEL[s.role] || s.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{s.schoolName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{s.subject || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-NG') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {!fetched && !loading && (
        <p className="text-sm text-gray-400 text-center pt-4">
          Click <strong>Load All Staff</strong> to fetch every staff member.
        </p>
      )}
    </div>
  );
}

// ─── Reset Tab ───────────────────────────────────────────────────────────────
const WHAT_GETS_CLEARED = [
  'All students',
  'All teachers',
  'All classes',
  'All fees & payments',
  'All results & grades',
  'All attendance records',
  'All assignments & submissions',
  'All admin, principal, HOA & secretary accounts',
];

const WHAT_STAYS = [
  'Developer accounts (you)',
  'Default seeder accounts (admin, principal, HOA, secretary) — re-created with password 123456',
];

function ResetTab() {
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.resetSystem();
      setResult(data);
      setShowModal(false);
      setConfirm('');
      toast.success('System reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">

      {/* Warning banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <TriangleAlert size={20} className="text-red-600" />
        </div>
        <div>
          <p className="font-bold text-red-700 text-sm mb-1">Danger Zone — Irreversible Action</p>
          <p className="text-red-600 text-xs leading-relaxed">
            This will permanently delete all school data and restore the system to its default state.
            This action <strong>cannot be undone</strong>.
          </p>
        </div>
      </div>

      {/* What gets cleared */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Trash2 size={15} className="text-red-500" /> What will be deleted
          </p>
          <ul className="space-y-1">
            {WHAT_GETS_CLEARED.map(item => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Shield size={15} className="text-emerald-500" /> What will be kept / restored
          </p>
          <ul className="space-y-1">
            {WHAT_STAYS.map(item => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition"
      >
        <Trash2 size={16} /> Reset Entire System
      </button>

      {/* Success result */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <p className="font-bold text-emerald-700 text-sm mb-3">✅ Reset completed</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(result.cleared || {}).map(([key, count]) => (
              <div key={key} className="text-xs text-gray-600">
                <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>: {count} deleted
              </div>
            ))}
          </div>
          <p className="text-xs text-emerald-600 mt-3 font-medium">
            Default accounts restored — password: <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">123456</span>
          </p>
        </div>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <TriangleAlert size={20} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Confirm System Reset</p>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              All school data will be permanently deleted. Type{' '}
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">RESET</span>{' '}
              below to confirm.
            </p>

            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Type RESET to confirm"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowModal(false); setConfirm(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={confirm !== 'RESET' || loading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Resetting…</>
                  : <><Trash2 size={15} /> Yes, Reset Everything</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* Page header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <LayoutDashboard size={22} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome, {user?.fullname}. System-wide controls.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                id === 'reset'
                  ? tab === id ? 'bg-red-600 text-white shadow-sm' : 'text-red-500 hover:text-red-700'
                  : tab === id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview'   && <OverviewTab />}
        {tab === 'key-access' && <KeyAccessTab />}
        {tab === 'export'     && <ExportStaffTab />}
        {tab === 'reset'      && <ResetTab />}

      </div>
    </MainLayout>
  );
}
