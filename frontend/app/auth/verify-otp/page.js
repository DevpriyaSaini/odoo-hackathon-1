'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../services/api';
import { ButtonSpinner } from '../../components/LoadingSpinner';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem('verify_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !otp) {
      setError('Please enter your email and OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await authService.verifyOtp({
        email: email,
        otp: otp,
      });

      if (response.success && response.token) {
        setSuccess('Email verified successfully! Redirecting...');

        // Store token
        localStorage.setItem('dayflow_token', response.token);

        // Clear verification email
        sessionStorage.removeItem('verify_email');

        // Decode token to get role
        const payload = JSON.parse(atob(response.token.split('.')[1]));

        // Redirect after delay
        setTimeout(() => {
          if (payload.role === 'admin') {
            router.push('/dashboard/admin');
          } else {
            router.push('/dashboard/employee');
          }
        }, 1500);
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify OTP. Please try again.');
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
          <h2>Verify Your Email</h2>
          <p>We've sent a 6-digit code to your email</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            {success}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              className="input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                // Only allow numbers and max 6 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
                setError('');
              }}
              disabled={loading}
              maxLength={6}
              style={{
                fontSize: '24px',
                letterSpacing: '8px',
                textAlign: 'center',
                fontWeight: '600',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading || success}
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p style={{ marginBottom: '8px' }}>Didn't receive the code?</p>
          <Link href="/auth/register">Resend OTP</Link>
          <span style={{ margin: '0 8px' }}>•</span>
          <Link href="/auth/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
