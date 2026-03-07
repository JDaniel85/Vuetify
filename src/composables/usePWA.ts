/**
 * usePWA.ts
 *
 * Composable que gestiona toda la lógica de la PWA:
 * - Detección del evento beforeinstallprompt para mostrar botón "Instalar"
 * - Ejecución del prompt de instalación nativo del navegador
 * - Estado de instalación (ya instalada vs. instalable)
 * - Estado de conexión online/offline
 * - Detección de modo standalone (app instalada corriendo fuera del navegador)
 */

import { ref, onMounted, onUnmounted } from 'vue'

// Tipo extendido para el evento beforeinstallprompt (no incluido en los tipos estándar)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

// Estado global compartido entre todos los componentes que usen este composable
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstallable = ref(false)
const isInstalled = ref(false)
const isOnline = ref(navigator.onLine)
const isStandalone = ref(
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true
)

export function usePWA() {
  /**
   * Manejador del evento beforeinstallprompt.
   * El navegador lo dispara cuando la PWA cumple los criterios de instalación.
   * Lo interceptamos (preventDefault) para controlar cuándo mostrar el prompt.
   */
  function handleBeforeInstallPrompt(e: Event) {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    isInstallable.value = true
  }

  /** Se dispara cuando el usuario completa la instalación */
  function handleAppInstalled() {
    isInstalled.value = true
    isInstallable.value = false
    deferredPrompt.value = null
  }

  function handleOnline() { isOnline.value = true }
  function handleOffline() { isOnline.value = false }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar si ya está corriendo en modo standalone
    isStandalone.value =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  /**
   * Muestra el diálogo nativo del navegador para instalar la PWA.
   * Solo funciona si el navegador disparó beforeinstallprompt previamente.
   */
  async function installPWA() {
    if (!deferredPrompt.value) return

    await deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      isInstalled.value = true
      isInstallable.value = false
    }
    deferredPrompt.value = null
  }

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isStandalone,
    installPWA,
  }
}
