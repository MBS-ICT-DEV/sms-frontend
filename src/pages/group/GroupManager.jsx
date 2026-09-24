import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { groupAPI } from '../../api/group.api';
import { teacherAPI } from '../../api/teacher.api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  Plus, X, Users, Star, Trash2, Shuffle, Merge, Split, Loader2,
  Clock, ChevronRight, Crown, Pencil, Wand2, Handshake,
  UserMinus, Scissors, Save, UserPlus,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const btnPrimary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50';
const btnGhost = 'flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50';

const MODE_LABEL = {
  individual: 'Individual',
  group: 'Group',
  both: 'Group + Individual',
};

const STATUS_STYLE = {
  active: 'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  graded: 'bg-emerald-100 text-emerald-700',
};

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
      <p className={`text-xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function GroupManager() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [busy, setBusy]             = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [groups, setGroups]         = useState([]);
  const [stats, setStats]           = useState({ groupCount: 0, classSize: 0, ungrouped: 0, submitted: 0 });
  const [students, setStudents]     = useState([]);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ by: 'groups', numberOfGroups: 2, studentsPerGroup: 3, replace: false });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', studentIds: [] });

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState('');

  const [splitTarget, setSplitTarget] = useState(null);
  const [splitForm, setSplitForm]     = useState({ studentIds: [], name: '' });

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeForm, setMergeForm] = useState({ selected: [], target: '', name: '' });

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const { data } = await groupAPI.list(assignmentId);
      const a = data.assignment || null;
      setAssignment(a);
      setGroups(data.groups || []);
      setStats(data.stats || { groupCount: 0, classSize: 0, ungrouped: 0, submitted: 0 });

      const classId = a?.class?._id || a?.class;
      if (classId) {
        try {
          const { data: sd } = await teacherAPI.getStudentsInClass(classId);
          setStudents(sd.students || []);
        } catch {
          setStudents([]);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  const groupedIds = new Set(
    groups.flatMap((g) => (g.members || []).map((m) => m.student?._id)).filter(Boolean)
  );
  const ungroupedStudents = students.filter((s) => !groupedIds.has(s._id));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setBusy(true);
    try {
      const payload = { assignmentId, replace: genForm.replace };
      if (genForm.by === 'groups') payload.numberOfGroups = Number(genForm.numberOfGroups);
      else payload.studentsPerGroup = Number(genForm.studentsPerGroup);

      await groupAPI.generate(payload);
      toast.success('Groups generated');
      setGenerateOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate groups');
    } finally {
      setBusy(false);
    }
  };

  const handleRandomize = async () => {
    setBusy(true);
    try {
      await groupAPI.randomize(assignmentId);
      toast.success('Groups randomized');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to randomize groups');
    } finally {
      setBusy(false);
    }
  };

  const toggleCreateStudent = (id) => {
    setCreateForm((p) => ({
      ...p,
      studentIds: p.studentIds.includes(id)
        ? p.studentIds.filter((s) => s !== id)
        : [...p.studentIds, id],
    }));
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return toast.error('Group name is required');
    setBusy(true);
    try {
      await groupAPI.create({
        assignmentId,
        name: createForm.name.trim(),
        studentIds: createForm.studentIds,
      });
      toast.success('Group created');
      setCreateOpen(false);
      setCreateForm({ name: '', studentIds: [] });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setBusy(false);
    }
  };

  const startRename = (g) => { setEditingId(g._id); setEditName(g.name || ''); };

  const saveRename = async (groupId) => {
    if (!editName.trim()) { setEditingId(null); return; }
    try {
      await groupAPI.update(groupId, { name: editName.trim() });
      toast.success('Group renamed');
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename group');
    }
  };

  const setLeader = async (groupId, studentId) => {
    try {
      await groupAPI.update(groupId, { leaderId: studentId });
      toast.success('Group leader updated');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set leader');
    }
  };

  const removeMember = async (groupId, studentId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await groupAPI.removeMember(groupId, studentId);
      toast.success('Member removed');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const moveMember = async (studentId, toGroupId) => {
    if (!toGroupId) return;
    try {
      await groupAPI.transfer({ studentId, toGroupId });
      toast.success('Member moved');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move member');
    }
  };

  const openSplit = (g) => { setSplitTarget(g); setSplitForm({ studentIds: [], name: '' }); };

  const toggleSplitMember = (id) => {
    setSplitForm((p) => ({
      ...p,
      studentIds: p.studentIds.includes(id)
        ? p.studentIds.filter((s) => s !== id)
        : [...p.studentIds, id],
    }));
  };

  const handleSplit = async () => {
    if (!splitTarget) return;
    if (splitForm.studentIds.length === 0) return toast.error('Select at least one member to split off');
    setBusy(true);
    try {
      await groupAPI.split(splitTarget._id, {
        studentIds: splitForm.studentIds,
        name: splitForm.name.trim() || undefined,
      });
      toast.success('Group split');
      setSplitTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to split group');
    } finally {
      setBusy(false);
    }
  };

  const openMerge = () => { setMergeOpen(true); setMergeForm({ selected: [], target: '', name: '' }); };

  const toggleMergeGroup = (id) => {
    setMergeForm((p) => {
      const selected = p.selected.includes(id)
        ? p.selected.filter((g) => g !== id)
        : [...p.selected, id];
      const target = selected.includes(p.target) ? p.target : (selected[0] || '');
      return { ...p, selected, target };
    });
  };

  const handleMerge = async () => {
    if (mergeForm.selected.length < 2) return toast.error('Select at least two groups to merge');
    const target = mergeForm.target || mergeForm.selected[0];
    const sourceGroupIds = mergeForm.selected.filter((id) => id !== target);
    setBusy(true);
    try {
      await groupAPI.merge({
        targetGroupId: target,
        sourceGroupIds,
        name: mergeForm.name.trim() || undefined,
      });
      toast.success('Groups merged');
      setMergeOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to merge groups');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (g) => {
    if (!window.confirm(`Delete group "${g.name}"? Its members will become ungrouped.`)) return;
    try {
      await groupAPI.remove(g._id);
      toast.success('Group deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  const deadline = assignment?.deadline;
  const mode = assignment?.mode || 'individual';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {assignment?.title || 'Group Manager'}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                {MODE_LABEL[mode] || mode}
              </span>
              {deadline && (
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                  <Clock size={11} /> Due {format(new Date(deadline), 'MMM d, yyyy HH:mm')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Groups" value={stats.groupCount} accent="text-indigo-600" />
          <StatCard label="Class size" value={stats.classSize} />
          <StatCard label="Ungrouped" value={stats.ungrouped} accent={stats.ungrouped ? 'text-amber-600' : 'text-gray-900'} />
          <StatCard label="Submitted" value={stats.submitted} accent="text-emerald-600" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setGenerateOpen(true)} className={btnPrimary}>
            <Wand2 size={15} /> Generate Groups
          </button>
          <button onClick={handleRandomize} disabled={busy} className={btnGhost}>
            <Shuffle size={15} /> Randomize
          </button>
          <button onClick={() => { setCreateOpen(true); setCreateForm({ name: '', studentIds: [] }); }} className={btnGhost}>
            <UserPlus size={15} /> Create Group
          </button>
        </div>

        {/* Ungrouped students */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserMinus size={15} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900">
              Ungrouped students ({ungroupedStudents.length})
            </h2>
          </div>
          {ungroupedStudents.length === 0 ? (
            <p className="text-sm text-gray-400">
              {students.length === 0 ? 'No class roster available.' : 'Everyone is in a group.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ungroupedStudents.map((s) => (
                <span key={s._id} className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
                  {s.fullname}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Groups */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No groups yet</p>
            <p className="text-gray-400 text-sm">Generate groups automatically or create one manually</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => {
              const members = g.members || [];
              const status = g.status || 'active';
              const score = g.submission?.score;
              return (
                <div key={g._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === g._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            className={inputCls + ' py-1.5'}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename(g._id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => saveRename(g._id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                            <Save size={15} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                          <button onClick={() => startRename(g)} className="p-1 text-gray-400 hover:text-blue-600 transition">
                            <Pencil size={13} />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {members.length} member{members.length === 1 ? '' : 's'}
                        {typeof g.contributionCount === 'number' && ` · ${g.contributionCount} answers`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[status] || STATUS_STYLE.active}`}>
                        {status}
                      </span>
                      {score != null && (
                        <span className="text-sm font-bold text-emerald-600">{score}</span>
                      )}
                    </div>
                  </div>

                  {/* Members */}
                  <div className="divide-y divide-gray-50">
                    {members.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">No members yet</p>
                    ) : (
                      members.map((m) => {
                        const s = m.student || {};
                        const isLeader = m.role === 'leader' || g.leader === s._id;
                        return (
                          <div key={s._id || m._id} className="flex items-center gap-3 px-4 py-2.5">
                            <Star size={14} className={isLeader ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{s.fullname || '—'}</p>
                              {s.registrationNumber && <p className="text-xs text-gray-400">{s.registrationNumber}</p>}
                            </div>
                            {isLeader && (
                              <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-600">
                                <Crown size={11} /> Leader
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!isLeader && (
                                <button
                                  title="Make leader"
                                  onClick={() => setLeader(g._id, s._id)}
                                  className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                                >
                                  <Crown size={14} />
                                </button>
                              )}
                              <select
                                title="Move to another group"
                                value=""
                                onChange={(e) => moveMember(s._id, e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 text-gray-500 max-w-[110px]"
                              >
                                <option value="">Move…</option>
                                {groups.filter((o) => o._id !== g._id).map((o) => (
                                  <option key={o._id} value={o._id}>{o.name}</option>
                                ))}
                              </select>
                              <button
                                title="Remove member"
                                onClick={() => removeMember(g._id, s._id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <UserMinus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Group actions */}
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/group/${g._id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      <ChevronRight size={13} /> Open Group
                    </button>
                    <button
                      onClick={() => openSplit(g)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                    >
                      <Scissors size={13} /> Split
                    </button>
                    <button
                      onClick={openMerge}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                    >
                      <Merge size={13} /> Merge
                    </button>
                    <button
                      onClick={() => handleDelete(g)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate modal */}
      <Modal isOpen={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Groups">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setGenForm((p) => ({ ...p, by: 'groups' }))}
              className={`py-2 rounded-xl text-sm font-semibold border transition ${genForm.by === 'groups' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              Number of groups
            </button>
            <button
              onClick={() => setGenForm((p) => ({ ...p, by: 'size' }))}
              className={`py-2 rounded-xl text-sm font-semibold border transition ${genForm.by === 'size' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              Students per group
            </button>
          </div>

          {genForm.by === 'groups' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of groups</label>
              <input
                type="number" min={2} className={inputCls}
                value={genForm.numberOfGroups}
                onChange={(e) => setGenForm((p) => ({ ...p, numberOfGroups: e.target.value }))}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Students per group</label>
              <input
                type="number" min={2} className={inputCls}
                value={genForm.studentsPerGroup}
                onChange={(e) => setGenForm((p) => ({ ...p, studentsPerGroup: e.target.value }))}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <input
              type="checkbox"
              checked={genForm.replace}
              onChange={(e) => setGenForm((p) => ({ ...p, replace: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Replace existing groups
          </label>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setGenerateOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleGenerate} disabled={busy} className={btnPrimary + ' flex-1'}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Generate
            </button>
          </div>
        </div>
      </Modal>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Group">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Group name *</label>
            <input
              className={inputCls}
              placeholder="e.g. Team Alpha"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Members ({createForm.studentIds.length})
            </label>
            {ungroupedStudents.length === 0 ? (
              <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl px-3 py-3">
                No ungrouped students available.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-50">
                {ungroupedStudents.map((s) => (
                  <label key={s._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={createForm.studentIds.includes(s._id)}
                      onChange={() => toggleCreateStudent(s._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{s.fullname}</span>
                    {s.registrationNumber && <span className="text-xs text-gray-400 ml-auto">{s.registrationNumber}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setCreateOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={busy} className={btnPrimary + ' flex-1'}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Split modal */}
      <Modal isOpen={!!splitTarget} onClose={() => setSplitTarget(null)} title={`Split "${splitTarget?.name || ''}"`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select the members to move into the new group.</p>
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {(splitTarget?.members || []).length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">No members in this group.</p>
            ) : (
              (splitTarget?.members || []).map((m) => {
                const s = m.student || {};
                return (
                  <label key={s._id || m._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={splitForm.studentIds.includes(s._id)}
                      onChange={() => toggleSplitMember(s._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{s.fullname || '—'}</span>
                    {m.role === 'leader' && <Crown size={12} className="text-amber-500 ml-auto" />}
                  </label>
                );
              })
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">New group name (optional)</label>
            <input
              className={inputCls}
              placeholder="e.g. Team Beta"
              value={splitForm.name}
              onChange={(e) => setSplitForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setSplitTarget(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleSplit} disabled={busy} className={btnPrimary + ' flex-1'}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Split size={14} />} Split
            </button>
          </div>
        </div>
      </Modal>

      {/* Merge modal */}
      <Modal isOpen={mergeOpen} onClose={() => setMergeOpen(false)} title="Merge Groups">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select two or more groups to combine.</p>
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">No groups to merge.</p>
            ) : (
              groups.map((g) => (
                <label key={g._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={mergeForm.selected.includes(g._id)}
                    onChange={() => toggleMergeGroup(g._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{g.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{(g.members || []).length} members</span>
                </label>
              ))
            )}
          </div>

          {mergeForm.selected.length >= 2 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Merge into</label>
              <select
                className={inputCls}
                value={mergeForm.target}
                onChange={(e) => setMergeForm((p) => ({ ...p, target: e.target.value }))}
              >
                {mergeForm.selected.map((id) => {
                  const g = groups.find((x) => x._id === id);
                  return <option key={id} value={id}>{g?.name || id}</option>;
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Merged group name (optional)</label>
            <input
              className={inputCls}
              placeholder="Leave blank to keep target name"
              value={mergeForm.name}
              onChange={(e) => setMergeForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setMergeOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleMerge} disabled={busy} className={btnPrimary + ' flex-1'}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Handshake size={14} />} Merge
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
