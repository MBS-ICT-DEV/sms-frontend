import apiClient from "./axios.js";

export const adminAPI = {

  // Test
  //  geClasses: () => apiClient.get("/admin/principal-classes"),
    // getMyPStudentByClass: () => apiClient.get("/admin/principal-student"),
  // ============================================================
  // ADMIN
  // ============================================================

  createAdmin: (data) =>
    apiClient.post("/admin/create-admin", data),

  getAllAdmins: () =>
    apiClient.get("/admin/all-admins"),

  getAllUsers: () =>
    apiClient.get("/admin/all-users"),

  // ============================================================
  // PRINCIPAL
  // ============================================================

  createPrincipal: (data) =>
    apiClient.post("/admin/create-principal", data),

  // ============================================================
  // TEACHERS
  // ============================================================

  createTeacher: (data) =>
    apiClient.post("/admin/create-teacher", data),

  // Assign, update or clear the phone number of an existing staff account.
  // Staff live in one collection per role, so the role travels in the body.
  assignStaffPhone: (id, role, phone) =>
    apiClient.put(`/admin/staff/${id}/phone`, { role, phone }),

  getAllTeachers: () => apiClient.get("/admin/teachers"),

  getTeachersResultStatus: (params) =>
    apiClient.get("/admin/teachers/results-status", {
      params,
    }),

  suspendTeacher: (id) =>
    apiClient.put(`/admin/teachers/${id}/suspend`),

  deleteTeacher: (id) =>
    apiClient.delete(`/admin/teachers/${id}`),

  // ============================================================
  // STUDENTS
  // ============================================================

  getAllStudents: () =>
    apiClient.get("/admin/students"),

  getStudents: (params) =>
    apiClient.get("/admin/students", {
      params,
    }),

  // Reuses the existing student update route (PRINCIPAL/ADMIN/DEVELOPER/HOA).
  updateStudent: (id, data) =>
    apiClient.put(`/students/${id}`, data),

  deleteStudent: (id) =>
    apiClient.delete(`/admin/students/${id}`),

  getAllStudentByClass: (params) =>
    apiClient.get("/admin/by-class", {
      params,
    }),


    // --------------------------------------------------
// ACADEMIC TERMS
// --------------------------------------------------

createTerm: (data) =>
  apiClient.post("/terms", data),

getAllTerms: () =>
  apiClient.get("/terms"),

getCurrentTerm: () =>
  apiClient.get("/terms/current"),

activateTerm: (id) =>
  apiClient.put(`/terms/${id}/activate`),

closeTerm: (id) =>
  apiClient.put(`/terms/${id}/close`),

submitTermResults: (id) =>
  apiClient.put(`/terms/${id}/submit-results`),
  // ============================================================
  // CLASSES
  // ============================================================

  getClasses: () =>
    apiClient.get("/admin/classes"),

  getClassById: (classId) =>
    apiClient.get(`/admin/classes/${classId}`),

  getClassesBySection: (sectionId) =>
    apiClient.get(`/admin/classes/section/${sectionId}`),

  createClass: (data) => {
    const payload = {
      name: data.className || data.name,
      sectionId: data.sectionId || data.section,
      section: data.sectionId || data.section,
      capacity: data.capacity,
      subjects: data.subjects || [],
      teacher: data.teacher || null,
    };

    return apiClient.post("/admin/create-class", payload);
  },

  updateClass: (id, data) => {
    const payload = {
      name: data.className || data.name,
      capacity: data.capacity,
      sectionId: data.sectionId || data.section,
      section: data.sectionId || data.section,
      subjects: data.subjects || [],
    };

    return apiClient.put(`/admin/classes/${id}`, payload);
  },

  deleteClass: (id) =>
    apiClient.delete(`/admin/classes/${id}`),

  assignTeacherToClass: (data) =>
    apiClient.put("/admin/assign-teacher", {
      classId: data.classId,
      teacherId: data.teacherId,
    }),

  getTeacherClasses: () =>
    apiClient.get("/admin/teacher-classes"),

  // ============================================================
  // SECTION
  // ============================================================

  getSections: () =>
    apiClient.get("/admin/sections"),

  createSection: (data) =>
    apiClient.post("/admin/create-section", data),

  getSectionById: (sectionId) =>
    apiClient.get(`/admin/sections/${sectionId}`),

  getSectionClasses: (sectionId) =>
    apiClient.get(`/admin/sections/${sectionId}/classes`),

  updateSection: (sectionId, data) =>
    apiClient.put(`/admin/sections/${sectionId}`, data),

  deleteSection: (sectionId) =>
    apiClient.delete(`/admin/sections/${sectionId}`),

  sectionClasses: (params) =>
    apiClient.get("/admin/section/classes", {
      params,
    }),

  assignExistingClassesToSections: () =>
    apiClient.post("/admin/classes/assign-existing-sections"),

  assignClassesToSection: (data) =>
    apiClient.post("/admin/classes/assign-section", data),

  updateClassSection: (classId, data) =>
    apiClient.put(`/admin/classes/${classId}/section`, data),

  // ============================================================
  // DEPARTMENTS
  // ============================================================

  createDepartment: (data) =>
    apiClient.post("/admin/departments", data),

  createDepartmentBulk: (data) =>
    apiClient.post("/admin/departments/bulk", data),

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

  // ============================================================
  // SUBJECTS
  // ============================================================

  createSubject: (data) =>
    apiClient.post("/admin/subjects", data),

  createSubjectBulk: (data) =>
    apiClient.post("/admin/subjects/bulk", data),

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

  // ============================================================
  // HOA
  // ============================================================

  createHOA: (data) =>
    apiClient.post("/admin/create-hoa", data),

  getHoaStats: () =>
    apiClient.get("/admin/hoa/stats"),

  previewMigration: (data) => apiClient.post("/migrations/preview", data),
  confirmMigration: (data) => apiClient.post("/migrations/confirm", data),

  getAnnouncements: () => apiClient.get("/announcements"),
  createAnnouncement: (data) => apiClient.post("/announcements", data),

  getStaffStats: (params) =>
    apiClient.get("/admin/staff-stats", {
      params,
    }),

  // ============================================================
  // SECRETARY
  // ============================================================

  createSecretary: (data) =>
    apiClient.post("/admin/create-secretary", data),

  // ============================================================
  // ATTENDANCE
  // ============================================================

  getClassStudentsForAttendance: (params) =>
    apiClient.get(
      "/admin/attendance/class/students",
      {
        params,
      }
    ),

  markClassAttendance: (data) =>
    apiClient.post(
      "/admin/attendance/class",
      data
    ),

  retrieveClassAttendance: (params) =>
    apiClient.get(
      "/admin/attendance/class",
      {
        params,
      }
    ),

  getAttendanceHistoryByClass: (params) =>
    apiClient.get(
      "/admin/attendance/class/history",
      {
        params,
      }
    ),

  getAttendanceView: (params) =>
    apiClient.get(
      "/admin/attendance",
      {
        params,
      }
    ),

  // Individual attendance record for one student (SMS alert source)
  getStudentAttendance: (studentId, params) =>
    apiClient.get(
      `/admin/attendance/student/${studentId}`,
      {
        params,
      }
    ),

  historyOfAttendance: (params) =>
    apiClient.get(
      "/admin/attendance-history",
      {
        params,
      }
    ),

  // ============================================================
  // FEES
  // ============================================================

  getFeeManagement: (params) =>
    apiClient.get("/admin/fees", {
      params,
    }),

  // ============================================================
  // DEVELOPER / SYSTEM
  // ============================================================

  getKeyUsers: () =>
    apiClient.get("/admin/key-users"),

  getAllStaff: () =>
    apiClient.get("/admin/all-staff"),

  resetSystem: () =>
    apiClient.delete("/admin/reset-system"),

    resetStudentData: () =>
    apiClient.delete("/admin/reset-studentData"),
};

export default adminAPI;
