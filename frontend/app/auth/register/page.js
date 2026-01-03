'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../services/api';
import { ButtonSpinner } from '../../components/LoadingSpinner';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    Adminname: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: '',
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
    
    // Validation
    if (!formData.Adminname || !formData.email || !formData.password || !formData.image) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await authService.register({
        Adminname: formData.Adminname,
        email: formData.email,
        password: formData.password,
        image: formData.image,
      });

      if (response.success) {
        // Store email for OTP verification
        sessionStorage.setItem('verify_email', formData.email);
        router.push('/auth/verify-otp');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
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
          <h2>Create Admin Account</h2>
          <p>Register to manage your organization</p>
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
            <label htmlFor="Adminname">Full Name *</label>
            <input
              type="text"
              id="Adminname"
              name="Adminname"
              className="input"
              placeholder="John Doe"
              value={formData.Adminname}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input"
              placeholder="you@iitjammu.ac.in"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="image">Profile Image URL *</label>
            <input
              type="url"
              id="image"
              name="image"
              className="input"
              placeholder="https://example.com/your-photo.jpg"
              value={formData.image}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="input"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
