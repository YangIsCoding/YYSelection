// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'YYSelction',
  description: '由歪歪與 Pin-Yang 打造的簡易代購平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-Hant">
      <body className={inter.className}>
         <Providers>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
          <Footer />
         </Providers>
      </body>
    </html>
  )
}
