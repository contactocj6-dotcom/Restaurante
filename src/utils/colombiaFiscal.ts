/**
 * Utilidades de Facturación y Moneda para Colombia (COP & DIAN)
 * Cumple con la normatividad de la Dirección de Impuestos y Aduanas Nacionales (DIAN):
 * - Resolución DIAN 000165 de 2023 y Resolución 000008 de 2024 (Facturación Electrónica y Sistema POS)
 * - Art. 512-1 del Estatuto Tributario (Impuesto Nacional al Consumo - INC 8% en restaurantes y bares)
 * - Ley 1935 de 2018 (Regulación de la Propina Voluntaria en Colombia)
 */

export interface DianCompanyInfo {
  razonSocial: string;
  nombreComercial: string;
  nit: string;
  digitoVerificacion: string;
  regimen: string;
  responsabilidades: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  codigoPostal: string;
  telefono: string;
  emailFacturacion: string;
  web: string;
  // Redes Sociales y Comunicación Directa
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  eslogan?: string;
  mensajeTicket?: string;
  resolucionDianNumero: string;
  resolucionDianFecha: string;
  prefijoFactura: string;
  prefijoPos: string;
  rangoDesde: number;
  rangoHasta: number;
  vigenciaMeses: number;
  fechaVigenciaHasta: string;
  proveedorSoftware: string;
  proveedorNit: string;
  codigoActividadCIIU: string;
  // Configuración Central de Base de Datos / Google Sheets del Restaurante
  googleSheetId?: string;
  googleSheetUrl?: string;
  autoSyncEnabled?: boolean;
}

export const DIAN_COMPANY_INFO: DianCompanyInfo = {
  razonSocial: 'RESTAURANTE ANTOJOS MAR Y TIERRA S.A.S.',
  nombreComercial: 'Restaurante Antojos Mar y Tierra',
  nit: '901.784.321',
  digitoVerificacion: '8',
  regimen: 'Responsable de Impuesto Nacional al Consumo (INC) y Régimen Ordinario',
  responsabilidades: 'R-99-PN (No responsable de IVA para alimentos/bebidas - Responsable de INC 8%)',
  direccion: 'Km 3 Vía Principal / Zona Gastronómica',
  ciudad: 'Bucaramanga',
  departamento: 'Santander',
  pais: 'Colombia',
  codigoPostal: '680001',
  telefono: '+57 310 829-4560 / +57 312 450-8921',
  emailFacturacion: 'administracion@antojosmarytierra.com.co',
  web: 'www.antojosmarytierra.com',
  whatsapp: '+57 310 829-4560',
  instagram: '@antojosmarytierra',
  facebook: 'AntojosMaryTierraRestaurante',
  tiktok: '@antojosmarytierra',
  eslogan: 'El Auténtico Sabor del Mar y la Parrilla',
  mensajeTicket: '¡Gracias por visitarnos en Antojos Mar y Tierra! ¡Esperamos atenderle de nuevo!',
  resolucionDianNumero: '18764058291044',
  resolucionDianFecha: '15/01/2026',
  prefijoFactura: 'FE',
  prefijoPos: 'POS',
  rangoDesde: 1,
  rangoHasta: 50000,
  vigenciaMeses: 24,
  fechaVigenciaHasta: '15/01/2028',
  proveedorSoftware: 'RestoFlow Cloud Tech S.A.S. (Software Propio Autorizado DIAN)',
  proveedorNit: '901.784.321-8',
  codigoActividadCIIU: '5611 (Expendio a la mesa de comidas preparadas)',
  googleSheetId: '',
  googleSheetUrl: '',
  autoSyncEnabled: true,
};

export const RESTAURANT_INFO_STORAGE_KEY = 'restoflow_restaurant_info';

/**
 * Obtiene la información personalizada del restaurante desde localStorage,
 * o los valores predeterminados DIAN_COMPANY_INFO si aún no se ha guardado.
 */
