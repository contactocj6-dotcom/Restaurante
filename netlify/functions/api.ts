import express from 'express';
import serverless from 'serverless-http';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json());

// In-memory data for notifications & FCM devices
let sseClients: { id: number; res: express.Response }[] = [];
let nextClientId = 1;
const notificationHistory: any[] = [];
const registeredKitchenDevices: Map<string, any> = new Map();

// Data directory for serverless environment (use /tmp if read-only)
const dataDir = (() => {
  try {
    const tmpDir = path.resolve('/tmp', 'restoflow-data');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  } catch {
    return process.cwd();
  }
})();

const mongoConfigPath = path.resolve(dataDir, 'mongo-config.json');

const DEFAULT_MONGODB_URI = process.env.MONGODB_URI || '';

let mongoConfig = {
  uri: DEFAULT_MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME || 'restoflow',
  autoSync: true,
  lastSyncTime: '',
};

try {
  if (fs.existsSync(mongoConfigPath)) {
    const savedMongo = fs.readFileSync(mongoConfigPath, 'utf-8');
    const parsed = JSON.parse(savedMongo);
    mongoConfig = {
      ...mongoConfig,
      ...parsed,
      uri: parsed.uri || DEFAULT_MONGODB_URI,
    };
  } else if (DEFAULT_MONGODB_URI) {
    fs.writeFileSync(mongoConfigPath, JSON.stringify(mongoConfig, null, 2), 'utf-8');
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
      } catch {}
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

function sanitizeMongoUri(uri: string): string {
  if (!uri) return '';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:••••••••@');
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'RestoFlow Serverless Backend',
    timestamp: new Date().toISOString(),
  });
});

// MongoDB Status
app.get('/api/mongo/status', async (_req, res) => {
  if (!mongoConfig.uri) {
    return res.json({
      configured: false,
      connected: false,
      dbName: mongoConfig.dbName,
      message: 'MongoDB Atlas aún no está configurado en MONGODB_URI.',
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
      message: 'Error al conectar con MongoDB Atlas. Revisa la IP (0.0.0.0/0) y credenciales.',
    });
  }
});

// Test connection
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
    } catch {}

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
      } catch {}
    }
    return res.status(400).json({
      success: false,
      error: err?.message || String(err),
      message: 'Error al conectar con MongoDB Atlas. Asegúrate de permitir acceso desde 0.0.0.0/0.',
    });
  }
});

// Save config
app.post('/api/mongo/config', async (req, res) => {
  const { uri, dbName = 'restoflow', autoSync = true } = req.body;
  if (!uri) {
    return res.status(400).json({ success: false, message: 'Cadena de conexión requerida' });
  }

  try {
    const testClient = await getMongoClient(uri, dbName);
    if (!testClient) {
      return res.status(400).json({ success: false, message: 'No se pudo crear cliente' });
    }
    await testClient.db(dbName).command({ ping: 1 });
    activeMongoClient = testClient;

    mongoConfig = {
      uri,
      dbName,
      autoSync: Boolean(autoSync),
      lastSyncTime: new Date().toISOString(),
    };

    try {
      fs.writeFileSync(mongoConfigPath, JSON.stringify(mongoConfig, null, 2), 'utf-8');
    } catch {}

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

// Disconnect
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
    lastSyncTime: '',
  };

  try {
    fs.writeFileSync(mongoConfigPath, JSON.stringify(mongoConfig, null, 2), 'utf-8');
  } catch {}

  res.json({ success: true, message: 'Desconectado de MongoDB Atlas' });
});

// Push all
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

// Pull all
app.get('/api/mongo/pull-all', async (_req, res) => {
  try {
    const client = await getMongoClient();
    if (!client) {
      return res.status(400).json({ success: false, message: 'MongoDB Atlas no está conectado' });
    }

    const db = client.db(mongoConfig.dbName);
    const cleanDocs = (docs: any[]) => docs.map(({ _id, ...rest }) => rest);

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

// Upsert comanda
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
    res.json({ success: false, error: err?.message });
  }
});

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};
