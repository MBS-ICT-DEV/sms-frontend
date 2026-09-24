import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { teacherAPI } from '../../api/teacher.api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { connectSocket } from '../../utils/socket';
import {
  Plus, X, Upload, File, Download, ChevronDown, ChevronUp,
  Clock, CheckCircle, Loader2, BookOpen, Users,
  BarChart3, Trash2, Pencil, AlertTriangle, PlusCircle, MinusCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const inputCls = "w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

// ── Interactive-question helpers ──────────────────────────────────────────────
// Option keys are positional (A, B, C…) so they are derived at render/submit
// time instead of being stored — the backend accepts auto-generated keys.
const optionKey = (i) => String.fromCharCode(65 + i);

const emptyForm = () => ({
  title: '', description: '', dueDate: '', classId: '', file: null,
  mode: 'individual', submissionMode: 'one_answer', discussion: true,
  submissionType: 'upload', resultVisibility: 'immediate', questions: [],
});

const newQuestion = (type = 'objective') => ({
  type, prompt: '', points: 1, required: true, allowUpload: true,
  options: [{ text: '' }, { text: '' }], correctIndex: 0,
});

// Internal question state → the shape the API expects.
const toPayloadQuestion = (q) =>
  q.type === 'objective'
    ? {
        type: 'objective',
        prompt: q.prompt,
        points: Number(q.points) || 0,
        required: q.required,
        allowUpload: false,
        options: q.options.map((o, i) => ({ key: optionKey(i), text: o.text })),
        correctOption: optionKey(q.correctIndex),
      }
    : {
        type: 'essay',
        prompt: q.prompt,
        points: Number(q.points) || 0,
        required: q.required,
        allowUpload: q.allowUpload,
        options: [],
        correctOption: null,
      };

// Mirrors the server's own rules so the teacher gets immediate feedback.
const validateQuestions = (questions) => {
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    if (!q.prompt.trim()) return `Question ${i + 1} needs a prompt`;
    if (q.type === 'objective') {
      const filled = q.options.filter((o) => o.text.trim());
      if (filled.length < 2) return `Question ${i + 1} needs at least two options`;
      if (!q.options[q.correctIndex]?.text.trim()) return `Question ${i + 1} needs a correct option`;
    }
  }
  return null;
};

