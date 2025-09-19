// Exporta todos os services
export { authService } from './authService';
export { userService } from './userService';

// Re-exporta tipos
export type {
    User,
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ApiResponse,
    PaginationParams,
    PaginatedResponse,
    UpdateUserRequest,
} from '@/types/api';