<template>
  <!-- ======================================================
    Banner de instalación PWA
    Se muestra automáticamente cuando el navegador detecta
    que la app cumple los criterios para instalarse.
    ====================================================== -->
  <v-snackbar
    v-model="showBanner"
    :timeout="-1"
    location="bottom"
    color="primary"
    elevation="8"
    rounded="lg"
    max-width="480"
    class="pwa-install-banner"
  >
    <div class="d-flex align-center ga-3">
      <v-avatar size="40" color="white">
        <v-img src="/pwa-64x64.png" alt="App icon" />
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-2 font-weight-bold text-white">
          Instalar Control de Almacen PWA
        </div>
        <div class="text-caption text-blue-lighten-3">
          Úsala sin conexión · Acceso rápido desde tu pantalla de inicio
        </div>
      </div>
    </div>

    <template #actions>
      <v-btn
        variant="tonal"
        color="white"
        size="small"
        class="mr-1"
        @click="handleInstall"
      >
        <v-icon start>mdi-download</v-icon>
        Instalar
      </v-btn>
      <v-btn
        variant="text"
        color="white"
        size="small"
        icon="mdi-close"
        @click="dismissBanner"
      />
    </template>
  </v-snackbar>

  <!-- ======================================================
    Indicador de estado offline
    Se muestra cuando el usuario pierde la conexión a internet.
    ====================================================== -->
  <v-snackbar
    v-model="showOfflineBanner"
    :timeout="-1"
    location="top"
    color="warning"
    elevation="8"
    rounded="lg"
  >
    <div class="d-flex align-center ga-2">
      <v-icon color="white">mdi-wifi-off</v-icon>
      <span class="text-white text-subtitle-2">Sin conexión — Modo offline activo</span>
    </div>
  </v-snackbar>

  <!-- Notificación cuando se vuelve a tener conexión -->
  <v-snackbar
    v-model="showOnlineBanner"
    :timeout="3000"
    location="top"
    color="success"
    elevation="8"
    rounded="lg"
  >
    <div class="d-flex align-center ga-2">
      <v-icon color="white">mdi-wifi</v-icon>
      <span class="text-white text-subtitle-2">Conexión restaurada</span>
    </div>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { usePWA } from '@/composables/usePWA'

const { isInstallable, isOnline, installPWA } = usePWA()

// Controla la visibilidad del banner de instalación
const showBanner = ref(false)
// Controla si el usuario lo descartó manualmente (evita que vuelva a aparecer esta sesión)
const dismissed = ref(false)

// Muestra el banner cuando la PWA es instalable (y no se descartó)
watch(isInstallable, (val) => {
  if (val && !dismissed.value) {
    // Pequeño delay para que la UI cargue primero
    setTimeout(() => { showBanner.value = true }, 1500)
  }
}, { immediate: true })

async function handleInstall() {
  showBanner.value = false
  await installPWA()
}

function dismissBanner() {
  showBanner.value = false
  dismissed.value = true
}

// Estado de conectividad
const showOfflineBanner = ref(false)
const showOnlineBanner = ref(false)
let wasOffline = false

watch(isOnline, (online) => {
  if (!online) {
    showOfflineBanner.value = true
    showOnlineBanner.value = false
    wasOffline = true
  } else {
    showOfflineBanner.value = false
    if (wasOffline) {
      showOnlineBanner.value = true
      wasOffline = false
    }
  }
})
</script>

<style scoped>
.pwa-install-banner {
  z-index: 9999 !important;
}
</style>
