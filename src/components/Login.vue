<template>
  <div class="login-page">
    <v-card class="login-card" elevation="2">

      <!-- Encabezado -->
      <div class="card-header">
        <v-avatar color="#dce5ff" size="64" class="mb-4">
          <v-icon size="38" color="#3b5bdb">mdi-account-circle</v-icon>
        </v-avatar>
        <h1 class="header-title">Iniciar Sesión</h1>
        <p class="header-subtitle">¡Bienvenido!</p>
        <p class="header-subtitle">Por favor ingresa los siguientes datos</p>
      </div>

      <v-divider></v-divider>

      <!-- Formulario -->
      <div class="card-body">

        <!-- Alerta de sin conexión -->
        <v-alert
          v-if="!isOnline"
          type="warning"
          variant="tonal"
          prominent
          class="mb-4"
          icon="mdi-wifi-off"
        >
          <v-alert-title class="text-subtitle-2 font-weight-bold">Sin conexión a internet</v-alert-title>
          No es posible conectarse al servidor. La vista de inicio de sesión está disponible,
          pero no podrás autenticarte hasta que se restablezca la conexión.
        </v-alert>

        <v-form validate-on="submit lazy" @submit.prevent="submit">

          <v-text-field
            v-model="userName"
            :rules="userNameRules"
            label="Correo electrónico"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            color="#3b5bdb"
            class="custom-field"
            hide-details="auto"
          ></v-text-field>

          <v-text-field
            v-model="password"
            :rules="passwordRules"
            label="Contraseña"
            type="password"
            prepend-inner-icon="mdi-lock-outline"
            variant="outlined"
            density="comfortable"
            color="#3b5bdb"
            class="custom-field mt-4"
            hide-details="auto"
          ></v-text-field>

          <v-btn
            :loading="loading"
            :disabled="!isOnline"
            type="submit"
            block
            size="large"
            variant="flat"
            class="submit-btn mt-5"
          >
            <v-icon v-if="!isOnline" start>mdi-wifi-off</v-icon>
            {{ isOnline ? 'Continuar' : 'Sin conexión' }}
          </v-btn>

          <!-- Alertas de éxito / error (del código 2 original) -->
          <div class="mt-4">
            <v-slide-y-transition group>
              <v-alert
                v-if="successMessage"
                key="success"
                type="success"
                variant="tonal"
                class="mb-2"
                closable
                @click:close="successMessage = ''"
              >
                {{ successMessage }}
              </v-alert>
              <v-alert
                v-if="errorMessage"
                key="error"
                type="error"
                variant="tonal"
                class="mb-2"
                closable
                @click:close="errorMessage = ''"
              >
                {{ errorMessage }}
              </v-alert>
            </v-slide-y-transition>
          </div>

        </v-form>
      </div>

    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePWA } from '@/composables/usePWA'

const { isOnline } = usePWA()

const userNameRules = [value => checkApi(value)]
const passwordRules = [
  value => !!value || 'Password is required.',
  value => (value && value.length >= 8) || 'Password must be at least 8 characters.',
  value => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter.',
  value => /[a-z]/.test(value) || 'Password must contain at least one lowercase letter.',
  value => /[0-9]/.test(value) || 'Password must contain at least one number.',
]

const loading = ref(false)
const userName = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')

async function submit(event) {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const results = await event

  if (!results.valid) {
    loading.value = false
    errorMessage.value = 'Por favor corrija los campos marcados para poder continuar.'
    return
  }

  // Verificar conexión antes de intentar el login
  if (!isOnline.value) {
    errorMessage.value = 'No hay conexión a internet. No es posible conectarse al servidor.'
    loading.value = false
    return
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: userName.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (data.acceso === "Ok") {
      successMessage.value = "¡Inicio de sesión exitoso!"
      localStorage.setItem("token", data.token)
      setTimeout(() => {
        router.push('/Products')
      }, 800)
    } else {
      errorMessage.value = data.error || 'Credenciales incorrectas.'
    }

  } catch (error) {
    if (!navigator.onLine) {
      errorMessage.value = 'No hay conexión a internet. No es posible conectarse al servidor.'
    } else {
      errorMessage.value = 'No se pudo conectar con el servidor. Intente de nuevo más tarde.'
    }
    console.error(error)
  }

  loading.value = false
}


let timeout = -1
async function checkApi(userName) {
  return new Promise(resolve => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      if (!userName) return resolve('Por favor ingresa tu correo.')
      return resolve(true)
    }, 500)
  })
}

const router = useRouter();
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  width: 100%;
  background: #eef2ff;
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 16px !important;
  overflow: hidden;
}

/* Encabezado */
.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 32px 28px;
  background: #3b5bdb;
  text-align: center;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.header-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  line-height: 1.5;
}

/* Cuerpo */
.card-body {
  padding: 28px 32px 32px;
  background: white;
}

.custom-field :deep(.v-field) {
  border-radius: 8px;
}

/* Botón */
.submit-btn {
  background: #3b5bdb !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 0.9rem !important;
  height: 48px !important;
  color: white !important;
  letter-spacing: 0.3px;
  box-shadow: 0 3px 10px rgba(59, 91, 219, 0.3) !important;
  transition: all 0.2s ease !important;
}

.submit-btn:hover {
  background: #3451c7 !important;
  box-shadow: 0 5px 16px rgba(59, 91, 219, 0.4) !important;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    margin: 16px;
  }

  .card-header,
  .card-body {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>