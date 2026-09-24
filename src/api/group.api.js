import apiClient from './axios';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const groupAPI = {
  // =====================================
  // GROUP MANAGEMENT (teacher)
  // =====================================

  list: (assignmentId) =>
    apiClient.get('/groups', { params: { assignmentId } }),

  create: (data) =>
    apiClient.post('/groups', data),

  generate: (data) =>
    apiClient.post('/groups/generate', data),

  randomize: (assignmentId) =>
    apiClient.post('/groups/randomize', { assignmentId }),

  merge: (data) =>
    apiClient.post('/groups/merge', data),

  transfer: (data) =>
    apiClient.post('/groups/transfer', data),

  update: (groupId, data) =>
    apiClient.patch(`/groups/${groupId}`, data),

  remove: (groupId) =>
    apiClient.delete(`/groups/${groupId}`),

  split: (groupId, data) =>
    apiClient.post(`/groups/${groupId}/split`, data),

  addMember: (groupId, studentId) =>
    apiClient.post(`/groups/${groupId}/members`, { studentId }),

  removeMember: (groupId, studentId) =>
    apiClient.delete(`/groups/${groupId}/members/${studentId}`),

  // =====================================
  // STUDENT VIEW
  // =====================================

  my: (assignmentId) =>
    apiClient.get('/groups/my', { params: { assignmentId } }),

  // =====================================
  // GROUP WORKSPACE
  // =====================================

  get: (groupId) =>
    apiClient.get(`/groups/${groupId}`),

  // -------- Discussion --------
  messages: (groupId) =>
    apiClient.get(`/groups/${groupId}/messages`),

  sendMessage: (groupId, formData) =>
    apiClient.post(`/groups/${groupId}/messages`, formData, multipart),

  // -------- Answers / Contributions --------
  contributions: (groupId) =>
    apiClient.get(`/groups/${groupId}/contributions`),

  addContribution: (groupId, formData) =>
    apiClient.post(`/groups/${groupId}/contributions`, formData, multipart),

  updateContribution: (groupId, contributionId, data) =>
    apiClient.patch(`/groups/${groupId}/contributions/${contributionId}`, data),

  deleteContribution: (groupId, contributionId) =>
    apiClient.delete(`/groups/${groupId}/contributions/${contributionId}`),

  // -------- Submission & Grading --------
  submit: (groupId, formData) =>
    apiClient.post(`/groups/${groupId}/submit`, formData, multipart),

  submission: (groupId) =>
    apiClient.get(`/groups/${groupId}/submission`),

  grade: (groupId, data) =>
    apiClient.patch(`/groups/${groupId}/grade`, data),

  // -------- Activity --------
  activity: (groupId) =>
    apiClient.get(`/groups/${groupId}/activity`),
};

export default groupAPI;
