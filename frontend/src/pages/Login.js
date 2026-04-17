import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark large">L</div>
          <h1>LaundryOS</h1>
          <p>Dry cleaning order management</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label>Full name</label>
              <input type="text" value={form.name} onChange={set('name')} required placeholder="Your name" />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@store.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" minLength={6} />
          </div>
          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
        <p className="auth-hint">Demo: register with any email/password to get started.</p>
      </div>
    </div>
  );
}