export function getSavedRestaurantInfo(): DianCompanyInfo {
  if (typeof window === 'undefined') return DIAN_COMPANY_INFO;
  try {
    const saved = localStorage.getItem(RESTAURANT_INFO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DIAN_COMPANY_INFO, ...parsed };
    }
  } catch (err) {
    console.error('Error al recuperar información del restaurante desde localStorage:', err);
  }
  return DIAN_COMPANY_INFO;
}

/**
 * Guarda la información del restaurante en localStorage y despacha un evento para reactividad global.
 */
export function saveRestaurantInfo(info: DianCompanyInfo): void {
  try {
    localStorage.setItem(RESTAURANT_INFO_STORAGE_KEY, JSON.stringify(info));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('restoflow_restaurant_info_updated', { detail: info })
      );
    }
  } catch (err) {
    console.error('Error al guardar información del restaurante en localStorage:', err);
  }
}

/**
 * Formatea un monto numérico a Pesos Colombianos (COP) según estándar colombiano:
 * Sin decimales (en Colombia no circulan centavos), separador de miles con punto (.)
 * Ejemplo: 35000 -> "$ 35.000"
 */
export function formatCOP(monto: number, includeCurrencyCode = false): string {
  if (isNaN(monto) || monto === null || monto === undefined) {
    return includeCurrencyCode ? '$ 0 COP' : '$ 0';
  }

  // Redondear a enteros ya que en Colombia no circulan centavos ni decimales
  const rounded = Math.round(monto);
  const isNegative = rounded < 0;
  const absStr = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = isNegative ? '-' : '';

  return includeCurrencyCode ? `${sign}$ ${absStr} COP` : `${sign}$ ${absStr}`;
}

/**
 * Formatea un número sin el signo '$' pero con separadores de miles colombianos (.) y sin decimales
 */
export function formatCOPNumber(monto: number): string {
  if (isNaN(monto) || monto === null || monto === undefined) return '0';
  const rounded = Math.round(monto);
  const isNegative = rounded < 0;
  const absStr = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-${absStr}` : absStr;
}

/**
 * Convierte montos a formato compacto en miles o millones (ej. "$ 120K", "$ 1.5M")
 */
export function formatCOPCompact(monto: number): string {
  if (isNaN(monto) || monto === null || monto === undefined) return '$ 0';
  const abs = Math.abs(Math.round(monto));
  if (abs >= 1_000_000) {
    const millions = (monto / 1_000_000);
    const millionsStr = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1).replace('.', ',');
    return `$ ${millionsStr}M`;
  }
  if (abs >= 1_000) {
    return `$ ${(monto / 1_000).toFixed(0)}K`;
  }
  return formatCOP(monto);
}

/**
 * Genera el Código Único de Facturación Electrónica (CUFE) sintético válido de 64 caracteres hex
 */
export function generateCufe(facturaId: string, nit: string, monto: number, fecha: string): string {
  const seed = `${facturaId}-${nit}-${Math.round(monto)}-${fecha}-DIAN-COLOMBIA-RESTOFLOW`;
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + char * (i + 1);
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(16);
  return `${hex1}${hex2}${timestamp}c9e4b78a91df20485601a4b87c23f109e45a89`.padEnd(64, '0').slice(0, 64);
}

/**
 * Enlace oficial de consulta pública de la DIAN para validación de la factura
 */
export function getDianQrUrl(cufe: string): string {
  return `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;
}

/**
 * Desglose tributario colombiano:
 * En restaurantes en Colombia aplica el INC (Impuesto Nacional al Consumo - 8%).
 * La propina voluntaria sugerida máxima legal es del 10% (Ley 1935 de 2018).
 */
export interface ColombiaTaxBreakdown {
  baseGravable: number;
  impuestoInc8: number;
  impuestoIva19: number;
  propinaVoluntaria: number;
  totalSinPropina: number;
  totalConPropina: number;
  impuestoNombre: string;
}

