import axiosInstance from '@/lib/axios';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ApiResponse,
    User
} from '@/types/api';

class AuthService {
    // Salva token no localStorage e cookies
    private setToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
            // Salva no cookie também para o middleware
            document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
    }

    // Remove token do localStorage e cookies
    private removeToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            // Remove o cookie
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
    }

    // Obtém token do localStorage
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    }

    // Verifica se usuário está autenticado
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    // Registro de usuário
    async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        try {
            const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/register', data);

            // Não salva o token automaticamente - usuário deve fazer login após o registro
            // if (response.data.success && response.data.data?.token) {
            //     this.setToken(response.data.data.token);
            // }

            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro no registro');
        }
    }

    // Login de usuário
    async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        try {
            const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data);

            // Salva token após login bem-sucedido
            if (response.data.success && response.data.data?.token) {
                this.setToken(response.data.data.token);
            }

            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro no login');
        }
    }

    // Logout
    async logout(): Promise<ApiResponse> {
        try {
            const response = await axiosInstance.post<ApiResponse>('/auth/logout');

            // Remove token após logout
            this.removeToken();

            return response.data;
        } catch (error: any) {
            // Remove token mesmo se houver erro
            this.removeToken();
            throw new Error(error.response?.data?.error || 'Erro no logout');
        }
    }

    // Obter perfil do usuário
    async getProfile(): Promise<ApiResponse<User>> {
        try {
            const response = await axiosInstance.get<ApiResponse<User>>('/auth/profile');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro ao obter perfil');
        }
    }

    // Health check
    async healthCheck(): Promise<ApiResponse> {
        try {
            const response = await axiosInstance.get<ApiResponse>('/health');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro no health check');
        }
    }
}

// Instância singleton do service
export const authService = new AuthService();