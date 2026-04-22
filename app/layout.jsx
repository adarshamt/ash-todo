import './globals.css'

export const metadata = {
  title: 'Ash Todo',
  description: 'Simplify your day',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
