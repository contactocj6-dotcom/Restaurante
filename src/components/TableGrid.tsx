import React, { useState, useEffect } from 'react';
import { Table, Comanda, TableStatus } from '../types/restaurant';
import {
  Users,
  Clock,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Utensils,
  DollarSign,
  Filter,
  Calendar,
  UserCheck,
  ArrowRightLeft,
  Layers,
} from 'lucide-react';
import { formatCOP } from '../utils/colombiaFiscal';
import { TableTransferModal } from './TableTransferModal';

interface TableGridProps {
  tables: Table[];
  comandas: Comanda[];
  onOpenComandaForTable: (table: Table) => void;
  onOpenCheckoutForTable: (table: Table, comanda: Comanda) => void;
  onUpdateTableStatus: (tableId: string, status: TableStatus, clienteNombre?: string) => void;
  onAddTable: () => void;
  onOpenReservationForTable?: (table: Table) => void;
  onCheckInTable?: (table: Table) => void;
  onNavigateToReservations?: () => void;
  onTransferTable?: (sourceTableId: string, targetTableId: string) => void;
  onMergeTables?: (sourceTableId: string, targetTableId: string) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({
  tables,
  comandas,
  onOpenComandaForTable,
  onOpenCheckoutForTable,
  onUpdateTableStatus,
  onAddTable,
  onOpenReservationForTable,
  onCheckInTable,
  onNavigateToReservations,
  onTransferTable,
  onMergeTables,
}) => {
  const [filter, setFilter] = useState<'All' | TableStatus>('All');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [customCustomer, setCustomCustomer] = useState('');
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [tableToTransfer, setTableToTransfer] = useState<{ table: Table; comanda: Comanda } | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Mantener los tiempos transcurridos actualizados en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedTimeInfo = (timestamp?: string) => {
    if (!timestamp) {
      return {
        text: 'Recién abierta',
        shortText: 'Nuevo',
        minutes: 0,
        hours: 0,
        exactTime: '--:--',
        isWarning: false,
        isDanger: false,
      };
    }

    const startMs = new Date(timestamp).getTime();
    if (isNaN(startMs)) {
      return {
        text: 'Recién abierta',
        shortText: 'Nuevo',
        minutes: 0,
        hours: 0,
        exactTime: '--:--',
        isWarning: false,
        isDanger: false,
      };
    }

    const diffMs = Math.max(0, now - startMs);
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const remMinutes = totalMinutes % 60;
    const totalSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const d = new Date(timestamp);
    const exactTime = d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let text = '';
    let shortText = '';
    if (totalMinutes < 1) {
      text = `Menos de 1 min (${totalSeconds}s)`;
      shortText = '< 1 min';
    } else if (hours < 1) {
      text = `${totalMinutes} minuto${totalMinutes > 1 ? 's' : ''}`;
      shortText = `${totalMinutes} min`;
    } else {
      text = `${hours}h ${remMinutes}m`;
      shortText = `${hours}h ${remMinutes}m`;
    }

    return {
      text,
      shortText,
      minutes: totalMinutes,
      hours,
      exactTime,
      isWarning: totalMinutes >= 45 && totalMinutes < 75,
      isDanger: totalMinutes >= 75,
    };
  };

  const filteredTables = tables.filter((t) => {
    if (filter === 'All') return true;
    return t.estado === filter;
  });

  const getActiveComanda = (table: Table): Comanda | undefined => {
    return comandas.find(
      (c) => (c.idMesa === table.id || c.mesaNumero === table.numero) && c.estado !== 'Entregado'
    );
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'Libre':
        return {
          bg: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          glow: 'group-hover:border-emerald-500/50',
        };
      case 'Ocupada':
        return {
          bg: 'bg-amber-950/40 border-amber-800/60 text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          glow: 'group-hover:border-amber-500/50',
        };
      case 'Reservada':
        return {
          bg: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-400',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          glow: 'group-hover:border-indigo-500/50',
        };
    }
  };

  const freeCount = tables.filter((t) => t.estado === 'Libre').length;
  const occupiedCount = tables.filter((t) => t.estado === 'Ocupada').length;
  const reservedCount = tables.filter((t) => t.estado === 'Reservada').length;

