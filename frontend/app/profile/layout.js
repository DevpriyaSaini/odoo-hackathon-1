'use client';

import { AuthProvider } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function ProfileLayout({ children }) {
  return (
    <AuthProvider>
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
