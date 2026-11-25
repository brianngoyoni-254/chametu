import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // 1. Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    // 2. Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return // Don't show if already installed
    }

    // 3. Android/Chrome Listener
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // 4. iOS: Just show the banner after a delay if not installed
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-2xl border border-line bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-navy sm:left-auto sm:right-6 sm:w-96">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute right-3 top-3 text-ink-soft hover:text-navy"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest/10 text-forest">
          <Download size={20} />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-navy dark:text-white">Install Chametu</h3>
          <p className="mt-1 text-xs text-ink-soft dark:text-slate-400">
            {isIOS 
              ? "Tap the Share button and select 'Add to Home Screen' to install." 
              : "Install our app for quick access and a better experience."}
          </p>
          
          {isIOS ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-paper p-2 text-xs font-semibold text-navy">
              <Share size={14} /> Tap Share → Add to Home Screen
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="mt-3 rounded-lg bg-forest px-3 py-1.5 text-xs font-bold text-white transition hover:bg-forest/90"
            >
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  )
}