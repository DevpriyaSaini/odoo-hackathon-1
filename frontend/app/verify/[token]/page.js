'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function VerifyEmailPage({ params }) {
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Wait for params to be ready
                const resolvedParams = await params;
                const response = await authAPI.verifyEmail(resolvedParams.token);
                setStatus('success');
                setMessage(response.message);
                setTimeout(() => router.push('/signin'), 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.message || 'Verification failed. The link may be expired.');
            }
        };

        verifyEmail();
    }, [params, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="mb-6">
                                <svg className="animate-spin h-16 w-16 mx-auto text-purple-600" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Email</h2>
                            <p className="text-gray-600">Please wait while we verify your email...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mb-6">
                                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
                            <p className="text-gray-600 mb-4">{message}</p>
                            <p className="text-sm text-gray-500">Redirecting to sign in...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mb-6">
                                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <Link
                                href="/signin"
                                className="inline-block py-2 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                            >
                                Go to Sign In
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
