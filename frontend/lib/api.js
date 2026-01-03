const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

// Auth API
export const authAPI = {
    // Sign Up
    signup: async (userData) => {
        return apiCall('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // Sign In
    signin: async (credentials) => {
        return apiCall('/auth/signin', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    // Verify Email
    verifyEmail: async (token) => {
        return apiCall(`/auth/verify/${token}`, {
            method: 'GET',
        });
    },

    // Get Current User
    getMe: async () => {
        return apiCall('/auth/me', {
            method: 'GET',
        });
    },

    // Resend Verification Email
    resendVerification: async () => {
        return apiCall('/auth/resend-verification', {
            method: 'POST',
        });
    },

    // Forgot Password
    forgotPassword: async (email) => {
        return apiCall('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    // Reset Password
    resetPassword: async (token, password) => {
        return apiCall(`/auth/reset-password/${token}`, {
            method: 'PUT',
            body: JSON.stringify({ password }),
        });
    },
};

export default authAPI;
