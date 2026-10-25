import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  UtensilsCrossed,
  Layers,
  Users,
  Receipt,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToProduction: (options: { clearMenu: boolean; keepStaff: boolean }) => void;
  onRestoreDemoData: () => void;
  currentCounts: {
    comandas: number;
    ventas: number;
    menu: number;
    reservas: number;
  };
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  onResetToProduction,
  onRestoreDemoData,
  currentCounts,
}) => {
  const [clearMenu, setClearMenu] = useState(false);
  const [keepStaff, setKeepStaff] = useState(true);
  const [confirmStep, setConfirmStep] = useState<'options' | 'confirm_prod' | 'confirm_demo'>('options');

  if (!isOpen) return null;

  const handleExecuteProduction = () => {
    onResetToProduction({ clearMenu, keepStaff });
    setConfirmStep('options');
    onClose();
  };

  const handleExecuteDemo = () => {
    onRestoreDemoData();
    setConfirmStep('options');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Puesta a Cero / Modo Producción
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Limpia los datos de muestra para empezar a operar tu restaurante con información 100% real.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setConfirmStep('options');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-xs">
          
          {confirmStep === 'options' && (
            <>
              {/* Option A: Production Mode (Primary) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-700/40 shadow-lg space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        Opción 1: Iniciar en Blanco (Modo Producción Real)
                      </h3>
                      <p className="text-[11px] text-emerald-300/80">
                        Recomendado para comenzar a facturar y atender clientes reales.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary of what happens */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Todas las 12 mesas quedan <strong>Libres</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Comandas de prueba: <strong>0 activas</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Ventas y Facturas: <strong>0 registradas</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Caja: <strong>Lista para abrir turno</strong></span>
                  </div>
                </div>

                {/* Granular Configuration Checkboxes */}
                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
                    <input
                      type="checkbox"
                      checked={clearMenu}
                      onChange={(e) => setClearMenu(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500/30 w-4 h-4 bg-zinc-900"
                    />
                    <div>
                      <span className="font-bold text-white text-xs block">
                        Vaciar también los platos del menú ({currentCounts.menu} platos actuales)
                      </span>
                      <span className="text-[11px] text-zinc-400 leading-relaxed block mt-0.5">
                        {clearMenu
                          ? 'El menú quedará con 0 platos para que agregues tus propios productos desde cero.'
                          : 'Mantener platos de prueba como plantilla (podrás renombrarlos y cambiarles el precio rápidamente).'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
                    <input
                      type="checkbox"
                      checked={keepStaff}
                      onChange={(e) => setKeepStaff(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500/30 w-4 h-4 bg-zinc-900"
                    />
                    <div>
                      <span className="font-bold text-white text-xs block">
                        Conservar usuarios del equipo y Administrador
                      </span>
                      <span className="text-[11px] text-zinc-400 leading-relaxed block mt-0.5">
                        Mantiene tu usuario Administrador y colaboradores para que puedas seguir gestionando el terminal sin bloqueos.
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmStep('confirm_prod')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Empezar en Blanco (Modo Producción)</span>
                </button>
              </div>

              {/* Option B: Restore Demo Data */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>¿Quieres restaurar los datos de demostración?</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Recarga los platos, mesas ocupadas y comandas de ejemplo para demostraciones o entrenamiento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmStep('confirm_demo')}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 whitespace-nowrap transition"
                >
                  Restaurar Demo
                </button>
              </div>
            </>
          )}

          {/* Confirm Production Step */}
          {confirmStep === 'confirm_prod' && (
            <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-600/60 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-white">
                  ¿Confirmas iniciar en Modo Producción?
                </h3>
                <p className="text-zinc-300 text-xs mt-2 leading-relaxed max-w-md mx-auto">
                  Se vaciarán las comandas, historial de ventas, facturas y reservas de prueba. Las 12 mesas quedarán libres y la caja en cero lista para el primer turno.
                  {clearMenu && (
                    <strong className="block text-amber-400 mt-1">
                      ⚠️ También se eliminarán los platos del menú para crearlos desde cero.
                    </strong>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmStep('options')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                >
                  Volver atrás
                </button>

                <button
                  type="button"
                  onClick={handleExecuteProduction}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Sí, Limpiar e Iniciar Producción</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirm Restore Demo Step */}
          {confirmStep === 'confirm_demo' && (
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-white">
                  ¿Restaurar datos de demostración?
                </h3>
                <p className="text-zinc-400 text-xs mt-2 leading-relaxed max-w-md mx-auto">
                  Se cargarán los platos del menú, mesas con clientes de ejemplo, comandas activas y ventas de demostración.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmStep('options')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleExecuteDemo}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg transition"
                >
                  Restaurar Datos de Muestra
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Los cambios se guardan localmente en tu terminal en tiempo real.</span>
          <button
            type="button"
            onClick={() => {
              setConfirmStep('options');
              onClose();
            }}
            className="text-zinc-400 hover:text-white transition font-medium"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
