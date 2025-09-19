'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserService } from '@/hooks/useServices';
import { User } from '@/types/api';

export default function UserProfile() {
    const { user, isAuthenticated } = useAuth();
    const userService = useUserService();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Exemplo: Listar usuários (apenas para admin)
    const loadUsers = async () => {
        if (!isAuthenticated || user?.role !== 'admin') return;

        setLoading(true);
        try {
            const response = await userService.getUsers();
            if (response.success && response.data) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [isAuthenticated, user?.role]);

    if (!isAuthenticated) {
        return <div>Faça login para ver seu perfil</div>;
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Perfil do Usuário</h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-2">Suas Informações</h3>
                <p><strong>Nome:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
            </div>

            {user?.role === 'admin' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Lista de Usuários (Admin)</h3>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : (
                        <div className="space-y-2">
                            {users.map((u) => (
                                <div key={u.id} className="flex justify-between items-center p-2 border rounded">
                                    <span>{u.name} ({u.email})</span>
                                    <span className="text-sm text-gray-500">{u.role}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}