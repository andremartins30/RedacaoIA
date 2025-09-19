import { authService, userService } from '../services';

export const useServices = () => {
    return {
        auth: authService,
        user: userService,
    };
};

// Hook específico para autenticação
export const useAuthService = () => {
    return authService;
};

// Hook específico para usuários
export const useUserService = () => {
    return userService;
};