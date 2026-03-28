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
    Banner de notificaciones push FCM
    Se muestra después de instalar la PWA para solicitar
    permiso de notificaciones.
    ====================================================== -->
  <v-snackbar
    v-model="showNotificationBanner"
    :timeout="-1"
    location="bottom"
    :color="notificationsEnabled ? 'success' : 'success'"
    elevation="8"
    rounded="lg"
    max-width="480"
    class="notification-banner"
  >
    <div class="d-flex align-center ga-3">
      <v-avatar size="40" color="white">
        <v-icon :color="notificationsEnabled ? 'success' : 'warning'">
          {{ notificationsEnabled ? 'mdi-bell-check' : 'mdi-bell' }}
        </v-icon>
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-2 font-weight-bold text-white">
          {{ notificationsEnabled ? 'Notificaciones Activas' : 'Activa Notificaciones' }}
        </div>
        <div class="text-caption text-green-lighten-3">
          {{ notificationsEnabled ? 'Recibirás alertas en tiempo real' : 'Recibe alertas importantes en tiempo real' }}
        </div>
      </div>
    </div>

    <template #actions>
      <v-btn
        v-if="!notificationsEnabled"
        variant="tonal"
        color="white"
        size="small"
        class="mr-1"
        :loading="loadingNotifications"
        @click="handleEnableNotifications"
      >
        <v-icon start>mdi-bell-ring</v-icon>
        Activar
      </v-btn>
      <v-btn
        variant="text"
        color="white"
        size="small"
        icon="mdi-close"
        @click="dismissNotificationBanner"
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
import { ref, watch, onMounted } from 'vue'
import { usePWA } from '@/composables/usePWA'
import { 
  initializeMessaging, 
  requestNotificationPermission, 
  setupMessageListener 
} from '@/config/firebase'

const { isInstallable, isOnline, installPWA } = usePWA()

// Controla la visibilidad del banner de instalación
const showBanner = ref(false)
// Controla si el usuario lo descartó manualmente (evita que vuelva a aparecer esta sesión)
const dismissed = ref(false)

// Banner de notificaciones
const showNotificationBanner = ref(false)
const notificationsEnabled = ref(false)
const loadingNotifications = ref(false)

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
  
  // Mostrar banner de notificaciones después de instalar
  setTimeout(() => {
    showNotificationBanner.value = true
  }, 2000)
}

// Mostrar banner de notificaciones si la PWA ya está instalada
function checkAndShowNotificationBanner() {
  console.log('🔍 Verificando estado de notificaciones...')
  console.log('  - Notification.permission:', Notification.permission)
  
  // Si rechazó notificaciones, no mostrar banner
  if (Notification.permission === 'denied') {
    console.log('❌ Notificaciones rechazadas por el usuario')
    return
  }
  
  // Siempre mostrar el banner para que el usuario pueda activar/confirmar
  console.log('📱 Mostrando banner de notificaciones...')
  setTimeout(() => {
    showNotificationBanner.value = true
    console.log('✅ Banner visible')
  }, 800)
}

function dismissBanner() {
  showBanner.value = false
  dismissed.value = true
}

async function handleEnableNotifications() {
  loadingNotifications.value = true
  try {
    const token = await requestNotificationPermission()
    if (token) {
      notificationsEnabled.value = true
      console.log('✅ Notificaciones activadas correctamente')
      // Cambiar el banner para mostrar que está activado
      setTimeout(() => {
        console.log('ℹ️ Banner actualizado con estado "Activas"')
      }, 500)
    }
  } catch (error) {
    console.error('Error al activar notificaciones:', error)
  } finally {
    loadingNotifications.value = false
  }
}

function dismissNotificationBanner() {
  showNotificationBanner.value = false
  console.log('❌ Banner de notificaciones cerrado por el usuario')
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

// Inicializar Firebase Messaging cuando el componente se monta
onMounted(async () => {
  try {
    console.log('🔄 Iniciando setup de FCM...')
    
    // Asegurarse de que el Service Worker disponible
    // Firebase lo registrará automáticamente cuando sea necesario
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Workers soportados')
    } else {
      console.warn('⚠️ Service Workers no soportados en este navegador')
    }

    // Inicializar Firebase Messaging
    const messaging = initializeMessaging()
    if (!messaging) {
      console.error('❌ Firebase Messaging no se inicializó')
      // IMPORTANTE: Aun así verificar el banner de notificaciones
      checkAndShowNotificationBanner()
      return
    }
    
    // Configurar el listener para mensajes en primer plano
    setupMessageListener()
    console.log('✅ Listener de mensajes configurado')

    // Verificar si la PWA ya está instalada y mostrar banner de notificaciones
    // Esto mostrará el botón de activación incluso si el permiso ya fue otorgado
    checkAndShowNotificationBanner()

  } catch (error) {
    console.error('❌ Error inicializando FCM:', error)
    // IMPORTANTE: Aun así intentar mostrar el banner
    checkAndShowNotificationBanner()
  }
})
</script>

<style scoped>
.pwa-install-banner {
  z-index: 9999 !important;
}

.notification-banner {
  z-index: 9998 !important;
}
</style>
