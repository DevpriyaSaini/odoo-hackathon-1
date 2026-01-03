'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../services/api';
import { ButtonSpinner } from '../../components/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

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
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
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
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />
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

        {/* Footer */}
        <div className="auth-footer">
          Don't have an account? <Link href="/auth/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
