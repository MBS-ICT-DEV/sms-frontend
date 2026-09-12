import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');

  const handleChange = (e) => {
    setCredentials(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = credentials.email.trim();
      const password = credentials.password;

      if (!email || !password) {
        return setError('Email/Username and password are required');
      }

      let user = null;

      try {
        user = await auth.loginUnified({ email, password });
      } catch {
        try {
          user = await auth.loginStudent({ username: email, password });
        } catch {
          setError('Invalid credentials. Check your email/username and password.');
          return;
        }
      }

      if (user) {
        const destRole = (user.role || 'student').toLowerCase();
        navigate(`/${destRole}/dashboard`);
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80"
          alt="School campus"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-slate-900/30" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-white/80 text-sm font-medium tracking-wide uppercase mb-2">Mercan Brilliant School (SMS)</p>
          <h1 className="text-white text-3xl font-bold leading-tight">Manage your account<br />with confidence</h1>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider">Enterprise</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Welcome back</p>
              <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="email"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    placeholder="you@school.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2.5 text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Staff: use your school email. Students: use your registration username.
              </p>
            </div>
          </div>
        </div>
        <div className="px-8 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            &copy; {new Date().getFullYear()} MBS ICT. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
