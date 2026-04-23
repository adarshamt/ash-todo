import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
