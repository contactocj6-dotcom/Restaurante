import React, { useState } from 'react';
import { MovimientoCajaTipo, PaymentMethod } from '../types/restaurant';
import {
  X,
  PlusCircle,
  MinusCircle,
  ShieldAlert,
  DollarSign,
  FileText,
  Tag,
  Receipt,
  User,
} from 'lucide-react';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'Entrada_Manual' | 'Salida_Gasto';
  activeCajeroNombre: string;
  activeCajeroId: string;
  onConfirmMovement: (data: {
    tipo: MovimientoCajaTipo;
    concepto: string;
    monto: number;
    metodoPago: PaymentMethod | 'Efectivo';
    comprobanteRef?: string;
  }) => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'Salida_Gasto',
  activeCajeroNombre,
  activeCajeroId,
  onConfirmMovement,
}) => {
  const [tipo, setTipo] = useState<MovimientoCajaTipo>(defaultType);
  const [monto, setMonto] = useState<number | ''>('');
  const [concepto, setConcepto] = useState<string>('');
  const [comprobanteRef, setComprobanteRef] = useState<string>('');

  if (!isOpen) return null;

  const isIngreso = tipo === 'Entrada_Manual';

  const quickConceptsIngreso = [
    'Reposición de sencillo / monedas desde tesorería',
    'Aporte de cambio en billetes pequeños',
    'Devolución de anticipo no utilizado',
  ];

  const quickConceptsEgreso = [
    'Compra urgente de hielo y limones (Caja Menor)',
    'Pago a proveedor de verdura de emergencia',
    'Compra de bolsas de delivery y descartables',
    'Retiro parcial de seguridad hacia caja fuerte',
    'Pago servicio de mensajería urgente',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }
    if (!concepto.trim()) {
      alert('Por favor ingresa un concepto o motivo');
      return;
    }

    onConfirmMovement({
      tipo,
      concepto: concepto.trim(),
      monto: Number(monto),
      metodoPago: 'Efectivo',
      comprobanteRef: comprobanteRef.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isIngreso
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {isIngreso ? <PlusCircle className="w-6 h-6" /> : <MinusCircle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isIngreso ? 'Ingreso Manual de Efectivo' : 'Salida / Gasto de Caja Menor'}
              </h2>
              <p className="text-xs text-zinc-400">
                Cajero: <strong className="text-zinc-200">{activeCajeroNombre}</strong>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Movement Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setTipo('Entrada_Manual')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                tipo === 'Entrada_Manual'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Entrada / Inyección (+)
            </button>
            <button
              type="button"
              onClick={() => setTipo('Salida_Gasto')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                tipo === 'Salida_Gasto' || tipo === 'Retiro_Seguridad'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Salida / Gasto (-)
            </button>
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Monto del Movimiento en Efectivo (COP sin decimales)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400">
                $
              </span>
              <input
                type="number"
                step="1000"
                min="100"
                value={monto}
                onChange={(e) => setMonto(e.target.value === '' ? '' : Math.round(parseFloat(e.target.value)))}
                placeholder="50000"
                className={`w-full pl-9 pr-4 py-3 bg-zinc-900/80 border rounded-xl text-xl font-black font-mono focus:outline-none ${
                  isIngreso
                    ? 'border-emerald-500/40 text-emerald-400 focus:border-emerald-500'
                    : 'border-rose-500/40 text-rose-400 focus:border-rose-500'
                }`}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Quick concept templates */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400">
              Conceptos habituales rápidos:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(isIngreso ? quickConceptsIngreso : quickConceptsEgreso).map((qc) => (
                <button
                  key={qc}
                  type="button"
                  onClick={() => setConcepto(qc)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition text-left"
                >
                  {qc}
                </button>
              ))}
            </div>
          </div>

          {/* Concepto Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Motivo o Concepto Detallado
            </label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej. Compra de limones y hielo para bar..."
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Reference Receipt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-400" />
              Comprobante / Recibo / Factura de Referencia (Opcional)
            </label>
            <input
              type="text"
              value={comprobanteRef}
              onChange={(e) => setComprobanteRef(e.target.value)}
              placeholder="Ej. REC-082, Factura prov. 49102"
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Buttons */}
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
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition ${
                isIngreso
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {isIngreso ? <PlusCircle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
              Registrar {isIngreso ? 'Entrada (+)' : 'Salida (-)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
