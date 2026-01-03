'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('dayflow_token');

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Check if token is expired
        if (payload.exp * 1000 > Date.now()) {
          // Redirect based on role
          if (payload.role === 'admin') {
            router.push('/dashboard/admin');
          } else {
            router.push('/dashboard/employee');
          }
          return;
        }
      } catch (error) {
        console.error('Invalid token:', error);
      }

      // Token is invalid or expired
      localStorage.removeItem('dayflow_token');
    }

    // Not logged in, redirect to login
    router.push('/auth/login');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
          Day<span style={{ color: 'var(--accent-400)' }}>flow</span>
        </h1>
        <p style={{ opacity: 0.8, marginBottom: '24px' }}>Every workday, perfectly aligned</p>
        <LoadingSpinner />
      </div>
    </div>
  );
}
