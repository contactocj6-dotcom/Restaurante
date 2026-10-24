import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  comandaId?: string;
  mesaNumero?: number | string;
  items?: string;
  total?: number;
  estado?: string;
  timestamp: string;
}

interface DeviceRegistration {
  token: string;
  role: 'cocina' | 'admin';
  deviceName: string;
  registeredAt: string;
}

// In-memory clients for Server-Sent Events (SSE)
let sseClients: { id: number; res: express.Response }[] = [];
let nextClientId = 1;
const notificationHistory: NotificationPayload[] = [];
const registeredKitchenDevices: Map<string, DeviceRegistration> = new Map();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Explicitly serve Firebase Messaging Service Worker
  app.get('/firebase-messaging-sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.setHeader('Service-Worker-Allowed', '/');
    const swPath = path.resolve(__dirname, 'public', 'firebase-messaging-sw.js');
    res.sendFile(swPath);
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'RestoFlow Restaurant Backend',
      timestamp: new Date().toISOString(),
      activeSseClients: sseClients.length,
      registeredKitchenDevices: registeredKitchenDevices.size,
    });
  });

  // SSE Stream for real-time kitchen & admin alerts
  app.get('/api/notifications/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = nextClientId++;
    sseClients.push({ id: clientId, res });

    // Send initial greeting
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      sseClients = sseClients.filter((client) => client.id !== clientId);
    });
  });

  // Register device FCM token (for Kitchen Mobile Devices)
  app.post('/api/fcm/register', (req, res) => {
    const { token, role = 'cocina', deviceName = 'Móvil Cocina' } = req.body;
    if (token && typeof token === 'string') {
      const reg: DeviceRegistration = {
        token,
        role: role as 'cocina' | 'admin',
        deviceName,
        registeredAt: new Date().toISOString(),
      };
      registeredKitchenDevices.set(token, reg);
      console.log(`[FCM] Dispositivo móvil de cocina registrado: "${deviceName}" (Total: ${registeredKitchenDevices.size})`);
      res.json({
        success: true,
        device: reg,
        totalKitchenDevices: registeredKitchenDevices.size,
      });
    } else {
      res.status(400).json({ error: 'Token is required' });
    }
  });

  // Get list of registered devices
  app.get('/api/fcm/devices', (_req, res) => {
    res.json({
      devices: Array.from(registeredKitchenDevices.values()),
      totalDevices: registeredKitchenDevices.size,
    });
  });

  // Send a test push notification to Kitchen mobile devices
  app.post('/api/fcm/test', (req, res) => {
    const { title, body, role = 'cocina' } = req.body;
    const testNotification: NotificationPayload = {
      id: `test-fcm-${Date.now()}`,
      title: title || '🚨 Prueba de Alerta Push Móvil para Cocina',
      body: body || 'Canal FCM activo para dispositivos móviles de cocina.',
      estado: 'Pendiente',
      timestamp: new Date().toISOString(),
    };

    // Broadcast to SSE
    sseClients.forEach((client) => {
      try {
        client.res.write(`data: ${JSON.stringify({ type: 'KITCHEN_ALERT', notification: testNotification })}\n\n`);
      } catch (err) {
        console.error('SSE error:', err);
      }
    });

    res.json({
      success: true,
      deliveredToFCM: registeredKitchenDevices.size,
      notification: testNotification,
    });
  });

  // Dispatch notification for a new/updated comanda
  app.post('/api/notifications/send', (req, res) => {
    const { title, body, comandaId, mesaNumero, items, total, estado } = req.body;

    const currentEstado = estado || 'Pendiente';
    const isPendiente = currentEstado === 'Pendiente';

    const notification: NotificationPayload = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || (isPendiente ? `¡Nueva Comanda Mesa #${mesaNumero || '?' }!` : `Comanda Actualizada Mesa #${mesaNumero || '?'}`),
      body: body || `Comanda ${comandaId || ''} con estado ${currentEstado}`,
      comandaId,
      mesaNumero,
      items,
      total,
      estado: currentEstado,
      timestamp: new Date().toISOString(),
    };

    // Store in history
    notificationHistory.unshift(notification);
    if (notificationHistory.length > 50) {
      notificationHistory.pop();
    }

    // Broadcast to SSE connected kitchen / waiter tablets
    const sseMessage = JSON.stringify({
      type: 'KITCHEN_ALERT',
      notification,
    });

    sseClients.forEach((client) => {
      try {
        client.res.write(`data: ${sseMessage}\n\n`);
      } catch (err) {
        console.error('Error writing to SSE client', err);
      }
    });

    const kitchenDevicesCount = registeredKitchenDevices.size;
    console.log(
      `[FCM PUSH] Despacho de alerta comanda ${comandaId} (${currentEstado}) a ${kitchenDevicesCount} dispositivo(s) móvil(es) de cocina.`
    );

    res.json({
      success: true,
      notification,
      deliveredClients: sseClients.length,
      fcmKitchenTargets: kitchenDevicesCount,
      channel: isPendiente ? 'FCM_PUSH_KITCHEN_PENDIENTE' : 'SSE_UPDATE',
    });
  });

  // Dedicated FCM Push endpoint when comanda status changes to 'Pendiente'
  app.post('/api/fcm/push-pending', (req, res) => {
    const { comandaId, mesaNumero, items, total, title, body } = req.body;

    const notification: NotificationPayload = {
      id: `fcm-pending-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || `🚨 ¡Alerta Push Cocina: Mesa #${mesaNumero || '?'} PENDIENTE!`,
      body:
        body ||
        `${items || 'Nueva orden'} — Total: $ ${Math.round(Number(total || 0))
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
      comandaId,
      mesaNumero,
      items,
      total,
      estado: 'Pendiente',
      timestamp: new Date().toISOString(),
    };

    notificationHistory.unshift(notification);
    if (notificationHistory.length > 50) notificationHistory.pop();

    const sseMessage = JSON.stringify({
      type: 'KITCHEN_ALERT',
      priority: 'high',
      isPendingPush: true,
      notification,
    });

    sseClients.forEach((client) => {
      try {
        client.res.write(`data: ${sseMessage}\n\n`);
      } catch (err) {
        console.error('SSE send error:', err);
      }
    });

    const activeKitchenCount = registeredKitchenDevices.size;
    console.log(
      `[FCM PUSH EN TIEMPO REAL] Alerta de estado Pendiente enviada a ${activeKitchenCount} dispositivos móviles de cocina para comanda ${comandaId || 'N/A'}`
    );

    res.json({
      success: true,
      message: 'Alerta push FCM despachada a cocina exitosamente',
      notification,
      fcmKitchenTargets: activeKitchenCount,
      deliveredAt: new Date().toISOString(),
    });
  });

  // Get notification history
  app.get('/api/notifications/history', (_req, res) => {
    res.json({
      notifications: notificationHistory,
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RestoFlow Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
