import {
  MenuItem,
  Table,
  Comanda,
  Venta,
  Compra,
  Proveedor,
  Cliente,
  Factura,
  Reserva,
  StaffUser,
  StaffRole,
} from '../types/restaurant';
import {
  INITIAL_MENU,
  INITIAL_TABLES,
  INITIAL_COMANDAS,
  INITIAL_VENTAS,
  INITIAL_COMPRAS,
  INITIAL_PROVEEDORES,
  INITIAL_CLIENTES,
  INITIAL_FACTURAS,
  INITIAL_STAFF_USERS,
} from '../data/initialData';

export const SHEET_NAMES = [
  'Menú',
  'Mesas',
  'Comandas',
  'Ventas',
  'Compras',
  'Proveedores',
  'Clientes',
  'Facturación',
  'Reservas',
  'Usuarios',
] as const;

export const SHEET_HEADERS: Record<string, string[]> = {
  'Menú': ['ID', 'Nombre', 'Descripción', 'Precio', 'Categoría', 'Disponible', 'Stock_Actual', 'Stock_Minimo'],
  'Mesas': ['ID', 'Número', 'Estado', 'Capacidad', 'Cliente_Actual_ID', 'Hora_Reserva', 'Comensales_Reserva'],
  'Comandas': ['ID_Comanda', 'ID_Mesa', 'Lista_Items', 'Total', 'Estado', 'Timestamp'],
  'Ventas': ['ID_Venta', 'ID_Comanda', 'Fecha', 'Monto', 'Método_Pago'],
  'Compras': ['ID_Compra', 'Proveedor_ID', 'Fecha', 'Monto', 'Descripción'],
  'Proveedores': ['ID', 'Nombre', 'Contacto', 'Teléfono', 'Email'],
  'Clientes': ['ID', 'Nombre', 'Teléfono', 'Email', 'Historial_Pedidos'],
  'Facturación': ['ID_Factura', 'ID_Venta', 'Fecha', 'NIT/ID_Cliente', 'Monto', 'Estado'],
  'Reservas': ['ID', 'ID_Mesa', 'Mesa_Numero', 'Cliente_Nombre', 'Teléfono', 'Fecha', 'Hora', 'Comensales', 'Notas', 'Estado'],
  'Usuarios': ['ID', 'Nombre', 'Rol', 'PIN', 'Activo', 'Teléfono', 'Email', 'Último_Acceso'],
};

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Creates a brand-new Google Spreadsheet with all 8 restaurant sheets pre-formatted.
 */
