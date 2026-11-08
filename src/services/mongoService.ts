export interface MongoStatusResponse {
  configured: boolean;
  connected: boolean;
  dbName: string;
  sanitizedUri?: string;
  autoSync?: boolean;
  lastSyncTime?: string;
  counts?: Record<string, number>;
  message?: string;
  error?: string;
}

export interface MongoTestResponse {
  success: boolean;
  latencyMs?: number;
  dbName?: string;
  collectionsFound?: string[];
  message: string;
  error?: string;
}

export interface MongoSyncResult {
  success: boolean;
  lastSyncTime?: string;
  counts?: Record<string, number>;
  message: string;
  error?: string;
}

export interface MongoPullResult {
  success: boolean;
  data?: {
    menu?: any[];
    tables?: any[];
    comandas?: any[];
    ventas?: any[];
    clientes?: any[];
    proveedores?: any[];
    compras?: any[];
    facturas?: any[];
    reservas?: any[];
    staffUsers?: any[];
    restaurantInfo?: any;
  };
  counts?: Record<string, number>;
  timestamp?: string;
  message?: string;
  error?: string;
}

async function parseJsonResponse(res: Response, fallbackMessage: string) {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        configured: false,
        connected: false,
        message: fallbackMessage,
        error: err?.message || String(err),
      };
    }
  } else {
    return {
      success: false,
      configured: false,
      connected: false,
      message: 'El servidor backend no devolvió JSON válido. Es posible que el servidor se esté reiniciando.',
      error: 'Invalid non-JSON response (HTML DOCTYPE)',
    };
  }
}

/**
 * Fetch current MongoDB connection status and collection statistics from backend
 */
export async function fetchMongoStatus(): Promise<MongoStatusResponse> {
  try {
    const res = await fetch('/api/mongo/status');
    return await parseJsonResponse(res, 'Error al procesar el estado de MongoDB');
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      dbName: 'restoflow',
      error: err?.message || String(err),
      message: 'No se pudo contactar con el servidor local para verificar MongoDB',
    };
  }
}

/**
 * Test a MongoDB connection string in real-time
 */
export async function testMongoConnection(uri: string, dbName = 'restoflow'): Promise<MongoTestResponse> {
  try {
    const res = await fetch('/api/mongo/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, dbName }),
    });
    return await parseJsonResponse(res, 'Error al probar la conexión con MongoDB Atlas');
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Error de red al probar conexión con MongoDB Atlas',
      error: String(err),
    };
  }
}

/**
 * Save MongoDB Atlas configuration and establish persistent connection
 */
export async function saveMongoConfig(
  uri: string,
  dbName = 'restoflow',
  autoSync = true
): Promise<MongoStatusResponse> {
  try {
    const res = await fetch('/api/mongo/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, dbName, autoSync }),
    });
    return await parseJsonResponse(res, 'Error al guardar la configuración de MongoDB Atlas');
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      dbName,
      error: err?.message || String(err),
      message: 'Error al guardar la configuración de MongoDB Atlas',
    };
  }
}

/**
 * Disconnect and clear MongoDB Atlas configuration
 */
export async function disconnectMongo(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/mongo/disconnect', { method: 'POST' });
    return await parseJsonResponse(res, 'Error al desconectar de MongoDB Atlas');
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error al desconectar' };
  }
}

/**
 * Push all restaurant data to MongoDB Atlas collections
 */
export async function pushAllToMongo(data: {
  menu: any[];
  tables: any[];
  comandas: any[];
  ventas: any[];
  clientes: any[];
  proveedores: any[];
  compras: any[];
  facturas: any[];
  reservas?: any[];
  staffUsers?: any[];
  restaurantInfo?: any;
}): Promise<MongoSyncResult> {
  try {
    const res = await fetch('/api/mongo/push-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    return await parseJsonResponse(res, 'Error al sincronizar datos hacia MongoDB Atlas');
  } catch (err: any) {
    return {
      success: false,
      message: 'Error de red al sincronizar con MongoDB Atlas',
      error: err?.message || String(err),
    };
  }
}

/**
 * Pull all restaurant collections from MongoDB Atlas into local app state
 */
export async function pullAllFromMongo(): Promise<MongoPullResult> {
  try {
    const res = await fetch('/api/mongo/pull-all');
    return await parseJsonResponse(res, 'Error al consultar colecciones de MongoDB Atlas');
  } catch (err: any) {
    return {
      success: false,
      message: 'Error de red al consultar colecciones de MongoDB Atlas',
      error: err?.message || String(err),
    };
  }
}

/**
 * Upsert a single comanda into MongoDB Atlas in background
 */
export async function liveUpsertComandaToMongo(comanda: any): Promise<boolean> {
  try {
    const res = await fetch('/api/mongo/upsert-comanda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comanda }),
    });
    const data = await parseJsonResponse(res, 'Error en upsert de comanda');
    return !!data.success;
  } catch {
    return false;
  }
}
