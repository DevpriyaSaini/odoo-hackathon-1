'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, employeeAuthService } from '../../services/api';
import { ButtonSpinner } from '../../components/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // First try admin login
      let response;
      try {
        response = await authService.login({
          email: formData.email,
          password: formData.password,
        });
      } catch (adminErr) {
        // If admin login fails, try employee login
        try {
          response = await employeeAuthService.login({
            email: formData.email,
            password: formData.password,
          });
        } catch (empErr) {
          throw empErr;
        }
      }

      if (response.success && response.token) {
        // Store token
        localStorage.setItem('dayflow_token', response.token);
        
        // Decode token to get role
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        
        // Redirect based on role - use window.location for reliable redirect
        if (payload.role === 'admin') {
          window.location.href = '/dashboard/admin';
        } else {
          window.location.href = '/dashboard/employee';
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <h1>Day<span>flow</span></h1>
          <p>Every workday, perfectly aligned</p>
        </div>

        {/* Header */}
        <div className="auth-header">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your dashboard</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address / Employee ID</label>
            <input
              type="text"
              id="email"
              name="email"
              className="input"
              placeholder="you@example.com or OIJODO20260001"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Info Note */}
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          background: 'var(--gray-50)', 
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--gray-600)',
          textAlign: 'center',
        }}>
          <strong>Employees:</strong> Use your email or Employee ID to login. First-time users should use the temporary password sent to your email.
        </div>

        {/* Footer */}
        <div className="auth-footer">
          Don't have an admin account? <Link href="/auth/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
