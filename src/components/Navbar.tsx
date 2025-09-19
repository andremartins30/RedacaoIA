'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    User,
    LogOut,
    Settings,
    Moon,
    Sun,
    Menu,
    X,
    ChevronDown,
    Home,
    FileText,
    Users,
    BarChart3
} from 'lucide-react';

// Componente responsável pela barra de navegação principal do sistema
export default function Navbar() {
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    const { isDark, toggleTheme } = useTheme(); // Corrigido: usar isDark em vez de theme
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const handleLogin = () => {
        router.push('/login');
    };

    const navigation = isAuthenticated ? [
        { name: 'Corretor', href: '/corretor', icon: FileText },
    ] : [];

    const adminNavigation = [
        { name: 'Usuários', href: '/admin/users', icon: Users },
        { name: 'Relatórios', href: '/admin/reports', icon: BarChart3 },
    ];

    if (isLoading) {
        return (
            <nav className="bg-white dark:bg-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                REDAÇÃO IA
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-24 rounded"></div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push('/')}
                            className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            REDAÇÃO IA
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => router.push(item.href)}
                                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}

                        {/* Admin Navigation */}
                        {isAuthenticated && user?.role === 'admin' && (
                            <>
                                {adminNavigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => router.push(item.href)}
                                            className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{item.name}</span>
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* Toggle Theme */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            {isDark ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </button>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-sm font-medium">{user?.name}</span>
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                                            <p className="font-medium">{user?.name}</p>
                                            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                router.push('/profile');
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Perfil
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Entrar
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-600">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push(item.href);
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Icon className="h-5 w-5 mr-2" />
                                        {item.name}
                                    </button>
                                );
                            })}

                            {/* Admin Mobile Navigation */}
                            {isAuthenticated && user?.role === 'admin' && (
                                <>
                                    {adminNavigation.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.name}
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    router.push(item.href);
                                                }}
                                                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Icon className="h-5 w-5 mr-2" />
                                                {item.name}
                                            </button>
                                        );
                                    })}
                                </>
                            )}

                            <button
                                onClick={toggleTheme}
                                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {isDark ? (
                                    <Sun className="h-5 w-5 mr-2" />
                                ) : (
                                    <Moon className="h-5 w-5 mr-2" />
                                )}
                                {isDark ? 'Modo Claro' : 'Modo Escuro'}
                            </button>

                            {isAuthenticated ? (
                                <>
                                    <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                                        <p className="font-medium">{user?.name}</p>
                                        <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/profile');
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Settings className="h-5 w-5 mr-2" />
                                        Perfil
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <LogOut className="h-5 w-5 mr-2" />
                                        Sair
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        handleLogin();
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-base font-medium transition-colors"
                                >
                                    Entrar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}