export async function createRestaurantSpreadsheet(
  token: string,
  title = 'RestoFlow - Sistema de Restaurante'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create spreadsheet with all 8 sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: SHEET_NAMES.map((name) => ({
        properties: {
          title: name,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      })),
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al crear hoja de cálculo (${createRes.status})`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl;

  // 2. Populate headers and initial seed data for each sheet
  const batchData = [
    {
      range: 'Menú!A1',
      values: [
        SHEET_HEADERS['Menú'],
        ...INITIAL_MENU.map((m) => [
          m.id,
          m.nombre,
          m.descripcion,
          m.precio,
          m.categoria,
          m.disponible ? 'SI' : 'NO',
          m.stockActual,
          m.stockMinimo,
        ]),
      ],
    },
    {
      range: 'Mesas!A1',
      values: [
        SHEET_HEADERS['Mesas'],
        ...INITIAL_TABLES.map((t) => [t.id, t.numero, t.estado, t.capacidad, t.clienteActualId || '']),
      ],
    },
    {
      range: 'Comandas!A1',
      values: [
        SHEET_HEADERS['Comandas'],
        ...INITIAL_COMANDAS.map((c) => [
          c.idComanda,
          c.idMesa,
          JSON.stringify(c.listaItems),
          c.total,
          c.estado,
          c.timestamp,
        ]),
      ],
    },
    {
      range: 'Ventas!A1',
      values: [
        SHEET_HEADERS['Ventas'],
        ...INITIAL_VENTAS.map((v) => [v.idVenta, v.idComanda, v.fecha, v.monto, v.metodoPago]),
      ],
    },
    {
      range: 'Compras!A1',
      values: [
        SHEET_HEADERS['Compras'],
        ...INITIAL_COMPRAS.map((cp) => [cp.idCompra, cp.proveedorId, cp.fecha, cp.monto, cp.descripcion]),
      ],
    },
    {
      range: 'Proveedores!A1',
      values: [
        SHEET_HEADERS['Proveedores'],
        ...INITIAL_PROVEEDORES.map((p) => [p.id, p.nombre, p.contacto, p.telefono, p.email]),
      ],
    },
    {
      range: 'Clientes!A1',
      values: [
        SHEET_HEADERS['Clientes'],
        ...INITIAL_CLIENTES.map((cl) => [cl.id, cl.nombre, cl.telefono, cl.email, cl.historialPedidos]),
      ],
    },
    {
      range: 'Facturación!A1',
      values: [
        SHEET_HEADERS['Facturación'],
        ...INITIAL_FACTURAS.map((f) => [f.idFactura, f.idVenta, f.fecha, f.nitCliente, f.monto, f.estado]),
      ],
    },
    {
      range: 'Reservas!A1',
      values: [SHEET_HEADERS['Reservas']],
    },
    {
      range: 'Usuarios!A1',
      values: [
        SHEET_HEADERS['Usuarios'],
        ...INITIAL_STAFF_USERS.map((u) => [
          u.id,
          u.nombre,
          u.rol,
          u.pin,
          u.activo ? 'SI' : 'NO',
          u.telefono || '',
          u.email || '',
          u.ultimoAcceso || '',
        ]),
      ],
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData,
    }),
  });

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Validates existence and retrieves metadata for a spreadsheet
 */
export async function getSpreadsheetDetails(token: string, spreadsheetId: string) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `No se pudo acceder a la hoja (${res.status})`);
  }
  return res.json();
}

/**
 * Ensures all required sheets (including 'Usuarios' and 'Reservas') exist in the spreadsheet.
 * If any tab is missing, it creates the tab and populates headers.
 */
export async function ensureSheetTabsExist(token: string, spreadsheetId: string): Promise<string[]> {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaRes.ok) return [...SHEET_NAMES];

    const meta = await metaRes.json();
    const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);

    const missingSheets = SHEET_NAMES.filter((name) => !existingTitles.includes(name));
    if (missingSheets.length > 0) {
      // Create missing sheets in batch
      const requests = missingSheets.map((title) => ({
        addSheet: {
          properties: {
            title,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      }));

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      // Write initial headers and data for missing sheets
      for (const sheetName of missingSheets) {
        let initialRows: any[][] = [];
        if (sheetName === 'Usuarios') {
          initialRows = INITIAL_STAFF_USERS.map((u) => [
            u.id,
            u.nombre,
            u.rol,
            u.pin,
            u.activo ? 'SI' : 'NO',
            u.telefono || '',
            u.email || '',
            u.ultimoAcceso || '',
          ]);
        }
        await syncSheetFullRows(token, spreadsheetId, sheetName, initialRows);
      }

      return [...existingTitles, ...missingSheets];
    }

    return existingTitles;
  } catch (err) {
    console.warn('Error verifying/creating sheet tabs:', err);
    return [...SHEET_NAMES];
  }
}

/**
 * Reads all restaurant sheets in batch request, including Usuarios and Reservas
 */
export async function fetchAllSheetsData(token: string, spreadsheetId: string) {
  // Ensure missing tabs like Usuarios or Reservas exist
  const existingSheetNames = await ensureSheetTabsExist(token, spreadsheetId);

  const validRanges = SHEET_NAMES.filter((name) => existingSheetNames.includes(name));
  const rangesQuery = validRanges.map((s) => `ranges=${encodeURIComponent(s)}!A1:Z500`).join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al leer las hojas de cálculo (${res.status})`);
  }

  const data = await res.json();
  const valueRanges: { range: string; values?: any[][] }[] = data.valueRanges || [];

  const getSheetValues = (name: string): any[][] => {
    const vr = valueRanges.find((r) => r.range.startsWith(`'${name}'!`) || r.range.startsWith(`${name}!`) || r.range.includes(name));
    return vr?.values || [];
  };

  // 1. Menú
  const menuRows = getSheetValues('Menú').slice(1);
  const menu: MenuItem[] = menuRows.map((r, i) => ({
    id: r[0] || `MEN-${i + 1}`,
    nombre: r[1] || 'Plato sin nombre',
    descripcion: r[2] || '',
    precio: parseFloat(r[3]) || 0,
    categoria: r[4] || 'General',
    disponible: String(r[5]).toLowerCase() === 'si' || String(r[5]).toLowerCase() === 'true',
    stockActual: r[6] !== undefined && r[6] !== '' ? parseInt(r[6], 10) : 15,
    stockMinimo: r[7] !== undefined && r[7] !== '' ? parseInt(r[7], 10) : 5,
  }));

  // 2. Mesas
  const mesaRows = getSheetValues('Mesas').slice(1);
  const tables: Table[] = mesaRows.map((r, i) => ({
    id: r[0] || `TAB-${i + 1}`,
    numero: parseInt(r[1], 10) || i + 1,
    estado: (r[2] as any) || 'Libre',
    capacidad: parseInt(r[3], 10) || 4,
    clienteActualId: r[4] || undefined,
    reservaHora: r[5] || undefined,
    reservaComensales: r[6] ? parseInt(r[6], 10) : undefined,
  }));

  // 3. Comandas
  const comandaRows = getSheetValues('Comandas').slice(1);
  const comandas: Comanda[] = comandaRows.map((r, i) => {
    let items = [];
    try {
      items = JSON.parse(r[2] || '[]');
    } catch {
      items = [];
    }
    return {
      idComanda: r[0] || `COM-${i + 1}`,
      idMesa: r[1] || '',
      listaItems: items,
      total: parseFloat(r[3]) || 0,
      estado: (r[4] as any) || 'Pendiente',
      timestamp: r[5] || new Date().toISOString(),
    };
  });

  // 4. Ventas
  const ventaRows = getSheetValues('Ventas').slice(1);
  const ventas: Venta[] = ventaRows.map((r, i) => ({
    idVenta: r[0] || `VEN-${i + 1}`,
    idComanda: r[1] || '',
    fecha: r[2] || '',
    monto: parseFloat(r[3]) || 0,
    metodoPago: (r[4] as any) || 'Efectivo',
  }));

  // 5. Compras
  const compraRows = getSheetValues('Compras').slice(1);
  const compras: Compra[] = compraRows.map((r, i) => ({
    idCompra: r[0] || `CMP-${i + 1}`,
    proveedorId: r[1] || '',
    fecha: r[2] || '',
    monto: parseFloat(r[3]) || 0,
    descripcion: r[4] || '',
  }));

  // 6. Proveedores
  const proveedorRows = getSheetValues('Proveedores').slice(1);
  const proveedores: Proveedor[] = proveedorRows.map((r, i) => ({
    id: r[0] || `PRV-${i + 1}`,
    nombre: r[1] || '',
    contacto: r[2] || '',
    telefono: r[3] || '',
    email: r[4] || '',
  }));

  // 7. Clientes
  const clienteRows = getSheetValues('Clientes').slice(1);
  const clientes: Cliente[] = clienteRows.map((r, i) => ({
    id: r[0] || `CLI-${i + 1}`,
    nombre: r[1] || '',
    telefono: r[2] || '',
    email: r[3] || '',
    historialPedidos: r[4] || '',
  }));

  // 8. Facturación
  const facturaRows = getSheetValues('Facturación').slice(1);
  const facturas: Factura[] = facturaRows.map((r, i) => ({
    idFactura: r[0] || `FAC-${i + 1}`,
    idVenta: r[1] || '',
    fecha: r[2] || '',
    nitCliente: r[3] || 'CF',
    monto: parseFloat(r[4]) || 0,
    estado: (r[5] as any) || 'Emitida',
  }));

  // 9. Reservas
  const reservaRows = getSheetValues('Reservas').slice(1);
  const reservas: Reserva[] = reservaRows.map((r, i) => ({
    id: r[0] || `RES-${i + 1}`,
    idMesa: r[1] || '',
    mesaNumero: parseInt(r[2], 10) || 1,
    clienteNombre: r[3] || 'Cliente',
    clienteTelefono: r[4] || '',
    clienteEmail: undefined,
    fecha: r[5] || new Date().toISOString().split('T')[0],
    hora: r[6] || '12:00',
    comensales: parseInt(r[7], 10) || 2,
    notas: r[8] || '',
    estado: (r[9] as any) || 'Confirmada',
    createdAt: new Date().toISOString(),
  }));

  // 10. Usuarios (Personal y PINs)
  const usuarioRows = getSheetValues('Usuarios').slice(1);
  const staffUsers: StaffUser[] = usuarioRows
    .filter((r) => r[0] && r[1])
    .map((r, i) => ({
      id: r[0] || `USR-${String(i + 1).padStart(3, '0')}`,
      nombre: r[1] || 'Colaborador',
      rol: (r[2] as StaffRole) || 'Mesero',
      pin: String(r[3] || '1234'),
      activo: String(r[4]).toLowerCase() === 'si' || String(r[4]).toLowerCase() === 'true',
      telefono: r[5] || undefined,
      email: r[6] || undefined,
      ultimoAcceso: r[7] || undefined,
      avatarColor:
        INITIAL_STAFF_USERS.find((u) => u.id === r[0])?.avatarColor ||
        INITIAL_STAFF_USERS[i % INITIAL_STAFF_USERS.length]?.avatarColor ||
        'from-amber-500 to-rose-600',
    }));

  return {
    menu: menu.length > 0 ? menu : INITIAL_MENU,
    tables: tables.length > 0 ? tables : INITIAL_TABLES,
    comandas,
    ventas,
    compras,
    proveedores: proveedores.length > 0 ? proveedores : INITIAL_PROVEEDORES,
    clientes,
    facturas,
    reservas,
    staffUsers: staffUsers.length > 0 ? staffUsers : INITIAL_STAFF_USERS,
  };
}

