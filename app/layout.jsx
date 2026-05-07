import './globals.css'
import 'leaflet/dist/leaflet.css'
import ServiceWorkerRegister from './components/ServiceWorkerRegister'
import InstallButton from './components/InstallButton'

export const metadata = {
  title: 'Ash Todo',
  description: 'Simplify your day',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ash Todo",
  },
}

export const viewport = {
  themeColor: "#000000",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="icon" href="/icons/icon-512.png" sizes="512x512" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        {children}
        {/* Client component will register the service worker when available */}
        <ServiceWorkerRegister />
        <InstallButton />
      </body>
    </html>
  )
}
