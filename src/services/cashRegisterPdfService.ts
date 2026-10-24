import jsPDF from 'jspdf';
import { SesionCaja, MovimientoCaja, Venta, Factura } from '../types/restaurant';
import {
  DIAN_COMPANY_INFO,
  DianCompanyInfo,
  formatCOP,
  getSavedRestaurantInfo,
} from '../utils/colombiaFiscal';

export interface CashClosingDetails {
  sesion: SesionCaja;
  movimientos: MovimientoCaja[];
  ventas: Venta[];
  facturas: Factura[];
}

/**
 * Genera el Acta Oficial de Cierre y Arqueo de Caja (Reporte Z) en formato A4 para Colombia (COP y DIAN).
 */
export function generateCashClosingExecutivePDF(
  details: CashClosingDetails,
  company: DianCompanyInfo = getSavedRestaurantInfo()
): jsPDF {
  const { sesion, movimientos } = details;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  let y = 14;

  // Header Banner
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');

  // Restaurant Brand & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(company.nombreComercial || company.razonSocial, margin + 6, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 158, 11);
  doc.text('ACTA OFICIAL DE CIERRE Y ARQUEO FISCAL DE CAJA (REPORTE Z)', margin + 6, y + 14.5);
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text(
    `NIT: ${company.nit}-${company.digitoVerificacion} • ${company.ciudad}, Colombia • Moneda: Pesos Colombianos (COP)`,
    margin + 6,
    y + 20.5
  );

  // Status Badge on Header
  const badgeX = pageWidth - margin - 52;
  const isCerrada = sesion.estado === 'Cerrada';
  doc.setFillColor(isCerrada ? 16 : 217, isCerrada ? 185 : 119, isCerrada ? 129 : 6);
  doc.roundedRect(badgeX, y + 6, 46, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(isCerrada ? 'CIERRE FINALIZADO' : 'TURNO ACTIVO (EN VIVO)', badgeX + 23, y + 12.5, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`ID: ${sesion.id}`, badgeX + 23, y + 18, { align: 'center' });

  y += 34;

  // Metadata Grid: Two boxes
  const boxWidth = (pageWidth - margin * 2 - 6) / 2;
  const boxHeight = 26;

  // Box 1: Cajero y Turno
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DEL TURNO Y RESPONSABLE', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Cajero a cargo:', margin + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${sesion.cajeroNombre} (${sesion.cajeroId})`, margin + 28, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Turno:', margin + 4, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${sesion.turno}`, margin + 28, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Supervisor:', margin + 4, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${sesion.supervisorCierre || 'Administración de Restaurante'}`, margin + 28, y + 21);

  // Box 2: Horarios y Fechas
  const box2X = margin + boxWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('HORARIOS DE OPERACIÓN', box2X + 4, y + 6);

  const formatFechaHora = (iso?: string) => {
    if (!iso) return 'En curso...';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('es-CO')} ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Apertura:', box2X + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatFechaHora(sesion.fechaApertura), box2X + 24, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Cierre:', box2X + 4, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatFechaHora(sesion.fechaCierre), box2X + 24, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Emisión:', box2X + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleString('es-CO'), box2X + 24, y + 21);

  y += boxHeight + 6;

  // Financial Balance Card (Arqueo y Flujo)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 46, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('BALANCE GENERAL Y ARQUEO DE EFECTIVO (COP)', margin + 4, y + 7);

  // 4 Column summary in the card
  const colW = (pageWidth - margin * 2 - 8) / 4;
  const statsY = y + 12;

  // 1. Base Inicial
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 2, statsY, colW - 2, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('BASE INICIAL (FONDO)', margin + 4, statsY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCOP(sesion.montoBase), margin + 4, statsY + 16);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Fondo cambio inicial', margin + 4, statsY + 24);

  // 2. Ventas Efectivo + Entradas
  const c2X = margin + 2 + colW;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(c2X, statsY, colW - 2, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129);
  doc.text('VENTAS EN EFECTIVO (+)', c2X + 3, statsY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(formatCOP(sesion.totalVentasEfectivo), c2X + 3, statsY + 16);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Entradas: +${formatCOP(sesion.totalEntradasManuales)}`, c2X + 3, statsY + 24);

  // 3. Salidas / Egresos
  const c3X = margin + 2 + colW * 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(c3X, statsY, colW - 2, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(239, 68, 68);
  doc.text('EGRESOS CAJA MENOR (-)', c3X + 3, statsY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text(formatCOP(sesion.totalSalidasManuales), c3X + 3, statsY + 16);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Gastos autorizados', c3X + 3, statsY + 24);

  // 4. Saldo Esperado vs Contado
  const c4X = margin + 2 + colW * 3;
  const dif = sesion.diferencia ?? 0;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(c4X, statsY, colW - 2, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('EFECTIVO ESPERADO', c4X + 3, statsY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(formatCOP(sesion.efectivoEsperado), c4X + 3, statsY + 16);

  if (sesion.efectivoReal !== undefined) {
    doc.setFontSize(6.5);
    if (Math.abs(dif) < 1) {
      doc.setTextColor(16, 185, 129);
      doc.text(`Contado: ${formatCOP(sesion.efectivoReal)} (Cuadrado)`, c4X + 3, statsY + 24);
    } else if (dif > 0) {
      doc.setTextColor(2, 132, 199);
      doc.text(`Contado: ${formatCOP(sesion.efectivoReal)} (+${formatCOP(dif)} Sobrante)`, c4X + 3, statsY + 24);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text(`Contado: ${formatCOP(sesion.efectivoReal)} (${formatCOP(dif)} Faltante)`, c4X + 3, statsY + 24);
    }
  } else {
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Turno en curso', c4X + 3, statsY + 24);
  }

  y += 52;

  // Desglose por Medio de Pago
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESGLOSE DE VENTAS POR MEDIO DE PAGO EN ESTE TURNO (COP):', margin + 4, y + 5);

  const totalVentasTurno =
    sesion.totalVentasEfectivo + sesion.totalVentasTarjeta + sesion.totalVentasTransferencia;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Efectivo: ', margin + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCOP(sesion.totalVentasEfectivo), margin + 18, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.text('Tarjetas: ', margin + 50, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCOP(sesion.totalVentasTarjeta), margin + 64, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.text('Transferencia / QR: ', margin + 98, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCOP(sesion.totalVentasTransferencia), margin + 128, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text(`TOTAL FACTURADO: ${formatCOP(totalVentasTurno, true)}`, pageWidth - margin - 4, y + 13, { align: 'right' });

  y += 25;

  // Movements Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTRO DETALLADO DE MOVIMIENTOS DE CAJA (GAVETA)', margin, y);

  y += 3;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  doc.text('HORA', margin + 3, y + 4.5);
  doc.text('TIPO', margin + 22, y + 4.5);
  doc.text('CONCEPTO / DESCRIPCIÓN', margin + 50, y + 4.5);
  doc.text('REF.', margin + 125, y + 4.5);
  doc.text('MÉTODO', margin + 148, y + 4.5);
  doc.text('MONTO (COP)', pageWidth - margin - 3, y + 4.5, { align: 'right' });

  y += 7;

  const movList = movimientos.slice(0, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  movList.forEach((mov, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    }

    const timeStr = mov.fecha
      ? new Date(mov.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    doc.setTextColor(71, 85, 105);
    doc.text(timeStr, margin + 3, y + 4.5);

    if (mov.tipo === 'Salida_Gasto') {
      doc.setTextColor(220, 38, 38);
      doc.text('EGRESO (-)', margin + 22, y + 4.5);
    } else if (mov.tipo === 'Base_Inicial') {
      doc.setTextColor(79, 70, 229);
      doc.text('BASE INICIAL', margin + 22, y + 4.5);
    } else if (mov.tipo === 'Entrada_Manual') {
      doc.setTextColor(13, 148, 136);
      doc.text('ENTRADA (+)', margin + 22, y + 4.5);
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text('VENTA (+)', margin + 22, y + 4.5);
    }

    doc.setTextColor(15, 23, 42);
    const truncConcepto = mov.concepto.length > 45 ? mov.concepto.slice(0, 42) + '...' : mov.concepto;
    doc.text(truncConcepto, margin + 50, y + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text(mov.comprobanteRef || 'S/C', margin + 125, y + 4.5);
    doc.text(mov.metodoPago, margin + 148, y + 4.5);

    doc.setFont('helvetica', 'bold');
    if (mov.tipo === 'Salida_Gasto') {
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatCOP(mov.monto)}`, pageWidth - margin - 3, y + 4.5, { align: 'right' });
    } else {
      doc.setTextColor(15, 23, 42);
      doc.text(`+${formatCOP(mov.monto)}`, pageWidth - margin - 3, y + 4.5, { align: 'right' });
    }
    doc.setFont('helvetica', 'normal');

    y += 6.5;
  });

  if (movList.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('No se registraron movimientos en esta sesión.', margin + 4, y + 5);
    y += 8;
  }

  y += 4;

  // Notes Block
  if (sesion.notasApertura || sesion.notasCierre) {
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(254, 240, 138);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 98, 7);
    doc.text('OBSERVACIONES DE AUDITORÍA Y CONTROL INTERNO:', margin + 4, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 63, 18);
    const notasText = [
      sesion.notasApertura ? `Apertura: ${sesion.notasApertura}` : '',
      sesion.notasCierre ? `Cierre: ${sesion.notasCierre}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    doc.text(notasText.slice(0, 120), margin + 4, y + 9.5);
    y += 18;
  }

  // Signatures section
  const sigY = pageHeight - 34;
  const sigWidth = 70;

  // Signature 1: Cajero
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, sigY, margin + 10 + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Firma Cajero: ${sesion.cajeroNombre}`, margin + 10 + sigWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Código / C.C.: ${sesion.cajeroId}`, margin + 10 + sigWidth / 2, sigY + 8, { align: 'center' });

  // Signature 2: Supervisor
  const sig2X = pageWidth - margin - sigWidth - 10;
  doc.line(sig2X, sigY, sig2X + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Firma Supervisor / Administrador', sig2X + sigWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(sesion.supervisorCierre || 'Administración Central', sig2X + sigWidth / 2, sigY + 8, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Control Tributario y Arqueo Fiscal • RestoFlow GastroBar Colombia • Fecha: ${new Date().toLocaleString('es-CO')}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}

/**
 * Genera el Tiquete Térmico de Cierre de Caja Z (80mm) en Pesos Colombianos (COP)
 */
export function generateCashClosingThermalPDF(
  details: CashClosingDetails,
  company: DianCompanyInfo = getSavedRestaurantInfo()
): jsPDF {
  const { sesion } = details;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200],
  });

  let y = 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(company.nombreComercial || company.razonSocial, 40, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIT: ${company.nit}-${company.digitoVerificacion} • ${company.ciudad}`, 40, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REPORTE Z - CIERRE FISCAL DE CAJA', 40, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`ID SESIÓN: ${sesion.id}`, 40, y, { align: 'center' });

  y += 3.5;
  doc.text(`FECHA: ${new Date().toLocaleString('es-CO')}`, 40, y, { align: 'center' });

  y += 3;
  doc.text('------------------------------------------------', 40, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text(`CAJERO: ${sesion.cajeroNombre}`, 5, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`TURNO: ${sesion.turno}`, 5, y);
  y += 4;
  doc.text(
    `APERTURA: ${new Date(sesion.fechaApertura).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
    5,
    y
  );
  if (sesion.fechaCierre) {
    y += 4;
    doc.text(
      `CIERRE: ${new Date(sesion.fechaCierre).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
      5,
      y
    );
  }

  y += 4;
  doc.text('------------------------------------------------', 40, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('FONDO BASE INICIAL:', 5, y);
  doc.text(formatCOP(sesion.montoBase), 75, y, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Ventas Efectivo (+):', 5, y);
  doc.text(formatCOP(sesion.totalVentasEfectivo), 75, y, { align: 'right' });

  y += 4;
  doc.text('Entradas manuales (+):', 5, y);
  doc.text(formatCOP(sesion.totalEntradasManuales), 75, y, { align: 'right' });

  y += 4;
  doc.text('Salidas / Gastos (-):', 5, y);
  doc.text(formatCOP(sesion.totalSalidasManuales), 75, y, { align: 'right' });

  y += 4;
  doc.text('------------------------------------------------', 40, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('EFECTIVO ESPERADO:', 5, y);
  doc.text(formatCOP(sesion.efectivoEsperado), 75, y, { align: 'right' });

  if (sesion.efectivoReal !== undefined) {
    y += 4.5;
    doc.text('EFECTIVO CONTADO:', 5, y);
    doc.text(formatCOP(sesion.efectivoReal), 75, y, { align: 'right' });

    y += 4.5;
    const dif = sesion.diferencia ?? 0;
    doc.text('DIFERENCIA:', 5, y);
    if (Math.abs(dif) < 1) {
      doc.text('$ 0 (CUADRADO)', 75, y, { align: 'right' });
    } else {
      doc.text(
        `${dif > 0 ? '+' : ''}${formatCOP(dif)} (${dif > 0 ? 'SOBRANTE' : 'FALTANTE'})`,
        75,
        y,
        { align: 'right' }
      );
    }
  }

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.text('VENTAS EN OTROS MEDIOS:', 5, y);
  y += 4;
  doc.text('Tarjetas Débito/Crédito:', 5, y);
  doc.text(formatCOP(sesion.totalVentasTarjeta), 75, y, { align: 'right' });

  y += 4;
  doc.text('Transferencia / QR:', 5, y);
  doc.text(formatCOP(sesion.totalVentasTransferencia), 75, y, { align: 'right' });

  const totalGen =
    sesion.totalVentasEfectivo + sesion.totalVentasTarjeta + sesion.totalVentasTransferencia;
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL VENTAS DEL TURNO:', 5, y);
  doc.text(formatCOP(totalGen, true), 75, y, { align: 'right' });

  y += 6;
  doc.text('================================================', 40, y, { align: 'center' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('_____________________________', 40, y, { align: 'center' });
  y += 4;
  doc.text(`Firma Cajero: ${sesion.cajeroNombre}`, 40, y, { align: 'center' });

  return doc;
}

/**
 * Descarga del Reporte de Cierre de Caja
 */
export function downloadCashClosingPDF(
  details: CashClosingDetails,
  format: 'executive' | 'thermal' = 'executive',
  company: DianCompanyInfo = getSavedRestaurantInfo()
) {
  const doc =
    format === 'executive'
      ? generateCashClosingExecutivePDF(details, company)
      : generateCashClosingThermalPDF(details, company);

  const filename = `Cierre_Caja_${details.sesion.id}_COP.pdf`;
  doc.save(filename);
}
