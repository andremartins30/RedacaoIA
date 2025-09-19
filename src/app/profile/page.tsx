'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserService } from '@/hooks/useServices';
import { User } from '@/types/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import {
    User as UserIcon,
    Mail,
    Calendar,
    Shield,
    Edit,
    Save,
    X,
    Loader2
} from 'lucide-react';

export default function ProfilePage() {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const userService = useUserService();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
            });
        }
    }, [user]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Acesso Negado
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Faça login para acessar seu perfil
                    </p>
                </div>
            </div>
        );
    }

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
        });
        setError('');
        setSuccess('');
    };

    const handleSave = async () => {
        if (!user) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await userService.updateUser(user.id, {
                name: formData.name,
                email: formData.email,
            });

            if (response.success) {
                setSuccess('Perfil atualizado com sucesso!');
                setIsEditing(false);
                await refreshUser();
            } else {
                setError(response.error || 'Erro ao atualizar perfil');
            }
        } catch (error: any) {
            setError(error.message || 'Erro ao atualizar perfil');
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
        <ProtectedRoute>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Meu Perfil
                                </h1>
                                {!isEditing ? (
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span>Editar</span>
                                    </button>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                            <span>Cancelar</span>
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            <span>Salvar</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                                    <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                                    <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nome Completo
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                        ) : (
                                            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                                <UserIcon className="h-5 w-5 text-gray-400" />
                                                <span>{user?.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            />
                                        ) : (
                                            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                                <span>{user?.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tipo de Usuário
                                        </label>
                                        <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                            <Shield className="h-5 w-5 text-gray-400" />
                                            <span className="capitalize">{user?.role}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Membro desde
                                        </label>
                                        <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <span>
                                                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center">
                                    <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center">
                                        <UserIcon className="h-16 w-16 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}