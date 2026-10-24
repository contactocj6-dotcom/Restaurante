import jsPDF from 'jspdf';
import { Factura, Venta, Comanda, ComandaItem, PaymentMethod } from '../types/restaurant';
import {
  DIAN_COMPANY_INFO,
  DianCompanyInfo,
  formatCOP,
  numeroALetrasCOP,
  generateCufe,
  getDianQrUrl,
  calculateColombiaTaxes,
  getSavedRestaurantInfo,
} from '../utils/colombiaFiscal';

export interface InvoiceDetails {
  factura: Factura;
  venta?: Venta;
  comanda?: Comanda;
  mesaNumero?: number;
  metodoPago?: PaymentMethod;
  items: ComandaItem[];
  subtotal: number;
  impuesto: number;
  propina: number;
  total: number;
  cufe: string;
  qrUrl: string;
}

export type RestaurantCompanyInfo = DianCompanyInfo;
export const RESTAURANT_COMPANY_INFO = DIAN_COMPANY_INFO;

/**
 * Resuelve los detalles completos de la factura adaptados a la normatividad DIAN (Colombia).
 */
export function resolveInvoiceDetails(
  factura: Factura,
  ventas: Venta[] = [],
  comandas: Comanda[] = []
): InvoiceDetails {
  const venta = ventas.find((v) => v.idVenta === factura.idVenta);

  let comanda = comandas.find(
    (c) =>
      c.idComanda === venta?.idComanda ||
      (factura.idVenta && c.idComanda.endsWith(factura.idVenta.replace('VEN-', '')))
  );

  if (!comanda && venta?.mesaNumero) {
    comanda = comandas.find((c) => c.mesaNumero === venta.mesaNumero);
  }

  let items: ComandaItem[] = [];
  if (comanda && comanda.listaItems && comanda.listaItems.length > 0) {
    items = [...comanda.listaItems];
  } else {
    items = [
      {
        menuId: 'SRV-GEN',
        nombre: 'Servicio y Consumo Gastronómico a la Mesa',
        precio: factura.monto > 0 ? factura.monto : 45000,
        cantidad: 1,
        notas: `Consumo amparado bajo Factura Electrónica ${factura.idFactura}`,
      },
    ];
  }

  const itemsSum = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const totalFactura = factura.monto > 0 ? factura.monto : itemsSum;

  // Desglose conforme al Estatuto Tributario colombiano (INC 8% y Propina voluntaria sugerida 10%)
  const taxes = calculateColombiaTaxes(totalFactura, 0, 'INC');
  const subtotal = taxes.baseGravable;
  const impuesto = taxes.impuestoInc8;
  const propina = factura.propinaMonto || 0;
  const total = totalFactura + propina;

  const mesaNumero =
    comanda?.mesaNumero ||
    venta?.mesaNumero ||
    (comanda?.idMesa ? parseInt(comanda.idMesa.replace(/\D/g, ''), 10) || 1 : 1);

  const metodoPago = venta?.metodoPago || 'Tarjeta';

  const cufe =
    factura.cufe ||
    generateCufe(factura.idFactura, DIAN_COMPANY_INFO.nit, total, factura.fecha);
  const qrUrl = factura.qrDianUrl || getDianQrUrl(cufe);

  return {
    factura,
    venta,
    comanda,
    mesaNumero,
    metodoPago,
    items,
    subtotal,
    impuesto,
    propina,
    total,
    cufe,
    qrUrl,
  };
}

/**
 * Genera la Factura Electrónica de Venta oficial en formato A4 conforme a la DIAN (Colombia).
 */
