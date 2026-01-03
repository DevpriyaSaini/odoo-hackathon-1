'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/signin');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 mx-auto text-purple-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Dayflow
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                                {user.employeeId} ({user.role})
                            </span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Email Verification Warning */}
                {!user.isVerified && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                        <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-yellow-800">
                            Please verify your email to access all features.
                        </span>
                    </div>
                )}

                {/* Welcome Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Welcome, {user.employeeId}! 👋
                    </h2>
                    <p className="text-gray-600">
                        You are logged in as <span className="font-semibold text-purple-600">{user.role}</span>
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-medium opacity-90">Total Leave Balance</h3>
                        <p className="text-4xl font-bold mt-2">24 days</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-medium opacity-90">Pending Requests</h3>
                        <p className="text-4xl font-bold mt-2">0</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-medium opacity-90">This Month Attendance</h3>
                        <p className="text-4xl font-bold mt-2">100%</p>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="mt-6 bg-white rounded-2xl shadow-lg p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Your Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Employee ID</p>
                            <p className="text-gray-800 font-medium">{user.employeeId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-gray-800 font-medium">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="text-gray-800 font-medium">{user.role}</p>
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
