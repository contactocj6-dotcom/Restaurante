import React, { useState } from 'react';
import { SesionCaja, MovimientoCaja, Venta, Factura, DenominacionConteo } from '../types/restaurant';
import {
  X,
  Lock,
  DollarSign,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Printer,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Receipt,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  downloadCashClosingPDF,
  CashClosingDetails,
} from '../services/cashRegisterPdfService';
import { formatCOP } from '../utils/colombiaFiscal';

interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  sesion: SesionCaja;
  movimientos: MovimientoCaja[];
  ventas: Venta[];
  facturas: Factura[];
  onConfirmClose: (closingData: {
    efectivoReal: number;
    diferencia: number;
    notasCierre?: string;
    supervisorCierre?: string;
    desgloseConteo?: DenominacionConteo[];
  }) => void;
}

const DENOMINACIONES = [
  { valor: 100, label: '$100 Billetes' },
  { valor: 50, label: '$50 Billetes' },
  { valor: 20, label: '$20 Billetes' },
  { valor: 10, label: '$10 Billetes' },
  { valor: 5, label: '$5 Billetes' },
  { valor: 1, label: '$1 Monedas / Billetes' },
  { valor: 0.5, label: '$0.50 Monedas' },
  { valor: 0.25, label: '$0.25 Monedas' },
];

