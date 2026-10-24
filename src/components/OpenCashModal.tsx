import React, { useState } from 'react';
import { Cajero, TurnoTipo, DenominacionConteo } from '../types/restaurant';
import {
  X,
  LockOpen,
  DollarSign,
  User,
  Clock,
  Coins,
  FileText,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import {
  DENOMINACIONES_COLOMBIA,
  PRESET_BASES_COLOMBIA,
  formatCOP,
} from '../utils/colombiaFiscal';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  cajeros: Cajero[];
  activeCajero: Cajero | null;
  onConfirmOpen: (data: {
    cajeroId: string;
    cajeroNombre: string;
    turno: TurnoTipo;
    montoBase: number;
    notasApertura?: string;
    desglose?: DenominacionConteo[];
  }) => void;
  onOpenAddCashier?: () => void;
}

const PRESET_BASES = PRESET_BASES_COLOMBIA;
const DENOMINACIONES = DENOMINACIONES_COLOMBIA;

export const OpenCashModal: React.FC<OpenCashModalProps> = ({
  isOpen,
  onClose,
  cajeros,
  activeCajero,
  onConfirmOpen,
  onOpenAddCashier,
}) => {
  const [selectedCajeroId, setSelectedCajeroId] = useState<string>(
    activeCajero?.id || cajeros[0]?.id || ''
  );
  const [turno, setTurno] = useState<TurnoTipo>('Turno Mañana (08:00 - 15:00)');
  const [montoBase, setMontoBase] = useState<number>(200000);
  const [notasApertura, setNotasApertura] = useState<string>(
    'Fondo base entregado en gaveta para cambio inicial en efectivo (COP).'
  );
  const [useBreakdown, setUseBreakdown] = useState<boolean>(false);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({
    50000: 2,
    20000: 3,
    10000: 3,
    2000: 5,
  });

  if (!isOpen) return null;

  const activeCajerosList = cajeros.filter((c) => c.activo);

  const calculateBreakdownTotal = () => {
    return Object.entries(breakdown).reduce((acc, [valorStr, qty]) => {
      return acc + parseFloat(valorStr) * (qty || 0);
    }, 0);
  };

  const handleApplyBreakdown = () => {
    const total = calculateBreakdownTotal();
    setMontoBase(total);
    setUseBreakdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cajero = cajeros.find((c) => c.id === selectedCajeroId);
    if (!cajero) return;

    if (montoBase < 0) {
      alert('El monto base inicial no puede ser negativo');
      return;
    }

    onConfirmOpen({
      cajeroId: cajero.id,
      cajeroNombre: cajero.nombre,
      turno,
      montoBase: Number(montoBase),
      notasApertura: notasApertura.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
              <LockOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Apertura de Caja & Turno
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Base Inicial
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Registra el cajero a cargo y el fondo de cambio en gaveta
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Cajero Responsable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" />
                Cajero Responsable del Turno
              </label>
              {onOpenAddCashier && (
                <button
                  type="button"
                  onClick={onOpenAddCashier}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition"
                >
                  + Registrar Nuevo Cajero
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeCajerosList.map((caj) => {
                const isSelected = selectedCajeroId === caj.id;
                return (
                  <button
                    key={caj.id}
                    type="button"
                    onClick={() => setSelectedCajeroId(caj.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white bg-gradient-to-tr ${
                        caj.avatarColor || 'from-amber-500 to-orange-600'
                      }`}
                    >
                      {caj.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{caj.nombre}</p>
                        <span className="text-[10px] text-zinc-500 font-mono">#{caj.codigo}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{caj.rol}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Turno / Horario */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Turno Operativo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Turno Mañana (08:00 - 15:00)',
                'Turno Tarde/Noche (15:00 - 23:00)',
                'Jornada Completa',
                'Turno Extra / Especial',
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTurno(t as TurnoTipo)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition ${
                    turno === t
                      ? 'bg-zinc-800 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Base Inicial (Fondo de Cambio) */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Monto Base Inicial (Fondo de Gaveta)
                </label>
                <p className="text-[11px] text-zinc-400">
                  Dinero en efectivo con el que abre la caja para cambio y sencillo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUseBreakdown(!useBreakdown)}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition"
              >
                <Calculator className="w-3.5 h-3.5" />
                {useBreakdown ? 'Ocultar Calculadora' : 'Desglosar Billetes'}
              </button>
            </div>

            {/* Quick Amounts */}
            <div className="flex flex-wrap gap-2">
              {PRESET_BASES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMontoBase(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    montoBase === preset
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {formatCOP(preset)}
                </button>
              ))}
            </div>

            {/* Direct Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400">
                $
              </span>
              <input
                type="number"
                step="1000"
                min="0"
                value={montoBase}
                onChange={(e) => setMontoBase(parseFloat(e.target.value) || 0)}
                placeholder="200000"
                className="w-full pl-9 pr-14 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-xl font-black text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                COP
              </span>
            </div>

            {/* Interactive Breakdown Calculator */}
            {useBreakdown && (
              <div className="mt-3 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold border-b border-zinc-800 pb-2">
                  <span>Conteo por Denominación (Colombia)</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    Subtotal: {formatCOP(calculateBreakdownTotal())}
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
                  onClick={handleApplyBreakdown}
                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl transition"
                >
                  Aplicar Total Calculado ({formatCOP(calculateBreakdownTotal())}) a la Base
                </button>
              </div>
            )}
          </div>

          {/* 4. Notas u Observaciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Observaciones de Apertura (Opcional)
            </label>
            <textarea
              rows={2}
              value={notasApertura}
              onChange={(e) => setNotasApertura(e.target.value)}
              placeholder="Ej. Recibido de tesorería, incluye rollo de monedas de 25ctvs..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Policy Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <p>
              Al abrir caja, todos los cobros en efectivo y medios electrónicos quedarán asociados al cajero seleccionado hasta el cierre formal del turno.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <LockOpen className="w-4 h-4" />
              Confirmar Apertura e Iniciar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