/**
 * Appends a single row to a sheet in Google Sheets
 */
export async function appendRowToGoogleSheet(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  rowValues: any[]
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al agregar fila en ${sheetName}`);
  }
  return res.json();
}

/**
 * Replaces all rows of a sheet with fresh data (keeping header)
 */
export async function syncSheetFullRows(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  rows: any[][]
) {
  const header = SHEET_HEADERS[sheetName] || [];
  const fullValues = [header, ...rows];

  try {
    // Clear existing content first to avoid ghost rows
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1000:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    // Ignore clear failure if sheet doesn't exist yet
  }

  // Write updated values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`;
  let res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: fullValues,
    }),
  });

  // If sheet does not exist, create it and retry write
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.error?.message?.includes('Unable to parse range') || res.status === 400) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });

      res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: fullValues,
        }),
      });
    }

    if (!res.ok) {
      const retryErr = await res.json().catch(() => ({}));
      throw new Error(retryErr.error?.message || `Error al sincronizar ${sheetName}`);
    }
  }

  return res.json();
}

/**
 * Parses a Google Visualization Query (GViz) response text into 2D row array
 */
export function parseGVizResponseToRows(text: string): any[][] {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return [];

  try {
    const jsonStr = text.substring(start, end + 1);
    const data = JSON.parse(jsonStr);
    if (data.status === 'error') {
      const msg = data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || 'Error en Google Sheets';
      console.warn('[GViz Parse] Google Sheets reportó:', msg);
      return [];
    }

    const table = data.table;
    if (!table || !table.rows) return [];

    const rows: any[][] = [];

    // Header labels from cols if available
    const cols = (table.cols || []).map((col: any) => col?.label || '');
    if (cols.some((c: string) => c !== '')) {
      rows.push(cols);
    }

    for (const r of table.rows) {
      if (!r || !r.c) continue;
      const rowValues = r.c.map((cell: any) => {
        if (!cell) return '';
        if (cell.v !== undefined && cell.v !== null) return cell.v;
        return cell.f !== undefined && cell.f !== null ? cell.f : '';
      });
      // Skip completely empty rows
      if (rowValues.some((v: any) => v !== '' && v !== null && v !== undefined)) {
        rows.push(rowValues);
      }
    }

    return rows;
  } catch (err) {
    console.warn('[GViz Parse] Error parsing JSON response:', err);
    return [];
  }
}

