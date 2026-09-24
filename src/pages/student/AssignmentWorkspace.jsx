import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { assignmentAPI } from '../../api/assignment.api';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';
import {
  BookOpen, Calendar, Loader2, Upload, File, CheckCircle, X,
  AlertCircle, Lock, Award, Paperclip, Clock,
} from 'lucide-react';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

function optionText(options, key) {
  if (!key) return '';
  const found = (options || []).find(
    (option) => String(option.key).toUpperCase() === String(key).toUpperCase()
  );
  return found ? found.text : key;
}

function FilePick({ file, onChange, label = 'Attach a file', required = false }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600 border-2 border-dashed border-gray-200 rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-blue-400 transition">
      <Paperclip size={15} className="text-gray-400 flex-shrink-0" />
      <span className="truncate">{file ? file.name : `${label}${required ? ' *' : ''}`}</span>
      <input type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </label>
  );
}

function ResultView({ result }) {
  if (!result) return null;
  const visible = !!result.visible;
  const max = Number(result.maxScore) || 0;
  const score = Number(result.score) || 0;
  const pct = max > 0 ? Math.round((score / max) * 100) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your score</p>
            {visible ? (
              <p className="text-2xl font-bold text-gray-900">
                {max > 0 ? `${score} / ${max}` : score}
                {pct !== null && <span className="text-base font-semibold text-emerald-600 ml-2">({pct}%)</span>}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Your result will be released later.</p>
            )}
          </div>
        </div>
      </div>

      {(result.answers || []).map((a, i) => (
        <div key={a.question || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">
              <span className="text-gray-400 mr-1.5">Q{i + 1}.</span>{a.prompt}
            </p>
            <span className="text-xs text-gray-400 whitespace-nowrap">{a.points} mark{a.points === 1 ? '' : 's'}</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 mb-1">Your answer</p>
            {a.type === 'objective' ? (
              a.option ? (
                <p className="text-sm text-gray-700">{a.option}. {optionText(a.options, a.option)}</p>
              ) : (
                <p className="text-sm text-gray-400">Not answered</p>
              )
            ) : (
              <>
                {a.text ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.text}</p>
                ) : (
                  <p className="text-sm text-gray-400">No typed answer</p>
                )}
                {a.fileUrl && (
                  <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-600 hover:underline">
                    <File size={12} /> {a.filename || 'Attachment'}
                  </a>
                )}
              </>
            )}
          </div>

          {visible && (
            <div className="space-y-1.5">
              {a.type === 'objective' && (
                <div className="flex items-center gap-2 flex-wrap">
                  {a.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      <CheckCircle size={11} /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      <X size={11} /> Incorrect
                    </span>
                  )}
                  {a.correctOption && (
                    <span className="text-xs text-gray-500">
                      Correct answer: <span className="font-semibold text-gray-700">{a.correctOption}. {optionText(a.options, a.correctOption)}</span>
                    </span>
                  )}
                </div>
              )}
              {a.awarded !== null && a.awarded !== undefined && (
                <p className="text-xs text-gray-500">
                  Awarded: <span className="font-semibold text-gray-700">{a.awarded} / {a.points}</span>
                </p>
              )}
              {a.feedback && (
                <p className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  <span className="font-semibold">Teacher feedback: </span>{a.feedback}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AssignmentWorkspace() {
  const { assignmentId } = useParams();

  const [loading, setLoading]       = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Answering state
  const [text, setText]                 = useState('');
  const [overallFile, setOverallFile]   = useState(null);
  const [optionMap, setOptionMap]       = useState({});
  const [essayTextMap, setEssayTextMap] = useState({});
  const [essayFileMap, setEssayFileMap] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await assignmentAPI.paper(assignmentId);
      setAssignment(data.assignment || null);
      setSubmission(data.submission || null);
      setResult(data.submission?.result || null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) setError('This assignment could not be found.');
      else if (status === 403) setError('This assignment is not available for your class.');
      else setError(err.response?.data?.message || 'Failed to load the assignment.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  const type = assignment?.submissionType || 'upload';
  const interactive = type === 'interactive' || type === 'mixed';
  const questions = assignment?.questions || [];
  const deadline = assignment?.deadline;
  const pastDeadline = deadline ? new Date() > new Date(deadline) : false;

  const requiredAnswered = useMemo(
    () => questions.every((q) => {
      if (q.required === false) return true;
      if (q.type === 'objective') return !!optionMap[q._id];
      return !!((essayTextMap[q._id] || '').trim() || essayFileMap[q._id]);
    }),
    [questions, optionMap, essayTextMap, essayFileMap]
  );

  const canSubmit = useMemo(() => {
    if (!assignment || pastDeadline) return false;
    if (type === 'upload') return !!overallFile;
    if (type === 'text') return !!text.trim();
    if (type === 'interactive') return requiredAnswered;
    if (type === 'mixed') return !!overallFile && requiredAnswered;
    return false;
  }, [assignment, pastDeadline, type, overallFile, text, requiredAnswered]);

  const buildAnswers = () => {
    const list = [];
    questions.forEach((q) => {
      if (q.type === 'objective') {
        const opt = optionMap[q._id];
        if (opt) list.push({ question: q._id, option: opt });
      } else {
        const t = (essayTextMap[q._id] || '').trim();
        const f = essayFileMap[q._id];
        if (t || f) list.push({ question: q._id, text: t });
      }
    });
    return list;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('assignmentId', assignmentId);
      if (text.trim()) fd.append('text', text);
      if (interactive) {
        const answers = buildAnswers();
        if (answers.length) fd.append('answers', JSON.stringify(answers));
      }
      if (overallFile) fd.append('file', overallFile);
      Object.entries(essayFileMap).forEach(([qid, file]) => {
        if (file) fd.append(`answer_${qid}`, file);
      });

      const { data } = await assignmentAPI.submit(fd);
      toast.success(data.message || 'Assignment submitted');
      setSubmission(data.submission || null);
      setResult(data.result || data.submission?.result || null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('You have already submitted this assignment.');
      else if (status === 403) setError('The submission deadline has passed. No submissions allowed.');
      else if (status === 404) setError('This assignment could not be found.');
      else setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  if (!assignment) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
          <p className="text-gray-700 font-medium">{error || 'Assignment not available'}</p>
        </div>
      </MainLayout>
    );
  }

  const submitted = !!submission;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{assignment.title}</h1>
                {pastDeadline ? (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    <Lock size={11} /> Closed
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Open</span>
                )}
              </div>
              {assignment.description && (
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{assignment.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
                {deadline && (
                  <span className={`flex items-center gap-1 ${pastDeadline ? 'text-red-500 font-medium' : ''}`}>
                    <Calendar size={11} />
                    Due {format(new Date(deadline), 'MMM d, yyyy HH:mm')}
                    {' '}({formatDistanceToNow(new Date(deadline), { addSuffix: true })})
                  </span>
                )}
                {assignment.maxScore > 0 && (
                  <span className="flex items-center gap-1"><Award size={11} /> {assignment.maxScore} marks</span>
                )}
                <span className="capitalize">{type}</span>
              </div>
            </div>
          </div>
          {pastDeadline && !submitted && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-sm text-red-600">
              <Lock size={15} className="flex-shrink-0" />
              The deadline has passed — this assignment is closed for submissions.
            </div>
          )}
        </div>

        {/* Inline error (e.g. 409/403/404 on submit) */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-sm text-red-600">
            <AlertCircle size={15} className="flex-shrink-0" /> {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Submitted</h2>
                {submission.submittedAt && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}
                  </span>
                )}
              </div>
              {submission.text && (
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Your answer</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.text}</p>
                </div>
              )}
              {submission.fileUrl && (
                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
                  <File size={14} /> {submission.filename || 'Attachment'}
                </a>
              )}
              {!submission.text && !submission.fileUrl && (
                <p className="text-sm text-gray-400">Your responses have been recorded.</p>
              )}
            </div>

            {result ? (
              result.visible ? (
                <ResultView result={result} />
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3 text-sm text-amber-700">
                  <Clock size={15} className="flex-shrink-0" />
                  Your answers were submitted. Your result will be released later.
                </div>
              )
            ) : null}
          </div>
        ) : pastDeadline ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <Lock size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">This assignment is closed. You can no longer submit.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'text' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Your answer *</label>
                <textarea rows={8} className={inputCls + ' resize-none'} placeholder="Type your answer..."
                          value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            )}

            {type === 'upload' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <FilePick file={overallFile} onChange={setOverallFile} label="Attach your work" required />
                <p className="text-xs text-gray-400 mt-2">PDF, Word, Images — any format.</p>
              </div>
            )}

            {interactive && questions.map((q, idx) => (
              <div key={q._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    <span className="text-gray-400 mr-1.5">Q{idx + 1}.</span>{q.prompt}
                    {q.required !== false && <span className="text-red-500"> *</span>}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{q.points} mark{q.points === 1 ? '' : 's'}</span>
                </div>

                {q.type === 'objective' ? (
                  <div className="space-y-2">
                    {(q.options || []).map((opt) => (
                      <label key={opt.key}
                             className={`flex items-center gap-3 border rounded-xl px-3.5 py-2.5 cursor-pointer transition ${
                               optionMap[q._id] === opt.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                             }`}>
                        <input type="radio" name={`q_${q._id}`} className="accent-blue-600"
                               checked={optionMap[q._id] === opt.key}
                               onChange={() => setOptionMap((p) => ({ ...p, [q._id]: opt.key }))} />
                        <span className="text-sm text-gray-700"><span className="font-semibold mr-1">{opt.key}.</span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea rows={4} className={inputCls + ' resize-none'} placeholder="Type your answer..."
                              value={essayTextMap[q._id] || ''}
                              onChange={(e) => setEssayTextMap((p) => ({ ...p, [q._id]: e.target.value }))} />
                    {q.allowUpload !== false && (
                      <FilePick file={essayFileMap[q._id] || null} label="Attach a scan (optional)"
                                onChange={(f) => setEssayFileMap((p) => ({ ...p, [q._id]: f }))} />
                    )}
                  </div>
                )}
              </div>
            ))}

            {type === 'mixed' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Overall attachment *</label>
                <FilePick file={overallFile} onChange={setOverallFile} label="Attach your overall work" required />
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={!canSubmit || submitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {submitting ? 'Submitting...' : 'Submit assignment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
