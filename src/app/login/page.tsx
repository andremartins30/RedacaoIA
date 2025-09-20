'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import PublicRoute from '@/components/PublicRoute';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);

    const handleLoginSuccess = () => {
        router.push('/corretor');
    };

    const handleRegisterSuccess = () => {
        setIsLogin(true); // Volta para o login após cadastro bem-sucedido
    };

    const switchToRegister = () => {
        setIsLogin(false);
    };

    const switchToLogin = () => {
        setIsLogin(true);
    };

    return (
        <PublicRoute redirectTo="/corretor">
            <div className="min-h-screen bg-slate-700 flex flex-col lg:flex-row">
                {/* Seção Esquerda - Informações da Plataforma */}
                <div className="hidden lg:flex lg:w-1/2 bg-slate-700 items-center justify-center p-12 relative">
                    <div className="max-w-md text-center">

                        {/* Conteúdo Principal */}
                        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-10 shadow-xl max-w-lg border border-blue-100">
                            <h1 className="text-3xl font-bold text-slate-800 mb-4 text-center leading-tight">
                                Bem-vindo ao <span className="text-blue-600">RedaçãoIA</span>
                            </h1>

                            <div className="space-y-4 text-center">
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    Uma plataforma inovadora que revoluciona a criação de textos e redações
                                </p>
                                <div className="flex items-center justify-center space-x-2 text-slate-500">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Ferramentas inteligentes</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2 text-slate-500">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Para estudantes e profissionais</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2 text-slate-500">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm">Melhore suas habilidades de escrita</span>
                                </div>
                            </div>

                        </div>


                    </div>
                </div>

                {/* Seção Direita - Formulário de Login/Registro */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 min-h-screen lg:min-h-auto relative">


                    <div className="w-full max-w-md mt-16 lg:mt-0">
                        {isLogin ? (
                            <LoginForm
                                onSuccess={handleLoginSuccess}
                                onSwitchToRegister={switchToRegister}
                            />
                        ) : (
                            <RegisterForm
                                onSuccess={handleRegisterSuccess}
                                onSwitchToLogin={switchToLogin}
                            />
                        )}
                    </div>
                </div>
            </div>
        </PublicRoute>
    );
}