/**
 * Reads a single sheet from a public Google Sheet via GViz without needing OAuth token
 */
export async function fetchSheetRowsWithoutAuth(spreadsheetId: string, sheetName: string): Promise<any[][]> {
  // Try backend proxy first (avoids browser CORS issues)
  try {
    const proxyRes = await fetch(`/api/sheets/proxy-gviz?sheetId=${encodeURIComponent(spreadsheetId)}&sheet=${encodeURIComponent(sheetName)}`);
    if (proxyRes.ok) {
      const text = await proxyRes.text();
      const rows = parseGVizResponseToRows(text);
      if (rows.length > 0) return rows;
    }
  } catch (e) {
    // Fall back to direct GViz fetch
  }

  // Direct fetch fallback
  try {
    const directUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const directRes = await fetch(directUrl);
    if (directRes.ok) {
      const text = await directRes.text();
      return parseGVizResponseToRows(text);
    }
  } catch (e) {
    console.warn(`[GViz Direct] Could not load sheet ${sheetName}:`, e);
  }

  return [];
}

/**
 * Reads all restaurant sheets directly without ANY Google login, using public sheet link.
 * Requires the Google Sheet to be shared as "Cualquier persona con el enlace puede ver".
 */
export async function fetchAllSheetsDataWithoutAuth(spreadsheetId: string) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) throw new Error('ID o enlace de Google Sheets no válido');

  // Read each sheet in parallel
  const [
    menuRows,
    mesaRows,
    comandaRows,
    ventaRows,
    compraRows,
    proveedorRows,
    clienteRows,
    facturaRows,
    reservaRows,
    usuarioRows,
  ] = await Promise.all([
    fetchSheetRowsWithoutAuth(cleanId, 'Menú'),
    fetchSheetRowsWithoutAuth(cleanId, 'Mesas'),
    fetchSheetRowsWithoutAuth(cleanId, 'Comandas'),
    fetchSheetRowsWithoutAuth(cleanId, 'Ventas'),
    fetchSheetRowsWithoutAuth(cleanId, 'Compras'),
    fetchSheetRowsWithoutAuth(cleanId, 'Proveedores'),
    fetchSheetRowsWithoutAuth(cleanId, 'Clientes'),
    fetchSheetRowsWithoutAuth(cleanId, 'Facturación'),
    fetchSheetRowsWithoutAuth(cleanId, 'Reservas'),
    fetchSheetRowsWithoutAuth(cleanId, 'Usuarios'),
  ]);

  // If header was included, skip first row
  const filterDataRows = (rows: any[][]) => {
    if (rows.length === 0) return [];
    const firstCell = String(rows[0][0] || '').toLowerCase();
    if (firstCell === 'id' || firstCell === 'id_comanda' || firstCell === 'id_venta' || firstCell === 'id_compra' || firstCell === 'id_factura') {
      return rows.slice(1);
    }
    return rows;
  };

  // 1. Menú
  const menuData = filterDataRows(menuRows);
  const menu: MenuItem[] = menuData.map((r, i) => ({
    id: String(r[0] || `MEN-${i + 1}`),
    nombre: String(r[1] || 'Plato sin nombre'),
    descripcion: String(r[2] || ''),
    precio: parseFloat(r[3]) || 0,
    categoria: String(r[4] || 'General'),
    disponible: String(r[5]).toLowerCase() === 'si' || String(r[5]).toLowerCase() === 'true',
    stockActual: r[6] !== undefined && r[6] !== '' ? parseInt(r[6], 10) : 15,
    stockMinimo: r[7] !== undefined && r[7] !== '' ? parseInt(r[7], 10) : 5,
  }));

  // 2. Mesas
  const mesaData = filterDataRows(mesaRows);
  const tables: Table[] = mesaData.map((r, i) => ({
    id: String(r[0] || `TAB-${i + 1}`),
    numero: parseInt(r[1], 10) || i + 1,
    estado: (r[2] as any) || 'Libre',
    capacidad: parseInt(r[3], 10) || 4,
    clienteActualId: r[4] ? String(r[4]) : undefined,
    reservaHora: r[5] ? String(r[5]) : undefined,
    reservaComensales: r[6] ? parseInt(r[6], 10) : undefined,
  }));

  // 3. Comandas
  const comandaData = filterDataRows(comandaRows);
  const comandas: Comanda[] = comandaData.map((r, i) => {
    let items = [];
    try {
      items = JSON.parse(r[2] || '[]');
    } catch {
      items = [];
    }
    return {
      idComanda: String(r[0] || `COM-${i + 1}`),
      idMesa: String(r[1] || ''),
      listaItems: items,
      total: parseFloat(r[3]) || 0,
      estado: (r[4] as any) || 'Pendiente',
      timestamp: String(r[5] || new Date().toISOString()),
    };
  });

  // 4. Ventas
  const ventaData = filterDataRows(ventaRows);
  const ventas: Venta[] = ventaData.map((r, i) => ({
    idVenta: String(r[0] || `VEN-${i + 1}`),
    idComanda: String(r[1] || ''),
    fecha: String(r[2] || ''),
    monto: parseFloat(r[3]) || 0,
    metodoPago: (r[4] as any) || 'Efectivo',
  }));

  // 5. Compras
  const compraData = filterDataRows(compraRows);
  const compras: Compra[] = compraData.map((r, i) => ({
    idCompra: String(r[0] || `CMP-${i + 1}`),
    proveedorId: String(r[1] || ''),
    fecha: String(r[2] || ''),
    monto: parseFloat(r[3]) || 0,
    descripcion: String(r[4] || ''),
  }));

  // 6. Proveedores
  const proveedorData = filterDataRows(proveedorRows);
  const proveedores: Proveedor[] = proveedorData.map((r, i) => ({
    id: String(r[0] || `PRV-${i + 1}`),
    nombre: String(r[1] || ''),
    contacto: String(r[2] || ''),
    telefono: String(r[3] || ''),
    email: String(r[4] || ''),
  }));

  // 7. Clientes
  const clienteData = filterDataRows(clienteRows);
  const clientes: Cliente[] = clienteData.map((r, i) => ({
    id: String(r[0] || `CLI-${i + 1}`),
    nombre: String(r[1] || ''),
    telefono: String(r[2] || ''),
    email: String(r[3] || ''),
    historialPedidos: String(r[4] || ''),
  }));

  // 8. Facturación
  const facturaData = filterDataRows(facturaRows);
  const facturas: Factura[] = facturaData.map((r, i) => ({
    idFactura: String(r[0] || `FAC-${i + 1}`),
    idVenta: String(r[1] || ''),
    fecha: String(r[2] || ''),
    nitCliente: String(r[3] || 'CF'),
    monto: parseFloat(r[4]) || 0,
    estado: (r[5] as any) || 'Emitida',
  }));

  // 9. Reservas
  const reservaData = filterDataRows(reservaRows);
  const reservas: Reserva[] = reservaData.map((r, i) => ({
    id: String(r[0] || `RES-${i + 1}`),
    idMesa: String(r[1] || ''),
    mesaNumero: parseInt(r[2], 10) || 1,
    clienteNombre: String(r[3] || 'Cliente'),
    clienteTelefono: String(r[4] || ''),
    clienteEmail: undefined,
    fecha: String(r[5] || new Date().toISOString().split('T')[0]),
    hora: String(r[6] || '12:00'),
    comensales: parseInt(r[7], 10) || 2,
    notas: String(r[8] || ''),
    estado: (r[9] as any) || 'Confirmada',
    createdAt: new Date().toISOString(),
  }));

  // 10. Usuarios (Personal y PINs)
  const usuarioData = filterDataRows(usuarioRows);
  const staffUsers: StaffUser[] = usuarioData
    .filter((r) => r[0] && r[1])
    .map((r, i) => ({
      id: String(r[0] || `USR-${String(i + 1).padStart(3, '0')}`),
      nombre: String(r[1] || 'Colaborador'),
      rol: (r[2] as StaffRole) || 'Mesero',
      pin: String(r[3] || '1234'),
      activo: String(r[4]).toLowerCase() === 'si' || String(r[4]).toLowerCase() === 'true',
      telefono: r[5] ? String(r[5]) : undefined,
      email: r[6] ? String(r[6]) : undefined,
      ultimoAcceso: r[7] ? String(r[7]) : undefined,
      avatarColor:
        INITIAL_STAFF_USERS.find((u) => u.id === r[0])?.avatarColor ||
        INITIAL_STAFF_USERS[i % INITIAL_STAFF_USERS.length]?.avatarColor ||
        'from-amber-500 to-rose-600',
    }));

  return {
    menu: menu.length > 0 ? menu : INITIAL_MENU,
    tables: tables.length > 0 ? tables : INITIAL_TABLES,
    comandas,
    ventas,
    compras,
    proveedores,
    clientes,
    facturas,
    reservas,
    staffUsers: staffUsers.length > 0 ? staffUsers : INITIAL_STAFF_USERS,
  };
}

