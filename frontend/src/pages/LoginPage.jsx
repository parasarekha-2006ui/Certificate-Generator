import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';
import { useToast } from '../components/Toast';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  useEffect(() => {
    // Check if session expired
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setErrorMsg('Your session has expired. Please sign in again.');
    }

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('admin', JSON.stringify(data.admin));
        if (onLoginSuccess) onLoginSuccess(data.admin);
        addToast(`Welcome back, ${data.admin.name}!`, 'success');
        navigate('/');
      } else {
        setErrorMsg(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, #eef2ff 0%, #f8fafc 90%)',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 40px rgba(30, 58, 138, 0.08), 0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid var(--surface-border)',
        padding: '2.5rem 2rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52,
            height: 52,
            margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 16px rgba(30, 58, 138, 0.25)'
          }}>
            <GraduationCap size={28} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            College Certificate Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Administrative Sign In
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder="admin@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
                required
                autoFocus
              />
              <Mail 
                size={17} 
                color="var(--text-light)" 
                style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                required
              />
              <Lock 
                size={17} 
                color="var(--text-light)" 
                style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                  padding: 2
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight size={17} />
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <a
            href="/verify"
            style={{
              fontSize: '0.825rem',
              color: 'var(--secondary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            Public Credential Verification &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
