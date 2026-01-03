'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('dayflow_token');
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        // Check if token is expired
        if (payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser({
            id: payload.id,
            email: payload.email,
            role: payload.role,
          });
        } else {
          // Token expired - clean up
          localStorage.removeItem('dayflow_token');
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('dayflow_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken) => {
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      localStorage.setItem('dayflow_token', newToken);
      setToken(newToken);
      setUser({
        id: payload.id,
        email: payload.email,
        role: payload.role,
      });
      
      // Redirect based on role
      if (payload.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/employee');
      }
      
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  };

  const isAdmin = () => user?.role === 'admin';
  const isEmployee = () => user?.role === 'employ' || user?.role === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isEmployee,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
