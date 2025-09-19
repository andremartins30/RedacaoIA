import axiosInstance from '@/lib/axios';
import {
    User,
    ApiResponse,
    PaginatedResponse,
    UpdateUserRequest
} from '@/types/api';

class UserService {
    // Listar todos os usuários (apenas admin)
    async getUsers(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<User>>> {
        try {
            const response = await axiosInstance.get<ApiResponse<PaginatedResponse<User>>>(
                `/users?page=${page}&limit=${limit}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro ao listar usuários');
        }
    }

    // Obter usuário por ID
    async getUserById(id: string): Promise<ApiResponse<User>> {
        try {
            const response = await axiosInstance.get<ApiResponse<User>>(`/users/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro ao obter usuário');
        }
    }

    // Atualizar usuário
    async updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
        try {
            const response = await axiosInstance.put<ApiResponse<User>>(`/users/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro ao atualizar usuário');
        }
    }

    // Deletar usuário (apenas admin)
    async deleteUser(id: string): Promise<ApiResponse> {
        try {
            const response = await axiosInstance.delete<ApiResponse>(`/users/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Erro ao deletar usuário');
        }
    }
}

// Instância singleton do service
export const userService = new UserService();