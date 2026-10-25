import React, { useState, useMemo } from 'react';
import {
  History,
  Users,
  Filter,
  Search,
  Download,
  ShieldCheck,
  Receipt,
  UtensilsCrossed,
  ChefHat,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Table as TableIcon,
  List,
} from 'lucide-react';
import { AuditLogEntry, StaffUser, StaffRole, AuditActionCategory } from '../types/restaurant';
import { formatCOP } from '../utils/colombiaFiscal';

interface DashboardAuditLogProps {
  auditLogs: AuditLogEntry[];
  staffUsers: StaffUser[];
}

export const DashboardAuditLog: React.FC<DashboardAuditLogProps> = ({
  auditLogs,
  staffUsers,
}) => {
  const [selectedUser, setSelectedUser] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // User filter
      if (selectedUser !== 'todos' && log.usuarioId !== selectedUser) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'todos') {
        if (log.categoria) {
          if (log.categoria !== selectedCategory) return false;
        } else {
          // Fallback inference if category not explicitly set
          const actLower = log.accion.toLowerCase();
          const detLower = (log.detalles || '').toLowerCase();
          if (selectedCategory === 'comandas' && !actLower.includes('comanda') && !detLower.includes('comanda')) return false;
          if (selectedCategory === 'caja' && !actLower.includes('caja') && !detLower.includes('caja') && !actLower.includes('turno')) return false;
          if (selectedCategory === 'menu' && !actLower.includes('menú') && !actLower.includes('menu') && !actLower.includes('plato')) return false;
          if (selectedCategory === 'ventas' && !actLower.includes('cobro') && !actLower.includes('factura') && !actLower.includes('venta')) return false;
          if (selectedCategory === 'administracion' && !actLower.includes('fiscal') && !actLower.includes('sistema') && !actLower.includes('usuario')) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchUser = log.usuarioNombre.toLowerCase().includes(term);
        const matchAction = log.accion.toLowerCase().includes(term);
        const matchDetails = (log.detalles || '').toLowerCase().includes(term);
        const matchRole = log.rol.toLowerCase().includes(term);
        const matchMesa = log.mesaNumero ? `mesa ${log.mesaNumero}`.includes(term) || `#${log.mesaNumero}`.includes(term) : false;
        const matchComanda = log.comandaId ? log.comandaId.toLowerCase().includes(term) : false;

        if (!matchUser && !matchAction && !matchDetails && !matchRole && !matchMesa && !matchComanda) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, selectedUser, selectedCategory, searchTerm]);

  // Format relative time
  const getRelativeTime = (isoString: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffMs = now - past;
      const diffMin = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMin / 60);

      if (diffMin < 1) return 'Hace un momento';
      if (diffMin === 1) return 'Hace 1 minuto';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHours === 1) return 'Hace 1 hora';
      if (diffHours < 24) return `Hace ${diffHours} horas`;
      return new Date(isoString).toLocaleDateString('es-CO', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Badge helpers
  const getRoleStyle = (rol: StaffRole) => {
    switch (rol) {
      case 'Administrador':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          icon: ShieldCheck,
          label: 'Admin',
        };
      case 'Cajero':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          icon: Receipt,
          label: 'Cajero',
        };
      case 'Mesero':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: UtensilsCrossed,
          label: 'Mesero',
        };
      case 'Cocina':
        return {
          bg: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
          icon: ChefHat,
          label: 'Cocina',
        };
    }
  };

  const getCategoryBadge = (cat?: AuditActionCategory, accion?: string) => {
    const act = (accion || '').toLowerCase();
    if (cat === 'comandas' || act.includes('comanda')) {
      return {
        label: 'Comandas & Cocina',
        color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      };
    }
    if (cat === 'caja' || act.includes('caja') || act.includes('turno')) {
      return {
        label: 'Caja & Cierre Z',
        color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    }
    if (cat === 'menu' || act.includes('menú') || act.includes('plato')) {
      return {
        label: 'Menú & Precios',
        color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    }
    if (cat === 'ventas' || act.includes('cobro') || act.includes('factura')) {
      return {
        label: 'Ventas & Facturas',
        color: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      };
    }
    return {
      label: 'Administración',
      color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    };
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Fecha/Hora', 'Usuario', 'Rol', 'Categoría', 'Acción', 'Detalles', 'Mesa', 'Comanda', 'Monto'];
    const rows = filteredLogs.map((log) => [
      `"${new Date(log.fecha).toLocaleString('es-CO')}"`,
      `"${log.usuarioNombre}"`,
      `"${log.rol}"`,
      `"${log.categoria || 'Operación'}"`,
      `"${log.accion.replace(/"/g, '""')}"`,
      `"${(log.detalles || '').replace(/"/g, '""')}"`,
      log.mesaNumero ? `Mesa ${log.mesaNumero}` : '',
      log.comandaId || '',
      log.monto ? `${log.monto}` : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_restaurante_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white tracking-tight">
                Historial de Auditoría & Trazabilidad de Usuarios
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {filteredLogs.length} eventos registrados
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Registro inmutable de cambios de estado en comandas, cierres Z de caja, modificaciones al menú y acciones de personal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Toggle Timeline vs Table */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'timeline'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Línea de Tiempo"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Línea de Tiempo</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition shadow-sm disabled:opacity-40"
            title="Descargar registro de auditoría en formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
        
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, mesa, comanda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 placeholder-zinc-500"
          />
        </div>

        {/* Filter by User */}
        <div className="sm:col-span-4 relative">
          <div className="relative">
            <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
            >
              <option value="todos">Todos los Usuarios ({staffUsers.length})</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter by Action Category */}
        <div className="sm:col-span-4 relative">
          <div className="relative">
            <SlidersHorizontal className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
            >
              <option value="todos">Todos los Tipos de Acción</option>
              <option value="comandas">Comandas & Cocina (Estados, Preparación)</option>
              <option value="caja">Caja & Cierres Z (Arqueos, Turnos)</option>
              <option value="menu">Modificaciones al Menú & Precios</option>
              <option value="ventas">Ventas, Facturas & Pagos</option>
              <option value="administracion">Administración & Sistema</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-center space-y-2">
          <History className="w-8 h-8 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-300">No se encontraron registros de auditoría</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Prueba ajustando los filtros de usuario o tipo de acción, o el término de búsqueda.
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
          {filteredLogs.map((log) => {
            const roleStyle = getRoleStyle(log.rol);
            const RoleIcon = roleStyle.icon;
            const categoryBadge = getCategoryBadge(log.categoria, log.accion);
            const userObj = staffUsers.find((u) => u.id === log.usuarioId);

            return (
              <div key={log.id} className="relative group">
                {/* Node icon on timeline rail */}
                <div className="absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full bg-zinc-900 border-2 border-amber-500/60 flex items-center justify-center shadow">
                  <div className="w-2 h-2 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                </div>

                {/* Card */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition shadow-sm space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    {/* User and Role */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                          userObj?.avatarColor || 'from-zinc-700 to-zinc-800'
                        } flex items-center justify-center font-bold text-white text-xs shadow shrink-0`}
                      >
                        {log.usuarioNombre.charAt(0)}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs">
                          {log.usuarioNombre}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${roleStyle.bg}`}
                        >
                          <RoleIcon className="w-2.5 h-2.5" />
                          <span>{roleStyle.label}</span>
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryBadge.color}`}
                        >
                          {categoryBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono shrink-0">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="text-zinc-400 font-semibold">{getRelativeTime(log.fecha)}</span>
                      <span>•</span>
                      <span>{new Date(log.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Action Title and Details */}
                  <div className="pl-9 space-y-1">
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2 flex-wrap">
                      <span>{log.accion}</span>
                      {log.mesaNumero && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-normal border border-zinc-700">
                          Mesa #{log.mesaNumero}
                        </span>
                      )}
                      {log.comandaId && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-normal border border-zinc-700">
                          {log.comandaId}
                        </span>
                      )}
                      {log.monto && log.monto > 0 && (
                        <span className="text-emerald-400 font-mono font-bold text-[11px]">
                          {formatCOP(log.monto)}
                        </span>
                      )}
                    </h4>

                    {log.detalles && (
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60 font-mono text-[11px]">
                        {log.detalles}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Detalles</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredLogs.map((log) => {
                const roleStyle = getRoleStyle(log.rol);
                const RoleIcon = roleStyle.icon;
                const categoryBadge = getCategoryBadge(log.categoria, log.accion);

                return (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                      <div className="font-semibold text-zinc-200">
                        {new Date(log.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {new Date(log.fecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {log.usuarioNombre}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${roleStyle.bg}`}
                      >
                        <RoleIcon className="w-2.5 h-2.5" />
                        <span>{roleStyle.label}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryBadge.color}`}
                      >
                        {categoryBadge.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-amber-300">
                      {log.accion}
                    </td>

                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] max-w-xs truncate">
                      {log.detalles || '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {log.monto ? formatCOP(log.monto) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Summary */}
      <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
        <span className="font-mono text-[11px]">
          Mostrando <strong className="text-zinc-200">{filteredLogs.length}</strong> de <strong className="text-zinc-200">{auditLogs.length}</strong> acciones auditadas
        </span>
        <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Trazabilidad activa por usuario y turno
        </span>
      </div>

    </div>
  );
};
