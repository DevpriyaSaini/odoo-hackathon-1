'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

export default function DashboardPage() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/signin');
        }
    }, [loading, isAuthenticated, router]);

    const handleResendVerification = async () => {
        setResending(true);
        setResendMessage('');
        try {
            await authAPI.resendVerification();
            setResendMessage('Verification email sent! Check your inbox.');
        } catch (error) {
            setResendMessage(error.message || 'Failed to send email');
        } finally {
            setResending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Dayflow HRMS</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">{user.employeeId} ({user.role})</span>
                            <button onClick={logout} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Email Verification Warning */}
                {!user.isVerified && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-yellow-800">
                                Please verify your email to access all features.
                            </span>
                            <button
                                onClick={handleResendVerification}
                                disabled={resending}
                                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                            >
                                {resending ? 'Sending...' : 'Resend Email'}
                            </button>
                        </div>
                        {resendMessage && (
                            <p className="mt-2 text-sm text-yellow-700">{resendMessage}</p>
                        )}
                    </div>
                )}

                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.employeeId}! 👋</h2>
                    <p className="text-gray-600">You are logged in as <span className="font-semibold text-blue-600">{user.role}</span></p>
                </div>

                {/* User Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Your Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Employee ID</p>
                            <p className="text-gray-900 font-medium">{user.employeeId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-gray-900 font-medium">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="text-gray-900 font-medium">{user.role}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email Status</p>
                            <p className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                                {user.isVerified ? 'Verified ✓' : 'Pending Verification'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
