'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { employeeService } from '../services/api';

export default function ProfilePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Profile picture upload states
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real profile from API
      try {
        const response = await employeeService.getProfile();
        if (response.success && response.profile) {
          setProfile({
            _id: response.profile._id,
            Employname: response.profile.employee?.Employname || user?.email?.split('@')[0] || 'User',
            email: response.profile.employee?.email || user?.email,
            role: response.profile.employee?.role || user?.role,
            phone: response.profile.phone || '',
            department: response.profile.jobDetails?.department || 'Not Assigned',
            position: response.profile.jobDetails?.designation || 'Not Assigned',
            joiningDate: response.profile.jobDetails?.joiningDate || new Date().toISOString(),
            employmentType: response.profile.jobDetails?.employmentType || 'full-time',
            status: 'active',
            profilePicture: response.profile.profilePicture || '',
            address: response.profile.address || '',
          });
          setError(null);
          return;
        }
      } catch (apiError) {
        console.log('No profile found, using defaults:', apiError);
      }
      
      // Fallback to mock data if no profile exists
      setProfile({
        _id: user?.id,
        Employname: user?.email?.split('@')[0] || 'User',
        email: user?.email,
        role: user?.role,
        phone: '',
        department: 'Not Assigned',
        position: 'Not Assigned',
        joiningDate: new Date().toISOString(),
        employmentType: 'full-time',
        status: 'active',
        profilePicture: '',
        address: '',
        emergencyContact: {
          name: '',
          phone: '',
          relation: '',
        },
        leaveBalance: {
          paid: 12,
          sick: 6,
          unpaid: 0,
        },
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile picture selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }
    
    setUploadError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload the file
    uploadProfilePicture(file);
  };
  
  // Upload profile picture to Cloudinary
  const uploadProfilePicture = async (file) => {
    try {
      setUploading(true);
      setUploadError(null);
      
      const response = await employeeService.uploadProfilePicture(file);
      
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          profilePicture: response.profilePicture,
        }));
        setImagePreview(null); // Clear preview after successful upload
      } else {
        setUploadError(response.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload profile picture');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };
  
  // Trigger file input click
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleEdit = () => {
    setEditData({
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update profile via API
      const response = await employeeService.update(profile._id, editData);
      
      if (response.success) {
        setProfile(prev => ({ ...prev, ...editData }));
        setIsEditing(false);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <h3>Profile not found</h3>
        <p>Unable to load your profile information.</p>
      </div>
    );
  }

  // Determine what to show as profile image
  const displayImage = imagePreview || profile.profilePicture;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your personal information</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Profile Card */}
        <Card hover={false} style={{ padding: '32px', textAlign: 'center' }}>
          {/* Profile Picture with Upload */}
          <div 
            style={{ 
              position: 'relative', 
              width: '140px', 
              height: '140px', 
              margin: '0 auto 20px',
            }}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {/* Profile Picture */}
            <div
              onClick={triggerFileSelect}
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: displayImage 
                  ? `url(${displayImage}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: displayImage ? '0' : '56px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '4px solid var(--gray-100)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {!displayImage && (profile.Employname?.charAt(0)?.toUpperCase() || 'U')}
              
              {/* Hover Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  borderRadius: '50%',
                }}
                className="profile-picture-overlay"
              >
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            
            {/* Upload Progress Indicator */}
            {uploading && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>
            )}
            
            {/* Camera Badge */}
            <div
              onClick={triggerFileSelect}
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'var(--primary-600)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'var(--primary-500)';
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          
          {/* Upload Error */}
          {uploadError && (
            <div 
              style={{ 
                color: 'var(--error)', 
                fontSize: '13px', 
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
              }}
            >
              {uploadError}
            </div>
          )}
          
          {/* Upload Hint */}
          <p 
            style={{ 
              fontSize: '12px', 
              color: 'var(--gray-400)', 
              marginBottom: '16px',
            }}
          >
            Click the camera icon to upload a photo
          </p>
          
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
            {profile.Employname}
          </h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '12px' }}>{profile.position}</p>
          <StatusBadge status={profile.status} />
          
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--gray-200)' }}>
            <InfoRow label="Department" value={profile.department} />
            <InfoRow label="Employee Type" value={profile.employmentType} />
            <InfoRow label="Joined" value={new Date(profile.joiningDate).toLocaleDateString()} />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '24px' }}
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        </Card>

        {/* Details Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Contact Information */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={profile.phone || 'Not provided'} />
            </div>
          </Card>

          {/* Address */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Address
            </h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              {profile.address || 'No address provided'}
            </p>
          </Card>

          {/* Emergency Contact */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Emergency Contact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InfoRow label="Name" value={profile.emergencyContact?.name || 'Not provided'} />
              <InfoRow label="Phone" value={profile.emergencyContact?.phone || 'Not provided'} />
              <InfoRow label="Relation" value={profile.emergencyContact?.relation || 'Not provided'} />
            </div>
          </Card>

          {/* Leave Balance */}
          <Card hover={false} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              Leave Balance
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--success)' }}>
                  {profile.leaveBalance?.paid || 0}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>Paid Leave</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--warning)' }}>
                  {profile.leaveBalance?.sick || 0}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>Sick Leave</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--gray-600)' }}>
                  {profile.leaveBalance?.unpaid || 0}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>Unpaid Leave</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Profile"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <ButtonSpinner /> : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="tel"
              className="input"
              value={editData.phone || ''}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              placeholder="+91 9876543210"
            />
          </div>
          <div className="input-group">
            <label>Address</label>
            <textarea
              className="input"
              rows="3"
              value={editData.address || ''}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="Enter your full address"
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>
        </div>
      </Modal>

      {/* Inline Styles for hover effect */}
      <style jsx>{`
        .profile-picture-overlay {
          opacity: 0 !important;
        }
        
        div:hover > .profile-picture-overlay {
          opacity: 1 !important;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>{value || '-'}</div>
    </div>
  );
}
