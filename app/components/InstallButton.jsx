"use client"

import { useEffect, useState } from "react"

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    try {
      deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      console.log('Install choice:', choiceResult)
    } catch (err) {
      console.error('Install prompt failed', err)
    } finally {
      setVisible(false)
      setDeferredPrompt(null)
    }
  }

  if (!visible) return null

  return (
    <button
      onClick={handleInstall}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        padding: '10px 14px',
        background: '#000',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        zIndex: 1000,
      }}
    >
      Install Ash Todo
    </button>
  )
}
