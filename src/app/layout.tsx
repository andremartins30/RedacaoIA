import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://redacao-ia.com.br'),
  title: 'REDAÇÃO IA - Corretor Inteligente de Redações',
  description: 'Corrija suas redações do ENEM com inteligência artificial. Receba notas detalhadas e feedback personalizado.',
  keywords: ['ENEM', 'redação', 'correção', 'inteligência artificial', 'educação'],
  authors: [{ name: 'REDAÇÃO IA Team' }],
  openGraph: {
    title: 'REDAÇÃO IA - Corretor Inteligente de Redações',
    description: 'Corrija suas redações do ENEM com IA',
    url: 'https://redacao-ia.com.br',
    siteName: 'REDAÇÃO IA',
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
    title: 'REDAÇÃO IA - Corretor Inteligente de Redações',
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  localStorage.setItem('theme', 'dark');
                }
              })();
            `
          }}
        />
      </head>
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