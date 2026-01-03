'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await authAPI.getMe();
                setUser(response.user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        const response = await authAPI.signup(userData);
        if (response.token) {
            localStorage.setItem('token', response.token);
            setUser(response.user);
        }
        return response;
    };

    const signin = async (credentials) => {
        const response = await authAPI.signin(credentials);
        if (response.token) {
            localStorage.setItem('token', response.token);
            setUser(response.user);
        }
        return response;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/signin');
    };

    const value = {
        user,
        loading,
        signup,
        signin,
        logout,
        checkAuth,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
