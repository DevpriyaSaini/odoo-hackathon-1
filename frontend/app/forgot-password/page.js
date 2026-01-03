'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await authAPI.forgotPassword(email);
            setStatus('success');
            setMessage(response.message);
        } catch (error) {
            setStatus('error');
            setMessage(error.message || 'Failed to send reset email.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Dayflow</h1>
                    <p className="text-white/80">Human Resource Management System</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        Forgot Password?
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        Enter your email and we'll send you a reset link
                    </p>

                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-700 mb-4">{message}</p>
                            <Link href="/signin" className="text-purple-600 font-semibold hover:text-purple-700">
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            {status === 'error' && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                        placeholder="you@company.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-gray-600">
                                Remember your password?{' '}
                                <Link href="/signin" className="text-purple-600 font-semibold hover:text-purple-700">
                                    Sign In
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