export const CloseCashModal: React.FC<CloseCashModalProps> = ({
  isOpen,
  onClose,
  sesion,
  movimientos,
  ventas,
  facturas,
  onConfirmClose,
}) => {
  const [efectivoContado, setEfectivoContado] = useState<number>(sesion.efectivoEsperado);
  const [showDenomCalc, setShowDenomCalc] = useState<boolean>(false);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({});
  const [notasCierre, setNotasCierre] = useState<string>('Arqueo realizado y verificado.');
  const [supervisor, setSupervisor] = useState<string>('Administrador General');

  if (!isOpen) return null;

  const diferencia = efectivoContado - sesion.efectivoEsperado;
  const isExact = Math.abs(diferencia) < 0.01;
  const isSobrante = diferencia > 0.01;
  const isFaltante = diferencia < -0.01;

  const calculateBreakdownTotal = () => {
    return Object.entries(breakdown).reduce((acc, [valorStr, qty]) => {
      return acc + parseFloat(valorStr) * (qty || 0);
    }, 0);
  };

  const handleApplyCalculated = () => {
    const total = calculateBreakdownTotal();
    setEfectivoContado(total);
    setShowDenomCalc(false);
  };

  const currentDetails: CashClosingDetails = {
    sesion: {
      ...sesion,
      efectivoReal: efectivoContado,
      diferencia,
      notasCierre,
      supervisorCierre: supervisor,
    },
    movimientos,
    ventas,
    facturas,
  };

  const handleDownloadPDF = (format: 'executive' | 'thermal') => {
    downloadCashClosingPDF(currentDetails, format);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmClose({
      efectivoReal: Number(efectivoContado),
      diferencia: Number(diferencia),
      notasCierre: notasCierre.trim(),
      supervisorCierre: supervisor.trim(),
    });
    onClose();
  };

  const totalVentasTurno =
    sesion.totalVentasEfectivo + sesion.totalVentasTarjeta + sesion.totalVentasTransferencia;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Cierre de Caja & Arqueo de Turno
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {sesion.id}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cajero: <strong className="text-zinc-200">{sesion.cajeroNombre}</strong> • {sesion.turno}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-400 block uppercase">
                Base Inicial
              </span>
              <span className="text-lg font-black text-white font-mono mt-1 block">
                {formatCOP(sesion.montoBase)}
              </span>
              <span className="text-[10px] text-zinc-500">Fondo apertura</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] font-semibold text-emerald-400 block uppercase">
                Ventas Efectivo
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
                +{formatCOP(sesion.totalVentasEfectivo)}
              </span>
              <span className="text-[10px] text-zinc-500">
                +{formatCOP(sesion.totalEntradasManuales)} ent. manual
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] font-semibold text-rose-400 block uppercase">
                Salidas / Gastos
              </span>
              <span className="text-lg font-black text-rose-400 font-mono mt-1 block">
                -{formatCOP(sesion.totalSalidasManuales)}
              </span>
              <span className="text-[10px] text-zinc-500">Caja menor turno</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
              <span className="text-[10px] font-semibold text-indigo-300 block uppercase">
                Efectivo Esperado
              </span>
              <span className="text-lg font-black text-indigo-300 font-mono mt-1 block">
                {formatCOP(sesion.efectivoEsperado)}
              </span>
              <span className="text-[10px] text-indigo-400/80">Saldo en gaveta</span>
            </div>
          </div>

          {/* Physical Cash Count Section */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  Conteo Físico de Efectivo en Mano
                </h3>
                <p className="text-xs text-zinc-400">
                  Ingresa el monto contado físicamente en billetes y monedas
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDenomCalc(!showDenomCalc)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                {showDenomCalc ? 'Cerrar Desglose' : 'Calculadora de Billetes'}
              </button>
            </div>

            {/* Input and Live Difference Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                  Monto Físico Contado (COP sin decimales):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={efectivoContado || ''}
                    onChange={(e) => setEfectivoContado(Math.round(parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-xl font-black text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isExact
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isSobrante
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {isExact ? (
                  <CheckCircle2 className="w-7 h-7 flex-shrink-0 text-emerald-400" />
                ) : isSobrante ? (
                  <TrendingUp className="w-7 h-7 flex-shrink-0 text-sky-400" />
                ) : (
                  <AlertTriangle className="w-7 h-7 flex-shrink-0 text-rose-400" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {isExact
                      ? 'Arqueo Cuadrado Perfecto'
                      : isSobrante
                      ? 'Sobrante de Caja'
                      : 'Faltante de Caja'}
                  </div>
                  <div className="text-lg font-black font-mono mt-0.5">
                    {isExact
                      ? '$ 0'
                      : isSobrante
                      ? `+${formatCOP(diferencia)}`
                      : formatCOP(diferencia)}
                  </div>
                  <p className="text-[10px] opacity-80">
                    {isExact
                      ? 'El dinero físico coincide exactamente con el sistema'
                      : isSobrante
                      ? 'Hay más dinero físico en gaveta del registrado'
                      : 'Falta dinero físico respecto al registro'}
                  </p>
                </div>
              </div>
            </div>

            {/* Denomination Breakdown */}
            {showDenomCalc && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold border-b border-zinc-800 pb-2">
                  <span>Conteo por Denominación</span>
                  <span className="text-amber-400 font-mono font-bold">
                    Total: {formatCOP(calculateBreakdownTotal())}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DENOMINACIONES.map((den) => (
                    <div key={den.valor} className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-medium block truncate">
                        {den.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={breakdown[den.valor] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setBreakdown((prev) => ({ ...prev, [den.valor]: val }));
                        }}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-white text-center focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleApplyCalculated}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition"
                >
                  Usar Total Calculado ({formatCOP(calculateBreakdownTotal())})
                </button>
              </div>
            )}
          </div>

          {/* Electronic Payments Reconciliation */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-300 block">
              Consolidado de Facturación del Turno (Todos los medios)
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Efectivo Cobrado</span>
                <span className="font-bold text-white font-mono">
                  {formatCOP(sesion.totalVentasEfectivo)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Tarjetas POS</span>
                <span className="font-bold text-sky-400 font-mono">
                  {formatCOP(sesion.totalVentasTarjeta)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Transferencias / QR</span>
                <span className="font-bold text-purple-400 font-mono">
                  {formatCOP(sesion.totalVentasTransferencia)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-400 font-medium">Total Facturación Bruta:</span>
              <span className="text-amber-400 font-black font-mono text-sm">
                {formatCOP(totalVentasTurno)}
              </span>
            </div>
          </div>

          {/* Auditor / Supervisor & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Supervisor / Testigo del Cierre
              </label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                placeholder="Nombre del supervisor"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Observaciones del Arqueo
              </label>
              <input
                type="text"
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                placeholder="Ej. Sin novedades, entrega conforme..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick PDF Reports before closing */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-xs text-zinc-300">
              <span className="font-bold text-white block">Acta Oficial de Cierre</span>
              <span className="text-[11px] text-zinc-500">
                Descarga el informe completo con firmas y desglose
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPDF('executive')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                title="Descargar Acta A4 con firmas"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                Descargar Acta A4
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('thermal')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                title="Descargar Ticket Térmico Z"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                Ticket 80mm
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition"
            >
              <Lock className="w-4 h-4" />
              Finalizar y Cerrar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