// ISO date → value for a <input type="datetime-local">.
const toLocalInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Server question → internal builder state (used when editing).
const fromServerQuestion = (q) => {
  if (q.type === 'objective') {
    const options = (q.options || []).map((o) => ({ text: o.text || '' }));
    const idx = (q.options || []).findIndex(
      (o) => String(o.key).toUpperCase() === String(q.correctOption).toUpperCase()
    );
    return {
      type: 'objective',
      prompt: q.prompt || '',
      points: q.points ?? 1,
      required: q.required !== false,
      allowUpload: false,
      options: options.length ? options : [{ text: '' }, { text: '' }],
      correctIndex: idx >= 0 ? idx : 0,
    };
  }
  return {
    type: 'essay',
    prompt: q.prompt || '',
    points: q.points ?? 1,
    required: q.required !== false,
    allowUpload: q.allowUpload !== false,
    options: [{ text: '' }, { text: '' }],
    correctIndex: 0,
  };
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

export default function UploadAssignment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses]           = useState([]);
  const [assignments, setAssignments]   = useState([]);
  const [submissions, setSubmissions]   = useState({}); // assignmentId → []
  const [expanded, setExpanded]         = useState(null);
  const [loadingSubs, setLoadingSubs]   = useState({});
  const [modal, setModal]               = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [form, setForm] = useState(emptyForm());
  const fileRef = useRef(null);

  // ── Fetch initial data ────────────────────────────────────────────────────
  const loadAssignments = useCallback(async () => {
    try {
      const { data } = await teacherAPI.getAssignments();
      setAssignments(data.assignments || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    teacherAPI.getMyClasses()
      .then(({ data }) => setClasses(data.classes || data || []))
      .catch(() => {});
    loadAssignments();
  }, [loadAssignments]);

  // ── Socket.IO — real-time submission notifications ─────────────────────────
  useEffect(() => {
    if (!user?._id) return;

    const socket = connectSocket();

    // join after connect; socket.io client may not be connected yet on first render
    const joinRoom = () => socket.emit('join_teacher_room', user._id);
    if (socket.connected) { joinRoom(); }
    else { socket.once('connect', joinRoom); }

    socket.on('new_submission', ({ assignmentId, assignmentTitle, studentName, submittedAt, fileUrl, filename }) => {
      toast.info(
        `📎 ${studentName} submitted "${assignmentTitle}"`,
        { autoClose: 5000 }
      );

      // Inject the new submission directly into state so count updates immediately
      setSubmissions((prev) => {
        const list = prev[assignmentId] || [];
        // avoid duplicate if already fetched
        const exists = list.some((s) => s.student?.fullname === studentName);
        if (exists) return prev;
        return {
          ...prev,
          [assignmentId]: [
            { _id: Date.now(), student: { fullname: studentName }, fileUrl, filename, createdAt: submittedAt },
            ...list,
          ],
        };
      });

      // Also bump the assignment count badge
      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignmentId
            ? { ...a, _submissionCount: (a._submissionCount || 0) + 1 }
            : a
        )
      );
    });

    socket.on('group_submission', ({ assignmentId, assignmentTitle, groupName, submittedBy }) => {
      toast.info(
        `👥 ${groupName} submitted "${assignmentTitle}"${submittedBy ? ` — by ${submittedBy}` : ''}`,
        { autoClose: 5000 }
      );

      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignmentId
            ? { ...a, _submissionCount: (a._submissionCount || 0) + 1 }
            : a
        )
      );
    });

    return () => {
      socket.off('connect', joinRoom);
      socket.off('new_submission');
      socket.off('group_submission');
    };
  }, [user?._id]);

  // ── Load submissions on expand ─────────────────────────────────────────────
  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);

    if (!submissions[id]) {
      setLoadingSubs((p) => ({ ...p, [id]: true }));
      try {
        const { data } = await teacherAPI.getAssignmentSubmissions(id);
        setSubmissions((p) => ({ ...p, [id]: data.submissions || [] }));
        // sync count
        setAssignments((prev) =>
          prev.map((a) => a._id === id ? { ...a, _submissionCount: data.count } : a)
        );
      } catch {
        toast.error('Failed to load submissions');
      } finally {
        setLoadingSubs((p) => ({ ...p, [id]: false }));
      }
    }
  };

  // ── Question builder mutators ──────────────────────────────────────────────
  const addQuestion = () =>
    setForm((p) => ({ ...p, questions: [...p.questions, newQuestion()] }));

  const removeQuestion = (qi) =>
    setForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }));

  const updateQuestion = (qi, patch) =>
    setForm((p) => ({
      ...p,
      questions: p.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)),
    }));

  const addOption = (qi) =>
    setForm((p) => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qi ? { ...q, options: [...q.options, { text: '' }] } : q
      ),
    }));

  const removeOption = (qi, oi) =>
    setForm((p) => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qi) return q;
        const options = q.options.filter((_, idx) => idx !== oi);
        let correctIndex = q.correctIndex;
        if (correctIndex === oi) correctIndex = 0;
        else if (correctIndex > oi) correctIndex -= 1;
        return { ...q, options, correctIndex };
      }),
    }));

  const updateOption = (qi, oi, text) =>
    setForm((p) => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, idx) => (idx === oi ? { ...o, text } : o)) }
          : q
      ),
    }));

  // ── Open the modal for a new assignment ────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    if (fileRef.current) fileRef.current.value = '';
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditingId(null);
    setForm(emptyForm());
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Open the modal to edit an existing assignment (prefill questions) ───────
  const handleEdit = async (id) => {
    try {
      const { data } = await teacherAPI.getAssignment(id);
      const a = data.assignment;
      setForm({
        title: a.title || '',
        description: a.description || '',
        dueDate: a.deadline ? toLocalInput(a.deadline) : '',
        classId: a.class?._id || a.class || '',
        file: null,
        mode: a.mode || 'individual',
        submissionMode: a.groupConfig?.submissionMode || 'one_answer',
        discussion: a.groupConfig?.discussion ?? true,
        submissionType: a.submissionType || 'upload',
        resultVisibility: a.resultVisibility || 'immediate',
        questions: (a.questions || []).map(fromServerQuestion),
      });
      setEditingId(id);
      if (fileRef.current) fileRef.current.value = '';
      setModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load assignment');
    }
  };

  // ── Create / update an assignment ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.dueDate)       return toast.error('Due date is required');
    if (!form.classId)       return toast.error('Select a class');

    const isInteractive = form.submissionType === 'interactive' || form.submissionType === 'mixed';
    if (isInteractive) {
      if (form.questions.length === 0) return toast.error('Add at least one question');
      const error = validateQuestions(form.questions);
      if (error) return toast.error(error);
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title);
      fd.append('description', form.description);
      fd.append('dueDate',     form.dueDate);
      fd.append('classId',     form.classId);
      fd.append('mode',        form.mode);
      fd.append('groupConfig', JSON.stringify({
        submissionMode: form.submissionMode,
        discussion: form.discussion,
      }));
      fd.append('submissionType', form.submissionType);
      fd.append('resultVisibility', form.resultVisibility);
      fd.append('questions', JSON.stringify(
        isInteractive ? form.questions.map(toPayloadQuestion) : []
      ));
      if (form.file) fd.append('file', form.file);

      if (editingId) {
        await teacherAPI.updateAssignment(editingId, fd);
        toast.success('Assignment updated');
      } else {
        await teacherAPI.uploadAssignment(fd);
        toast.success('Assignment created and sent!');
      }
      closeModal();
      loadAssignments();
    } catch (err) {
      // Surfaces both the 400 validation message and the 409
      // "questions cannot be changed once students have submitted".
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete an assignment (cascades on the server) ──────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await teacherAPI.deleteAssignment(confirmDelete._id);
      setAssignments((prev) => prev.filter((a) => a._id !== confirmDelete._id));
      setSubmissions((prev) => {
        const next = { ...prev };
        delete next[confirmDelete._id];
        return next;
      });
      toast.success('Assignment deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete assignment');
    } finally {
      setDeleting(false);
    }
  };

  const isOverdue = (deadline) => deadline && new Date() > new Date(deadline);
  const isInteractive = form.submissionType === 'interactive' || form.submissionType === 'mixed';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-500 text-sm mt-1">Create assignments and track student submissions in real-time</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={15} /> New Assignment
          </button>
        </div>

        {/* Assignment list */}
        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No assignments yet</p>
            <p className="text-gray-400 text-sm">Click "New Assignment" to create one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const deadline = a.deadline || a.dueDate;
              const overdue  = isOverdue(deadline);
              const subList  = submissions[a._id] || [];
              const subCount = a._submissionCount ?? subList.length;
              const isOpen   = expanded === a._id;

              return (
                <div key={a._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Row */}
                  <div
                    onClick={() => toggleExpand(a._id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {a.class?.name && <span className="text-xs text-gray-400">{a.class.name}</span>}
                        {a.mode && a.mode !== 'individual' && (
                          <span className="text-xs font-semibold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            {a.mode === 'both' ? 'Individual + Group' : 'Group'}
                          </span>
                        )}
                        {a.submissionType && a.submissionType !== 'upload' && (
                          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                            {a.submissionType}
                          </span>
                        )}
                        {deadline && (
                          <span className={`flex items-center gap-1 text-xs font-semibold ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                            <Clock size={10} />
                            {overdue ? 'Closed' : `Due ${format(new Date(deadline), 'MMM d, HH:mm')}`}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Submission badge + row actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                        <Users size={11} /> {subCount}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assignments/${a._id}/results`); }}
                        title="Results"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <BarChart3 size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(a._id); }}
                        title="Edit"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(a); }}
                        title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                      {isOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Submissions panel */}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="px-4 pt-4 flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assignments/${a._id}/results`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                        >
                          <BarChart3 size={13} /> View Results
                        </button>
                        {a.mode && a.mode !== 'individual' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assignments/${a._id}/groups`); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition"
                          >
                            <Users size={13} /> Manage Groups
                          </button>
                        )}
                      </div>
                      {loadingSubs[a._id] ? (
                        <div className="flex justify-center py-6">
                          <Loader2 size={20} className="animate-spin text-blue-400" />
                        </div>
                      ) : subList.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-6">No submissions yet</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {subList.map((s) => (
                            <div key={s._id} className="flex items-center justify-between px-4 py-3">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{s.student?.fullname || '—'}</p>
                                  <p className="text-xs text-gray-400">
                                    {s.createdAt ? format(new Date(s.createdAt), 'MMM d, yyyy HH:mm') : ''}
                                    {s.student?.registrationNumber && ` · ${s.student.registrationNumber}`}
                                  </p>
                                </div>
                              </div>
                              {s.fileUrl && (
                                <a
                                  href={s.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                                >
                                  <Download size={12} /> {s.filename || 'Download'}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New / Edit Assignment Modal */}
      <Modal isOpen={modal} onClose={closeModal} title={editingId ? 'Edit Assignment' : 'New Assignment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
            <input className={inputCls} placeholder="e.g. Chapter 5 — Mathematics" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea rows={2} className={inputCls + ' resize-none'} placeholder="Instructions…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Class *</label>
              <select className={inputCls} value={form.classId} onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}>
                <option value="">Select…</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date *</label>
              <input type="datetime-local" className={inputCls} value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>

          {/* Assignment Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assignment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'individual', label: 'Individual' },
                { value: 'group', label: 'Group' },
                { value: 'both', label: 'Both' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, mode: opt.value }))}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    form.mode === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.mode !== 'individual' && (
            <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Group Submission Mode</label>
                <select className={inputCls} value={form.submissionMode} onChange={(e) => setForm((p) => ({ ...p, submissionMode: e.target.value }))}>
                  <option value="one_answer">One shared group answer</option>
                  <option value="any_member">Any member can submit</option>
                  <option value="contributions">Members contribute, then submit</option>
                  <option value="individual">Discuss as a group, submit individually</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.discussion} onChange={(e) => setForm((p) => ({ ...p, discussion: e.target.checked }))} className="rounded" />
                Allow students to discuss in the group workspace
              </label>
              <p className="text-xs text-gray-500">
                After creating the assignment, open <span className="font-semibold">Manage Groups</span> to build the groups.
              </p>
            </div>
          )}

          {/* How students answer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">How students answer</label>
            <select className={inputCls} value={form.submissionType} onChange={(e) => setForm((p) => ({ ...p, submissionType: e.target.value }))}>
              <option value="upload">Upload a file</option>
              <option value="text">Type an answer</option>
              <option value="interactive">Interactive questions</option>
              <option value="mixed">Questions + file</option>
            </select>
          </div>

          {/* Question builder */}
          {isInteractive && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">Questions</label>
                <span className="text-xs text-gray-400">
                  {form.questions.length} question{form.questions.length === 1 ? '' : 's'}
                </span>
              </div>

              {form.questions.map((q, qi) => (
                <div key={qi} className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qi, { type: 'objective' })}
                        className={`px-3 py-1.5 text-xs font-semibold transition ${
                          q.type === 'objective' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Objective (poll)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(qi, { type: 'essay' })}
                        className={`px-3 py-1.5 text-xs font-semibold transition ${
                          q.type === 'essay' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Essay
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      title="Remove question"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    className={inputCls + ' resize-none'}
                    placeholder={`Question ${qi + 1} prompt…`}
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Points</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={inputCls}
                        value={q.points}
                        onChange={(e) => updateQuestion(qi, { points: e.target.value })}
                      />
                    </div>
                    <label className="flex items-end gap-2 text-sm text-gray-700 pb-2.5">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={q.required}
                        onChange={(e) => updateQuestion(qi, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>

                  {q.type === 'objective' ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-500">Options — select the correct one</label>
                      {q.options.map((o, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            className="accent-blue-600 flex-shrink-0"
                            checked={q.correctIndex === oi}
                            onChange={() => updateQuestion(qi, { correctIndex: oi })}
                          />
                          <span className="w-4 text-xs font-bold text-gray-400 flex-shrink-0">{optionKey(oi)}</span>
                          <input
                            className={inputCls}
                            placeholder={`Option ${optionKey(oi)}`}
                            value={o.text}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qi, oi)}
                            disabled={q.options.length <= 2}
                            title="Remove option"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          >
                            <MinusCircle size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qi)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                      >
                        <PlusCircle size={14} /> Add option
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={q.allowUpload}
                        onChange={(e) => updateQuestion(qi, { allowUpload: e.target.checked })}
                      />
                      Allow a scan / upload for this question
                    </label>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
              >
                <Plus size={15} /> Add question
              </button>
            </div>
          )}

          {/* Result visibility */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">When students see their result</label>
            <select className={inputCls} value={form.resultVisibility} onChange={(e) => setForm((p) => ({ ...p, resultVisibility: e.target.value }))}>
              <option value="immediate">Immediately</option>
              <option value="after_deadline">After the deadline</option>
              <option value="manual">When I release it</option>
            </select>
          </div>

          {/* File */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} />
            {form.file ? (
              <>
                <File size={28} className="mx-auto text-blue-500 mb-1" />
                <p className="text-sm font-semibold text-gray-800">{form.file.name}</p>
                <p className="text-xs text-gray-400">{(form.file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <Upload size={28} className="mx-auto text-gray-300 mb-1" />
                <p className="text-sm text-gray-500 font-medium">Click to attach file (optional)</p>
                <p className="text-xs text-gray-400">PDF, Word, Images…</p>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Saving…' : (editingId ? 'Save Changes' : 'Send to Class')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete assignment">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{confirmDelete?.title}</p>
              <p className="text-sm text-gray-500 mt-1">Delete this assignment? Submissions and group work will be removed too.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
