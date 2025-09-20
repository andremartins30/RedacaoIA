'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface RegisterFormProps {
    onSuccess?: () => void;
    onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setIsLoading(false);
            return;
        }

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            if (result.success) {
                setSuccess(result.message || 'Cadastro realizado com sucesso!');
                // Aguarda um momento para mostrar a mensagem de sucesso
                setTimeout(() => {
                    onSwitchToLogin?.(); // Redireciona para login
                }, 2000);
            }
        } catch (error: any) {
            setError(error.message || 'Erro ao criar conta');
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
                    CRIAR CONTA
                </h2>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-b-md shadow-lg p-6 border border-gray-100">
                {/* Logo RedaçãoIA */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center">
                        <span className="text-2xl font-light text-slate-700 tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            RedaçãoIA
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-700 text-sm">{success}</p>
                        <p className="text-green-600 text-xs mt-1">
                            Redirecionando para login...
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="block w-full px-3 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 text-sm focus:bg-white active:bg-white"
                            placeholder="Nome completo"
                        />
                    </div>

                    <div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full px-3 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 text-sm focus:bg-white active:bg-white"
                            placeholder="E-mail"
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
                            placeholder="Senha (mín. 6 caracteres)"
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

                    <div>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="block w-full px-3 py-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 text-sm focus:bg-white active:bg-white"
                            placeholder="Confirmar senha"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4 inline" />
                                Criando conta...
                            </>
                        ) : (
                            'Criar Conta'
                        )}
                    </button>
                </form>

                {/* Link para login */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-600">
                        Já tem uma conta?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="font-medium text-blue-600 hover:text-blue-700 underline"
                        >
                            Faça login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}