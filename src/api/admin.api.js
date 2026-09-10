import apiClient from './axios';

export const adminAPI = {
  createAdmin: (data) => apiClient.post('/admin/create-admin', data),
  getAllAdmins: () => apiClient.get('/admin/all-admins'),
  getAllUsers: () => apiClient.get('/admin/all-users'),

  createPrincipal: (data) => apiClient.post('/admin/create-principal', data),

  createTeacher: (data) => apiClient.post('/admin/create-teacher', data),
  getAllTeachers: () => apiClient.get('/admin/teachers'),

  getClasses: () => apiClient.get('/admin/classes'),

  // ✅ FIXED: className standard
  createClass: (data) => {
    const payload = {
      name: data.className || data.name,
      capacity: data.capacity,
      section: data.section,
  getSections: () => apiClient.get('/admin/sections'),
  createSection: (data) => apiClient.post('/admin/create-section', data),
  getSectionById: (sectionId) => apiClient.get(`/admin/sections/${sectionId}`),
  getSectionClasses: (sectionId) => apiClient.get(`/admin/sections/${sectionId}/classes`),
  getClasses: () => apiClient.get('/admin/classes'),
  getClassById: (classId) => apiClient.get(`/admin/classes/${classId}`),
  getClassesBySection: (sectionId) => apiClient.get(`/admin/classes/section/${sectionId}`),

  createClass: (data) => {
    const payload = {
      name: data.className || data.name,
      sectionId: data.sectionId || data.section,
      section: data.sectionId || data.section,
      capacity: data.capacity,
      subjects: data.subjects || [],
      teacher: data.teacher || null,
    };

    return apiClient.post('/admin/create-class', payload);
  },

  getAllStudentByClass: (params) => {
    return apiClient.get("/admin/by-class ", {params});
  },
  // 1 fetch for class and student
  getClassStudentsForAttendance: (params) =>
  apiClient.get("/admin/attendance/class/students", {
    params,
  }),
  updateClass: (id, data) => {
    const payload = {
      name: data.className || data.name,
      capacity: data.capacity,
      section: data.section,
      sectionId: data.sectionId || data.section,
      section: data.sectionId || data.section,
      subjects: data.subjects || [],
    };

    return apiClient.put(`/admin/classes/${id}`, payload);
  },

  deleteClass: (id) => apiClient.delete(`/admin/classes/${id}`),

  // ✅ FIXED: MUST be PUT (your backend uses router.put)
  assignTeacherToClass: (data) => {
    return apiClient.put('/admin/assign-teacher', {
      classId: data.classId,
      teacherId: data.teacherId,
    });
  },
  
  getAllStudents: () => apiClient.get('/admin/students'),
  getTeacherClasses: () => apiClient.get('/admin/teacher-classes'),

  // HOA
  createHOA: (data) => apiClient.post('/admin/create-hoa', data),

  // Secretary
  createSecretary: (data) => apiClient.post('/admin/create-secretary', data),
  getHoaStats: () => apiClient.get('/admin/hoa/stats'),
getStudents: (params) => apiClient.get("/admin/students", { params }),
  // HOA
  createHOA: (data) => apiClient.post('/admin/create-hoa', data),
markClassAttendance: (data) =>
  apiClient.post("/admin/attendance/class", data),
 
fetchClassId:(params) => apiClient.post('', {params}),

retreiveClassAttendance: (params) => 
  apiClient.get("/admin/attendance/class", {params}),

getAttendanceHistoryByClass: (params) =>
  apiClient.get("/admin/attendance/class/history", {
    params,
  }),

assignExistingClassesToSections: () =>
  apiClient.post("/admin/classes/assign-existing-sections"),

assignClassesToSection: (data) =>
  apiClient.post("/admin/classes/assign-section", data),

getClassesBySection: (sectionId) =>
  apiClient.get(`/admin/classes/section/${sectionId}`),
 // ===============================
  // CLASSES
  // ===============================

  getClasses: () =>
    apiClient.get("/admin/classes"),

  // DEPARTMENTS

// BULK DEPARTMENTS

createDepartmentBulk: (data) =>
  apiClient.post("/admin/departments/bulk", data),

//  BULK SUBJECTS
// ===============================

createSubjectBulk: (data) =>
  apiClient.post("/admin/subjects/bulk", data),
  createDepartment: (data) =>
    apiClient.post("/admin/departments", data),

  getAllDepartments: () =>
    apiClient.get("/admin/departments"),

  getDepartmentsBySection: (sectionId) =>
    apiClient.get(`/admin/departments/section/${sectionId}`),

  getDepartmentById: (departmentId) =>
    apiClient.get(`/admin/departments/${departmentId}`),

  updateDepartment: (departmentId, data) =>
    apiClient.patch(
      `/admin/departments/${departmentId}`,
      data
    ),

  deleteDepartment: (departmentId) =>
    apiClient.delete(
      `/admin/departments/${departmentId}`
    ),

  // ===============================
  // SUBJECTS
  // ===============================

  createSubject: (data) =>
    apiClient.post("/admin/subjects", data),

  getAllSubjects: () =>
    apiClient.get("/admin/subjects"),

  getSubjectsBySection: (sectionId) =>
    apiClient.get(
      `/admin/subjects/section/${sectionId}`
    ),

  getSubjectsByDepartment: (departmentId) =>
    apiClient.get(
      `/admin/subjects/department/${departmentId}`
    ),

  getSubjectById: (subjectId) =>
    apiClient.get(
      `/admin/subjects/${subjectId}`
    ),

  updateSubject: (subjectId, data) =>
    apiClient.patch(
      `/admin/subjects/${subjectId}`,
      data
    ),

  deleteSubject: (subjectId) =>
    apiClient.delete(
      `/admin/subjects/${subjectId}`
    ),
  // SECTION CLASSES
  sectionClasses: (params) => apiClient.get("/admin/section/classes", {
    params
  }),
// history continue here
  historyOfAttendace: (params) => apiClient.get("/admin/attendance-history", {params}),
  // Secretary
  createSecretary: (data) => apiClient.post('/admin/create-secretary', data),
  getHoaStats: () => apiClient.get('/admin/hoa/stats'),
  getStaffStats: (params) => apiClient.get('/admin/staff-stats', {params}),
  getAttendanceView: (params) => apiClient.get('/admin/attendance', { params }),
  getTeachersResultStatus: (params) => apiClient.get('/admin/teachers/results-status', { params }),
  suspendTeacher: (id) => apiClient.put(`/admin/teachers/${id}/suspend`),
  deleteTeacher: (id) => apiClient.delete(`/admin/teachers/${id}`),
  deleteStudent: (id) => apiClient.delete(`/admin/students/${id}`),

  // Developer only
  getKeyUsers:  () => apiClient.get('/admin/key-users'),
  getAllStaff:  () => apiClient.get('/admin/all-staff'),
  resetSystem:  () => apiClient.delete('/admin/reset-system'),
};

export default adminAPI;