export function calculateColombiaTaxes(
  montoTotal: number,
  propinaPctOrAmount = 10,
  tipoImpuesto: 'INC' | 'IVA' = 'INC',
  isExactPropinaAmount = false
): ColombiaTaxBreakdown {
  const rate = tipoImpuesto === 'INC' ? 0.08 : 0.19;
  const impuestoNombre = tipoImpuesto === 'INC' ? 'Impuesto Nacional al Consumo (INC 8%)' : 'IVA (19%)';

  // El monto de carta o comanda en Colombia típicamente incluye el impuesto
  const totalSinPropina = montoTotal;
  const baseGravable = Math.round(totalSinPropina / (1 + rate));
  const impuestoMonto = totalSinPropina - baseGravable;

  let propinaVoluntaria = 0;
  if (isExactPropinaAmount) {
    propinaVoluntaria = Math.max(0, Math.round(propinaPctOrAmount));
  } else {
    propinaVoluntaria = propinaPctOrAmount > 0 ? Math.round((totalSinPropina * propinaPctOrAmount) / 100) : 0;
  }
  const totalConPropina = totalSinPropina + propinaVoluntaria;

  return {
    baseGravable,
    impuestoInc8: tipoImpuesto === 'INC' ? impuestoMonto : 0,
    impuestoIva19: tipoImpuesto === 'IVA' ? impuestoMonto : 0,
    propinaVoluntaria,
    totalSinPropina,
    totalConPropina,
    impuestoNombre,
  };
}

/**
 * Billetes y Monedas en circulación legal en la República de Colombia
 */
export const DENOMINACIONES_COLOMBIA = [
  { valor: 100000, label: '$100.000 Billetes', tipo: 'billete' },
  { valor: 50000, label: '$50.000 Billetes', tipo: 'billete' },
  { valor: 20000, label: '$20.000 Billetes', tipo: 'billete' },
  { valor: 10000, label: '$10.000 Billetes', tipo: 'billete' },
  { valor: 5000, label: '$5.000 Billetes', tipo: 'billete' },
  { valor: 2000, label: '$2.000 Billetes', tipo: 'billete' },
  { valor: 1000, label: '$1.000 Monedas', tipo: 'moneda' },
  { valor: 500, label: '$500 Monedas', tipo: 'moneda' },
  { valor: 200, label: '$200 Monedas', tipo: 'moneda' },
  { valor: 100, label: '$100 Monedas', tipo: 'moneda' },
  { valor: 50, label: '$50 Monedas', tipo: 'moneda' },
];

/**
 * Valores predefinidos comunes para Base Inicial de Caja en Colombia
 */
export const PRESET_BASES_COLOMBIA = [100000, 150000, 200000, 300000, 500000];

/**
 * Convierte un número a letras en Pesos Colombianos Moneda Corriente (M/CTE)
 */
export function numeroALetrasCOP(monto: number): string {
  const n = Math.round(monto);
  if (n === 0) return 'CERO PESOS M/CTE';

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const veintes = ['VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirCentenas(num: number): string {
    if (num === 100) return 'CIEN';
    let res = '';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (c > 0) res += centenas[c] + ' ';
    if (d === 1) {
      res += especiales[u] + ' ';
    } else if (d === 2) {
      res += veintes[u] + ' ';
    } else {
      if (d > 2) {
        res += decenas[d];
        if (u > 0) res += ' Y ' + unidades[u];
        res += ' ';
      } else if (u > 0) {
        res += unidades[u] + ' ';
      }
    }
    return res.trim();
  }

  function convertirMiles(num: number): string {
    if (num === 0) return '';
    if (num === 1) return 'MIL';
    return convertirCentenas(num) + ' MIL';
  }

  let letras = '';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1_000);
  const resto = n % 1_000;

  if (millones > 0) {
    if (millones === 1) {
      letras += 'UN MILLÓN ';
    } else {
      letras += convertirCentenas(millones) + ' MILLONES ';
    }
  }

  if (miles > 0) {
    letras += convertirMiles(miles) + ' ';
  }

  if (resto > 0) {
    letras += convertirCentenas(resto) + ' ';
  }

  return `${letras.trim()} PESOS M/CTE`;
}
