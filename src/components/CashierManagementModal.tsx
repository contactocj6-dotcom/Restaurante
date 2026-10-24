import React, { useState } from 'react';
import { Cajero, CajeroRol } from '../types/restaurant';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Phone,
  Hash,
  Sparkles,
} from 'lucide-react';

interface CashierManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cajeros: Cajero[];
  activeCajeroId: string;
  onSelectActiveCajero: (cajeroId: string) => void;
  onAddCajero: (newCajero: Omit<Cajero, 'id'>) => void;
  onToggleCajeroStatus: (cajeroId: string) => void;
}

const AVATAR_GRADIENTS = [
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-amber-600',
];

export const CashierManagementModal: React.FC<CashierManagementModalProps> = ({
  isOpen,
  onClose,
  cajeros,
  activeCajeroId,
  onSelectActiveCajero,
  onAddCajero,
  onToggleCajeroStatus,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [rol, setRol] = useState<CajeroRol>('Cajero Turno');
  const [telefono, setTelefono] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim()) {
      alert('Ingresa el nombre y código del cajero');
      return;
    }

    const randomColor =
      AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];

    onAddCajero({
      nombre: nombre.trim(),
      codigo: codigo.trim(),
      rol,
      telefono: telefono.trim() || undefined,
      activo: true,
      avatarColor: randomColor,
    });

    setNombre('');
    setCodigo('');
    setTelefono('');
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Equipo de Cajeros</h2>
              <p className="text-xs text-zinc-400">
                Administra los cajeros autorizados para operar caja y turnos
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add Cashier Toggle */}
          {!isAddingNew ? (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-900 border border-dashed border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/80 text-xs font-bold text-amber-400 transition"
            >
              <UserPlus className="w-4 h-4" />
              + Registrar Nuevo Cajero / Usuario de Caja
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Nuevo Cajero
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Sofía Valenzuela"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Código / PIN de Acceso
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej. 105"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">Rol</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as CajeroRol)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cajero Turno">Cajero Turno</option>
                    <option value="Cajero Principal">Cajero Principal</option>
                    <option value="Supervisor de Caja">Supervisor de Caja</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow transition"
                >
                  Guardar Cajero
                </button>
              </div>
            </form>
          )}

          {/* List of Cashiers */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Cajeros Registrados ({cajeros.length})
            </h3>

            <div className="space-y-2">
              {cajeros.map((caj) => {
                const isCurrentActive = activeCajeroId === caj.id;
                return (
                  <div
                    key={caj.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                      isCurrentActive
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white bg-gradient-to-tr ${
                          caj.avatarColor || 'from-amber-500 to-orange-600'
                        }`}
                      >
                        {caj.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{caj.nombre}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            PIN: {caj.codigo}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 uppercase">
                              Activo en Sesión
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          <span>{caj.rol}</span>
                          {caj.telefono && <span>• {caj.telefono}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrentActive && caj.activo && (
                        <button
                          type="button"
                          onClick={() => onSelectActiveCajero(caj.id)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                        >
                          Asignar Turno
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleCajeroStatus(caj.id)}
                        className={`p-1.5 rounded-xl border transition ${
                          caj.activo
                            ? 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                            : 'text-zinc-500 hover:bg-zinc-800 border-zinc-800'
                        }`}
                        title={caj.activo ? 'Desactivar Cajero' : 'Activar Cajero'}
                      >
                        {caj.activo ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
