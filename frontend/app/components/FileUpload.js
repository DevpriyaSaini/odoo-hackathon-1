'use client';

import { useState, useRef } from 'react';

/**
 * FileUpload component with drag-and-drop and Cloudinary integration
 */
export default function FileUpload({
  onUpload,
  accept = '*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = 'Upload File',
  hint = 'Drag and drop or click to browse',
  icon = '📁',
  className = '',
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleFile = async (file) => {
    setError(null);
    
    // Check file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${formatBytes(maxSize)}.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await onUpload(file, setProgress);
      setProgress(100);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`file-upload-wrapper ${className}`}>
      <div
        className={`file-upload-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="upload-progress">
            <div className="progress-circle">
              <svg viewBox="0 0 36 36">
                <path
                  className="progress-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="progress-bar"
                  strokeDasharray={`${progress}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="progress-text">{progress}%</span>
            </div>
            <p className="upload-status">Uploading...</p>
          </div>
        ) : (
          <>
            <span className="upload-icon">{icon}</span>
            <span className="upload-label">{label}</span>
            <span className="upload-hint">{hint}</span>
          </>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Profile Picture Upload component
 */
export function ProfilePictureUpload({ 
  currentImage, 
  name = 'User', 
  onUpload, 
  uploading = false,
  progress = 0 
}) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    e.target.value = '';
  };

  return (
    <div className="profile-picture-upload" onClick={handleClick}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      
      <div className="avatar-container">
        {currentImage ? (
          <img src={currentImage} alt={name} className="avatar-image" />
        ) : (
          <span className="avatar-initial">{name.charAt(0).toUpperCase()}</span>
        )}
        
        {uploading && (
          <div className="avatar-overlay">
            <div className="mini-progress">{progress}%</div>
          </div>
        )}
        
        <button className="avatar-edit-btn" type="button" disabled={uploading}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