/**
 * Appends a row via backend server (allows waiter and kitchen devices to register without OAuth)
 */
export async function appendRowViaServer(sheetName: string, rowValues: any[], spreadsheetId?: string) {
  try {
    const res = await fetch('/api/sheets/append-row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetName, rowValues, spreadsheetId }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[Append Row Server Proxy] Warning:', err);
    return { success: false };
  }
}

/**
 * Gets shared restaurant sheet configuration from backend server
 */
export async function fetchServerSheetsConfig() {
  try {
    const res = await fetch('/api/sheets/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Ignore offline or fallback
  }
  return null;
}

/**
 * Saves shared restaurant sheet configuration to backend server
 */
export async function saveServerSheetsConfig(config: {
  googleSheetUrl: string;
  sheetTitle?: string;
  autoSyncEnabled?: boolean;
  adminToken?: string;
  adminEmail?: string;
  webhookUrl?: string;
}) {
  try {
    const res = await fetch('/api/sheets/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Save Server Sheets Config] Warning:', err);
  }
  return null;
}

export interface SheetValidationResult {
  status: 'active' | 'needs_permission' | 'not_found' | 'invalid' | 'error';
  valid: boolean;
  cleanId: string;
  message: string;
  details?: string;
  menuRowsCount?: number;
}

/**
 * Validates whether a Google Spreadsheet is reachable publicly, requires permissions, or is not found.
 */
export async function validateSheetConnection(rawIdOrUrl: string): Promise<SheetValidationResult> {
  const cleanId = extractSpreadsheetId(rawIdOrUrl);
  if (!cleanId || cleanId.trim().length < 15) {
    return {
      status: 'invalid',
      valid: false,
      cleanId: cleanId || '',
      message: 'ID de hoja no válido',
      details: 'El identificador debe ser un código alfanumérico o una URL completa de Google Sheets.',
    };
  }

  // 1. Try server-side validation endpoint first (avoids browser CORS & iframe redirect traps)
  try {
    const res = await fetch(`/api/sheets/validate?sheetId=${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const data: SheetValidationResult = await res.json();
      return data;
    }
  } catch (err) {
    // If backend proxy is unreachable, continue with client fetch
  }

  // 2. Direct client fallback using GViz
  try {
    const targetUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Menú')}`;
    const directRes = await fetch(targetUrl);
    const text = await directRes.text();

    if (
      directRes.url.includes('accounts.google.com') ||
      text.includes('ServiceLogin') ||
      text.includes('accounts.google.com') ||
      text.includes('access_denied') ||
      directRes.status === 401 ||
      directRes.status === 403
    ) {
      return {
        status: 'needs_permission',
        valid: false,
        cleanId,
        message: 'Requiere permisos de lectura en Google Drive',
        details: 'La hoja existe pero está en modo restringido. Cambia el acceso a "Cualquier persona que tenga el vínculo puede ver (Lector)".',
      };
    }

    if (directRes.status === 404 || text.includes('File not found') || text.includes('reason:not_found')) {
      return {
        status: 'not_found',
        valid: false,
        cleanId,
        message: 'Hoja de cálculo no encontrada',
        details: 'El ID proporcionado no coincide con ningún archivo existente en Google Drive.',
      };
    }

    const rows = parseGVizResponseToRows(text);
    if (rows && rows.length > 0) {
      return {
        status: 'active',
        valid: true,
        cleanId,
        message: 'Conexión Activa y Verificada',
        details: `Se detectaron ${rows.length} registros en la pestaña "Menú". Toda la app sincronizará sin pedir credenciales.`,
        menuRowsCount: rows.length,
      };
    }

    return {
      status: 'active',
      valid: true,
      cleanId,
      message: 'Conexión Activa y Verificada',
      details: 'La hoja responde correctamente sin requerir login de Google.',
    };
  } catch (err: any) {
    return {
      status: 'error',
      valid: false,
      cleanId,
      message: 'Error al contactar con Google Sheets',
      details: err?.message || String(err),
    };
  }
}


