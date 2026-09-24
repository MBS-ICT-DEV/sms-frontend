import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { studentAPI } from '../../api/student.api';
import { toast } from 'react-toastify';
import { Download, Calendar, BookOpen, Loader2, Upload, File, Lock, CheckCircle, X, Award, Clock, PlayCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

function SubmitModal({ assignment, onClose, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file to attach');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('assignmentId', assignment._id);
      fd.append('file', file);

      await studentAPI.submitAssignment(fd);
      toast.success('Assignment submitted successfully!');
      onSubmitted(assignment._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setUploading(false);
    }
  };

  const deadline = assignment.deadline || assignment.dueDate;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Submit Assignment</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {deadline && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-700 font-medium">
              Due: {format(new Date(deadline), 'MMM d, yyyy — HH:mm')}
              {' '}({formatDistanceToNow(new Date(deadline), { addSuffix: true })})
            </div>
          )}

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <>
                <File size={30} className="mx-auto text-blue-500 mb-2" />
                <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                <p className="text-xs text-blue-500 mt-1">Click to change file</p>
              </>
            ) : (
              <>
                <Upload size={30} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-600">Click to attach your work</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, Word, Images — any format</p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={uploading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ViewAssignments() {
  const navigate = useNavigate();
  const [assignments,    setAssignments]    = useState([]);
  const [submissionMap,  setSubmissionMap]  = useState({});
  const [loading,        setLoading]        = useState(true);
  const [submitTarget,   setSubmitTarget]   = useState(null); // assignment obj

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [{ data: aData }, { data: sData }] = await Promise.all([
          studentAPI.getAssignments(),
          studentAPI.getMySubmissions(),
        ]);
        setAssignments(aData.assignments || []);
        setSubmissionMap(sData.submissionMap || {});
      } catch {
        toast.error('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSubmitted = (assignmentId) => {
    // Mark as submitted locally so the UI reflects immediately
    setSubmissionMap((prev) => ({
      ...prev,
      [assignmentId]: { createdAt: new Date().toISOString(), justSubmitted: true },
    }));
  };

  const isOverdue = (date) => date && new Date() > new Date(date);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">View, download, and submit your completed assignments</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No assignments yet</p>
            <p className="text-gray-400 text-sm">Your teachers haven't posted any assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const deadline   = a.deadline || a.dueDate;
              const overdue    = isOverdue(deadline);
              const submission = submissionMap[a._id];
              const submitted  = !!submission;

              return (
                <div key={a._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{a.title}</h3>
                        {/* Status badge */}
                        {submitted ? (
                          <>
                            <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                              <CheckCircle size={11} /> Submitted
                            </span>
                            {submission.status === 'graded' ? (
                              <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                <Award size={11} /> Marked
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                <Clock size={11} /> Awaiting mark
                              </span>
                            )}
                            {submission.score != null && submission.maxScore != null && (
                              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                {submission.score}/{submission.maxScore}
                              </span>
                            )}
                          </>
                        ) : overdue ? (
                          <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            <Lock size={11} /> Closed
                          </span>
                        ) : (
                          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Open
                          </span>
                        )}
                      </div>

                      {a.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{a.description}</p>}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        {deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            Due: {format(new Date(deadline), 'MMM d, yyyy HH:mm')}
                          </span>
                        )}
                        {a.class?.name && <span>Class: {a.class.name}</span>}
                        {submitted && submission.createdAt && (
                          <span className="text-emerald-500 font-medium">
                            Submitted {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {/* Download teacher's assignment file */}
                      {a.fileUrl && (
                        <a
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                        >
                          <Download size={12} /> Download
                        </a>
                      )}

                      {/* Open the workspace to answer or review the marked result */}
                      {submitted && (
                        <button
                          onClick={() => navigate('/student/assignments/' + a._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          <Award size={12} /> View result
                        </button>
                      )}

                      {/* Plain upload assignments keep the original one-file modal */}
                      {!submitted && !overdue && (a.submissionType || 'upload') === 'upload' && (
                        <button
                          onClick={() => setSubmitTarget(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                        >
                          <Upload size={12} /> Submit
                        </button>
                      )}

                      {/* Interactive / text / mixed assignments open the workspace */}
                      {!submitted && !overdue && (a.submissionType || 'upload') !== 'upload' && (
                        <button
                          onClick={() => navigate('/student/assignments/' + a._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                        >
                          <PlayCircle size={12} /> Start
                        </button>
                      )}

                      {overdue && !submitted && (
                        <span className="flex items-center gap-1 text-xs text-red-500 font-medium px-1">
                          <Lock size={11} /> No submissions
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit modal */}
      {submitTarget && (
        <SubmitModal
          assignment={submitTarget}
          onClose={() => setSubmitTarget(null)}
          onSubmitted={handleSubmitted}
        />
      )}
    </MainLayout>
  );
}
