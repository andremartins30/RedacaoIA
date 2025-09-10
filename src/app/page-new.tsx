import CorretorRedacao from '@/components/CorretorRedacao'
import ClientOnly from '@/components/ClientOnly'
import QuickThemeDebug from '@/components/QuickThemeDebug'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <ClientOnly fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-700 dark:text-gray-300 text-lg">Carregando NOTA1000...</p>
                    </div>
                </div>
            }>
                <CorretorRedacao />
                <QuickThemeDebug />
            </ClientOnly>
        </div>
    )
}
