// Cloudinary Upload Service
// Uses unsigned uploads for client-side file uploads

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset';

// Cloudinary upload URL
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder to upload to (default: 'dayflow')
 * @param {string} options.resourceType - Resource type: 'image', 'raw', 'auto' (default: 'auto')
 * @param {Function} options.onProgress - Progress callback (receives percentage)
 * @returns {Promise<{url: string, publicId: string, format: string}>}
 */
export const uploadToCloudinary = async (file, options = {}) => {
  const { folder = 'dayflow/profiles', onProgress } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress(percentage);
        }
      };
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
          format: response.format,
          originalFilename: response.original_filename,
          bytes: response.bytes,
        });
      } else {
        reject(new Error('Upload failed'));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };
    
    xhr.send(formData);
  });
};

/**
 * Upload profile picture to Cloudinary
 * @param {File} file - Image file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - URL of uploaded image
 */
export const uploadProfilePicture = async (file, onProgress) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const result = await uploadToCloudinary(file, {
    folder: 'dayflow/profile-pictures',
    onProgress,
  });

  return result.url;
};

/**
 * Upload a document to Cloudinary
 * @param {File} file - Document file
 * @param {string} documentType - Type of document (resume, aadhaar, pan)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<{url: string, filename: string}>}
 */
export const uploadDocument = async (file, documentType, onProgress) => {
  // Validate file types for documents
  const validTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF, Word document, or image file.');
  }

  // Validate file size (max 10MB for documents)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  const result = await uploadToCloudinary(file, {
    folder: `dayflow/documents/${documentType}`,
    onProgress,
  });

  return {
    url: result.url,
    filename: result.originalFilename || file.name,
    publicId: result.publicId,
  };
};

export default {
  uploadToCloudinary,
  uploadProfilePicture,
  uploadDocument,
};
