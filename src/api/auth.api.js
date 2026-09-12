import apiClient from './axios';

// Login endpoints
export const authAPI = {
  loginDeveloper: (credentials) => apiClient.post('/auth/developer/login', credentials),
  loginAdmin:     (credentials) => apiClient.post('/auth/admin/login',     credentials),
  loginPrincipal: (credentials) => apiClient.post('/auth/principal/login', credentials),
  loginHOA:       (credentials) => apiClient.post('/auth/hoa/login',       credentials),
  loginTeacher:   (credentials) => apiClient.post('/auth/teacher/login',   credentials),
  loginStudent:   (credentials) => apiClient.post('/auth/student/login',   credentials),
  unifiedLogin:   (credentials) => apiClient.post('/auth/login',           credentials),
  getProfile: () => apiClient.get('/auth/profile'),
};

export default authAPI;
