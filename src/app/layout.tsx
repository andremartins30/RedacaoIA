import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NOTA1000 - Corretor Inteligente de Redações',
  description: 'Corrija suas redações do ENEM com inteligência artificial. Receba notas detalhadas e feedback personalizado.',
  keywords: ['ENEM', 'redação', 'correção', 'inteligência artificial', 'educação'],
  authors: [{ name: 'NOTA1000 Team' }],
  openGraph: {
    title: 'NOTA1000 - Corretor Inteligente de Redações',
    description: 'Corrija suas redações do ENEM com IA',
    url: 'https://nota1000.com.br',
    siteName: 'NOTA1000',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOTA1000 - Corretor Inteligente de Redações',
    description: 'Corrija suas redações do ENEM com IA',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen">
            <main>
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}