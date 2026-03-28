<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card title="Centro de Control - Firebase Cloud Messaging" class="mb-4">
          <v-card-text>
            <v-row>
              <!-- Sección: Información del Token -->
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1">
                    <v-icon start>mdi-key</v-icon>
                    Tu Token FCM
                  </v-card-title>
                  <v-card-text>
                    <div v-if="userToken" class="mt-2">
                      <p class="text-caption text-grey">Token registrado:</p>
                      <div class="token-display">
                        {{ userToken.substring(0, 50) }}...
                      </div>
                      <p class="text-caption text-grey mt-2">
                        Registrado: {{ formatDate(tokenCreatedAt) }}
                      </p>
                      <v-btn
                        size="small"
                        color="primary"
                        variant="outlined"
                        class="mt-3"
                        @click="copyToken"
                      >
                        <v-icon start>mdi-content-copy</v-icon>
                        Copiar Token
                      </v-btn>
                    </div>
                    <div v-else>
                      <v-alert type="warning" class="mt-2">
                        <v-icon start>mdi-alert</v-icon>
                        No tienes un token FCM registrado. Abre tu aplicación para activar notificaciones.
                      </v-alert>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Sección: Estado de Permisos -->
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1">
                    <v-icon start>mdi-bell</v-icon>
                    Estado de Notificaciones
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <template #prepend>
                          <v-icon :color="notificationStatus.icon">
                            {{ notificationStatus.icon === 'mdi-check-circle' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                          </v-icon>
                        </template>
                        <v-list-item-title>{{ notificationStatus.text }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Sección: Enviar Notificación de Prueba -->
            <v-divider class="my-4" />
            <v-row>
              <v-col cols="12">
                <h3 class="text-subtitle-1 mb-3">📨 Enviar Notificación de Prueba</h3>
                <v-form @submit.prevent="sendTestNotification">
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="testForm.title"
                        label="Título"
                        placeholder="Ej: Nueva alerta"
                        outlined
                        dense
                        required
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="testForm.body"
                        label="Mensaje"
                        placeholder="Ej: Este es un mensaje de prueba"
                        outlined
                        dense
                        rows="3"
                        required
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-btn
                        color="success"
                        type="submit"
                        :loading="loadingTest"
                        block
                      >
                        <v-icon start>mdi-send</v-icon>
                        Enviar Notificación de Prueba
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-col>
            </v-row>

            <!-- Sección: Broadcast a Todos -->
            <v-divider class="my-4" />
            <v-row>
              <v-col cols="12">
                <h3 class="text-subtitle-1 mb-3">📢 Enviar Broadcast a Todos</h3>
                <v-alert type="info" class="mb-3">
                  <v-icon start>mdi-information</v-icon>
                  Envía un mensaje a todos los usuarios que han permitido notificaciones.
                </v-alert>
                <v-form @submit.prevent="sendBroadcast">
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="broadcastForm.title"
                        label="Título del Broadcast"
                        placeholder="Ej: Mantenimiento programado"
                        outlined
                        dense
                        required
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="broadcastForm.body"
                        label="Mensaje del Broadcast"
                        placeholder="Ej: Nuestro sistema estará en mantenimiento..."
                        outlined
                        dense
                        rows="3"
                        required
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="broadcastForm.topic"
                        label="Tema (Topic)"
                        placeholder="Ej: all, admin, users"
                        outlined
                        dense
                        hint="Deixa en blanco para usar 'all'"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-btn
                        color="warning"
                        type="submit"
                        :loading="loadingBroadcast"
                        block
                      >
                        <v-icon start>mdi-send-multiple</v-icon>
                        Enviar Broadcast
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar de resultados -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import axiosInstance from '@/config/axios'

// Estado reactivo
const userToken = ref('')
const tokenCreatedAt = ref(null)
const loadingTest = ref(false)
const loadingBroadcast = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Formularios
const testForm = ref({
  title: '',
  body: ''
})

const broadcastForm = ref({
  title: '',
  body: '',
  topic: ''
})

// Computed: Estado de notificaciones
const notificationStatus = computed(() => {
  const permission = Notification.permission
  
  if (permission === 'granted') {
    return {
      text: '✅ Notificaciones activadas',
      icon: 'mdi-check-circle',
      color: 'success'
    }
  } else if (permission === 'denied') {
    return {
      text: '❌ Notificaciones rechazadas por el usuario',
      icon: 'mdi-alert-circle',
      color: 'error'
    }
  } else {
    return {
      text: '⚠️ Sin permisos definidos',
      icon: 'mdi-alert-circle',
      color: 'warning'
    }
  }
})

// Cargar token del usuario
const loadUserToken = async () => {
  try {
    const response = await axiosInstance.get('/fcm-tokens')

    if (response.data.tokens && response.data.tokens.length > 0) {
      const token = response.data.tokens[0]
      userToken.value = token.token
      tokenCreatedAt.value = token.created_at
      console.log('✅ Token cargado desde el servidor')
    }
  } catch (error) {
    console.error('Error cargando token:', error)
  }
}

// Copiar token al portapapeles
const copyToken = () => {
  if (userToken.value) {
    navigator.clipboard.writeText(userToken.value)
    showMessage('✅ Token copiado al portapapeles', 'success')
  }
}

// Enviar notificación de prueba
const sendTestNotification = async () => {
  if (!testForm.value.title || !testForm.value.body) {
    showMessage('❌ Por favor completa todos los campos', 'error')
    return
  }

  loadingTest.value = true
  try {
    const response = await axiosInstance.post('/notifications/test', {
      title: testForm.value.title,
      body: testForm.value.body
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.data.success) {
      showMessage('✅ Notificación enviada correctamente', 'success')
      testForm.value = { title: '', body: '' }
    } else {
      showMessage(`❌ ${response.data.message}`, 'error')
    }
  } catch (error: any) {
    showMessage(`❌ Error: ${error.response?.data?.message || error.message}`, 'error')
  } finally {
    loadingTest.value = false
  }
}

// Enviar broadcast
const sendBroadcast = async () => {
  if (!broadcastForm.value.title || !broadcastForm.value.body) {
    showMessage('❌ Por favor completa todos los campos', 'error')
    return
  }

  loadingBroadcast.value = true
  try {
    const response = await axiosInstance.post('/notifications/broadcast', {
      title: broadcastForm.value.title,
      body: broadcastForm.value.body,
      topic: broadcastForm.value.topic || 'all'
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.data.success) {
      showMessage('✅ Broadcast enviado a todos los usuarios', 'success')
      broadcastForm.value = { title: '', body: '', topic: '' }
    } else {
      showMessage(`❌ ${response.data.message}`, 'error')
    }
  } catch (error: any) {
    showMessage(`❌ Error: ${error.response?.data?.message || error.message}`, 'error')
  } finally {
    loadingBroadcast.value = false
  }
}

// Mostrar mensaje
const showMessage = (message: string, color: string = 'info') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// Formatear fecha
const formatDate = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('es-ES')
}

// Montar componente
onMounted(() => {
  loadUserToken()
  
  // Escuchar el evento de token FCM guardado
  window.addEventListener('fcmTokenSaved', () => {
    console.log('🔄 Token FCM guardado detectado, recargando...')
    // Esperar un poco para que se guarde en BD
    setTimeout(() => {
      loadUserToken()
    }, 1500)
  })
})
</script>

<style scoped>
.token-display {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}
</style>
