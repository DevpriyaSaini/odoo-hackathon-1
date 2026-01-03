'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../services/api';
import { ButtonSpinner } from '../../components/LoadingSpinner';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dkpvhegme';
const CLOUDINARY_UPLOAD_PRESET = 'devpriyasaini';

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    Adminname: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Handle image file selection
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      setUploading(true);

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      cloudinaryFormData.append('folder', 'dayflow/profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload image');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.secure_url }));
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.Adminname || !formData.email || !formData.password || !formData.image) {
      setError('Please fill in all required fields including profile photo');
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
          {/* Profile Photo Upload */}
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <label style={{ marginBottom: '12px' }}>Profile Photo *</label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            {/* Profile picture preview/upload button */}
            <div
              onClick={!uploading && !loading ? triggerFileSelect : undefined}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: imagePreview
                  ? `url(${imagePreview}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--gray-100), var(--gray-200))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading || loading ? 'not-allowed' : 'pointer',
                border: '3px dashed var(--gray-300)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Upload icon or loading */}
              {uploading ? (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid var(--gray-300)',
                    borderTopColor: 'var(--primary-500)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              ) : !imagePreview ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-400)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  }}
                  className="upload-overlay"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </div>

            <p style={{
              fontSize: '12px',
              color: 'var(--gray-500)',
              marginTop: '8px',
              textAlign: 'center',
            }}>
              {uploading ? 'Uploading...' : formData.image ? 'Click to change photo' : 'Click to upload photo'}
            </p>

            {formData.image && !uploading && (
              <span style={{
                fontSize: '12px',
                color: 'var(--success)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Photo uploaded
              </span>
            )}
          </div>

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
            <label htmlFor="password">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
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

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className="input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                }}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
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
            disabled={loading || uploading}
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

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        div:hover > .upload-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
