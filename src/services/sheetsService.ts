import {
  MenuItem,
  Table,
  Comanda,
  Venta,
  Compra,
  Proveedor,
  Cliente,
  Factura,
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
 * Reads all 8 sheets in one batch request
 */
export async function fetchAllSheetsData(token: string, spreadsheetId: string) {
  const rangesQuery = SHEET_NAMES.map((s) => `ranges=${encodeURIComponent(s)}!A1:Z500`).join('&');
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

  return {
    menu: menu.length > 0 ? menu : INITIAL_MENU,
    tables: tables.length > 0 ? tables : INITIAL_TABLES,
    comandas: comandas.length > 0 ? comandas : INITIAL_COMANDAS,
    ventas: ventas.length > 0 ? ventas : INITIAL_VENTAS,
    compras: compras.length > 0 ? compras : INITIAL_COMPRAS,
    proveedores: proveedores.length > 0 ? proveedores : INITIAL_PROVEEDORES,
    clientes: clientes.length > 0 ? clientes : INITIAL_CLIENTES,
    facturas: facturas.length > 0 ? facturas : INITIAL_FACTURAS,
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

  // Clear existing content first to avoid ghost rows
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1000:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Write updated values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: fullValues,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al sincronizar ${sheetName}`);
  }
  return res.json();
}
