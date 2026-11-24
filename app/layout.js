import './globals.css'
import SincronizarPreferencias from '@/components/SincronizarPreferencias'
import LeitorDeBotoes from '@/components/LeitorDeBotoes'
import { scriptPreferencias } from '@/lib/preferencias'

export const metadata = {
  title: 'Vem Até Mim | Manicure, cabelo e barba em casa',
  description: 'Manicure, cabelo e barba em casa, em Maracanaú, com acompanhamento da família.',
}

// Importante: não limitar o zoom (maximumScale), quem enxerga pouco precisa dele
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'only light',
  themeColor: '#0B5CC4',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-fs="2" data-contraste="normal" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: scriptPreferencias }} />
      </head>
      <body>
        <a href="#conteudo" className="pular">Pular para o conteúdo</a>
        <SincronizarPreferencias />
        <LeitorDeBotoes />
        <main id="conteudo" tabIndex={-1}>{children}</main>
      </body>
    </html>
  )
}
