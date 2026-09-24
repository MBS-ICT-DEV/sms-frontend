import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import authAPI from '../api/auth.api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // ✅ Load session on refresh
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser ? { ...parsedUser, role: parsedUser.role?.toLowerCase() } : null);
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // ========================
  // HYDRATE SESSION
  // ========================
  // Pull the latest profile fields (notably profileImage) after a refresh or
  // a fresh login so the navbar/sidebar avatar always reflects the saved
  // picture.
  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    authAPI.getProfile()
      .then(({ data }) => {
        const profile = data?.profile;
        if (!active || !profile) return;
        setUser((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            fullname: profile.fullname ?? prev.fullname,
            email: profile.email ?? prev.email,
            phone: profile.phone ?? prev.phone,
            profileImage: profile.profileImage ?? prev.profileImage,
          };
          localStorage.setItem('user', JSON.stringify(next));
          return next;
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [token]);

  // ✅ Save session
  const saveSession = (authToken, userData) => {
    // Normalize role to lowercase to prevent case-sensitivity bugs in routing/menus
    const normalizedUser = userData ? { ...userData, role: userData.role?.toLowerCase() } : null;
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));

    setToken(authToken);
    setUser(normalizedUser);
  };

  // ========================
  // LOGIN METHODS
  // ========================

  const loginDeveloper = async (credentials) => {
    try {
      const { data } = await authAPI.loginDeveloper(credentials);
      saveSession(data.token, data.developer || data.user);
      toast.success('Developer login successful!');
      return data.developer || data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const loginAdmin = async (credentials) => {
    try {
      const { data } = await authAPI.loginAdmin(credentials);
      saveSession(data.token, data.admin || data.hoa || data.user);
      toast.success('Login successful!');
      return data.admin || data.hoa || data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const loginPrincipal = async (credentials) => {
    try {
      const { data } = await authAPI.loginPrincipal(credentials);
      saveSession(data.token, data.principal || data.user);
      toast.success('Principal login successful!');
      return data.principal || data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const loginHOA = async (credentials) => {
    try {
      const { data } = await authAPI.loginHOA(credentials);
      saveSession(data.token, data.hoa || data.user);
      toast.success('Login successful!');
      return data.hoa || data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const loginTeacher = async (credentials) => {
    try {
      const { data } = await authAPI.loginTeacher(credentials);
      saveSession(data.token, data.teacher || data.user);
      toast.success('Teacher login successful!');
      return data.teacher || data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const loginUnified = async (credentials) => {
    try {
      const { data } = await authAPI.unifiedLogin(credentials);
      const userData = data.admin || data.principal || data.hoa || data.secretary || data.teacher || data.user;
      saveSession(data.token, userData);
      toast.success('Login successful!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const loginStudent = async (credentials) => {
    try {
      const { data } = await authAPI.loginStudent(credentials);
      saveSession(data.token, data.student || data.user);
      toast.success('Student login successful!');
      return data.student || data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // ========================
  // LOGOUT
  // ========================
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  // ========================
  // FINAL CONTEXT VALUE
  // ========================
  // ========================
  // UPDATE LOCAL USER
  // ========================
  // Keeps the session (sidebar, navbar, localStorage) in sync after the
  // signed-in user edits their own profile.
  const updateUser = (partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial, role: (partial.role || prev.role)?.toLowerCase() };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,

        loginDeveloper,
        loginAdmin,
        loginPrincipal,
        loginHOA,
        loginTeacher,
        loginStudent,
        loginUnified,
        logout,
        updateUser,

        isAuthenticated: !!user,

        isDeveloper: user?.role?.toLowerCase() === 'developer',
        isAdmin:     user?.role?.toLowerCase() === 'admin',
        isPrincipal: user?.role?.toLowerCase() === 'principal',
        isHOA:       user?.role?.toLowerCase() === 'hoa',
        isTeacher:   user?.role?.toLowerCase() === 'teacher',
        isStudent:   user?.role?.toLowerCase() === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};