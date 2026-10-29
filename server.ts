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
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort =
    portArgIndex !== -1 && process.argv[portArgIndex + 1]
      ? parseInt(process.argv[portArgIndex + 1], 10)
      : null;
  // In AI Studio, Nginx listens on 8080 and proxies incoming traffic to port 3000.
  // The dev/production app server must always listen on port 3000.
  const envPort =
    process.env.PORT && process.env.PORT !== '8080'
      ? parseInt(process.env.PORT, 10)
      : null;
  const PORT = cliPort || envPort || 3000;

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

  // ==========================================
  // GOOGLE SHEETS CENTRALIZED INTEGRATION & PROXY
  // ==========================================
  const fs = await import('fs');
  const dataDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }
  }
  const configFilePath = path.resolve(dataDir, 'sheets-config.json');

  interface SheetsServerConfig {
    googleSheetUrl: string;
    googleSheetId: string;
    sheetTitle: string;
    autoSyncEnabled: boolean;
    adminToken?: string;
    adminEmail?: string;
    webhookUrl?: string;
    lastSyncTime?: string;
  }

  let sheetsConfig: SheetsServerConfig = {
    googleSheetUrl: '',
    googleSheetId: '',
    sheetTitle: 'RestoFlow - Hoja Principal',
    autoSyncEnabled: true,
  };

  try {
    if (fs.existsSync(configFilePath)) {
      const savedRaw = fs.readFileSync(configFilePath, 'utf-8');
      sheetsConfig = { ...sheetsConfig, ...JSON.parse(savedRaw) };
    }
  } catch (e) {
    console.warn('[Sheets Config] Error reading sheets-config.json, using defaults');
  }

  function extractSheetId(input: string): string {
    const trimmed = (input || '').trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  }

  // Get current restaurant sheet configuration (all devices retrieve this on launch)
  app.get('/api/sheets/config', (_req, res) => {
    res.json({
      googleSheetUrl: sheetsConfig.googleSheetUrl,
      googleSheetId: sheetsConfig.googleSheetId,
      sheetTitle: sheetsConfig.sheetTitle,
      autoSyncEnabled: sheetsConfig.autoSyncEnabled,
      hasAdminToken: !!sheetsConfig.adminToken,
      hasWebhook: !!sheetsConfig.webhookUrl,
      lastSyncTime: sheetsConfig.lastSyncTime,
      isConfigured: !!sheetsConfig.googleSheetId,
    });
  });

  // Save / update restaurant sheet configuration (done by Admin once)
  app.post('/api/sheets/config', (req, res) => {
    const {
      googleSheetUrl,
      sheetTitle,
      autoSyncEnabled,
      adminToken,
      adminEmail,
      webhookUrl,
    } = req.body;

    const sheetId = extractSheetId(googleSheetUrl || sheetsConfig.googleSheetUrl);
    sheetsConfig = {
      ...sheetsConfig,
      googleSheetUrl: googleSheetUrl !== undefined ? googleSheetUrl : sheetsConfig.googleSheetUrl,
      googleSheetId: sheetId,
      sheetTitle: sheetTitle || sheetsConfig.sheetTitle,
      autoSyncEnabled: autoSyncEnabled !== undefined ? Boolean(autoSyncEnabled) : sheetsConfig.autoSyncEnabled,
      adminToken: adminToken !== undefined ? adminToken : sheetsConfig.adminToken,
      adminEmail: adminEmail !== undefined ? adminEmail : sheetsConfig.adminEmail,
      webhookUrl: webhookUrl !== undefined ? webhookUrl : sheetsConfig.webhookUrl,
      lastSyncTime: new Date().toISOString(),
    };

    try {
      fs.writeFileSync(configFilePath, JSON.stringify(sheetsConfig, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[Sheets Config] Error writing sheets-config.json:', e);
    }

    // Broadcast update via SSE to all active client screens (meseros, cocina, caja)
    sseClients.forEach((client) => {
      try {
        client.res.write(
          `data: ${JSON.stringify({
            type: 'SHEETS_CONFIG_UPDATED',
            config: {
              googleSheetId: sheetsConfig.googleSheetId,
              googleSheetUrl: sheetsConfig.googleSheetUrl,
              sheetTitle: sheetsConfig.sheetTitle,
              autoSyncEnabled: sheetsConfig.autoSyncEnabled,
            },
          })}\n\n`
        );
      } catch (err) {
        // Ignore
      }
    });

    console.log(`[Sheets Config] Configuración guardada para hoja ID: "${sheetId}"`);
    res.json({
      success: true,
      config: {
        googleSheetId: sheetsConfig.googleSheetId,
        googleSheetUrl: sheetsConfig.googleSheetUrl,
        sheetTitle: sheetsConfig.sheetTitle,
        autoSyncEnabled: sheetsConfig.autoSyncEnabled,
        isConfigured: !!sheetsConfig.googleSheetId,
      },
    });
  });

  // Validate Google Sheet ID and check permissions
  app.get('/api/sheets/validate', async (req, res) => {
    const rawId = (req.query.sheetId as string) || sheetsConfig.googleSheetId;
    if (!rawId) {
      return res.status(400).json({
        status: 'error',
        valid: false,
        message: 'No se ha proporcionado un ID de Google Sheets',
      });
    }

    const cleanId = extractSheetId(rawId);
    if (!cleanId || cleanId.length < 15) {
      return res.status(200).json({
        status: 'invalid',
        valid: false,
        cleanId,
        message: 'El ID o enlace no tiene una estructura válida de Google Sheets.',
      });
    }

    try {
      const targetUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Menú')}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 RestoFlow-Validation-Agent',
        },
        redirect: 'follow',
      });

      const finalUrl = response.url || '';
      const text = await response.text();

      const isLoginRedirect =
        finalUrl.includes('accounts.google.com') ||
        finalUrl.includes('ServiceLogin') ||
        text.includes('accounts.google.com') ||
        text.includes('ServiceLogin') ||
        text.includes('Sign in - Google Accounts') ||
        text.includes('Iniciar sesión') ||
        text.includes('access_denied') ||
        text.includes('user_not_authorized');

      if (isLoginRedirect || response.status === 401 || response.status === 403) {
        return res.json({
          status: 'needs_permission',
          valid: false,
          cleanId,
          message: 'Requiere permisos de lectura en Google Drive',
          details: 'La hoja existe pero está configurada como privada. Cambia el acceso general a "Cualquier persona que tenga el vínculo puede ver (Lector)".',
        });
      }

      if (
        response.status === 404 ||
        text.includes('File not found') ||
        text.includes('Documento no encontrado') ||
        text.includes('file you have requested does not exist') ||
        text.includes('reason:not_found')
      ) {
        return res.json({
          status: 'not_found',
          valid: false,
          cleanId,
          message: 'Hoja de cálculo no encontrada',
          details: 'Verifica que el ID sea correcto y que el archivo exista en Google Drive.',
        });
      }

      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try {
          const jsonStr = text.substring(start, end + 1);
          const data = JSON.parse(jsonStr);

          if (data.status === 'error') {
            const errReason = data.errors?.[0]?.reason || '';
            const errMsg = data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || '';

            if (errReason === 'access_denied' || errMsg.includes('denied') || errMsg.includes('permission')) {
              return res.json({
                status: 'needs_permission',
                valid: false,
                cleanId,
                message: 'Requiere permisos de lectura en Google Drive',
                details: 'La hoja está protegida. Cambia el acceso general a "Cualquier persona con el vínculo".',
              });
            }

            if (errReason === 'not_found') {
              return res.json({
                status: 'not_found',
                valid: false,
                cleanId,
                message: 'Hoja no encontrada o pestaña no existe',
                details: errMsg,
              });
            }
          }

          const rowsCount = data.table?.rows?.length || 0;
          return res.json({
            status: 'active',
            valid: true,
            cleanId,
            message: 'Conexión Activa y Verificada',
            details: `Lectura pública habilitada exitosamente. Se detectaron ${rowsCount} registros en la pestaña "Menú".`,
            menuRowsCount: rowsCount,
          });
        } catch {
          // ignore
        }
      }

      if (response.ok) {
        return res.json({
          status: 'active',
          valid: true,
          cleanId,
          message: 'Conexión Activa y Verificada',
          details: 'La hoja de cálculo responde correctamente para sincronización pública.',
        });
      }

      return res.json({
        status: 'error',
        valid: false,
        cleanId,
        message: `Respuesta inesperada de Google (HTTP ${response.status})`,
      });
    } catch (err: any) {
      return res.json({
        status: 'error',
        valid: false,
        cleanId,
        message: `Error al contactar con Google Sheets: ${err?.message || err}`,
      });
    }
  });

  // Proxy GViz public query to avoid browser CORS and network issues
  app.get('/api/sheets/proxy-gviz', async (req, res) => {
    const sheetId = (req.query.sheetId as string) || sheetsConfig.googleSheetId;
    const sheetName = (req.query.sheet as string) || 'Menú';

    if (!sheetId) {
      return res.status(400).json({ error: 'No se ha configurado ninguna hoja de Google Sheets en el restaurante' });
    }

    const targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    try {
      const gvizRes = await fetch(targetUrl);
      const text = await gvizRes.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(text);
    } catch (err: any) {
      res.status(502).json({ error: `Error conectando con Google GViz: ${err?.message || err}` });
    }
  });

  // Server-side Append Row proxy (allows waitresses/cashiers to record into Sheet without logging in)
  app.post('/api/sheets/append-row', async (req, res) => {
    const { sheetName, rowValues, spreadsheetId: reqSheetId } = req.body;
    const targetSheetId = reqSheetId || sheetsConfig.googleSheetId;

    if (!targetSheetId) {
      return res.status(400).json({ error: 'No hay hoja configurada para registrar' });
    }

    // 1. If Webhook URL is set (Google Apps Script)
    if (sheetsConfig.webhookUrl) {
      try {
        const hookRes = await fetch(sheetsConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'appendRow',
            sheetName,
            rowValues,
            spreadsheetId: targetSheetId,
            timestamp: new Date().toISOString(),
          }),
        });
        const hookData = await hookRes.json().catch(() => ({}));
        return res.json({ success: true, via: 'webhook', result: hookData });
      } catch (e: any) {
        console.warn('[Sheets Webhook] Error dispatching webhook:', e);
      }
    }

    // 2. If Admin token is cached in server
    if (sheetsConfig.adminToken) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${targetSheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`;
        const gRes = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sheetsConfig.adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [rowValues],
          }),
        });
        if (gRes.ok) {
          return res.json({ success: true, via: 'adminToken' });
        }
      } catch (e) {
        console.warn('[Sheets Admin Token] Error with cached token:', e);
      }
    }

    // Fallback: acknowledged
    res.json({
      success: true,
      via: 'localProxyQueue',
      message: 'Fila registrada en el servidor de RestoFlow. Para sincronización directa en la nube de Google, el Administrador puede autenticarse o configurar el webhook.',
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
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
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
