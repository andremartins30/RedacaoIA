import type { Config } from 'tailwindcss'

export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: {
                    blue: 'rgb(59, 130, 246)',
                    purple: 'rgb(147, 51, 234)',
                },
                accent: {
                    yellow: 'rgb(251, 191, 36)',
                    orange: 'rgb(249, 115, 22)',
                },
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, rgb(59, 130, 246), rgb(147, 51, 234))',
                'gradient-accent': 'linear-gradient(135deg, rgb(251, 191, 36), rgb(249, 115, 22))',
                'gradient-soft': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.6s ease-out',
                'bounce-soft': 'bounceSoft 2s infinite',
                'pulse-slow': 'pulse 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    from: {
                        opacity: '0',
                        transform: 'translateY(10px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                slideUp: {
                    from: {
                        opacity: '0',
                        transform: 'translateY(20px)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
                bounceSoft: {
                    '0%, 20%, 50%, 80%, 100%': {
                        transform: 'translateY(0)',
                    },
                    '40%': {
                        transform: 'translateY(-5px)',
                    },
                    '60%': {
                        transform: 'translateY(-3px)',
                    },
                },
            },
            boxShadow: {
                'soft': '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                'medium': '0 10px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
                'strong': '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08)',
            },
        },
    },
    plugins: [],
} satisfies Config
