import axios, { AxiosInstance, AxiosResponse } from 'axios';


// BAse do axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';


// Instancia do axios
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})


// Interceptor para adicionar token de autenticação
axiosInstance.interceptors.request.use(
    (config) => {
        // Adiciona token se existir
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratamento de respostas
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        // Se o token expirou ou é inválido
        if (error.response?.status === 401) {
            // Remove token inválido
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
            }
            // Redireciona para login se não estiver na página de login
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;