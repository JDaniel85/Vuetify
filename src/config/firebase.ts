import { initializeApp } from 'firebase/app'
import { getMessaging, onMessage, getToken } from 'firebase/messaging'

// Configuración de Firebase con tus credenciales
const firebaseConfig = {
  apiKey: 'AIzaSyBdzET4RSfQZZeS4jmvtVclr-05slJ9Bks',
  authDomain: 'productos-5138d.firebaseapp.com',
  projectId: 'productos-5138d',
  storageBucket: 'productos-5138d.appspot.com',
  messagingSenderId: '675160803547',
  appId: '1:675160803547:web:07aaa883993e335ccde4fe',
  databaseURL: 'https://productos-5138d-default-rtdb.firebaseio.com'
}

// Inicializar Firebase
export const app = initializeApp(firebaseConfig)

// Inicializar Cloud Messaging
let messaging: any = null

// Registrar el Service Worker
const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      })
      console.log('✅ Service Worker registrado:', registration)
      return registration
    }
  } catch (error) {
    console.error('❌ Error registrando Service Worker:', error)
  }
}

export const initializeMessaging = () => {
  try {
    // Registrar el Service Worker primero
    registerServiceWorker()
    
    // Firebase Messaging necesita el SW para recibir mensajes en background
    messaging = getMessaging(app)
    console.log('✅ Firebase Messaging inicializado correctamente')
    return messaging
  } catch (error) {
    console.error('❌ Error inicializando Firebase Messaging:', error)
    return null
  }
}

export const getMessagingInstance = () => messaging

// Función para solicitar permiso y obtener token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    console.log('🔔 Solicitando permiso de notificaciones...')
    
    // Verificar que el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.error('❌ Este navegador no soporta notificaciones')
      return null
    }

    // Solicitar permiso al usuario
    const permission = await Notification.requestPermission()
    console.log('📋 Respuesta de usuario:', permission)
    
    if (permission === 'granted') {
      console.log('✅ Permiso de notificaciones concedido')
      
      // Pequeño delay para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const messaging = getMessagingInstance()
      if (!messaging) {
        console.error('❌ Firebase Messaging no está disponible')
        return null
      }

      // Obtener el token FCM
      console.log('🔑 Obteniendo token FCM...')
      const token = await getToken(messaging, {
        vapidKey: 'BNl_WE6MA5t2GwDNx3lcYwJ0vo8LtVxTAnwEVI4PTDCv3qjxPKGHEz9joMNSTj1nyfGnu44kbMcj3FTDnj97Dr4'
      })
      
      if (token) {
        console.log('✅ Token FCM obtenido correctamente')
        console.log('📝 Token:', token.substring(0, 50) + '...')
        
        // Guardar el token (enviar al servidor)
        await saveFCMToken(token)
        return token
      } else {
        console.error('❌ No se obtuvo token FCM')
      }
    } else if (permission === 'denied') {
      console.warn('⚠️ El usuario rechazó las notificaciones')
    } else {
      console.warn('⚠️ Permiso cerrado sin seleccionar opción')
    }
    
    return null
  } catch (error) {
    console.error('❌ Error solicitando permiso de notificaciones:', error)
    return null
  }
}

// Función para guardar el token en el servidor
export const saveFCMToken = async (token: string) => {
  try {
    console.log('📤 Enviando token al servidor...')
    
    const authToken = localStorage.getItem('token')
    console.log('🔐 Token de autenticación:', authToken ? 'Presente' : 'Ausente')

    // Detectar nombre del dispositivo a partir del User-Agent
    const ua = navigator.userAgent
    let deviceName = 'Unknown Device'
    if (ua.includes('Windows')) deviceName = 'Windows'
    else if (ua.includes('Mac')) deviceName = 'MacOS'
    else if (ua.includes('Android')) deviceName = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) deviceName = 'iOS'
    else if (ua.includes('Linux')) deviceName = 'Linux'

    const response = await fetch('/api/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken || ''}`
      },
      body: JSON.stringify({ 
        fcm_token: token,
        device_name: deviceName
      })
    })
    
    console.log('📊 Status de respuesta:', response.status)

    // Manejar respuesta
    if (!response.ok) {
      const text = await response.text()
      console.error('❌ Error al guardar token. Status:', response.status)
      console.error('📄 Respuesta:', text)
      return false
    }

    // Intentar parsear JSON si hay contenido
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('✅ Token FCM guardado en el servidor exitosamente')
      console.log('📨 Respuesta:', data)
      
      // Disparar evento para notificar que el token fue guardado
      window.dispatchEvent(new CustomEvent('fcmTokenSaved', { detail: token }))
      return true
    } else {
      console.log('✅ Token FCM guardado en el servidor (sin respuesta JSON)')
      
      // Disparar evento
      window.dispatchEvent(new CustomEvent('fcmTokenSaved', { detail: token }))
      return true
    }
  } catch (error) {
    console.error('❌ Error de red al guardar FCM token:', error)
    return false
  }
}

// Manejar mensajes cuando la aplicación está en primer plano
export const setupMessageListener = () => {
  const messaging = getMessagingInstance()
  
  if (!messaging) {
    console.error('Firebase Messaging no está inicializado')
    return
  }

  onMessage(messaging, (payload) => {
    console.log('📨 Mensaje recibido en primer plano:', payload)
    
    // Extraer datos de la notificación
    const title = payload.notification?.title || 
                  payload.data?.title || 
                  'Nueva notificación'
    const body = payload.notification?.body || 
                 payload.data?.body || 
                 'Tienes un nuevo mensaje'
    const image = payload.notification?.image || 
                  payload.data?.image

    const notificationOptions: NotificationOptions = {
      body: body,
      icon: image || '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: 'fcm-notification',
      requireInteraction: true,
      data: payload.data
    }

    console.log('🔔 Mostrando notificación:', { title, body })

    // Mostrar la notificación
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, notificationOptions)
          .then(() => {
            console.log('✅ Notificación mostrada en primer plano')
          })
          .catch((error) => {
            console.error('❌ Error mostrando notificación:', error)
          })
      })
    } else {
      // Fallback: usar Notification API directamente
      try {
        new Notification(title, notificationOptions)
        console.log('✅ Notificación mostrada (Fallback)')
      } catch (error) {
        console.error('❌ Error con Notification API:', error)
      }
    }
  })

  console.log('✅ Listener de mensajes configurado')
}
