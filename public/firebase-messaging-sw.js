// Firebase Cloud Messaging Service Worker
console.log('📝 Service Worker inicializado')

// Manejar mensajes push en background
self.addEventListener('push', (event) => {
  console.log('📨 Mensaje Push recibido:', event.data)
  
  if (event.data) {
    let notificationData = {}
    try {
      notificationData = event.data.json()
      console.log('📦 Datos del mensaje:', notificationData)
    } catch (e) {
      console.log('📄 Mensaje texto:', event.data.text())
    }

    const title = notificationData.notification?.title || 'Nueva Notificación'
    const options = {
      body: notificationData.notification?.body || 'Tienes un nuevo mensaje',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: 'fcm-notification',
      ...notificationData.notification
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  }
})

// Manejar click en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notificación clickeada:', event.notification.title)
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === '/' || client.url.includes('localhost:5174')) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Manejar cierre de notificación
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificación cerrada:', event.notification.title)
})
