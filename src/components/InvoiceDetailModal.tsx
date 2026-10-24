import React, { useState } from 'react';
import { Factura, Venta, Comanda } from '../types/restaurant';
import {
  X,
  FileDown,
  Printer,
  CheckCircle,
  Receipt,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  UtensilsCrossed,
  Info,
  DollarSign,
  Share2,
  ShieldCheck,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import {
  resolveInvoiceDetails,
  downloadInvoicePDF,
  generateThermalTicketPDF,
} from '../services/invoicePdfService';
import { formatCOP, DIAN_COMPANY_INFO, getSavedRestaurantInfo } from '../utils/colombiaFiscal';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  factura: Factura | null;
  ventas: Venta[];
  comandas?: Comanda[];
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  factura,
  ventas,
  comandas = [],
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen || !factura) return null;

  const company = getSavedRestaurantInfo();
  const details = resolveInvoiceDetails(factura, ventas, comandas);

  const handleDownloadExecutive = () => {
    try {
      downloadInvoicePDF(details, company);
      setDownloadSuccess('Factura Electrónica DIAN (Formato Oficial A4) descargada exitosamente');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const handleDownloadTicket = () => {
    try {
      const doc = generateThermalTicketPDF(details, company);
      doc.save(`Ticket_DIAN_${details.factura.idFactura}_COP.pdf`);
      setDownloadSuccess('Documento Equivalente POS (Térmico 80mm) descargado exitosamente');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Error generating Ticket PDF:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Factura Electrónica #{factura.idFactura}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    factura.estado === 'Emitida'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {factura.estado === 'Emitida' ? 'APROBADA DIAN' : 'ANULADA'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono font-bold">
                  COLOMBIA (COP)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Emitida el {factura.fecha} • Comprobante {factura.idVenta} • Res. DIAN {DIAN_COMPANY_INFO.resolucionDianNumero}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-in fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Client & Transaction Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Adquirente / Cliente (DIAN)
              </span>
              <div className="text-sm font-bold text-white">
                {factura.nombreCliente || details.comanda?.clienteNombre || 'Consumidor Final'}
              </div>
              <div className="text-zinc-400">
                NIT / Cédula: <span className="font-mono text-zinc-200">{factura.nitCliente || '222222222222'}</span>
              </div>
              <div className="text-zinc-400">
                Forma de Pago: <span className="text-zinc-200 font-medium">1 - Contado</span>
              </div>
            </div>

            {/* Operation Box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Operación & Ubicación
              </span>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Mesa asignada:</span>
                <span className="font-bold text-white">Mesa #{details.mesaNumero}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Comanda origen:</span>
                <span className="font-mono text-zinc-200">{details.comanda?.idComanda || details.venta?.idComanda || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Medio de pago:</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                  {details.metodoPago === 'Tarjeta' && <CreditCard className="w-3 h-3" />}
                  {details.metodoPago === 'Efectivo' && <Banknote className="w-3 h-3" />}
                  {details.metodoPago === 'Transferencia' && <Smartphone className="w-3 h-3" />}
                  {details.metodoPago}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Order Breakdown (Detalles del Pedido) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                Detalles del Pedido ({details.items.length} {details.items.length === 1 ? 'producto' : 'productos'})
              </h4>
              <span className="text-[11px] text-zinc-500">Mesa #{details.mesaNumero}</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-semibold">
                    <th className="py-2.5 px-3">Cant</th>
                    <th className="py-2.5 px-3">Descripción</th>
                    <th className="py-2.5 px-3 text-right">Precio Unit</th>
                    <th className="py-2.5 px-3 text-right">Total COP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {details.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {item.cantidad}x
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white">{item.nombre}</div>
                        {item.notas && (
                          <div className="text-[10px] text-zinc-400 italic">
                            Nota: {item.notas}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                        {formatCOP(item.precio)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-200">
                        {formatCOP(item.precio * item.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown (Desglose de Montos - Normativa DIAN Colombia) */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Desglose Tributario DIAN (Estatuto Tributario Colombia)
            </h4>

            <div className="flex items-center justify-between text-zinc-400">
              <span>Subtotal (Base Gravable):</span>
              <span className="font-mono text-white">{formatCOP(details.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span>Impuesto Nacional al Consumo (INC 8% Art. 512-1):</span>
              <span className="font-mono text-white">{formatCOP(details.impuesto)}</span>
            </div>

            {details.propina > 0 && (
              <div className="flex items-center justify-between text-zinc-400">
                <span>Propina Voluntaria (Ley 1935 de 2018):</span>
                <span className="font-mono text-amber-400">+{formatCOP(details.propina)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm">
              <span className="font-bold text-white">TOTAL FACTURADO:</span>
              <span className="font-mono font-black text-amber-400 text-base">
                {formatCOP(details.total, true)}
              </span>
            </div>
          </div>

          {/* CUFE & DIAN Verification Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Código Único de Facturación Electrónica (CUFE)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">DIAN Validado</span>
            </div>
            <p className="font-mono text-[10px] text-zinc-400 bg-zinc-900/90 p-2 rounded-xl break-all border border-zinc-800/80">
              {details.cufe}
            </p>
          </div>

          {/* Legal / Fiscal Notice */}
          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex items-start gap-2.5 text-zinc-500 text-[11px]">
            <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
            <p>
              Documento tributario homologado conforme a la Resolución DIAN 000165 de 2023.
              Autorización de Facturación N° {DIAN_COMPANY_INFO.resolucionDianNumero}.
              Rango {DIAN_COMPANY_INFO.prefijoFactura}-{DIAN_COMPANY_INFO.rangoDesde} al {DIAN_COMPANY_INFO.prefijoFactura}-{DIAN_COMPANY_INFO.rangoHasta}.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500">
            Descarga en formato oficial para presentación tributaria o impresión en punto de venta
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadTicket}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
              title="Descargar tiquete térmico para impresora de 80mm"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              Ticket Térmico (80mm)
            </button>

            <button
              onClick={handleDownloadExecutive}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition"
              title="Descargar factura en formato oficial A4"
            >
              <FileDown className="w-3.5 h-3.5" />
              Factura PDF Oficial (A4)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
