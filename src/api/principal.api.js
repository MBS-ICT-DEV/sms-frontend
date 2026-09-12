import apiClient from './axios';

export const principalAPI = {
  // Student Management
  getStudents: () => apiClient.get('/students/all'),
  createStudent: (data) => apiClient.post('/students/create', data),
  updateStudent: (id, data) => apiClient.put(`/students/${id}`, data),
  deleteStudent: (id) => apiClient.delete(`/admin/students/${id}`),
  assignStudentToClass: (data) => {
    // Ensure payload matches backend expectations (studentId, classId)
    const payload = {
      classId: data.classId,
      studentId: data.studentId || data.student
    };
    return apiClient.post('/students/assign-to-class', payload);
  },

  // Class & Teacher (via admin routes - principal has access)
  getClasses: () => apiClient.get('/admin/classes'),
  getTeachers: () => apiClient.get('/admin/teachers'),
  assignTeacherToClass: (data) => apiClient.put('/admin/assign-teacher', data),

  getMyClasses: () => apiClient.get('/admin/principal-classes'),
  getMyStudents: () => apiClient.get('/admin/principal-student'),
  getMyTeachers: () => apiClient.get('/admin/principal-teachers'),
  createSecondaryClass: (data) => apiClient.post('/admin/principal-classes', data),
  assignTeacherToSecondaryClass: (data) => apiClient.put('/admin/principal-classes/assign-teacher', data),
  getSecondaryTeachers: () => apiClient.get('/admin/principal-teachers'),

  // Results Approval
  getPendingResults: () => apiClient.get('/approval/pending'),
  approvResult: (resultId) => apiClient.post('/approval/approve', { resultId }),
  rejectResult: (resultId, reason) => apiClient.post('/approval/reject', { resultId, reason }),

  // Broadsheet & Cumulative
  generateBroadsheet: (classId, term) => apiClient.post('/broadsheet/generate', { classId, term }),
  generateCumulative: (studentId) => apiClient.post('/cumulative/generate', { studentId }),

};

export default principalAPI;
