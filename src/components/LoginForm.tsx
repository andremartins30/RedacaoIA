'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(formData);
            onSuccess?.();
        } catch (error: any) {
            setError(error.message || 'Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Cabeçalho da Área do Corretor */}
            <div className="bg-blue-600 text-center py-3 px-4 rounded-t-md">
                <h2 className="text-sm font-bold text-white tracking-wider">
                    ÁREA DO CORRETOR
                </h2>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-b-md shadow-lg p-6 border border-gray-100">
                {/* Logo Letrus */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center">
                        <span className="text-2xl font-light text-slate-700 tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            RedaçãoIA
                        </span>
                    </div>
                </div>                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full px-3 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 text-sm focus:bg-white active:bg-white"
                            placeholder="Usuário ou e-mail"
                        />
                    </div>

                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="block w-full px-3 py-3 pr-10 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 text-sm focus:bg-white active:bg-white"
                            placeholder="Senha"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            ) : (
                                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            )}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 inline" />
                                Entrando...
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                {/* Link Esqueci minha senha */}
                <div className="mt-4 text-center">
                    <a
                        href="#"
                        className="text-xs text-slate-600 hover:text-slate-800 underline"
                    >
                        Esqueci minha senha
                    </a>
                </div>

                {/* Link para cadastro */}
                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-600">
                        Não tem uma conta?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="font-medium text-blue-600 hover:text-blue-700 underline"
                        >
                            Cadastre-se
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}