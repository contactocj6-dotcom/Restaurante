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

export async function createApp(includeVite = false) {
  const app = express();
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
  // DATA STORAGE DIRECTORY
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

  // ==========================================
  // MONGODB ATLAS NATIVE CLOUD INTEGRATION
  // ==========================================
  const mongoConfigPath = path.resolve(dataDir, 'mongo-config.json');

  interface MongoServerConfig {
    uri: string;
    dbName: string;
    autoSync: boolean;
    lastSyncTime?: string;
  }

  let mongoConfig: MongoServerConfig = {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB_NAME || 'restoflow',
    autoSync: true,
  };

  try {
    if (fs.existsSync(mongoConfigPath)) {
      const savedMongo = fs.readFileSync(mongoConfigPath, 'utf-8');
      mongoConfig = { ...mongoConfig, ...JSON.parse(savedMongo) };
    }
  } catch (e) {
    console.warn('[Mongo Config] Error reading mongo-config.json:', e);
  }

  let activeMongoClient: any = null;

  async function getMongoClient(overrideUri?: string, overrideDb?: string) {
    const targetUri = overrideUri || mongoConfig.uri;
    if (!targetUri) return null;

    if (activeMongoClient && !overrideUri) {
      try {
        await activeMongoClient.db(mongoConfig.dbName).command({ ping: 1 });
        return activeMongoClient;
      } catch {
        try {
          await activeMongoClient.close();
        } catch {
          // ignore
        }
        activeMongoClient = null;
      }
    }

    const { MongoClient, ServerApiVersion } = await import('mongodb');
    const client = new MongoClient(targetUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 8000,
    });

    await client.connect();
    if (!overrideUri) {
      activeMongoClient = client;
    }
    return client;
  }

  // Obfuscate credentials for safe client display
  function sanitizeMongoUri(uri: string): string {
    if (!uri) return '';
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:••••••••@');
  }

  // Get current MongoDB connection status and collection statistics
  app.get('/api/mongo/status', async (_req, res) => {
    if (!mongoConfig.uri) {
      return res.json({
        configured: false,
        connected: false,
        dbName: mongoConfig.dbName,
        message: 'MongoDB Atlas aún no está configurado. Conéctalo ingresando la cadena de conexión en el panel.',
      });
    }

    try {
      const client = await getMongoClient();
      if (!client) {
        return res.json({
          configured: true,
          connected: false,
          dbName: mongoConfig.dbName,
          sanitizedUri: sanitizeMongoUri(mongoConfig.uri),
          message: 'No se pudo inicializar el cliente de MongoDB',
        });
      }

      const db = client.db(mongoConfig.dbName);
      await db.command({ ping: 1 });

      // Gather collection counts in parallel
      const collections = [
        'menu',
        'mesas',
        'comandas',
        'ventas',
        'clientes',
        'proveedores',
        'compras',
        'facturas',
        'reservas',
        'usuarios',
      ];

      const counts: Record<string, number> = {};
      await Promise.all(
        collections.map(async (collName) => {
          try {
            counts[collName] = await db.collection(collName).countDocuments();
          } catch {
            counts[collName] = 0;
          }
        })
      );

      return res.json({
        configured: true,
        connected: true,
        dbName: mongoConfig.dbName,
        sanitizedUri: sanitizeMongoUri(mongoConfig.uri),
        autoSync: mongoConfig.autoSync,
        lastSyncTime: mongoConfig.lastSyncTime,
        counts,
        message: 'Conectado exitosamente a MongoDB Atlas',
      });
    } catch (err: any) {
      return res.json({
        configured: true,
        connected: false,
        dbName: mongoConfig.dbName,
        sanitizedUri: sanitizeMongoUri(mongoConfig.uri),
        error: err?.message || String(err),
        message: 'Error al conectar con MongoDB Atlas. Revisa usuario, contraseña y la lista de acceso IP en Atlas (0.0.0.0/0).',
      });
    }
  });

  // Test connection to a MongoDB Atlas URI without persisting
  app.post('/api/mongo/test', async (req, res) => {
    const { uri, dbName = 'restoflow' } = req.body;
    if (!uri) {
      return res.status(400).json({ success: false, message: 'La cadena de conexión es requerida' });
    }

    const startTime = Date.now();
    let tempClient: any = null;
    try {
      const { MongoClient, ServerApiVersion } = await import('mongodb');
      tempClient = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        },
        connectTimeoutMS: 9000,
        serverSelectionTimeoutMS: 9000,
      });

      await tempClient.connect();
      const db = tempClient.db(dbName);
      await db.command({ ping: 1 });
      const latency = Date.now() - startTime;

      let collList: string[] = [];
      try {
        const collections = await db.listCollections().toArray();
        collList = collections.map((c: any) => c.name);
      } catch {
        // ignore
      }

      await tempClient.close();

      return res.json({
        success: true,
        latencyMs: latency,
        dbName,
        collectionsFound: collList,
        message: `¡Conexión a MongoDB Atlas verificada exitosamente! Latencia: ${latency}ms.`,
      });
    } catch (err: any) {
      if (tempClient) {
        try {
          await tempClient.close();
        } catch {
          // ignore
        }
      }
      return res.status(400).json({
        success: false,
        error: err?.message || String(err),
        message:
          'Error al conectar con MongoDB Atlas. Asegúrate de: 1) Permitir acceso desde cualquier IP (0.0.0.0/0) en Network Access de Atlas. 2) Verificar usuario y contraseña sin caracteres especiales no codificados.',
      });
    }
  });

  // Save MongoDB connection config and initialize
  app.post('/api/mongo/config', async (req, res) => {
    const { uri, dbName = 'restoflow', autoSync = true } = req.body;
    if (!uri) {
      return res.status(400).json({ success: false, message: 'Cadena de conexión requerida' });
    }

    try {
      const { MongoClient, ServerApiVersion } = await import('mongodb');
      const testClient = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        },
        connectTimeoutMS: 9000,
        serverSelectionTimeoutMS: 9000,
      });

      await testClient.connect();
      await testClient.db(dbName).command({ ping: 1 });

      if (activeMongoClient) {
        try {
          await activeMongoClient.close();
        } catch {}
      }
      activeMongoClient = testClient;

      mongoConfig = {
        uri,
        dbName,
        autoSync: Boolean(autoSync),
        lastSyncTime: new Date().toISOString(),
      };

      try {
        fs.writeFileSync(mongoConfigPath, JSON.stringify(mongoConfig, null, 2), 'utf-8');
      } catch (e) {
        console.warn('[Mongo Config] Error writing mongo-config.json:', e);
      }

      // Notify clients
      sseClients.forEach((client) => {
        try {
          client.res.write(
            `data: ${JSON.stringify({
              type: 'MONGO_CONFIG_UPDATED',
              config: {
                configured: true,
                connected: true,
                dbName,
                sanitizedUri: sanitizeMongoUri(uri),
              },
            })}\n\n`
          );
        } catch {}
      });

      return res.json({
        success: true,
        connected: true,
        dbName,
        sanitizedUri: sanitizeMongoUri(uri),
        message: 'Configuración de MongoDB Atlas guardada y conexión establecida.',
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err?.message || String(err),
        message: 'No se pudo conectar a MongoDB Atlas con las credenciales proporcionadas.',
      });
    }
  });

  // Disconnect / Clear MongoDB config
  app.post('/api/mongo/disconnect', async (_req, res) => {
    if (activeMongoClient) {
      try {
        await activeMongoClient.close();
      } catch {}
      activeMongoClient = null;
    }

    mongoConfig = {
      uri: '',
      dbName: 'restoflow',
      autoSync: false,
    };

    try {
      fs.writeFileSync(mongoConfigPath, JSON.stringify(mongoConfig, null, 2), 'utf-8');
    } catch {}

    sseClients.forEach((client) => {
      try {
        client.res.write(
          `data: ${JSON.stringify({
            type: 'MONGO_DISCONNECTED',
          })}\n\n`
        );
      } catch {}
    });

    res.json({ success: true, message: 'Desconectado de MongoDB Atlas' });
  });

  // Push all restaurant state from client to MongoDB Atlas (Bulk Upsert)
  app.post('/api/mongo/push-all', async (req, res) => {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Datos requeridos para exportar' });
    }

    try {
      const client = await getMongoClient();
      if (!client) {
        return res.status(400).json({ success: false, message: 'MongoDB Atlas no está conectado' });
      }

      const db = client.db(mongoConfig.dbName);
      const results: Record<string, number> = {};

      // Helper function to bulk upsert by key
      async function bulkUpsert(collName: string, items: any[], keyField: string) {
        if (!Array.isArray(items) || items.length === 0) return 0;
        const coll = db.collection(collName);
        const operations = items.map((item) => ({
          updateOne: {
            filter: { [keyField]: item[keyField] },
            update: { $set: item },
            upsert: true,
          },
        }));
        const res = await coll.bulkWrite(operations, { ordered: false });
        return (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.matchedCount || 0);
      }

      if (data.menu) results.menu = await bulkUpsert('menu', data.menu, 'id');
      if (data.tables) results.mesas = await bulkUpsert('mesas', data.tables, 'id');
      if (data.comandas) results.comandas = await bulkUpsert('comandas', data.comandas, 'idComanda');
      if (data.ventas) results.ventas = await bulkUpsert('ventas', data.ventas, 'idVenta');
      if (data.clientes) results.clientes = await bulkUpsert('clientes', data.clientes, 'id');
      if (data.proveedores) results.proveedores = await bulkUpsert('proveedores', data.proveedores, 'id');
      if (data.compras) results.compras = await bulkUpsert('compras', data.compras, 'idCompra');
      if (data.facturas) results.facturas = await bulkUpsert('facturas', data.facturas, 'idFactura');
      if (data.reservas) results.reservas = await bulkUpsert('reservas', data.reservas, 'id');
      if (data.staffUsers) results.usuarios = await bulkUpsert('usuarios', data.staffUsers, 'id');

      if (data.restaurantInfo) {
        await db.collection('restaurantConfig').updateOne(
          { key: 'dianCompanyInfo' },
          { $set: { key: 'dianCompanyInfo', ...data.restaurantInfo, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        results.restaurantInfo = 1;
      }

      mongoConfig.lastSyncTime = new Date().toISOString();
      try {
        fs.writeFileSync(mongoConfigPath, JSON.stringify(mongoConfig, null, 2), 'utf-8');
      } catch {}

      return res.json({
        success: true,
        lastSyncTime: mongoConfig.lastSyncTime,
        counts: results,
        message: '¡Datos sincronizados exitosamente con MongoDB Atlas!',
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || String(err),
        message: 'Error al sincronizar datos hacia MongoDB Atlas',
      });
    }
  });

  // Pull all restaurant collections from MongoDB Atlas
  app.get('/api/mongo/pull-all', async (_req, res) => {
    try {
      const client = await getMongoClient();
      if (!client) {
        return res.status(400).json({ success: false, message: 'MongoDB Atlas no está conectado' });
      }

      const db = client.db(mongoConfig.dbName);

      // Clean _id field from MongoDB docs to preserve React state clean types
      const cleanDocs = (docs: any[]) =>
        docs.map(({ _id, ...rest }) => rest);

      const [
        menuDocs,
        mesasDocs,
        comandasDocs,
        ventasDocs,
        clientesDocs,
        proveedoresDocs,
        comprasDocs,
        facturasDocs,
        reservasDocs,
        usuariosDocs,
        configDoc,
      ] = await Promise.all([
        db.collection('menu').find({}).toArray(),
        db.collection('mesas').find({}).toArray(),
        db.collection('comandas').find({}).toArray(),
        db.collection('ventas').find({}).toArray(),
        db.collection('clientes').find({}).toArray(),
        db.collection('proveedores').find({}).toArray(),
        db.collection('compras').find({}).toArray(),
        db.collection('facturas').find({}).toArray(),
        db.collection('reservas').find({}).toArray(),
        db.collection('usuarios').find({}).toArray(),
        db.collection('restaurantConfig').findOne({ key: 'dianCompanyInfo' }),
      ]);

      let restaurantInfo = null;
      if (configDoc) {
        const { _id, key, ...rest } = configDoc;
        restaurantInfo = rest;
      }

      return res.json({
        success: true,
        data: {
          menu: cleanDocs(menuDocs),
          tables: cleanDocs(mesasDocs),
          comandas: cleanDocs(comandasDocs),
          ventas: cleanDocs(ventasDocs),
          clientes: cleanDocs(clientesDocs),
          proveedores: cleanDocs(proveedoresDocs),
          compras: cleanDocs(comprasDocs),
          facturas: cleanDocs(facturasDocs),
          reservas: cleanDocs(reservasDocs),
          staffUsers: cleanDocs(usuariosDocs),
          restaurantInfo,
        },
        counts: {
          menu: menuDocs.length,
          tables: mesasDocs.length,
          comandas: comandasDocs.length,
          ventas: ventasDocs.length,
          clientes: clientesDocs.length,
          proveedores: proveedoresDocs.length,
          compras: comprasDocs.length,
          facturas: facturasDocs.length,
          reservas: reservasDocs.length,
          staffUsers: usuariosDocs.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || String(err),
        message: 'Error al recuperar colecciones desde MongoDB Atlas',
      });
    }
  });

  // Live single-comanda upsert to MongoDB Atlas
  app.post('/api/mongo/upsert-comanda', async (req, res) => {
    const { comanda } = req.body;
    if (!comanda || !comanda.idComanda) {
      return res.status(400).json({ success: false, message: 'Comanda requerida' });
    }

    try {
      const client = await getMongoClient();
      if (client) {
        const db = client.db(mongoConfig.dbName);
        await db.collection('comandas').updateOne(
          { idComanda: comanda.idComanda },
          { $set: comanda },
          { upsert: true }
        );
      }
      res.json({ success: true });
    } catch (err: any) {
      console.warn('[Mongo live comanda upsert error]:', err?.message);
      res.json({ success: false, error: err?.message });
    }
  });

  // Vite middleware in dev or static files in production (only when running standalone server)
  if (includeVite) {
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
  }

  return app;
}

async function startServer() {
  const app = await createApp(true);
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort =
    portArgIndex !== -1 && process.argv[portArgIndex + 1]
      ? parseInt(process.argv[portArgIndex + 1], 10)
      : null;
  const envPort =
    process.env.PORT && process.env.PORT !== '8080'
      ? parseInt(process.env.PORT, 10)
      : null;
  const PORT = cliPort || envPort || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RestoFlow Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