export function generateExecutiveInvoicePDF(
  details: InvoiceDetails,
  company: DianCompanyInfo = getSavedRestaurantInfo()
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // 1. BANNER SUPERIOR CON COLORES INSTITUCIONALES
  doc.setFillColor(245, 158, 11); // Amarillo Colombia / Ámbar RestoFlow
  doc.rect(margin, y, contentWidth, 2.5, 'F');
  y += 6;

  // Encabezado de la Empresa Emisora
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text(company.razonSocial, margin, y + 4);

  // Recuadro Tipo de Documento DIAN a la derecha
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(pageWidth - margin - 72, y - 2, 72, 22, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('FACTURA ELECTRÓNICA DE VENTA', pageWidth - margin - 36, y + 4, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(details.factura.idFactura, pageWidth - margin - 36, y + 11, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`PREFIJO ${company.prefijoFactura} • N° AUTORIZADO`, pageWidth - margin - 36, y + 17, { align: 'center' });

  // Datos fiscales del emisor
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIT: ${company.nit}-${company.digitoVerificacion} • ${company.regimen}`, margin, y + 10);
  doc.text(`${company.direccion} • ${company.ciudad}, ${company.pais}`, margin, y + 14.5);
  doc.text(`Tel: ${company.telefono} • Email: ${company.emailFacturacion}`, margin, y + 19);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Actividad Económica CIIU: ${company.codigoActividadCIIU}`, margin, y + 23.5);

  y += 30;

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. CUADRO DE METADATOS DIAN (CLIENTE Y RESOLUCIÓN)
  const colWidth = (contentWidth - 6) / 2;
  const boxHeight = 38;

  // Caja 1: Adquirente / Cliente
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 158, 11);
  doc.text('DATOS DEL ADQUIRENTE / RECEPTOR', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Nombre / Razón Social:', margin + 4, y + 11.5);
  doc.setFont('helvetica', 'normal');
  const clientName =
    details.factura.nombreCliente ||
    details.comanda?.clienteNombre ||
    'Consumidor Final (Sin Identificación)';
  doc.text(clientName.length > 30 ? clientName.substring(0, 28) + '...' : clientName, margin + 40, y + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('NIT / C.C. / Documento:', margin + 4, y + 17.5);
  doc.setFont('helvetica', 'normal');
  const docId = details.factura.nitCliente && details.factura.nitCliente !== 'CF'
    ? details.factura.nitCliente
    : '222222222222 (Consumidor Final DIAN)';
  doc.text(docId, margin + 40, y + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Forma & Medio Pago:', margin + 4, y + 23.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`1 - Contado (${details.metodoPago || 'Tarjeta'})`, margin + 40, y + 23.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Estado Validación DIAN:', margin + 4, y + 29.5);
  doc.setTextColor(16, 185, 129);
  doc.text(details.factura.estado === 'Emitida' ? 'DOCUMENTO APROBADO Y TRANSMITIDO' : 'ANULADA', margin + 40, y + 29.5);

  // Caja 2: Resolución DIAN y Datos de Operación
  const col2X = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, y, colWidth, boxHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 158, 11);
  doc.text('RESOLUCIÓN DIAN & OPERACIÓN', col2X + 4, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Fecha & Hora Emisión:', col2X + 4, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${details.factura.fecha} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, col2X + 38, y + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Resolución DIAN No:', col2X + 4, y + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.resolucionDianNumero} del ${company.resolucionDianFecha}`, col2X + 38, y + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Rango Autorizado:', col2X + 4, y + 23.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.prefijoFactura}-${company.rangoDesde} al ${company.prefijoFactura}-${company.rangoHasta} (${company.vigenciaMeses} meses)`, col2X + 38, y + 23.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Mesa / Comanda:', col2X + 4, y + 29.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mesa #${details.mesaNumero} • Ref: ${details.comanda?.idComanda || details.factura.idVenta}`, col2X + 38, y + 29.5);

  y += boxHeight + 4;

  // 3. TABLA DE CONSUMO Y PRODUCTOS
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  const colCantX = margin + 4;
  const colDescX = margin + 22;
  const colImpX = pageWidth - margin - 56;
  const colPrecioX = pageWidth - margin - 30;
  const colTotalX = pageWidth - margin - 4;

  doc.text('CANT', colCantX, y + 4.8);
  doc.text('DESCRIPCIÓN DEL PLATO / BEBIDA', colDescX, y + 4.8);
  doc.text('IMP (INC)', colImpX, y + 4.8, { align: 'right' });
  doc.text('PRECIO UNIT', colPrecioX, y + 4.8, { align: 'right' });
  doc.text('TOTAL COP', colTotalX, y + 4.8, { align: 'right' });

  y += 7;
  doc.setFontSize(8);

  details.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = item.notas ? 9.5 : 7;

    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.cantidad}x`, colCantX, y + 4.8);

    doc.setFont('helvetica', 'normal');
    const maxDescLength = 52;
    const descText =
      item.nombre.length > maxDescLength
        ? item.nombre.substring(0, maxDescLength - 2) + '..'
        : item.nombre;
    doc.text(descText, colDescX, y + 4.8);

    doc.setFontSize(7.5);
    doc.text('INC 8%', colImpX, y + 4.8, { align: 'right' });
    doc.setFontSize(8);
    doc.text(formatCOP(item.precio), colPrecioX, y + 4.8, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatCOP(item.precio * item.cantidad), colTotalX, y + 4.8, { align: 'right' });

    if (item.notas) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      doc.text(`* Especificación: ${item.notas}`, colDescX, y + 8);
      doc.setFontSize(8);
    }

    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    y += rowHeight;
  });

  y += 4;

  // 4. DESGLOSE TRIBUTARIO COLOMBIANO (DISPOSICIONES DIAN & TOTALES)
  const breakdownWidth = 88;
  const breakdownX = pageWidth - margin - breakdownWidth;
  const notesWidth = contentWidth - breakdownWidth - 6;

  // Izquierda: Disposiciones Fiscales DIAN y CUFE
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, notesWidth, 48, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, notesWidth, 48, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('DISPOSICIONES TRIBUTARIAS DIAN (COLOMBIA)', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('• Factura emitida según Resolución DIAN 000165 de 2023 y 000008 de 2024.', margin + 4, y + 9.5);
  doc.text('• Impuesto Nacional al Consumo (INC 8%) Art. 512-1 del Estatuto Tributario.', margin + 4, y + 13.5);
  doc.text('• Propina voluntaria sugerida (10%) conforme a la Ley 1935 de 2018.', margin + 4, y + 17.5);
  doc.text(`• Valor en letras: ${numeroALetrasCOP(details.total)}`, margin + 4, y + 21.5, { maxWidth: notesWidth - 8 });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Código Único de Facturación Electrónica (CUFE):', margin + 4, y + 28);
  doc.setFont('courier', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text(details.cufe, margin + 4, y + 32, { maxWidth: notesWidth - 8 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Verificación web: ${details.qrUrl}`, margin + 4, y + 42, { maxWidth: notesWidth - 8 });

  // Derecha: Desglose de Totales en COP
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(breakdownX, y, breakdownWidth, 48, 2, 2, 'S');

  let breakdownY = y + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Subtotal / Base Gravable
  doc.text('Subtotal (Base Gravable):', breakdownX + 4, breakdownY);
  doc.text(formatCOP(details.subtotal), pageWidth - margin - 4, breakdownY, { align: 'right' });
  breakdownY += 6;

  // Impuesto Nacional al Consumo (INC 8%)
  doc.text('Impuesto al Consumo (INC 8%):', breakdownX + 4, breakdownY);
  doc.text(formatCOP(details.impuesto), pageWidth - margin - 4, breakdownY, { align: 'right' });
  breakdownY += 6;

  // Propina voluntaria
  if (details.propina > 0) {
    doc.text('Propina Voluntaria (10% Ley 1935):', breakdownX + 4, breakdownY);
    doc.text(formatCOP(details.propina), pageWidth - margin - 4, breakdownY, { align: 'right' });
    breakdownY += 6;
  }

  // Divisor
  doc.setDrawColor(203, 213, 225);
  doc.line(breakdownX + 3, breakdownY, pageWidth - margin - 3, breakdownY);
  breakdownY += 3;

  // Total a Pagar en COP destacado
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(breakdownX + 2, breakdownY, breakdownWidth - 4, 12, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text('TOTAL A PAGAR:', breakdownX + 5, breakdownY + 8);

  doc.setFontSize(11.5);
  doc.text(formatCOP(details.total, true), pageWidth - margin - 5, breakdownY + 8, { align: 'right' });

  y += 54;

  // 5. CAJERO Y MÉTODO DE PAGO
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(39, 39, 42);
  doc.text('FORMA DE PAGO:', margin + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`1 - Contado • Medio: ${details.metodoPago || 'Tarjeta'} • Moneda: Pesos Colombianos (COP)`, margin + 35, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('FACTURADO & CERTIFICADO', pageWidth - margin - 4, y + 6.5, { align: 'right' });

  y += 16;

  // 6. PIE DE PÁGINA
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 24, 27);
  doc.text('¡GRACIAS POR SU VISITA A RESTOFLOW!', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text(
    'Comprobante avalado por la Dirección de Impuestos y Aduanas Nacionales (DIAN) de Colombia.',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 3.5;
  doc.text(
    `Software Autorizado: ${company.proveedorSoftware} • Impreso: ${new Date().toLocaleString('es-CO')}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  return doc;
}

/**
 * Descarga automática del PDF en formato oficial A4
 */
export function downloadInvoicePDF(
  details: InvoiceDetails,
  company: DianCompanyInfo = getSavedRestaurantInfo()
): void {
  const doc = generateExecutiveInvoicePDF(details, company);
  const cleanId = details.factura.idFactura.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `Factura_DIAN_${cleanId}_COP.pdf`;
  doc.save(fileName);
}

/**
 * Genera el Documento Equivalente POS Electrónico DIAN en formato rollo térmico de 80mm
 */
export function generateThermalTicketPDF(
  details: InvoiceDetails,
  company: DianCompanyInfo = getSavedRestaurantInfo()
): jsPDF {
  const itemsCount = details.items.length;
  const dynamicHeight = Math.max(185, 140 + itemsCount * 9);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, dynamicHeight],
  });

  // Cabecera DIAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(company.nombreComercial || company.razonSocial, 40, 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  if (company.nombreComercial && company.razonSocial && company.nombreComercial !== company.razonSocial) {
    doc.text(company.razonSocial, 40, 12.5, { align: 'center' });
    doc.text(`NIT: ${company.nit}-${company.digitoVerificacion} • ${company.regimen}`, 40, 16, { align: 'center' });
    doc.text(company.direccion, 40, 19.5, { align: 'center' });
    doc.text(`${company.ciudad} • Tel: ${company.telefono}`, 40, 23, { align: 'center' });
  } else {
    doc.text(`NIT: ${company.nit}-${company.digitoVerificacion} • ${company.regimen}`, 40, 13, { align: 'center' });
    doc.text(company.direccion, 40, 17, { align: 'center' });
    doc.text(`${company.ciudad} • Tel: ${company.telefono}`, 40, 21, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SISTEMA FACTURACIÓN ELECTRÓNICA DIAN', 40, 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Res. DIAN ${company.resolucionDianNumero} del ${company.resolucionDianFecha}`, 40, 29, { align: 'center' });
  doc.text(`Rango: ${company.prefijoFactura}-${company.rangoDesde} al ${company.prefijoFactura}-${company.rangoHasta}`, 40, 32.5, { align: 'center' });

  // Separador punteado
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(120, 120, 120);
  doc.line(6, 35, 74, 35);

  // Metadatos
  doc.setFontSize(7.5);
  doc.text(`FACTURA ELECTRÓNICA: ${details.factura.idFactura}`, 6, 39);
  doc.text(`VENTA REF: ${details.factura.idVenta}`, 6, 43);
  doc.text(
    `FECHA: ${details.factura.fecha} ${new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    6,
    47
  );
  doc.text(
    `MESA: #${details.mesaNumero} • COMANDA: ${details.comanda?.idComanda || 'N/A'}`,
    6,
    51
  );
  doc.text(`CLIENTE: ${details.factura.nombreCliente || 'Consumidor Final'}`, 6, 55);
  doc.text(
    `NIT / C.C.: ${details.factura.nitCliente && details.factura.nitCliente !== 'CF' ? details.factura.nitCliente : '222222222222'}`,
    6,
    59
  );
  doc.text(`CAJERO: ${details.factura.cajeroNombre || 'Carlos Ramírez'}`, 6, 63);

  // Separador
  doc.line(6, 66, 74, 66);

  // Encabezado de items
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CANT  PRODUCTO', 6, 70);
  doc.text('TOTAL COP', 74, 70, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  let y = 75;

  details.items.forEach((item) => {
    const itemTotal = formatCOP(item.precio * item.cantidad);
    const nameTruncated =
      item.nombre.length > 20 ? item.nombre.substring(0, 18) + '..' : item.nombre;

    doc.text(`${item.cantidad}x  ${nameTruncated}`, 6, y);
    doc.text(itemTotal, 74, y, { align: 'right' });
    y += 4;

    if (item.notas) {
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text(`   * ${item.notas}`, 6, y);
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      y += 3.5;
    }
  });

  // Separador
  doc.line(6, y + 1, 74, y + 1);
  y += 5;

  // Desglose fiscal colombiano
  doc.text('Subtotal (Base Gravable):', 6, y);
  doc.text(formatCOP(details.subtotal), 74, y, { align: 'right' });
  y += 4;

  doc.text('Impuesto al Consumo (INC 8%):', 6, y);
  doc.text(formatCOP(details.impuesto), 74, y, { align: 'right' });
  y += 4;

  if (details.propina > 0) {
    doc.text('Propina Voluntaria (10%):', 6, y);
    doc.text(formatCOP(details.propina), 74, y, { align: 'right' });
    y += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL A PAGAR (COP):', 6, y);
  doc.text(formatCOP(details.total), 74, y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Método: 1 - Contado (${details.metodoPago})`, 6, y);
  y += 4;

  // CUFE en tiquete
  doc.setFontSize(6);
  doc.text('CUFE DIAN:', 6, y);
  y += 3;
  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  doc.text(details.cufe.substring(0, 48) + '...', 6, y);
  y += 5;

  // Pie
  doc.line(6, y, 74, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(company.mensajeTicket || '¡Gracias por su compra!', 40, y, { align: 'center' });

  if (company.instagram || company.whatsapp) {
    y += 3.5;
    const socialParts = [
      company.instagram ? `IG: ${company.instagram}` : null,
      company.whatsapp ? `WhatsApp: ${company.whatsapp}` : null,
    ].filter(Boolean);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(socialParts.join(' • '), 40, y, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
  }

  y += 3.5;
  doc.text('Documento equivalente POS regulado por la DIAN', 40, y, { align: 'center' });
  doc.text(`Software: ${company.proveedorSoftware || 'RestoFlow Cloud Tech'}`, 40, y + 3.5, { align: 'center' });

  return doc;
}
