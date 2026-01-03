'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import FileUpload, { ProfilePictureUpload } from '../components/FileUpload';
import { employeeService } from '../services/api';
import { uploadProfilePicture, uploadDocument } from '../services/cloudinary';

const tabs = [
  { id: 'resume', label: 'Resume' },
  { id: 'private', label: 'Private Info' },
  { id: 'salary', label: 'Salary Info' },
  { id: 'security', label: 'Security' },
];

export default function ProfilePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('private');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profileExists, setProfileExists] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getProfile();
      if (response.success && response.profile) {
        setProfile({
          ...response.profile,
          employee: response.profile.employee || {},
        });
        setProfileExists(true);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // If profile not found, just set empty state and don't show error
      if (err.response?.status === 404) {
        setProfileExists(false);
        setProfile({
          employee: {
            Employname: user?.email?.split('@')[0] || 'User',
            email: user?.email,
            role: user?.role,
            _id: user?.id 
          },
          phone: '',
          address: '',
          profilePicture: '',
          jobDetails: {
            designation: isAdmin ? 'Administrator' : 'Employee',
            department: isAdmin ? 'Administration' : '',
            joiningDate: new Date().toISOString(),
            employmentType: 'full-time',
          },
          bankDetails: {},
          salaryStructure: {
            basic: 0,
            hra: 0,
            allowances: 0,
            deductions: 0,
            netSalary: 0,
          },
          documents: {},
        });
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      setSaving(true);
      const response = await employeeService.createProfile({
        phone: editData.phone || '',
        address: editData.address || '',
        profilePicture: editData.profilePicture || '',
      });
      if (response.success) {
        setProfile(response.profile);
        setProfileExists(true);
        setSuccessMessage('Profile created successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      phone: profile?.phone || '',
      address: profile?.address || '',
      profilePicture: profile?.profilePicture || '',
      dateOfBirth: profile?.dateOfBirth || '',
      nationality: profile?.nationality || 'Indian',
      personalEmail: profile?.personalEmail || '',
      gender: profile?.gender || '',
      maritalStatus: profile?.maritalStatus || '',
      jobDetails: {
        designation: profile?.jobDetails?.designation || '',
        department: profile?.jobDetails?.department || '',
        joiningDate: profile?.jobDetails?.joiningDate || '',
        employmentType: profile?.jobDetails?.employmentType || 'full-time',
      },
      bankDetails: {
        accountNumber: profile?.bankDetails?.accountNumber || '',
        bankName: profile?.bankDetails?.bankName || '',
        panNo: profile?.bankDetails?.panNo || '',
        uamNo: profile?.bankDetails?.uamNo || '',
        empCode: profile?.bankDetails?.empCode || '',
      },
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!profileExists) {
        await handleCreateProfile();
        return;
      }

      const response = await employeeService.update(profile?.employee?._id, editData);

      if (response.success) {
        setProfile(prev => ({ ...prev, ...editData }));
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle document upload - saves URL to backend
  const handleDocumentUpload = async (docType, uploadResult) => {
    try {
      // Update the documents object with the new URL
      const updatedDocuments = {
        ...profile?.documents,
        [docType]: uploadResult.url,
      };

      // Save to backend
      const response = await employeeService.update(profile?.employee?._id, {
        documents: updatedDocuments,
      });

      if (response.success) {
        // Update local state
        setProfile(prev => ({
          ...prev,
          documents: updatedDocuments,
        }));
        setSuccessMessage(`${docType.charAt(0).toUpperCase() + docType.slice(1)} uploaded and saved!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save document:', err);
      setError('Document uploaded but failed to save. Please try again.');
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  const employeeName = profile?.employee?.Employname || user?.email?.split('@')[0] || 'User';
  const employeeEmail = profile?.employee?.email || user?.email || '';
  const employeeRole = profile?.employee?.role || user?.role || 'employee';

  // Determine what to show as profile image
  const displayImage = profile?.profilePicture;

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <span className="profile-breadcrumb">My</span>
          <h1 className="profile-title">{employeeName}</h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          {successMessage}
        </div>
      )}

      {!profileExists && (
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          <span>Your profile doesn't exist yet. Click "Edit Profile" to create one.</span>
        </div>
      )}

      <div className="profile-container">
        {/* Left Profile Card */}
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt={employeeName} />
              ) : (
                <span>{employeeName.charAt(0).toUpperCase()}</span>
              )}
              <button className="avatar-edit-btn" title="Change photo">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>

            <h2 className="profile-name">{employeeName}</h2>
            <p className="profile-position">{profile?.jobDetails?.designation || 'Employee'}</p>
          </div>

          <div className="profile-quick-info">
            <InfoItem 
              label="Company" 
              value={profile?.jobDetails?.department || 'Not Assigned'} 
              highlight
            />
            <InfoItem 
              label="Email" 
              value={employeeEmail} 
              highlight 
              badgeColor="coral"
            />
            <InfoItem 
              label="Mobile" 
              value={profile?.phone || 'Not provided'} 
            />
          </div>

          <button 
            className="btn btn-primary profile-edit-btn" 
            onClick={handleEdit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            Edit Profile
          </button>
        </div>

        {/* Right Content Area */}
        <div className="profile-content">
          {/* Tabs */}
          <div className="profile-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            {activeTab === 'resume' && (
              <ResumeTab profile={profile} onDocumentUpload={handleDocumentUpload} />
            )}
            {activeTab === 'private' && (
              <PrivateInfoTab profile={profile} />
            )}
            {activeTab === 'salary' && (
              <SalaryInfoTab profile={profile} />
            )}
            {activeTab === 'security' && (
              <SecurityTab />
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={profileExists ? "Edit Profile" : "Create Profile"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <ButtonSpinner /> : null}
              {saving ? 'Saving...' : (profileExists ? 'Save Changes' : 'Create Profile')}
            </button>
          </>
        }
      >
        <div className="edit-form-container">
          {/* Personal Information Section */}
          <div className="edit-section">
            <h4 className="edit-section-title">Personal Information</h4>
            
            <div className="edit-form-grid">
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+91 9876543210"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label>Personal Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="personal@email.com"
                  value={editData.personalEmail || ''}
                  onChange={(e) => setEditData({ ...editData, personalEmail: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  className="input"
                  value={editData.dateOfBirth ? editData.dateOfBirth.split('T')[0] : ''}
                  onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label>Nationality</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Indian"
                  value={editData.nationality || ''}
                  onChange={(e) => setEditData({ ...editData, nationality: e.target.value })}
                />
              </div>
              
              <div className="input-group">
                <label>Gender</label>
                <select
                  className="input"
                  value={editData.gender || ''}
                  onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Marital Status</label>
                <select
                  className="input"
                  value={editData.maritalStatus || ''}
                  onChange={(e) => setEditData({ ...editData, maritalStatus: e.target.value })}
                >
                  <option value="">Select Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
            
            <div className="input-group" style={{ marginTop: '16px' }}>
              <label>Address</label>
              <textarea
                className="input"
                rows="2"
                placeholder="Enter your full address"
                value={editData.address || ''}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                style={{ resize: 'vertical', minHeight: '60px' }}
              />
            </div>
            
            <div className="input-group" style={{ marginTop: '16px' }}>
              <label>Profile Picture URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com/photo.jpg"
                value={editData.profilePicture || ''}
                onChange={(e) => setEditData({ ...editData, profilePicture: e.target.value })}
              />
            </div>
          </div>

          {/* Job Details Section */}
          <div className="edit-section">
            <h4 className="edit-section-title">Job Details</h4>
            
            <div className="edit-form-grid">
              <div className="input-group">
                <label>Designation</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Software Developer"
                  value={editData.jobDetails?.designation || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    jobDetails: { ...editData.jobDetails, designation: e.target.value } 
                  })}
                />
              </div>
              
              <div className="input-group">
                <label>Department</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Engineering"
                  value={editData.jobDetails?.department || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    jobDetails: { ...editData.jobDetails, department: e.target.value } 
                  })}
                />
              </div>
              
              <div className="input-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  className="input"
                  value={editData.jobDetails?.joiningDate ? editData.jobDetails.joiningDate.split('T')[0] : ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    jobDetails: { ...editData.jobDetails, joiningDate: e.target.value } 
                  })}
                />
              </div>
              
              <div className="input-group">
                <label>Employment Type</label>
                <select
                  className="input"
                  value={editData.jobDetails?.employmentType || 'full-time'}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    jobDetails: { ...editData.jobDetails, employmentType: e.target.value } 
                  })}
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="edit-section">
            <h4 className="edit-section-title">Bank Details</h4>
            
            <div className="edit-form-grid">
              <div className="input-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="State Bank of India"
                  value={editData.bankDetails?.bankName || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    bankDetails: { ...editData.bankDetails, bankName: e.target.value } 
                  })}
                />
              </div>
              
              <div className="input-group">
                <label>Account Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="XXXXXXXXXXXX"
                  value={editData.bankDetails?.accountNumber || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    bankDetails: { ...editData.bankDetails, accountNumber: e.target.value } 
                  })}
                />
              </div>
              
              <div className="input-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ABCDE1234F"
                  value={editData.bankDetails?.panNo || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    bankDetails: { ...editData.bankDetails, panNo: e.target.value } 
                  })}
                />
              </div>
              
              <div className="input-group">
                <label>UAM Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="UAM Number"
                  value={editData.bankDetails?.uamNo || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    bankDetails: { ...editData.bankDetails, uamNo: e.target.value } 
                  })}
                />
              </div>
              
              <div className="input-group">
                <label>Employee Code</label>
                <input
                  type="text"
                  className="input"
                  placeholder="EMP001"
                  value={editData.bankDetails?.empCode || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    bankDetails: { ...editData.bankDetails, empCode: e.target.value } 
                  })}
                />
              </div>
            </div>
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

// Resume Tab Component with Cloudinary Upload and Document Preview
function ResumeTab({ profile, onDocumentUpload }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('resume');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const documentTypes = [
    { id: 'resume', label: 'Resume', icon: '📄', accept: '.pdf,.doc,.docx', description: 'PDF, DOC, DOCX' },
    { id: 'aadhaar', label: 'Aadhaar Card', icon: '🪪', accept: '.pdf,.jpg,.jpeg,.png', description: 'PDF or Image' },
    { id: 'pan', label: 'PAN Card', icon: '💳', accept: '.pdf,.jpg,.jpeg,.png', description: 'PDF or Image' },
  ];

  const handleUploadClick = (docType) => {
    setSelectedDocType(docType);
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploadModalOpen(true);
  };

  const handleFileUpload = async (file, onProgress) => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const result = await uploadDocument(file, selectedDocType, (progress) => {
        setUploadProgress(progress);
        if (onProgress) onProgress(progress);
      });

      setUploadSuccess(`${documentTypes.find(d => d.id === selectedDocType)?.label} uploaded successfully!`);
      
      if (onDocumentUpload) {
        onDocumentUpload(selectedDocType, result);
      }

      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccess(null);
      }, 1500);
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const getDocumentInfo = (docType) => {
    const docUrl = profile?.documents?.[docType];
    if (docUrl && docUrl.startsWith('http')) {
      // Extract filename from URL
      const urlParts = docUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      const isPdf = /\.pdf$/i.test(fileName) || docUrl.includes('/raw/') || docUrl.includes('.pdf');
      
      return { 
        uploaded: true, 
        url: docUrl, 
        fileName: decodeURIComponent(fileName),
        isImage,
        isPdf: isPdf || !isImage,
        type: isImage ? 'image' : 'pdf'
      };
    }
    return { uploaded: false, url: null, fileName: 'Not Uploaded' };
  };

  const handlePreview = (docInfo, docLabel) => {
    if (docInfo.url) {
      setPreviewDoc({ ...docInfo, label: docLabel });
    }
  };

  const handleDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="tab-section">
      <h3 className="section-title">Documents</h3>
      
      <div className="documents-list">
        {documentTypes.map((doc) => {
          const docInfo = getDocumentInfo(doc.id);
          return (
            <div key={doc.id} className={`document-item ${docInfo.uploaded ? 'uploaded' : ''}`}>
              <div className="document-item-icon">
                {docInfo.uploaded && docInfo.isImage ? (
                  <div className="document-thumbnail">
                    <img src={docInfo.url} alt={doc.label} />
                  </div>
                ) : (
                  <span className="document-emoji">{doc.icon}</span>
                )}
              </div>
              
              <div className="document-item-info">
                <h4 className="document-item-title">{doc.label}</h4>
                {docInfo.uploaded ? (
                  <p className="document-item-file">
                    <span className="file-type-badge">{docInfo.type.toUpperCase()}</span>
                    {docInfo.fileName.length > 25 
                      ? docInfo.fileName.substring(0, 25) + '...' 
                      : docInfo.fileName}
                  </p>
                ) : (
                  <p className="document-item-hint">Upload {doc.description}</p>
                )}
              </div>

              <div className="document-item-actions">
                {docInfo.uploaded ? (
                  <>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePreview(docInfo, doc.label)}
                      title="Preview"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      View
                    </button>
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => handleDownload(docInfo.url, docInfo.fileName)}
                      title="Download"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleUploadClick(doc.id)}
                      title="Replace"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleUploadClick(doc.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => !uploading && setIsUploadModalOpen(false)}
        title={`Upload ${documentTypes.find(d => d.id === selectedDocType)?.label || 'Document'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label>Document Type</label>
            <select
              className="input"
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              disabled={uploading}
            >
              {documentTypes.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.icon} {doc.label}
                </option>
              ))}
            </select>
          </div>

          <FileUpload
            onUpload={handleFileUpload}
            accept={documentTypes.find(d => d.id === selectedDocType)?.accept || '*'}
            maxSize={10 * 1024 * 1024}
            label={`Upload ${documentTypes.find(d => d.id === selectedDocType)?.label}`}
            hint={`Drag and drop or click to browse (${documentTypes.find(d => d.id === selectedDocType)?.description})`}
            icon={documentTypes.find(d => d.id === selectedDocType)?.icon || '📁'}
            disabled={uploading}
          />

          {uploadError && (
            <div className="alert alert-error">{uploadError}</div>
          )}

          {uploadSuccess && (
            <div className="alert alert-success">{uploadSuccess}</div>
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.label || 'Document Preview'}
      >
        <div className="document-preview">
          {previewDoc?.isImage ? (
            <img 
              src={previewDoc.url} 
              alt={previewDoc.label}
              className="preview-image"
            />
          ) : (
            <div className="pdf-preview">
              <iframe
                src={`${previewDoc?.url}#toolbar=1`}
                title={previewDoc?.label}
                className="pdf-iframe"
              />
              <div className="pdf-fallback">
                <p>If the PDF doesn't load, click below to open in a new tab:</p>
                <a 
                  href={previewDoc?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Open PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// Private Info Tab Component
function PrivateInfoTab({ profile }) {
  return (
    <div className="tab-section">
      <div className="info-grid">
        <div className="info-column">
          <InfoRow label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'} />
          <InfoRow label="Residing Address" value={profile?.address || '-'} />
          <InfoRow label="Nationality" value={profile?.nationality || 'Indian'} />
          <InfoRow label="Personal Email" value={profile?.personalEmail || '-'} highlight badgeColor="coral" />
          <InfoRow label="Gender" value={profile?.gender || '-'} />
          <InfoRow label="Marital Status" value={profile?.maritalStatus || '-'} />
          <InfoRow label="Date of Joining" value={profile?.jobDetails?.joiningDate ? new Date(profile.jobDetails.joiningDate).toLocaleDateString() : '-'} />
        </div>

        <div className="info-column">
          <div className="bank-details-section">
            <h4 className="bank-details-title">Bank Details</h4>
            <InfoRow label="Account Number" value={profile?.bankDetails?.accountNumber || '-'} />
            <InfoRow label="Bank Name" value={profile?.bankDetails?.bankName || '-'} highlight badgeColor="coral" />
          </div>
          <InfoRow label="PAN No" value={profile?.bankDetails?.panNo || '-'} highlight badgeColor="coral" />
          <InfoRow label="UAM NO" value={profile?.bankDetails?.uamNo || '-'} />
          <InfoRow label="Emp Code" value={profile?.bankDetails?.empCode || '-'} />
        </div>
      </div>
    </div>
  );
}

// Salary Info Tab Component
function SalaryInfoTab({ profile }) {
  const salary = profile?.salaryStructure || {};
  const basicSalary = salary.basic || 0;
  const hra = salary.hra || 0;
  const allowances = salary.allowances || 0;
  const deductions = salary.deductions || 0;
  const gross = basicSalary + hra + allowances;
  const netSalary = salary.netSalary || gross - deductions;

  return (
    <div className="tab-section">
      <h3 className="section-title">Salary Structure</h3>
      
      <div className="salary-grid">
        <div className="salary-card earnings">
          <h4>Earnings</h4>
          <div className="salary-items">
            <SalaryItem label="Basic Salary" value={basicSalary} />
            <SalaryItem label="HRA" value={hra} />
            <SalaryItem label="Allowances" value={allowances} />
          </div>
          <div className="salary-total">
            <span>Gross Salary</span>
            <span className="amount">₹{gross.toLocaleString()}</span>
          </div>
        </div>

        <div className="salary-card deductions">
          <h4>Deductions</h4>
          <div className="salary-items">
            <SalaryItem label="Tax Deductions" value={deductions} isDeduction />
          </div>
          <div className="salary-total">
            <span>Total Deductions</span>
            <span className="amount deduction">₹{deductions.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="net-salary-card">
        <span className="net-salary-label">Net Salary</span>
        <span className="net-salary-amount">₹{netSalary.toLocaleString()}</span>
        <span className="net-salary-period">/ month</span>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="tab-section">
      <h3 className="section-title">Change Password</h3>
      
      <div className="security-form">
        <div className="input-group">
          <label>Current Password</label>
          <input
            type="password"
            className="input"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>New Password</label>
          <input
            type="password"
            className="input"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            className="input"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" style={{ marginTop: '12px' }}>
          Update Password
        </button>
      </div>

      <div className="security-section" style={{ marginTop: '40px' }}>
        <h3 className="section-title">Two-Factor Authentication</h3>
        <p style={{ color: 'var(--gray-500)', marginBottom: '16px' }}>
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <button className="btn btn-secondary">
          Enable 2FA
        </button>
      </div>
    </div>
  );
}

// Helper Components
function InfoItem({ label, value, highlight, badgeColor }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}</span>
      {highlight ? (
        <span className={`info-badge ${badgeColor || 'default'}`}>{value}</span>
      ) : (
        <span className="info-value">{value}</span>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight, badgeColor }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      {highlight ? (
        <span className={`info-badge ${badgeColor || 'default'}`}>{value}</span>
      ) : (
        <span className="info-row-value">{value}</span>
      )}
    </div>
  );
}

function DocumentCard({ label, fileName, icon, isUploaded, onUploadClick }) {
  const uploaded = isUploaded ?? (fileName !== 'Not Uploaded');
  
  return (
    <div 
      className={`document-card ${uploaded ? 'uploaded' : ''}`}
      onClick={!uploaded ? onUploadClick : undefined}
      style={{ cursor: !uploaded ? 'pointer' : 'default' }}
    >
      <span className="document-icon">{icon}</span>
      <div className="document-info">
        <span className="document-label">{label}</span>
        <span className="document-file">{fileName}</span>
      </div>
      {uploaded ? (
        <button 
          className="document-download"
          onClick={(e) => {
            e.stopPropagation();
            // Open document in new tab
            if (fileName && fileName.startsWith('http')) {
              window.open(fileName, '_blank');
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
      ) : (
        <button 
          className="document-upload-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (onUploadClick) onUploadClick();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </button>
      )}
    </div>
  );
}

function SalaryItem({ label, value, isDeduction }) {
  return (
    <div className="salary-item">
      <span className="salary-item-label">{label}</span>
      <span className={`salary-item-value ${isDeduction ? 'deduction' : ''}`}>
        {isDeduction ? '-' : ''}₹{value.toLocaleString()}
      </span>
    </div>
  );
}
