import './globals.css'
import ServiceWorkerRegister from './components/ServiceWorkerRegister'

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
        <link rel="apple-touch-icon" href="/ash-todo-logo.png" />
        <link rel="icon" href="/ash-todo-logo.png" sizes="192x192" />
        <link rel="icon" href="/ash-todo-logo.png" sizes="512x512" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        {children}
        {/* Client component will register the service worker when available */}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
