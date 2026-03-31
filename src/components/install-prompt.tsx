'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isIos() {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return

    if (isIos()) {
      setShowIosHint(true)
      return
    }

    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  if (dismissed || isInStandaloneMode()) return null

  if (showIosHint) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border bg-white/95 p-4 shadow-lg">
        <div className="text-sm font-semibold">Install Disc Golf Journey</div>
        <p className="mt-1 text-sm text-gray-700">
          On iPhone, tap the Share button in Safari, then tap <span className="font-medium">Add to Home Screen</span>.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="mt-3 text-sm font-medium underline"
        >
          Dismiss
        </button>
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border bg-white/95 p-4 shadow-lg">
        <div className="text-sm font-semibold">Install Disc Golf Journey</div>
        <p className="mt-1 text-sm text-gray-700">
          Add this app to your home screen for a more app-like experience.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            onClick={async () => {
              if (!deferredPrompt) return
              await deferredPrompt.prompt()
              await deferredPrompt.userChoice
              setDeferredPrompt(null)
            }}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Not now
          </button>
        </div>
      </div>
    )
  }

  return null
}
