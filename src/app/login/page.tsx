'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import PublicRoute from '@/components/PublicRoute';

export default function LoginPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/corretor');
    };

    const handleSwitchToRegister = () => {
        router.push('/register');
    };

    return (
        <PublicRoute redirectTo="/corretor">
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <LoginForm
                        onSuccess={handleSuccess}
                        onSwitchToRegister={handleSwitchToRegister}
                    />
                </div>
            </div>
        </PublicRoute>
    );
}