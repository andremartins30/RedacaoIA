'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
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
    const [isDark, setIsDark] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Inicialização do tema
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Primeiro, aplica o tema dark por padrão
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';

            // Depois verifica o localStorage
            const savedTheme = localStorage.getItem('theme');

            if (savedTheme === 'light') {
                setIsDark(false);
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
            } else {
                setIsDark(true);
                localStorage.setItem('theme', 'dark'); // Garante que está salvo
            }

            setIsInitialized(true);
        }
    }, []);

    const toggleTheme = () => {
        if (typeof window !== 'undefined') {
            const newIsDark = !isDark;

            if (newIsDark) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
                localStorage.setItem('theme', 'light');
            }

            setIsDark(newIsDark);
        }
    };

    const setTheme = (theme: 'light' | 'dark') => {
        if (typeof window !== 'undefined') {
            const newIsDark = theme === 'dark';

            if (newIsDark) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
            }

            localStorage.setItem('theme', theme);
            setIsDark(newIsDark);
        }
    };

    // Evita problemas de hidratação retornando um placeholder
    if (!isInitialized) {
        return (
            <ThemeContext.Provider value={{
                isDark: true,
                toggleTheme: () => { },
                setTheme: () => { }
            }}>
                {children}
            </ThemeContext.Provider>
        );
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
