'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services';
import { User, LoginRequest, RegisterRequest } from '@/types/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // Carrega o usuário ao inicializar
    useEffect(() => {
        const loadUser = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const response = await authService.getProfile();
                    if (response.success && response.data) {
                        setUser(response.data);
                    }
                } catch (error) {
                    console.error('Erro ao carregar usuário:', error);
                    // Token pode estar inválido, remove
                    authService.logout();
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = async (data: LoginRequest) => {
        try {
            const response = await authService.login(data);
            if (response.success && response.data) {
                setUser(response.data.user);
            } else {
                throw new Error(response.error || 'Erro no login');
            }
        } catch (error: any) {
            console.error('Erro no login:', error);
            throw error;
        }
    };

    const register = async (data: RegisterRequest) => {
        try {
            const response = await authService.register(data);
            if (response.success) {
                // Não define o usuário automaticamente - usuário precisa fazer login
                return { success: true, message: response.message || 'Cadastro realizado com sucesso!' };
            } else {
                throw new Error(response.error || 'Erro no registro');
            }
        } catch (error: any) {
            console.error('Erro no registro:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
        } catch (error) {
            console.error('Erro no logout:', error);
            // Força o logout mesmo se houver erro
            setUser(null);
        }
    };

    const refreshUser = async () => {
        if (authService.isAuthenticated()) {
            try {
                const response = await authService.getProfile();
                if (response.success && response.data) {
                    setUser(response.data);
                }
            } catch (error) {
                console.error('Erro ao atualizar usuário:', error);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}