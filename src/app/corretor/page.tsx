import CorretorRedacao from '@/components/CorretorRedacao'
import ClientOnly from '@/components/ClientOnly'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function CorretorPage() {
    return (
        <ProtectedRoute>
            <ClientOnly fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-white text-lg">Carregando NOTA1000...</p>
                    </div>
                </div>
            }>
                <Navbar />
                <CorretorRedacao />
            </ClientOnly>
        </ProtectedRoute>
    )
}
