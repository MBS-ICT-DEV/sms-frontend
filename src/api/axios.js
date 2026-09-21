import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors with toasts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An error occurred';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Callers may opt out of the global toast (e.g. the portal assistant
      // renders its own inline error state and message).
      const skipErrorToast =
        error.config?.skipErrorToast === true;

      switch (status) {
        case 400:
          message = data.message || 'Bad request. Please check your input.';
          break;
        case 401:
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          message = 'Session expired. Please login again.';
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          break;
        case 403:
          message = 'You do not have permission to access this resource.';
          break;
        case 404:
          message = 'Resource not found.';
          break;
        case 409:
          message = data.message || 'Conflict: The resource already exists.';
          break;
        case 422:
          message = data.message || 'Validation error. Please check your input.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = data.message || `Error: ${status}`;
      }

      // Show error toast - skip 400 and 401 (handled by components or redirect)
      if (!skipErrorToast && status !== 401 && status !== 400) {
        toast.error(message, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } else if (error.request) {
      message = 'No response from server. Please check your connection.';
      if (error.config?.skipErrorToast !== true) {
        toast.error(message, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } else {
      message = error.message || 'An unexpected error occurred';
      if (error.config?.skipErrorToast !== true) {
        toast.error(message, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
