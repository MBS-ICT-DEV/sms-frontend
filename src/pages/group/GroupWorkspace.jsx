import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { groupAPI } from '../../api/group.api';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, disconnectSocket } from '../../utils/socket';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Users, Star, Crown, MessageSquare, Send, Paperclip, FileText,
  CheckCircle, Lock, Award, Loader2, Download, Pencil, Trash2,
  Save, Calendar, AlertCircle, Info, Hourglass, ListChecks,
  RefreshCw, ShieldCheck, GraduationCap, Timer,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const btnPrimary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50';
const btnGhost = 'flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50';

const STATUS_STYLE = {
  active: 'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  graded: 'bg-emerald-100 text-emerald-700',
};

const TABS = [
  { key: 'discussion', label: 'Discussion', Icon: MessageSquare },
  { key: 'answers', label: 'Answers', Icon: ListChecks },
  { key: 'files', label: 'Files', Icon: FileText },
  { key: 'members', label: 'Members', Icon: Users },
];

function fileNameFromUrl(url) {
  if (!url) return 'file';
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'file');
  } catch {
    return 'file';
  }
}

function Empty({ text }) {
  return <p className="text-center text-sm text-gray-400 py-8">{text}</p>;
}

function Notice({ icon: Icon, text, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-50 border-gray-100 text-gray-500',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  };
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 text-sm ${tones[tone] || tones.gray}`}>
      {Icon && <Icon size={15} className="flex-shrink-0" />}
      <span>{text}</span>
    </div>
  );
}

function AttachmentLinks({ urls, className }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className={className || 'flex flex-wrap gap-2'}>
      {urls.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition max-w-full"
        >
          <Download size={12} className="flex-shrink-0" />
          <span className="truncate">{fileNameFromUrl(url)}</span>
        </a>
      ))}
    </div>
  );
}

export default function GroupWorkspace() {
  const { groupId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading]           = useState(true);
  const [busy, setBusy]                 = useState(false);
  const [group, setGroup]               = useState(null);
  const [assignment, setAssignment]     = useState(null);
  const [submission, setSubmission]     = useState(null);
  const [contributions, setContributions] = useState([]);
  const [messages, setMessages]         = useState([]);
  const [isOwner, setIsOwner]           = useState(false);
  const [isStaff, setIsStaff]           = useState(false);
  const [activity, setActivity]         = useState([]);
  const [activeTab, setActiveTab]       = useState('discussion');
  const [now, setNow]                   = useState(Date.now());

  // Discussion composer
  const [msgText, setMsgText]   = useState('');
  const [msgFiles, setMsgFiles] = useState([]);

  // Contribution composer
  const [cQuestion, setCQuestion] = useState('');
  const [cContent, setCContent]   = useState('');
  const [cFiles, setCFiles]       = useState([]);

  // Contribution editing
  const [editingContrib, setEditingContrib] = useState(null);
  const [editContent, setEditContent]       = useState('');

  // Submission
  const [submitContent, setSubmitContent] = useState('');
  const [submitFiles, setSubmitFiles]     = useState([]);
  const [resubmitting, setResubmitting]   = useState(false);

  // Grading
  const [gradeScore, setGradeScore]       = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [memberScores, setMemberScores]   = useState({});

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const { data } = await groupAPI.get(groupId);
      setGroup(data.group || null);
      setAssignment(data.assignment || null);
      setSubmission(data.submission || null);
      setContributions(data.contributions || []);
      setMessages(data.messages || []);
      setIsOwner(!!data.isOwner);
      setIsStaff(!!data.isStaff);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const refreshMessages = useCallback(async () => {
    try {
      const { data } = await groupAPI.messages(groupId);
      setMessages(data.messages || []);
    } catch { /* keep the current data */ }
  }, [groupId]);

  const refreshContributions = useCallback(async () => {
    try {
      const { data } = await groupAPI.contributions(groupId);
      setContributions(data.contributions || []);
    } catch { /* keep the current data */ }
  }, [groupId]);

  const refreshSubmission = useCallback(async () => {
    try {
      const { data } = await groupAPI.submission(groupId);
      setSubmission(data.submission || null);
    } catch { /* keep the current data */ }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  // Live updates: join the group's socket room and refresh the matching tab
  // whenever another member posts a message, adds an answer or submits.
  useEffect(() => {
    if (!groupId) return undefined;
    let socket;
    try {
      socket = connectSocket();
    } catch {
      return undefined; // socket.io unavailable — the page still works on refresh
    }

    const joinRoom = () => socket.emit('join_group_room', groupId);
    if (socket.connected) joinRoom();
    else socket.once('connect', joinRoom);

    const onMessage = () => { refreshMessages(); };
    const onContribution = () => { refreshContributions(); };
    const onSubmission = () => { refreshSubmission(); };

    socket.on('group_message', onMessage);
    socket.on('group_contribution', onContribution);
    socket.on('group_submission', onSubmission);

    return () => {
      try {
        socket.off('connect', joinRoom);
        socket.off('group_message', onMessage);
        socket.off('group_contribution', onContribution);
        socket.off('group_submission', onSubmission);
        disconnectSocket();
      } catch { /* ignore */ }
    };
  }, [groupId, refreshMessages, refreshContributions, refreshSubmission]);

  // Live countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // Load activity when the members tab is opened
  useEffect(() => {
    if (activeTab !== 'members' || !groupId) return;
    groupAPI.activity(groupId)
      .then(({ data }) => setActivity(data.participation || []))
      .catch(() => setActivity([]));
  }, [activeTab, groupId]);

  // Hydrate grading form from the current submission
  useEffect(() => {
    if (!submission) return;
    setGradeScore(submission.score ?? '');
    setGradeFeedback(submission.feedback || '');
    const ms = {};
    (submission.memberScores || []).forEach((s) => {
      const id = s.student?._id || s.student;
      if (id) ms[id] = s.score ?? '';
    });
    setMemberScores(ms);
  }, [submission]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const role = user?.role?.toLowerCase();
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher' || isStaff || isOwner;
  const gc = assignment?.groupConfig || {};
  const submissionMode = gc.submissionMode || 'one_answer';
  const discussionOn = gc.discussion !== false;
  const allowResubmission = !!gc.allowResubmission;
  const allowLate = !!gc.allowLate;
  const deadline = assignment?.deadline;

  const isMember = (group?.members || []).some((m) => m.student?._id === user?._id);
  const hasSubmission = !!submission;

  const canPostDiscussion = discussionOn && (!isTeacher || !!gc.teacherParticipate);

  const membersSummary = (group?.members || [])
    .map((m) => m.student?.fullname)
    .filter(Boolean)
    .join(' • ');

  const countdown = (() => {
    if (!deadline) return null;
    const ms = new Date(deadline).getTime() - now;
    if (ms <= 0) return 'Deadline passed';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours === 1 ? '' : 's'} remaining`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ${mins} min remaining`;
    return `${mins} min remaining`;
  })();

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!msgText.trim() && msgFiles.length === 0) return toast.error('Enter a message');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('message', msgText);
      msgFiles.forEach((f) => fd.append('files', f));
      await groupAPI.sendMessage(groupId, fd);
      const { data } = await groupAPI.messages(groupId);
      setMessages(data.messages || []);
      setMsgText('');
      setMsgFiles([]);
      toast.success('Message sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  const handleAddContribution = async () => {
    if (!cContent.trim()) return toast.error('Enter your answer');
    setBusy(true);
    try {
      const fd = new FormData();
      if (cQuestion.trim()) fd.append('question', cQuestion.trim());
      fd.append('content', cContent);
      cFiles.forEach((f) => fd.append('files', f));
      await groupAPI.addContribution(groupId, fd);
      await refreshContributions();
      setCQuestion('');
      setCContent('');
      setCFiles([]);
      toast.success('Answer added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add answer');
    } finally {
      setBusy(false);
    }
  };

  const startEditContrib = (c) => { setEditingContrib(c._id); setEditContent(c.content || ''); };

  const saveEditContrib = async (c) => {
    try {
      await groupAPI.updateContribution(groupId, c._id, { content: editContent });
      toast.success('Answer updated');
      setEditingContrib(null);
      await refreshContributions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update answer');
    }
  };

  const deleteContrib = async (c) => {
    if (!window.confirm('Delete this answer?')) return;
    try {
      await groupAPI.deleteContribution(groupId, c._id);
      toast.success('Answer deleted');
      await refreshContributions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete answer');
    }
  };

  const handleSubmitGroup = async () => {
    if (!submitContent.trim()) return toast.error('Enter your group answer');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('content', submitContent);
      submitFiles.forEach((f) => fd.append('files', f));
      const { data } = await groupAPI.submit(groupId, fd);
      setSubmission(data.submission || null);
      setSubmitContent('');
      setSubmitFiles([]);
      setResubmitting(false);
      toast.success('Group submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setBusy(false);
    }
  };

  const handleGrade = async () => {
    if (gradeScore === '' || Number.isNaN(Number(gradeScore))) return toast.error('Enter a score');
    setBusy(true);
    try {
      const payload = { score: Number(gradeScore), feedback: gradeFeedback };
      if (gc.allowIndividualScores) {
        payload.memberScores = Object.entries(memberScores)
          .filter(([, v]) => v !== '' && v != null)
          .map(([student, score]) => ({ student, score: Number(score) }));
      }
      const { data } = await groupAPI.grade(groupId, payload);
      setSubmission(data.submission || submission);
      toast.success('Submission graded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grade submission');
    } finally {
      setBusy(false);
    }
  };

  // ── Aggregations ───────────────────────────────────────────────────────────
  const filesList = [
    ...(messages || []).flatMap((m) =>
      (m.attachments || []).map((url) => ({ url, who: m.author?.fullname, at: m.createdAt, source: 'Discussion' }))
    ),
    ...(contributions || []).flatMap((c) =>
      (c.attachments || []).map((url) => ({ url, who: c.student?.fullname, at: c.createdAt, source: c.question ? `Answer · ${c.question}` : 'Answer' }))
    ),
    ...((submission?.attachments) || []).map((url) => ({
      url,
      who: submission?.submittedBy?.fullname,
      at: submission?.submittedAt,
      source: 'Submission',
    })),
  ];
  const sortedFiles = [...filesList].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const visibleContributions = isStudent && gc.seeOthersAnswers === false
    ? contributions.filter((c) => c.student?._id === user?._id)
    : contributions;

  const groupedContribs = visibleContributions.reduce((acc, c) => {
    const key = (c.question || '').trim() || 'General';
    (acc[key] = acc[key] || []).push(c);
    return acc;
  }, {});

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  if (!group) {
    return (
      <MainLayout>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Group not found</p>
        </div>
      </MainLayout>
    );
  }

  const status = group.status || 'active';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide truncate">
                {assignment?.title || 'Assignment'}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 truncate mt-0.5">{group.name}</h1>
              {membersSummary && <p className="text-sm text-gray-500 mt-1 truncate">{membersSummary}</p>}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[status] || STATUS_STYLE.active}`}>
              {status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
            {deadline && (
              <span className="flex items-center gap-1 text-gray-400">
                <Calendar size={12} /> Due {format(new Date(deadline), 'MMM d, yyyy HH:mm')}
              </span>
            )}
            {countdown && (
              <span className={`flex items-center gap-1 font-semibold ${countdown === 'Deadline passed' ? 'text-red-500' : 'text-blue-600'}`}>
                <Timer size={12} /> {countdown}
              </span>
            )}
            {allowLate && (
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <Info size={12} /> Late submission allowed
              </span>
            )}
          </div>
        </div>

        {/* Submission panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Submission</h2>
          </div>

          {isTeacher ? (
            hasSubmission ? (
              <div className="space-y-4">
                {submission?.content && (
                  <div className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Submitted answer</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                )}
                <AttachmentLinks urls={submission?.attachments} />
                {submission?.submittedBy && (
                  <p className="text-xs text-gray-400">
                    Submitted by <span className="font-semibold text-gray-600">{submission.submittedBy.fullname}</span>
                    {submission.submittedBy.registrationNumber && ` · ${submission.submittedBy.registrationNumber}`}
                    {submission.submittedAt && ` · ${format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}`}
                  </p>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Score</label>
                    <input
                      type="number" className={inputCls}
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Feedback</label>
                    <textarea
                      rows={2} className={inputCls + ' resize-none'}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                    />
                  </div>
                </div>

                {gc.allowIndividualScores && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Individual scores</p>
                    <div className="space-y-2">
                      {(group.members || []).map((m) => {
                        const s = m.student || {};
                        return (
                          <div key={s._id || m._id} className="flex items-center gap-3">
                            <span className="flex-1 text-sm text-gray-700 truncate">{s.fullname || '—'}</span>
                            <input
                              type="number"
                              className={inputCls + ' max-w-[110px]'}
                              value={memberScores[s._id] ?? ''}
                              onChange={(e) => setMemberScores((p) => ({ ...p, [s._id]: e.target.value }))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button onClick={handleGrade} disabled={busy} className={btnPrimary}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Save grade
                </button>
              </div>
            ) : (
              <Notice icon={Hourglass} text="No group submission yet." />
            )
          ) : submissionMode === 'individual' ? (
            <Notice icon={GraduationCap} tone="blue" text="Each member submits their own answer individually. There is no group submission." />
          ) : isStudent && !isMember ? (
            <Notice icon={Info} text="You are not a member of this group." />
          ) : hasSubmission && !resubmitting ? (
            <div className="space-y-3">
              <Notice icon={CheckCircle} tone="emerald" text="Group Submitted" />
              <p className="text-xs text-gray-400">
                Submitted by <span className="font-semibold text-gray-600">{submission?.submittedBy?.fullname || '—'}</span>
                {submission?.submittedAt && ` · ${format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}`}
              </p>
              {submission?.content && (
                <div className="bg-gray-50 rounded-xl p-3.5 text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</div>
              )}
              <AttachmentLinks urls={submission?.attachments} />

              {submission?.status === 'graded' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                  <p className="text-sm font-bold text-emerald-700">Score: {submission.score}</p>
                  {submission.feedback && (
                    <p className="text-sm text-emerald-800 mt-1 whitespace-pre-wrap">{submission.feedback}</p>
                  )}
                </div>
              )}

              {isStudent && isMember && (
                allowResubmission ? (
                  <button onClick={() => setResubmitting(true)} className={btnGhost}>
                    <RefreshCw size={14} /> Resubmit
                  </button>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lock size={12} /> The teacher has disabled resubmission.
                  </p>
                )
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={4}
                className={inputCls + ' resize-none'}
                placeholder="Write your group answer…"
                value={submitContent}
                onChange={(e) => setSubmitContent(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 border-2 border-dashed border-gray-200 rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-blue-400 transition">
                <Paperclip size={15} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{submitFiles.length ? `${submitFiles.length} file(s) attached` : 'Attach files (optional)'}</span>
                <input type="file" multiple className="hidden" onChange={(e) => setSubmitFiles(Array.from(e.target.files || []))} />
              </label>
              <div className="flex gap-3">
                {resubmitting && (
                  <button onClick={() => setResubmitting(false)} className={btnGhost}>Cancel</button>
                )}
                <button onClick={handleSubmitGroup} disabled={busy} className={btnPrimary + ' flex-1'}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {resubmitting ? 'Resubmit' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* DISCUSSION */}
            {activeTab === 'discussion' && (
              <div className="space-y-4">
                {!discussionOn ? (
                  <Notice icon={MessageSquare} text="Discussion is disabled for this assignment." />
                ) : (
                  <>
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <Empty text="No messages yet. Start the conversation!" />
                      ) : (
                        messages.map((m) => (
                          <div key={m._id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {(m.author?.fullname || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3.5 py-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800 truncate">{m.author?.fullname || 'Unknown'}</span>
                                <span className="text-xs text-gray-400">
                                  {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}
                                </span>
                              </div>
                              {m.message && <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{m.message}</p>}
                              <AttachmentLinks urls={m.attachments} className="flex flex-wrap gap-2 mt-2" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {canPostDiscussion ? (
                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <textarea
                          rows={2}
                          className={inputCls + ' resize-none'}
                          placeholder="Write a message…"
                          value={msgText}
                          onChange={(e) => setMsgText(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition">
                            <Paperclip size={14} />
                            <span>{msgFiles.length ? `${msgFiles.length} file(s)` : 'Attach'}</span>
                            <input type="file" multiple className="hidden" onChange={(e) => setMsgFiles(Array.from(e.target.files || []))} />
                          </label>
                          <button onClick={handleSendMessage} disabled={busy} className={btnPrimary + ' ml-auto'}>
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                        You can view this discussion but only members can post.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ANSWERS */}
            {activeTab === 'answers' && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-3">
                  <input
                    className={inputCls}
                    placeholder="Question / label (optional)"
                    value={cQuestion}
                    onChange={(e) => setCQuestion(e.target.value)}
                  />
                  <textarea
                    rows={3}
                    className={inputCls + ' resize-none'}
                    placeholder="Your answer…"
                    value={cContent}
                    onChange={(e) => setCContent(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition">
                      <Paperclip size={14} />
                      <span>{cFiles.length ? `${cFiles.length} file(s)` : 'Attach'}</span>
                      <input type="file" multiple className="hidden" onChange={(e) => setCFiles(Array.from(e.target.files || []))} />
                    </label>
                    <button onClick={handleAddContribution} disabled={busy} className={btnPrimary + ' ml-auto'}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Add answer
                    </button>
                  </div>
                </div>

                {isStudent && gc.seeOthersAnswers === false && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600">
                    <Lock size={12} /> You can only see your own answers until the group submits.
                  </p>
                )}

                {Object.keys(groupedContribs).length === 0 ? (
                  <Empty text="No answers yet." />
                ) : (
                  Object.entries(groupedContribs).map(([question, list]) => (
                    <div key={question} className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{question}</p>
                      {list.map((c) => {
                        const mine = c.student?._id === user?._id;
                        return (
                          <div key={c._id} className="bg-white border border-gray-100 rounded-xl p-3.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800">{c.student?.fullname || 'Unknown'}</span>
                              {c.student?.registrationNumber && (
                                <span className="text-xs text-gray-400">{c.student.registrationNumber}</span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">
                                {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                              </span>
                            </div>

                            {editingContrib === c._id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  rows={3}
                                  className={inputCls + ' resize-none'}
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEditContrib(c)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                                  >
                                    <Save size={12} /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingContrib(null)}
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1.5">{c.content}</p>
                            )}

                            <AttachmentLinks urls={c.attachments} className="flex flex-wrap gap-2 mt-2" />

                            {mine && editingContrib !== c._id && (
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => startEditContrib(c)}
                                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-blue-600 transition"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => deleteContrib(c)}
                                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 transition"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FILES */}
            {activeTab === 'files' && (
              <div className="space-y-2">
                {sortedFiles.length === 0 ? (
                  <Empty text="No files have been shared yet." />
                ) : (
                  sortedFiles.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 hover:bg-gray-50 transition"
                    >
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{fileNameFromUrl(f.url)}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {f.who || 'Unknown'} · {f.source}
                          {f.at ? ` · ${format(new Date(f.at), 'MMM d, HH:mm')}` : ''}
                        </p>
                      </div>
                      <Download size={15} className="text-gray-400 flex-shrink-0" />
                    </a>
                  ))
                )}
              </div>
            )}

            {/* MEMBERS */}
            {activeTab === 'members' && (
              <div className="space-y-2">
                {(group.members || []).map((m) => {
                  const s = m.student || {};
                  const isLeader = m.role === 'leader' || group.leader === s._id;
                  const stats = activity.find((p) => p.student?._id === s._id);
                  return (
                    <div key={s._id || m._id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                      <Star size={14} className={isLeader ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{s.fullname || '—'}</p>
                        {s.registrationNumber && <p className="text-xs text-gray-400">{s.registrationNumber}</p>}
                      </div>
                      {isLeader && (
                        <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <Crown size={11} /> Leader
                        </span>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {stats?.messages ?? 0}</span>
                        <span className="flex items-center gap-1"><ListChecks size={12} /> {stats?.contributions ?? 0}</span>
                        <span className="flex items-center gap-1"><FileText size={12} /> {stats?.files ?? 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
