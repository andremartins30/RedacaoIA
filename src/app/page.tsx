'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientOnly from '@/components/ClientOnly';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Se está autenticado, vai para o corretor
        router.replace('/corretor');
      } else {
        // Se não está autenticado, vai para login
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostra carregamento enquanto decide para onde redirecionar
  return (
    <ClientOnly fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando NOTA1000...</p>
        </div>
      </div>
    }>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecionando...</p>
        </div>
      </div>
    </ClientOnly>
  );
}