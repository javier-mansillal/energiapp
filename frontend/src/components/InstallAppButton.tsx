import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() =>
    typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
  const [showInstructions, setShowInstructions] = useState(false)
  const [isIos] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))
  )

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
      setShowInstructions(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (installed) return null

  async function handleInstall() {
    if (!installPrompt) {
      setShowInstructions((visible) => !visible)
      return
    }

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
    } catch {
      setShowInstructions(true)
    } finally {
      setInstallPrompt(null)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        aria-expanded={showInstructions}
        aria-controls="install-app-instructions"
        className="rounded-full cursor-pointer gap-1.5"
      >
        <Download className="size-4" />
        <span>Instalar</span>
      </Button>
      {showInstructions && (
        <div
          id="install-app-instructions"
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-background p-3 text-sm text-foreground shadow-lg"
        >
          {isIos
            ? 'En Safari, toca Compartir y selecciona “Añadir a pantalla de inicio”.'
            : 'Abre el menú del navegador y selecciona “Instalar Energiapp” o “Añadir a pantalla de inicio”.'}
        </div>
      )}
    </div>
  )
}
