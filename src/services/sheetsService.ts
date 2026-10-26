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
