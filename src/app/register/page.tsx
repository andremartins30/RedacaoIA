'use client';

import RegisterForm from '@/components/RegisterForm'
import PublicRoute from '@/components/PublicRoute'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/login');
    };

    const handleSwitchToLogin = () => {
        router.push('/login');
    };

    return (
        <PublicRoute redirectTo="/corretor">
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <RegisterForm
                        onSuccess={handleSuccess}
                        onSwitchToLogin={handleSwitchToLogin}
                    />
                </div>
            </div>
        </PublicRoute>
    )
}
