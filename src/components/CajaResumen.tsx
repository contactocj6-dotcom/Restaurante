import React from 'react';
import { SesionCaja, Venta } from '../types/restaurant';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  LockOpen,
  Lock,
  ArrowUpRight,
  User,
  Clock,
  Sparkles,
  Coins,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import { formatCOP } from '../utils/colombiaFiscal';

export interface CajaResumenProps {
  sesionCaja?: SesionCaja | null;
  ventas?: Venta[];
  onOpenCash?: () => void;
  onViewDetails?: () => void;
  className?: string;
  showBreakdownBar?: boolean;
}

export const CajaResumen: React.FC<CajaResumenProps> = ({
  sesionCaja,
  ventas = [],
  onOpenCash,
  onViewDetails,
  className = '',
  showBreakdownBar = true,
}) => {
  const isCajaAbierta = sesionCaja && sesionCaja.estado === 'Abierta';

  // Si hay sesión activa, usamos sus totales directos.
  const sessionSales = sesionCaja
    ? ventas.filter((v) => v.sesionCajaId === sesionCaja.id)
    : [];

  const rawEfectivo = sesionCaja
    ? sesionCaja.totalVentasEfectivo ||
      sessionSales
        .filter((v) => v.metodoPago === 'Efectivo')
        .reduce((sum, v) => sum + v.monto, 0)
    : 0;

  const rawTarjeta = sesionCaja
    ? sesionCaja.totalVentasTarjeta ||
      sessionSales
        .filter((v) => v.metodoPago === 'Tarjeta')
        .reduce((sum, v) => sum + v.monto, 0)
    : 0;

  const rawTransferencia = sesionCaja
    ? sesionCaja.totalVentasTransferencia ||
      sessionSales
        .filter((v) => v.metodoPago === 'Transferencia')
        .reduce((sum, v) => sum + v.monto, 0)
    : 0;

  const totalVentasSesion = Math.round(rawEfectivo + rawTarjeta + rawTransferencia);

  // Proporciones para la barra visual
  const pctEfectivo = totalVentasSesion > 0 ? Math.round((rawEfectivo / totalVentasSesion) * 100) : 0;
  const pctTarjeta = totalVentasSesion > 0 ? Math.round((rawTarjeta / totalVentasSesion) * 100) : 0;
  const pctTransferencia =
    totalVentasSesion > 0 ? Math.max(0, 100 - pctEfectivo - pctTarjeta) : 0;

  // Fondo Base y Efectivo Esperado en gaveta
  const montoBase = sesionCaja ? sesionCaja.montoBase || 0 : 0;
  const efectivoEnGaveta = sesionCaja
    ? sesionCaja.efectivoEsperado ||
      montoBase +
        rawEfectivo +
        (sesionCaja.totalEntradasManuales || 0) -
        (sesionCaja.totalSalidasManuales || 0)
    : 0;

  return (
    <div
      className={`bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Status and Cashier info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
              isCajaAbierta
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60'
            }`}
          >
            {isCajaAbierta ? (
              <LockOpen className="w-5 h-5 animate-pulse" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Resumen de Caja Actual (Pesos Colombianos - COP)
              </h3>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isCajaAbierta
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {isCajaAbierta ? 'Turno Activo' : 'Caja Cerrada'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
              {isCajaAbierta && sesionCaja ? (
                <>
                  <span className="flex items-center gap-1 text-zinc-300">
                    <User className="w-3 h-3 text-amber-400" />
                    {sesionCaja.cajeroNombre}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {sesionCaja.turno}
                  </span>
                </>
              ) : (
                <span>No hay sesión de caja en curso. Abre la caja con Base para registrar cobros.</span>
              )}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {!isCajaAbierta && onOpenCash && (
            <button
              onClick={onOpenCash}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              Abrir Caja con Base
            </button>
          )}

          {isCajaAbierta && onViewDetails && (
            <button
              onClick={onViewDetails}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              Ver Arqueo Completo
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid: Efectivo, Tarjeta, Transferencia y Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: EFECTIVO */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-emerald-500/20 hover:border-emerald-500/40 transition flex flex-col justify-between group shadow-sm">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 group-hover:scale-105 transition">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {pctEfectivo}% ventas
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Efectivo
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {formatCOP(rawEfectivo)}
              </span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Gaveta física:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatCOP(efectivoEnGaveta)}
            </span>
          </div>
        </div>

        {/* CARD 2: TARJETA */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-indigo-500/20 hover:border-indigo-500/40 transition flex flex-col justify-between group shadow-sm">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 group-hover:scale-105 transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {pctTarjeta}% ventas
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Tarjeta
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {formatCOP(rawTarjeta)}
              </span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Datafono POS:</span>
            <span className="font-mono font-bold text-indigo-300">
              Crédito / Débito
            </span>
          </div>
        </div>

        {/* CARD 3: TRANSFERENCIA */}
        <div className="p-4 rounded-2xl bg-zinc-950/70 border border-cyan-500/20 hover:border-cyan-500/40 transition flex flex-col justify-between group shadow-sm">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 group-hover:scale-105 transition">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {pctTransferencia}% ventas
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Transferencia
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {formatCOP(rawTransferencia)}
              </span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Canales:</span>
            <span className="font-mono font-bold text-cyan-300">
              Bancolombia QR / Nequi / Daviplata
            </span>
          </div>
        </div>

        {/* CARD 4: TOTAL DE VENTAS DE LA SESIÓN */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/30 hover:border-amber-500/50 transition flex flex-col justify-between group shadow-sm">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              100% Turno
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider block">
              Total Ventas Sesión
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                {formatCOP(totalVentasSesion)}
              </span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Fondo Base:</span>
            <span className="font-mono font-bold text-zinc-300">
              {formatCOP(montoBase)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Proportional Distribution Bar */}
      {showBreakdownBar && totalVentasSesion > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800/60">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
            <span>Distribución por Medio de Pago</span>
            <span className="font-mono text-zinc-300">{formatCOP(totalVentasSesion, true)} acumulado</span>
          </div>
          <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-zinc-800">
            {rawEfectivo > 0 && (
              <div
                style={{ width: `${pctEfectivo}%` }}
                className="bg-emerald-500 rounded-sm transition-all duration-500"
                title={`Efectivo: ${formatCOP(rawEfectivo)} (${pctEfectivo}%)`}
              />
            )}
            {rawTarjeta > 0 && (
              <div
                style={{ width: `${pctTarjeta}%` }}
                className="bg-indigo-500 rounded-sm transition-all duration-500"
                title={`Tarjeta: ${formatCOP(rawTarjeta)} (${pctTarjeta}%)`}
              />
            )}
            {rawTransferencia > 0 && (
              <div
                style={{ width: `${pctTransferencia}%` }}
                className="bg-cyan-500 rounded-sm transition-all duration-500"
                title={`Transferencia / QR: ${formatCOP(rawTransferencia)} (${pctTransferencia}%)`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Efectivo ({formatCOP(rawEfectivo)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              Tarjeta ({formatCOP(rawTarjeta)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
              Transferencia / QR ({formatCOP(rawTransferencia)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
