// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyBrwHErhZOk4D8Ki4HRYmeI5kX49JtF1Dw",
  projectId: "gen-lang-client-0083219337",
  messagingSenderId: "779494736756",
  appId: "1:779494736756:web:83fb6b49428c0e3103a221"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje push en segundo plano recibido:', payload);

  const title = payload.notification?.title || payload.data?.title || '¡Nueva Comanda para Cocina!';
  const body = payload.notification?.body || payload.data?.body || 'Nueva orden con estado Pendiente';
  
  const notificationOptions = {
    body: body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 400], // vibration pattern for mobile alert
    tag: payload.data?.comandaId || 'cocina-comanda-pendiente',
    renotify: true,
    requireInteraction: true,
    data: {
      url: '/',
      comandaId: payload.data?.comandaId,
      estado: payload.data?.estado || 'Pendiente',
    },
    actions: [
      { action: 'open_kds', title: 'Ver en Cocina' }
    ]
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
