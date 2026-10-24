import React, { useState } from 'react';
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
  KeyRound,
  UtensilsCrossed,
  Receipt,
  ChefHat,
  Search,
  Filter,
  History,
  Lock,
  Clock,
} from 'lucide-react';
import { StaffUser, StaffRole, AuditLogEntry, Comanda } from '../types/restaurant';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffUsers: StaffUser[];
  activeUser: StaffUser | null;
  comandas?: Comanda[];
  onSelectUser: (user: StaffUser) => void;
  onAddStaffUser: (user: Omit<StaffUser, 'id'>) => void;
  onUpdateStaffUser: (user: StaffUser) => void;
  onToggleStaffStatus: (userId: string) => void;
}

const AVATAR_GRADIENTS = [
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-amber-600',
];

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  staffUsers,
  activeUser,
  comandas = [],
  onSelectUser,
  onAddStaffUser,
  onUpdateStaffUser,
  onToggleStaffStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'nuevo' | 'auditoria'>('usuarios');
  const [roleFilter, setRoleFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form for new staff user
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [rol, setRol] = useState<StaffRole>('Mesero');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Editing PIN State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del colaborador');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      alert('El PIN de acceso debe tener mínimo 4 dígitos');
      return;
    }

    const randomColor =
      AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];

    onAddStaffUser({
      nombre: nombre.trim(),
      pin: pin.trim(),
      rol,
      activo: true,
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      avatarColor: randomColor,
      ultimoAcceso: new Date().toISOString(),
    });

    // Reset form
    setNombre('');
    setPin('');
    setRol('Mesero');
    setTelefono('');
    setEmail('');
    setActiveTab('usuarios');
  };

  const handleSavePin = (user: StaffUser) => {
    if (!newPin.trim() || newPin.length < 4) {
      alert('El nuevo PIN debe tener al menos 4 dígitos');
      return;
    }
    onUpdateStaffUser({
      ...user,
      pin: newPin.trim(),
    });
    setEditingUserId(null);
    setNewPin('');
  };

  const filteredUsers = staffUsers.filter((u) => {
    const matchesRole = roleFilter === 'Todos' || u.rol === roleFilter;
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.telefono && u.telefono.includes(searchTerm));
    return matchesRole && matchesSearch;
  });

  // Extract all audit logs from comandas
  const allAuditLogs: (AuditLogEntry & { comandaId: string; mesaNumero?: number })[] = [];
  comandas.forEach((c) => {
    if (c.historialCambios && c.historialCambios.length > 0) {
      c.historialCambios.forEach((h) => {
        allAuditLogs.push({
          ...h,
          comandaId: c.idComanda,
          mesaNumero: c.mesaNumero,
        });
      });
    } else {
      // Synthesize initial entry if exists
      if (c.meseroNombre) {
        allAuditLogs.push({
          id: `INIT-${c.idComanda}`,
          fecha: c.timestamp,
          usuarioId: c.meseroId || 'USR-004',
          usuarioNombre: c.meseroNombre,
          rol: 'Mesero',
          accion: 'Toma y apertura de comanda',
          detalles: `Mesa #${c.mesaNumero} • ${c.listaItems.length} ítems • Total: $${c.total}`,
          comandaId: c.idComanda,
          mesaNumero: c.mesaNumero,
        });
      }
    }
  });

  // Sort logs by newest first
  allAuditLogs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const getRoleIcon = (rol: StaffRole) => {
    switch (rol) {
      case 'Administrador':
        return ShieldCheck;
      case 'Cajero':
        return Receipt;
      case 'Mesero':
        return UtensilsCrossed;
      case 'Cocina':
        return ChefHat;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Equipo de Trabajo & Control de Acceso
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
                  MULTIUSUARIO & AUDITORÍA
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gestiona meseros, cocineros, cajeros y administradores con PIN individual y trazabilidad total
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-zinc-800 bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'usuarios'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Colaboradores ({staffUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nuevo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'nuevo'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Agregar Colaborador</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'auditoria'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Registro de Auditoría ({allAuditLogs.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: LISTADO DE COLABORADORES */}
          {activeTab === 'usuarios' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, correo o teléfono..."
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {(['Todos', 'Administrador', 'Cajero', 'Mesero', 'Cocina'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap ${
                        roleFilter === r
                          ? 'bg-zinc-800 text-white border-zinc-700'
                          : 'text-zinc-400 border-transparent hover:text-zinc-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Users */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {filteredUsers.map((u) => {
                  const RoleIcon = getRoleIcon(u.rol);
                  const isCurrent = activeUser?.id === u.id;
                  const isEditingPin = editingUserId === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 bg-zinc-950/60 ${
                        isCurrent
                          ? 'border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                          : u.activo
                          ? 'border-zinc-800/80 hover:border-zinc-700'
                          : 'border-zinc-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${
                              u.avatarColor || 'from-zinc-700 to-zinc-800'
                            } flex items-center justify-center font-black text-white text-base shadow shrink-0`}
                          >
                            {u.nombre.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm truncate">
                                {u.nombre}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  En Turno
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                              <RoleIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="font-semibold text-zinc-300">{u.rol}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="font-mono text-zinc-500">{u.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle */}
                        <button
                          type="button"
                          onClick={() => onToggleStaffStatus(u.id)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition ${
                            u.activo
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-emerald-500/10 hover:text-emerald-400'
                          }`}
                          title={u.activo ? 'Desactivar acceso' : 'Activar colaborador'}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>

                      {/* Contact & PIN details */}
                      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex items-center justify-between text-xs">
                        <div className="space-y-0.5 text-zinc-400">
                          {u.telefono && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              <span>{u.telefono}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[11px]">
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>
                              PIN de acceso:{' '}
                              <strong className="text-amber-300 font-mono tracking-wider">
                                {u.pin}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* PIN Edit Button */}
                        <div>
                          {isEditingPin ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                maxLength={6}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                placeholder="Nuevo PIN"
                                className="w-20 px-2 py-1 bg-zinc-950 border border-amber-500 rounded-lg text-xs font-mono text-amber-300 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePin(u)}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-[10px]"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="px-1.5 py-1 text-zinc-500 hover:text-white text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserId(u.id);
                                setNewPin(u.pin);
                              }}
                              className="text-[11px] text-zinc-400 hover:text-amber-400 font-semibold transition"
                            >
                              Cambiar PIN
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick select / Iniciar Turno button */}
                      {!isCurrent && u.activo && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectUser(u);
                            onClose();
                          }}
                          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-zinc-800 text-zinc-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Iniciar Sesión como {u.nombre}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AGREGAR NUEVO COLABORADOR */}
          {activeTab === 'nuevo' && (
            <form onSubmit={handleCreate} className="space-y-4 max-w-xl mx-auto animate-in fade-in">
              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-white font-semibold block mb-0.5">Nuevo Usuario para el Restaurante</strong>
                  Crea perfiles individuales para meseros, cocineros, cajeros o administradores. Cada uno usará su PIN de 4 dígitos para acceder a sus funciones y firmar cada comanda o cobro.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Mateo Gómez / Laura Restrepo"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Rol en el Restaurante *
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as StaffRole)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Mesero">🍽️ Mesero (Toma de pedidos y mesas)</option>
                    <option value="Cocina">👨‍🍳 Cocina (KDS y preparación)</option>
                    <option value="Cajero">💵 Cajero (Facturación y cobro)</option>
                    <option value="Administrador">👑 Administrador (Acceso total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    PIN Rápido de 4 Dígitos *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ej. 1234"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500 font-bold"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">PIN numérico para pantalla táctil</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Teléfono Móvil (Opcional)
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+57 312 000-0000"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@restoflow.com"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('usuarios')}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
                >
                  Guardar y Activar Colaborador
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REGISTRO DE AUDITORÍA / TRAZABILIDAD */}
          {activeTab === 'auditoria' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Historial de acciones registradas por cada mesero, cocinero y cajero:</span>
                <span className="font-mono text-zinc-500">{allAuditLogs.length} eventos</span>
              </div>

              {allAuditLogs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs bg-zinc-950/40 rounded-2xl border border-zinc-800/60">
                  <Clock className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                  No hay registros de auditoría aún. A medida que los colaboradores creen comandas o cocinen platos, quedarán aquí.
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {allAuditLogs.map((log) => {
                    const RoleIcon = getRoleIcon(log.rol);
                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 shrink-0 mt-0.5">
                            <RoleIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {log.usuarioNombre}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                                {log.rol}
                              </span>
                              {log.mesaNumero && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  Mesa #{log.mesaNumero}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-zinc-500">
                                {log.comandaId}
                              </span>
                            </div>
                            <p className="text-zinc-300 font-medium mt-1">
                              {log.accion}
                            </p>
                            {log.detalles && (
                              <p className="text-zinc-500 text-[11px] mt-0.5">
                                {log.detalles}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-[11px] text-zinc-400 block">
                            {new Date(log.fecha).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[10px] text-zinc-600 block">
                            {new Date(log.fecha).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Usuario actualmente activo: <strong className="text-white font-bold">{activeUser?.nombre || 'Ninguno'}</strong> ({activeUser?.rol || 'Sin rol'})</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
