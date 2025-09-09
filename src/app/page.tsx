import CorretorRedacao from '@/components/CorretorRedacao'
import ClientOnly from '@/components/ClientOnly'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <ClientOnly fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-lg">Carregando EnemAI...</p>
          </div>
        </div>
      }>
        <CorretorRedacao />
      </ClientOnly>
    </div>
  )
}