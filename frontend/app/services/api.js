import axios from 'axios';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - attach token to all requests
api.interceptors.request.use(
  (config) => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dayflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dayflow_token');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH SERVICES ============

export const authService = {
  // Admin registration
  register: async (data) => {
    const response = await api.post('/admin/register', data);
    return response.data;
  },

  // Verify OTP
  verifyOtp: async (data) => {
    const response = await api.put('/admin/verify-otp', data);
    return response.data;
  },

  // Login
  login: async (data) => {
    const response = await api.post('/admin/login', data);
    return response.data;
  },

  // Get all admins
  getAllAdmins: async () => {
    const response = await api.get('/admin/all-admins');
    return response.data;
  },
};

// ============ EMPLOYEE AUTH SERVICES ============

export const employeeAuthService = {
  // Employee registration (self-registration)
  register: async (data) => {
    const response = await api.post('/employ/register', data);
    return response.data;
  },

  // Admin-only: Create new employee with auto-generated ID and password
  createEmployee: async (data) => {
    const response = await api.post('/employ/create', data);
    return response.data;
  },

  // Verify OTP
  verifyOtp: async (data) => {
    const response = await api.put('/employ/verify-otp', data);
    return response.data;
  },

  // Login
  login: async (data) => {
    const response = await api.post('/employ/login', data);
    return response.data;
  },

  // Get all employees
  getAll: async () => {
    const response = await api.get('/employ/all');
    return response.data;
  },
};

// ============ EMPLOYEE SERVICES ============

// Cloudinary configuration for direct uploads
const CLOUDINARY_CLOUD_NAME = 'dkpvhegme';
const CLOUDINARY_UPLOAD_PRESET = 'devpriyasaini';

export const employeeService = {
  // Get all employees (admin only)
  getAll: async () => {
    const response = await api.get('/employ-profile/profiles');
    return response.data;
  },

  // Get specific employee profile (admin only)
  getById: async (employeeId) => {
    const response = await api.get(`/employ-profile/profile/${employeeId}`);
    return response.data;
  },

  // Get current employee profile
  getProfile: async () => {
    const response = await api.get('/employ-profile/profile');
    return response.data;
  },

  // Create employee profile
  createProfile: async (data) => {
    const response = await api.post('/employ-profile/profile', data);
    return response.data;
  },

  // Update employee profile
  update: async (id, data) => {
    const response = await api.put('/employ-profile/profile', data);
    return response.data;
  },

  // Admin update employee profile
  adminUpdate: async (employeeId, data) => {
    const response = await api.put(`/employ-profile/profile/${employeeId}`, data);
    return response.data;
  },
}
// ============ ATTENDANCE SERVICES ============

export const attendanceService = {
  // Check in
  checkIn: async () => {
    const response = await api.post('/attendance/check-in');
    return response.data;
  },

  // Check out
  checkOut: async () => {
    const response = await api.post('/attendance/check-out');
    return response.data;
  },

  // Get own attendance
  getMine: async (params) => {
    const response = await api.get('/attendance/me', { params });
    return response.data;
  },

  // Alias for getMine
  getMy: async (params) => {
    const response = await api.get('/attendance/me', { params });
    return response.data;
  },

  // Get all attendance (admin only)
  getAll: async (params) => {
    const response = await api.get('/attendance/all', { params });
    return response.data;
  },

  // Get today's status
  getToday: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  // Override attendance (admin only)
  override: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
};

// ============ LEAVE SERVICES ============

export const leaveService = {
  // Apply for leave
  apply: async (data) => {
    const response = await api.post('/leaves/apply', data);
    return response.data;
  },

  // Get own leaves
  getMine: async () => {
    const response = await api.get('/leaves/me');
    return response.data;
  },

  // Alias for getMine
  getMy: async () => {
    const response = await api.get('/leaves/me');
    return response.data;
  },

  // Get all leaves (admin only)
  getAll: async (params) => {
    const response = await api.get('/leaves/all', { params });
    return response.data;
  },

  // Approve leave (admin only)
  approve: async (id, comment) => {
    const response = await api.put(`/leaves/${id}/approve`, { comment });
    return response.data;
  },

  // Reject leave (admin only)
  reject: async (id, comment) => {
    const response = await api.put(`/leaves/${id}/reject`, { comment });
    return response.data;
  },
};

// ============ PAYROLL SERVICES ============

export const payrollService = {
  // Get own payroll
  getMine: async () => {
    const response = await api.get('/payroll/me');
    return response.data;
  },

  // Get all payroll (admin only)
  getAll: async (params) => {
    const response = await api.get('/payroll/all', { params });
    return response.data;
  },

  // Update payroll (admin only)
  update: async (employeeId, data) => {
    const response = await api.put(`/payroll/${employeeId}`, data);
    return response.data;
  },

  // Create payroll record (admin only)
  create: async (data) => {
    const response = await api.post('/payroll', data);
    return response.data;
  },
};

// ============ DASHBOARD SERVICES ============

export const dashboardService = {
  // Get admin dashboard stats
  getAdminStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // Get employee dashboard data
  getEmployeeData: async () => {
    const response = await api.get('/employee/dashboard');
    return response.data;
  },
};

// ============ UPLOAD SERVICES ============

export const uploadService = {
  // Upload profile picture
  uploadProfile: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload document
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    const response = await api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete uploaded file
  deleteFile: async (url, publicId) => {
    const response = await api.delete('/upload', { data: { url, publicId } });
    return response.data;
  },
};

export default api;

