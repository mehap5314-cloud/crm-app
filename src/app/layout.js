import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'

export const metadata = {
  title: 'CRM System',
  description: 'Customer Issues Management System',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg', apple: '/icon.svg' },
  appleWebApp: { capable: true, title: 'CRM', statusBarStyle: 'black-translucent' },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  themeColor: '#f59e0b',
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(getAuthOptions())

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('crm-theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}})()`
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(s){s.unregister()})});window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`
        }} />
      </head>
      <body className="font-body">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
