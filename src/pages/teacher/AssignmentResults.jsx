import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { assignmentAPI } from '../../api/assignment.api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  ArrowLeft, Loader2, BarChart3, CheckCircle, FileText,
  Download, ChevronDown, ChevronUp, Save, AlertCircle,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const btnPrimary = 'flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50';

const STATUS_STYLE = {
  active: 'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  graded: 'bg-emerald-100 text-emerald-700',
};

const fmt = (value) => (value === null || value === undefined ? '—' : value);

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
      <p className={`text-xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-300">{sub}</p>}
    </div>
  );
}

// Seed the editable draft for one submission from the server payload.
const buildStudentDraft = (student) => {
  const answers = {};
  (student.answers || []).forEach((answer) => {
    answers[answer.question] = {
      awarded: answer.awarded ?? '',
      feedback: answer.feedback ?? '',
    };
  });
  return { answers, score: student.score ?? '' };
};

export default function AssignmentResults() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [data, setData]           = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [drafts, setDrafts]       = useState({});   // submissionId → { answers, score }
  const [saving, setSaving]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await assignmentAPI.results(assignmentId);
      setData(res);
      // Initialise drafts only for submissions we have not seen yet, so an
      // in-progress mark on another row is never clobbered by a refresh.
      setDrafts((prev) => {
        const next = { ...prev };
        (res.students || []).forEach((s) => {
          if (!next[s._id]) next[s._id] = buildStudentDraft(s);
        });
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  const setDraftAnswer = (sid, qid, patch) =>
    setDrafts((p) => {
      const base = p[sid] || { answers: {}, score: '' };
      return {
        ...p,
        [sid]: {
          ...base,
          answers: { ...base.answers, [qid]: { ...(base.answers[qid] || {}), ...patch } },
        },
      };
    });

  const setDraftScore = (sid, value) =>
    setDrafts((p) => ({ ...p, [sid]: { ...(p[sid] || { answers: {} }), score: value } }));

  const saveMarks = async (student) => {
    const draft = drafts[student._id] || { answers: {}, score: '' };
    setSaving(student._id);
    try {
      let payload;
      if ((student.answers || []).length > 0) {
        payload = {
          answers: student.answers.map((a) => ({
            question: a.question,
            awarded: draft.answers[a.question]?.awarded,
            feedback: draft.answers[a.question]?.feedback ?? '',
          })),
        };
      } else {
        payload = { score: Number(draft.score) };
      }

      const { data: res } = await assignmentAPI.grade(student._id, payload);
      toast.success(res.message || 'Saved');
      // Re-seed this row from the refreshed payload (e.g. a clamped mark or the
      // new status once every answer has been marked).
      setDrafts((p) => {
        const next = { ...p };
        delete next[student._id];
        return next;
      });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(null);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-400" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-3xl">
          <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <button onClick={load} className="mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            Try again
          </button>
        </div>
      </MainLayout>
    );
  }

  const assignment = data?.assignment || {};
  const totals     = data?.totals || {};
  const questions  = data?.questions || [];
  const students   = data?.students || [];
  const maxScore   = assignment.maxScore ?? totals.maxScore ?? 0;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{assignment.title || 'Assignment results'}</h1>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">
              {assignment.submissionType || 'upload'} · results {String(assignment.resultVisibility || 'immediate').replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Submissions" value={fmt(totals.submissions)} />
          <StatCard label="Graded" value={fmt(totals.graded)} accent="text-emerald-600" />
          <StatCard label="Pending" value={fmt(totals.pending)} accent="text-amber-600" />
          <StatCard label="Average" value={fmt(totals.average)} sub={`out of ${maxScore}`} />
          <StatCard label="Highest" value={fmt(totals.highest)} sub={`out of ${maxScore}`} />
          <StatCard label="Lowest" value={fmt(totals.lowest)} sub={`out of ${maxScore}`} />
        </div>

        {/* Per-question breakdown (interactive assignments only) */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-500" /> Question breakdown
            </h2>

            {questions.map((q, i) => (
              q.type === 'objective' ? (
                <div key={q.question} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-400">
                        Question {i + 1} · Objective · {q.points} pt
                      </p>
                      <p className="font-semibold text-gray-900 mt-0.5">{q.prompt}</p>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {q.correct} of {q.answered} correct
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {(q.distribution || []).map((opt) => {
                      const pct = q.answered ? Math.round((opt.count / q.answered) * 100) : 0;
                      return (
                        <div key={opt.key}>
                          <div className="flex items-center justify-between text-xs mb-1 gap-2">
                            <span className={`font-semibold truncate ${opt.correct ? 'text-emerald-600' : 'text-gray-600'}`}>
                              {opt.key}. {opt.text}{opt.correct ? ' ✓' : ''}
                            </span>
                            <span className="text-gray-400 whitespace-nowrap">
                              {opt.count} {opt.count === 1 ? 'answer' : 'answers'} · {pct}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${opt.correct ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div key={q.question} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-semibold text-gray-400">
                    Question {i + 1} · Essay · {q.points} pt
                  </p>
                  <p className="font-semibold text-gray-900 mt-0.5">{q.prompt}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <span className="text-gray-500">Answered <span className="font-semibold text-gray-800">{q.answered}</span></span>
                    <span className="text-gray-500">Marked <span className="font-semibold text-emerald-600">{q.marked}</span></span>
                    <span className="text-gray-500">Pending <span className="font-semibold text-amber-600">{q.pending}</span></span>
                    <span className="text-gray-500">Average <span className="font-semibold text-gray-800">{fmt(q.average)}</span></span>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Students table */}
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No submissions yet</p>
            <p className="text-gray-400 text-sm">Student answers will appear here as they come in</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="hidden sm:flex items-center gap-4 px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span className="flex-1">Student</span>
              <span className="w-24">Status</span>
              <span className="w-24 text-right">Score</span>
              <span className="w-28 text-right">Submitted</span>
            </div>

            {students.map((s) => {
              const isOpen = expanded === s._id;
              const draft  = drafts[s._id] || { answers: {}, score: '' };
              const hasAnswers = (s.answers || []).length > 0;

              return (
                <div key={s._id} className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => setExpanded(isOpen ? null : s._id)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {isOpen
                        ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
                        : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{s.student?.fullname || '—'}</p>
                        <p className="text-xs text-gray-400">{s.student?.registrationNumber || ''}</p>
                      </div>
                    </div>
                    <span className={`w-24 text-xs font-semibold px-2.5 py-1 rounded-full text-center ${STATUS_STYLE[s.status] || 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                    <span className="w-24 text-right text-sm font-semibold text-gray-800">
                      {s.score ?? '—'} / {s.maxScore}
                    </span>
                    <span className="hidden sm:block w-28 text-right text-xs text-gray-400">
                      {s.submittedAt ? format(new Date(s.submittedAt), 'MMM d, HH:mm') : '—'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      {hasAnswers ? (
                        <>
                          {s.answers.map((a) => (
                            <div key={a.question} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-800">{a.prompt}</p>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{a.points} pt</span>
                              </div>

                              {/* The student's answer */}
                              {a.type === 'objective' ? (
                                <p className="text-sm text-gray-600">
                                  Answer: <span className="font-semibold">{a.option || '—'}</span>
                                  {a.correctOption && (
                                    <span className={`ml-2 font-semibold ${a.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {a.isCorrect ? '✓ Correct' : `✗ Correct: ${a.correctOption}`}
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <div className="text-sm text-gray-600 space-y-1">
                                  {a.text && <p className="whitespace-pre-wrap">{a.text}</p>}
                                  {a.fileUrl && (
                                    <a
                                      href={a.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                                    >
                                      <Download size={13} /> {a.filename || 'Download'}
                                    </a>
                                  )}
                                  {!a.text && !a.fileUrl && <p className="text-gray-400 italic">No answer</p>}
                                </div>
                              )}

                              {/* Marking controls — essays only (objectives auto-mark) */}
                              {a.type === 'essay' && (
                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                  <div className="sm:w-32">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Mark (0–{a.points})</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={a.points}
                                      className={inputCls}
                                      value={draft.answers[a.question]?.awarded ?? ''}
                                      onChange={(e) => setDraftAnswer(s._id, a.question, { awarded: e.target.value })}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Feedback</label>
                                    <input
                                      className={inputCls}
                                      placeholder="Optional feedback…"
                                      value={draft.answers[a.question]?.feedback ?? ''}
                                      onChange={(e) => setDraftAnswer(s._id, a.question, { feedback: e.target.value })}
                                    />
                                  </div>
                                </div>
                              )}

                              {a.type === 'objective' && a.awarded !== null && a.awarded !== undefined && (
                                <p className="text-xs text-gray-400">Awarded: {a.awarded} / {a.points}</p>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => saveMarks(s)}
                            disabled={saving === s._id}
                            className={btnPrimary}
                          >
                            {saving === s._id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save marks
                          </button>
                        </>
                      ) : (
                        <>
                          {(s.text || s.fileUrl) && (
                            <div className="text-sm text-gray-600 space-y-1">
                              {s.text && <p className="whitespace-pre-wrap">{s.text}</p>}
                              {s.fileUrl && (
                                <a
                                  href={s.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                                >
                                  <Download size={13} /> {s.filename || 'Download'}
                                </a>
                              )}
                            </div>
                          )}
                          <div className="flex items-end gap-3">
                            <div className="w-32">
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Score</label>
                              <input
                                type="number"
                                min="0"
                                className={inputCls}
                                value={draft.score}
                                onChange={(e) => setDraftScore(s._id, e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => saveMarks(s)}
                              disabled={saving === s._id}
                              className={btnPrimary}
                            >
                              {saving === s._id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              Save marks
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
