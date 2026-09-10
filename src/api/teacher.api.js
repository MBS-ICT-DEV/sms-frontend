import apiClient from './axios';

export const teacherAPI = {
  // =====================================
  // GET ASSIGNED CLASS
  // =====================================

  getAssignedClass: () =>
    apiClient.get('/teacher/assigned-class'),

  // ✅ FIXED
  // was: /admin/teacher-classes (404)
  // now uses your real backend route
  getAssignedClasses: () =>
    apiClient.get('/teacher/my-classes'),

  // ✅ KEEP THIS TOO
  getMyClasses: () =>
    apiClient.get('/teacher/my-classes'),

  getStudentsInClass: (classId) =>
    apiClient.get(`/classes/${classId}/students`),

  getClassStudents: (classId) =>
    apiClient.get(`/results/class-students/${classId}`),

  // =====================================
  // RESULTS
  // =====================================

  uploadResults: (formData) =>
    apiClient.post('/results/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );

        return progress;
      },
    }),
<<<<<<< HEAD
=======
    inputResult: (data) => apiClient.post('/results/input', data),
>>>>>>> a665f935 (Update school management frontend)

  uploadResultsNew: (data) =>
    apiClient.post('/teacher/upload-results', data),

  fetchSheetPreview: (url) =>
    apiClient.get('/results/fetch-sheet', { params: { url } }),

  // =====================================
  // ASSIGNMENTS
  // =====================================

  uploadAssignment: (formData) =>
    apiClient.post('/teacher/assignment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getAssignments: () =>
    apiClient.get('/teacher/assignments'),

  getAssignmentSubmissions: (assignmentId) =>
    apiClient.get(`/submissions/assignment/${assignmentId}`),

  updateAssignment: (assignmentId, data) =>
    apiClient.put(`/teacher/assignments/${assignmentId}`, data),

  deleteAssignment: (assignmentId) =>
    apiClient.delete(`/teacher/assignments/${assignmentId}`),

  // =====================================
  // ATTENDANCE
  // =====================================

  markAttendance: (data) =>
    apiClient.post('/teacher/attendance', data),

  getAttendanceRecords: (classId, startDate, endDate) =>
    apiClient.get('/teacher/attendance', {
      params: {
        classId,
        startDate,
        endDate,
      },
    }),

  getStudentAttendanceSummary: (studentId, term) =>
    apiClient.get(`/teacher/attendance/summary/${studentId}`, {
      params: { term },
    }),
};

export default teacherAPI;