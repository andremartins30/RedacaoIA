'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Carrega o tema salvo do localStorage na inicialização
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                setIsDark(true);
            } else if (savedTheme === 'light') {
                setIsDark(false);
            } else {
                // Se não há tema salvo, usa a preferência do sistema
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setIsDark(prefersDark);
            }
        }
    }, []);

    // Aplica o tema ao documento
    useEffect(() => {
        if (mounted && typeof window !== 'undefined') {
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [isDark, mounted]);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        }
    };

    // Evita problemas de hidratação
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