  return (
    <div className="space-y-6">
      {/* Top Stats & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filter === 'All'
                ? 'bg-zinc-800 text-white border-zinc-700 shadow'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            Todas ({tables.length})
          </button>
          <button
            onClick={() => setFilter('Libre')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filter === 'Libre'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'text-zinc-400 border-transparent hover:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Libres ({freeCount})
          </button>
          <button
            onClick={() => setFilter('Ocupada')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filter === 'Ocupada'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'text-zinc-400 border-transparent hover:text-amber-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Ocupadas ({occupiedCount})
          </button>
          <button
            onClick={() => setFilter('Reservada')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filter === 'Reservada'
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                : 'text-zinc-400 border-transparent hover:text-indigo-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Reservadas ({reservedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToReservations && (
            <button
              onClick={onNavigateToReservations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800 text-indigo-300 font-semibold text-xs transition shadow-sm"
              title="Ir al módulo de reservas"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ver Reservas ({reservedCount})</span>
            </button>
          )}

          <button
            onClick={onAddTable}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Mesa</span>
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
        {filteredTables.map((table) => {
          const activeComanda = getActiveComanda(table);
          const style = getStatusColor(table.estado);
          const isOccupied = table.estado === 'Ocupada';
          const timeInfo = isOccupied && activeComanda ? getElapsedTimeInfo(activeComanda.timestamp) : null;
          const isHovered = hoveredTableId === table.id;

          return (
            <div
              key={table.id}
              onMouseEnter={() => setHoveredTableId(table.id)}
              onMouseLeave={() => setHoveredTableId(null)}
              className={`group relative rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 bg-zinc-900/90 shadow-lg flex flex-col justify-between ${style.glow} hover:shadow-xl hover:z-30`}
            >
              {/* Tooltip / Popover flotante al pasar el ratón sobre la mesa ocupada */}
              {isOccupied && activeComanda && timeInfo && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full z-40 w-72 pointer-events-none transition-all duration-200 ease-out transform ${
                    isHovered
                      ? 'opacity-100 scale-100 translate-y-[-100%]'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                  role="tooltip"
                >
                  <div className="bg-zinc-950/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl shadow-black/90 ring-1 ring-white/10 text-zinc-100 space-y-2.5">
                    {/* Header del Popover */}
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Tiempo de la Comanda</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {activeComanda.idComanda}
                      </span>
                    </div>

                    {/* Métrica destacada de tiempo transcurrido */}
                    <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                          Transcurrido
                        </span>
                        <span
                          className={`font-mono text-xl font-black ${
                            timeInfo.isDanger
                              ? 'text-rose-400'
                              : timeInfo.isWarning
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {timeInfo.text}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                          Hora de Apertura
                        </span>
                        <span className="font-mono text-xs font-semibold text-zinc-200">
                          {timeInfo.exactTime}
                        </span>
                      </div>
                    </div>

                    {/* Detalles de la comanda en curso */}
                    <div className="space-y-1 text-xs text-zinc-400">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Estado cocina:</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-200 font-mono">
                          {activeComanda.estado}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Ítems ordenados:</span>
                        <span className="font-mono text-zinc-300">
                          {activeComanda.listaItems.reduce((acc, it) => acc + it.cantidad, 0)} platos / bebidas
                        </span>
                      </div>
                      {activeComanda.meseroNombre && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">Mesero a cargo:</span>
                          <span className="font-semibold text-amber-300">
                            {activeComanda.meseroNombre}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                        <span className="text-zinc-400 font-medium">Consumo actual:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCOP(activeComanda.total)}
                        </span>
                      </div>
                    </div>

                    {/* Alertas visuales de tiempo prolongado */}
                    {timeInfo.isWarning && (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Mesa con comanda prolongada (+45 min).</span>
                      </div>
                    )}
                    {timeInfo.isDanger && (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Atención: Mesa ocupada hace más de 1h 15m.</span>
                      </div>
                    )}
                  </div>

                  {/* Flecha indicadora inferior del popover */}
                  <div className="w-3 h-3 bg-zinc-950 border-r border-b border-amber-500/40 transform rotate-45 mx-auto -mt-1.5 shadow-md" />
                </div>
              )}

              {/* Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black tracking-tight text-white">
                        Mesa {table.numero}
                      </span>
                      {table.mesasUnidas && table.mesasUnidas.length > 1 && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold font-mono" title={`Mesa unida con mesas ${table.mesasUnidas.join(', ')}`}>
                          +{table.mesasUnidas.filter(n => n !== table.numero).map(n => `#${n}`).join(' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{table.capacidad} personas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Badge de tiempo en mesa activa */}
                    {isOccupied && timeInfo && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-help transition hover:bg-amber-500/20"
                        title={`Comanda abierta hace ${timeInfo.text} (desde las ${timeInfo.exactTime})`}
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{timeInfo.shortText}</span>
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${style.badge}`}
                    >
                      {table.estado}
                    </span>
                  </div>
                </div>

                {/* Customer name and waiter if occupied */}
                {table.estado === 'Ocupada' && (table.clienteNombre || activeComanda?.meseroNombre) && (
                  <div className="mt-3 text-xs bg-zinc-800/80 px-2.5 py-1.5 rounded-lg text-zinc-300 space-y-0.5">
                    {table.clienteNombre && (
                      <div className="truncate">
                        <span className="text-zinc-500 font-medium">Cliente: </span>
                        <span className="font-semibold text-white">{table.clienteNombre}</span>
                      </div>
                    )}
                    {activeComanda?.meseroNombre && (
                      <div className="truncate text-[11px] text-amber-300 font-medium flex items-center justify-between">
                        <span className="text-zinc-500">Mesero:</span>
                        <span className="font-bold">{activeComanda.meseroNombre}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reservation Details Box when status is Reservada */}
                {table.estado === 'Reservada' && (
                  <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Llegada: {table.reservaHora || 'Por definir'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold text-[11px] flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {table.reservaComensales || table.capacidad} pax
                      </span>
                    </div>

                    <div className="text-zinc-200 font-semibold truncate flex items-center gap-1.5">
                      <span className="text-zinc-400 text-[11px] font-normal">Titular:</span>
                      <span className="truncate">{table.clienteNombre || 'Sin nombre registrado'}</span>
                    </div>

                    {table.reservaNotas && (
                      <p className="text-[11px] text-zinc-400 italic line-clamp-2 pt-0.5 border-t border-indigo-900/40">
                        "{table.reservaNotas}"
                      </p>
                    )}
                  </div>
                )}

                {/* Active Order Summary if table is occupied */}
                {table.estado === 'Ocupada' && activeComanda && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400 font-medium">
                      <span className="text-amber-400 font-semibold">Comanda {activeComanda.idComanda}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                        {activeComanda.estado}
                      </span>
                    </div>

                    <div className="text-zinc-300 space-y-0.5 pt-1">
                      {activeComanda.listaItems.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] truncate">
                          <span className="truncate">
                            {item.cantidad}x {item.nombre}
                          </span>
                          <span className="text-zinc-400 ml-1 font-mono">
                            {formatCOP(item.precio * item.cantidad)}
                          </span>
                        </div>
                      ))}
                      {activeComanda.listaItems.length > 3 && (
                        <p className="text-[10px] text-zinc-500 italic">
                          +{activeComanda.listaItems.length - 3} producto(s) más...
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white">
                      <span>Total:</span>
                      <span className="text-emerald-400 font-mono">{formatCOP(activeComanda.total)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2 pt-3 border-t border-zinc-800/60">
                {table.estado === 'Libre' ? (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => onOpenComandaForTable(table)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition"
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Ocupar y Crear Comanda</span>
                    </button>
                    {onOpenReservationForTable && (
                      <button
                        onClick={() => onOpenReservationForTable(table)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-800/70 hover:bg-indigo-950/60 hover:text-indigo-300 hover:border-indigo-800 text-zinc-400 font-semibold text-xs border border-zinc-800 transition"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Registrar Reserva Futura</span>
                      </button>
                    )}
                  </div>
                ) : table.estado === 'Reservada' ? (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        if (onCheckInTable) {
                          onCheckInTable(table);
                        } else {
                          onUpdateTableStatus(table.id, 'Ocupada', table.clienteNombre);
                          onOpenComandaForTable(table);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                      title="Registrar llegada del cliente y pasar mesa a Ocupada"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Registrar Llegada & Atender</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {onOpenReservationForTable && (
                        <button
                          onClick={() => onOpenReservationForTable(table)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Editar</span>
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateTableStatus(table.id, 'Libre')}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Liberar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenComandaForTable(table)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{activeComanda ? 'Modificar' : 'Nueva Orden'}</span>
                      </button>

                      {activeComanda ? (
                        <button
                          onClick={() => onOpenCheckoutForTable(table, activeComanda)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Cobrar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateTableStatus(table.id, 'Libre')}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Liberar</span>
                        </button>
                      )}
                    </div>

                    {activeComanda && onTransferTable && onMergeTables && (
                      <button
                        type="button"
                        onClick={() => setTableToTransfer({ table, comanda: activeComanda })}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-zinc-800/80 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-zinc-800 text-zinc-400 font-medium text-xs transition"
                        title="Mudar comanda a otra mesa libre o unir mesas para grupos grandes"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cambiar / Unir Mesa</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Status Changers */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>Cambiar estado:</span>
                  <div className="flex gap-1.5">
                    {table.estado !== 'Libre' && (
                      <button
                        onClick={() => onUpdateTableStatus(table.id, 'Libre')}
                        className="hover:text-emerald-400 transition"
                      >
                        Libre
                      </button>
                    )}
                    {table.estado !== 'Ocupada' && (
                      <button
                        onClick={() => onUpdateTableStatus(table.id, 'Ocupada')}
                        className="hover:text-amber-400 transition"
                      >
                        Ocupada
                      </button>
                    )}
                    {table.estado !== 'Reservada' && (
                      <button
                        onClick={() => {
                          if (onOpenReservationForTable) {
                            onOpenReservationForTable(table);
                          } else {
                            onUpdateTableStatus(table.id, 'Reservada');
                          }
                        }}
                        className="hover:text-indigo-400 transition"
                      >
                        Reservar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Cambiar / Unir Mesas */}
      {tableToTransfer && onTransferTable && onMergeTables && (
        <TableTransferModal
          isOpen={!!tableToTransfer}
          onClose={() => setTableToTransfer(null)}
          sourceTable={tableToTransfer.table}
          activeComanda={tableToTransfer.comanda}
          allTables={tables}
          allComandas={comandas}
          onTransferTable={onTransferTable}
          onMergeTables={onMergeTables}
        />
      )}
    </div>
  );
};
