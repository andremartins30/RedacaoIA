// Tipos para usuários
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    created_at: string;
    updated_at: string;
}

// Tipos para autenticação
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// Tipos para respostas da API
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Tipos para paginação
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Tipos para atualização de usuário
export interface UpdateUserRequest {
    name?: string;
    email?: string;
    password?: string;
}