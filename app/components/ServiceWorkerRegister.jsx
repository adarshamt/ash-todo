"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const swUrl = '/sw.js'
        const registration = await navigator.serviceWorker.register(swUrl)
        console.log('Service worker registered:', registration)
      } catch (err) {
        console.error('Service worker registration failed:', err)
      }
    }

    register()
  }, [])

  return null
}
