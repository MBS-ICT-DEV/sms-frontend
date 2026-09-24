import apiClient from './axios';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const assignmentAPI = {
  // =====================================
  // STUDENT — answering & results
  // =====================================

  // The paper as the student sees it (never includes the correct options).
  paper: (assignmentId) =>
    apiClient.get(`/submissions/paper/${assignmentId}`),

  // Submit a completed paper. The FormData carries assignmentId, answers (JSON),
  // text, the overall file and one answer_<questionId> field per essay scan.
  submit: (formData) =>
    apiClient.post('/submissions', formData, multipart),

  mySubmissions: () =>
    apiClient.get('/submissions/my'),

  myResult: (assignmentId) =>
    apiClient.get(`/submissions/my/${assignmentId}`),

  // =====================================
  // TEACHER — results & marking
  // =====================================

  getAssignment: (assignmentId) =>
    apiClient.get(`/teacher/assignments/${assignmentId}`),

  results: (assignmentId) =>
    apiClient.get(`/submissions/assignment/${assignmentId}/results`),

  // payload is { score } for upload/text papers, or
  // { answers: [{ question, awarded, feedback }] } for interactive ones.
  grade: (submissionId, payload) =>
    apiClient.patch(`/submissions/${submissionId}/grade`, payload),
};

export default assignmentAPI;
