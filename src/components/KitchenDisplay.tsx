import React, { useState, useEffect } from 'react';
import { Comanda, ComandaStatus, StaffUser } from '../types/restaurant';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Bell,
  ArrowRight,
  Filter,
  AlertCircle,
  Volume2,
  Smartphone,
  Radio,
  Check,
  Send,
  UserCheck,
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { fcmService } from '../services/fcmService';

interface KitchenDisplayProps {
  comandas: Comanda[];
  onUpdateComandaStatus: (comandaId: string, newStatus: ComandaStatus) => void;
  activeStaffUser?: StaffUser | null;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
  comandas,
  onUpdateComandaStatus,
  activeStaffUser,
}) => {
  const [filter, setFilter] = useState<'Activas' | 'Todas' | ComandaStatus>('Activas');
  const [now, setNow] = useState(Date.now());

  // FCM Mobile push states
  const [fcmRegistered, setFcmRegistered] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !!localStorage.getItem('restoflow_fcm_token');
  });
  const [fcmLoading, setFcmLoading] = useState<boolean>(false);
  const [fcmMessage, setFcmMessage] = useState<string | null>(null);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);

  const [lastPushAlert, setLastPushAlert] = useState<{ title: string; body: string; comandaId?: string } | null>(null);

  useEffect(() => {
    // Check registered kitchen devices on server
    fetch('/api/fcm/devices')
      .then((r) => r.json())
      .then((d) => {
        if (d.totalDevices) {
          setConnectedDevicesCount(Math.max(1, d.totalDevices));
        }
      })
      .catch(() => {});

    // Subscribe to push alerts arriving on this terminal
    const unsub = fcmService.onPushAlert((payload) => {
      setLastPushAlert(payload);
      setTimeout(() => {
        setLastPushAlert((current) => (current?.title === payload.title ? null : current));
      }, 8000);
    });

    return () => unsub();
  }, []);

  const handleRegisterFcm = async () => {
    setFcmLoading(true);
    setFcmMessage(null);
    try {
      const res = await fcmService.registerKitchenDevice();
      if (res.success) {
        setFcmRegistered(true);
        setFcmMessage('✓ Dispositivo vinculado con éxito. Recibirás alertas push cuando ingresen comandas Pendientes.');
        setConnectedDevicesCount((prev) => prev + 1);
      } else {
        setFcmMessage(`Aviso: ${res.error || 'No se pudo vincular'}`);
      }
    } catch (err: any) {
      setFcmMessage(`Error: ${err.message || err}`);
    } finally {
      setFcmLoading(false);
    }
  };

  const handleTestFcmPush = async () => {
    setFcmLoading(true);
    try {
      await fcmService.testKitchenPush();
      setFcmMessage('✓ Alerta push de prueba emitida a dispositivos móviles de cocina.');
    } catch {
      setFcmMessage('Error al emitir alerta push');
    } finally {
      setFcmLoading(false);
    }
  };

  // Update timer every 10 seconds to keep minutes fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedTime = (timestamp: string) => {
    const elapsedMs = now - new Date(timestamp).getTime();
    const minutes = Math.floor(elapsedMs / (1000 * 60));
    if (minutes < 1) return 'Hace un momento';
    if (minutes === 1) return 'Hace 1 min';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getElapsedMinutes = (timestamp: string) => {
    return Math.floor((now - new Date(timestamp).getTime()) / (1000 * 60));
  };

  const filteredComandas = comandas
    .filter((c) => {
      if (filter === 'Activas') {
        return c.estado === 'Pendiente' || c.estado === 'Cocinando' || c.estado === 'Listo';
      }
      if (filter === 'Todas') return true;
      return c.estado === filter;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getStatusBadge = (status: ComandaStatus) => {
    switch (status) {
      case 'Pendiente':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          indicator: 'bg-rose-500 animate-ping',
        };
      case 'Cocinando':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          indicator: 'bg-amber-400',
        };
      case 'Listo':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          indicator: 'bg-emerald-400',
        };
      case 'Entregado':
        return {
          bg: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          indicator: 'bg-zinc-500',
        };
    }
  };

  const pendingCount = comandas.filter((c) => c.estado === 'Pendiente').length;
  const cookingCount = comandas.filter((c) => c.estado === 'Cocinando').length;
  const readyCount = comandas.filter((c) => c.estado === 'Listo').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                KDS — Pantalla de Cocina
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                En Vivo (Push SSE)
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {pendingCount} pendientes • {cookingCount} cocinando • {readyCount} listos para servir
            </p>
          </div>
        </div>

        {/* Filters and Test Sound Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('Activas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              filter === 'Activas'
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
            }`}
          >
            Activas ({pendingCount + cookingCount + readyCount})
          </button>
          <button
            onClick={() => setFilter('Pendiente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              filter === 'Pendiente'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-rose-400'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('Cocinando')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              filter === 'Cocinando'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-amber-400'
            }`}
          >
            Cocinando ({cookingCount})
          </button>
          <button
            onClick={() => setFilter('Listo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              filter === 'Listo'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-emerald-400'
            }`}
          >
            Listos ({readyCount})
          </button>

          <button
            onClick={() => audioService.playKitchenBell()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 text-xs font-semibold transition ml-auto sm:ml-0"
            title="Probar sonido de la campana"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Campana</span>
          </button>
        </div>
      </div>

      {/* FCM Mobile Push Notifications for Kitchen Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Alertas Push Móviles de Cocina (FCM)
              </h4>
              {fcmRegistered ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Móvil Vinculado ({connectedDevicesCount} activo{connectedDevicesCount > 1 ? 's' : ''})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Sin Vincular en este Dispositivo
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Envía notificaciones push automáticas a móviles de cocineros cuando una comanda entra como 'Pendiente'.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {!fcmRegistered ? (
            <button
              onClick={handleRegisterFcm}
              disabled={fcmLoading}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{fcmLoading ? 'Vinculando...' : 'Vincular este Móvil / Tablet'}</span>
            </button>
          ) : (
            <button
              onClick={handleTestFcmPush}
              disabled={fcmLoading}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              title="Disparar push de prueba a todos los móviles de cocina"
            >
              <Send className="w-3 h-3 text-amber-400" />
              <span>Probar Push Móvil</span>
            </button>
          )}
        </div>
      </div>

      {lastPushAlert && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/80 text-rose-200 flex items-center justify-between gap-3 shadow-lg shadow-rose-950/40 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 font-black text-xs">FCM PUSH</span>
            <div>
              <p className="text-xs font-black text-white">{lastPushAlert.title}</p>
              <p className="text-[11px] text-rose-300">{lastPushAlert.body}</p>
            </div>
          </div>
          <button
            onClick={() => setLastPushAlert(null)}
            className="text-xs text-rose-400 hover:text-white px-2 py-1 rounded-lg bg-rose-900/50"
          >
            Cerrar
          </button>
        </div>
      )}

      {fcmMessage && (
        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between animate-in fade-in">
          <span>{fcmMessage}</span>
          <button onClick={() => setFcmMessage(null)} className="text-zinc-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Orders Grid / Cards */}
      {filteredComandas.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-12 text-center text-zinc-500">
          <ChefHat className="w-12 h-12 stroke-1 mx-auto text-zinc-700 mb-3" />
          <p className="text-base font-semibold text-zinc-300">No hay comandas en este estado</p>
          <p className="text-xs text-zinc-500 mt-1">
            Los nuevos pedidos enviados por los meseros aparecerán aquí automáticamente con timbre sonoro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredComandas.map((comanda) => {
            const elapsedMins = getElapsedMinutes(comanda.timestamp);
            const isLate = elapsedMins >= 15;
            const badge = getStatusBadge(comanda.estado);

            return (
              <div
                key={comanda.idComanda}
                className={`rounded-2xl border flex flex-col justify-between transition-all shadow-lg overflow-hidden ${
                  isLate && comanda.estado !== 'Listo' && comanda.estado !== 'Entregado'
                    ? 'border-rose-500/80 bg-rose-950/20 ring-1 ring-rose-500/50'
                    : 'border-zinc-800 bg-zinc-900/90'
                }`}
              >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-semibold text-zinc-400">
                        {comanda.idComanda}
                      </span>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        Mesa #{comanda.mesaNumero || '?'}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.indicator}`} />
                        {comanda.estado}
                      </span>
                    </div>
                  </div>

                  {/* Timer & Customer */}
                  <div className="flex items-center justify-between text-xs mt-2.5 pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className={isLate ? 'text-rose-400 font-bold' : ''}>
                        {getElapsedTime(comanda.timestamp)}
                      </span>
                    </div>

                    {comanda.clienteNombre && (
                      <span className="text-zinc-300 font-medium truncate max-w-[120px]">
                        {comanda.clienteNombre}
                      </span>
                    )}
                  </div>

                  {/* Staff Assignment: Mesero and Chef */}
                  <div className="flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t border-zinc-800/60 text-zinc-400">
                    <span className="flex items-center gap-1 text-amber-300 font-medium truncate">
                      Mesero: <strong className="text-white">{comanda.meseroNombre || 'No asignado'}</strong>
                    </span>
                    {comanda.cocineroNombre && (
                      <span className="text-orange-400 font-medium truncate">
                        Chef: <strong className="text-white">{comanda.cocineroNombre}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
                  {comanda.listaItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                            {item.cantidad}x
                          </span>
                          <span className="text-sm font-bold text-white leading-tight">
                            {item.nombre}
                          </span>
                        </div>
                      </div>

                      {/* Item instructions / notes */}
                      {item.notas && (
                        <div className="text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{item.notas}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* General order note */}
                  {comanda.notasGenerales && (
                    <div className="p-2 rounded-xl bg-zinc-800/60 text-xs text-zinc-300 border border-zinc-700/60 italic">
                      Nota comanda: "{comanda.notasGenerales}"
                    </div>
                  )}
                </div>

                {/* Big Action Buttons for Kitchen Crew */}
                <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 space-y-2">
                  {comanda.estado === 'Pendiente' && (
                    <button
                      onClick={() => onUpdateComandaStatus(comanda.idComanda, 'Cocinando')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Empezar a Preparar</span>
                    </button>
                  )}

                  {comanda.estado === 'Cocinando' && (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => onUpdateComandaStatus(comanda.idComanda, 'Listo')}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-900/40 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como Listo</span>
                      </button>
                      <button
                        onClick={() => onUpdateComandaStatus(comanda.idComanda, 'Pendiente')}
                        className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-[11px] font-semibold border border-zinc-800 transition flex items-center justify-center gap-1.5"
                        title="Revertir comanda a Pendiente (Disparará alerta push a móviles de cocina)"
                      >
                        <span>↩ Devolver a Pendiente (Alerta Push)</span>
                      </button>
                    </div>
                  )}

                  {comanda.estado === 'Listo' && (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => onUpdateComandaStatus(comanda.idComanda, 'Entregado')}
                        className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Entregado a Mesa</span>
                      </button>
                      <button
                        onClick={() => onUpdateComandaStatus(comanda.idComanda, 'Pendiente')}
                        className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-[11px] font-semibold border border-zinc-800 transition flex items-center justify-center gap-1.5"
                        title="Reabrir comanda como Pendiente (Disparará alerta push a móviles de cocina)"
                      >
                        <span>↩ Reabrir como Pendiente (Alerta Push)</span>
                      </button>
                    </div>
                  )}

                  {comanda.estado === 'Entregado' && (
                    <div className="space-y-1.5">
                      <div className="text-center py-1 text-xs text-zinc-500 font-semibold">
                        Comanda Completada y Servida
                      </div>
                      <button
                        onClick={() => onUpdateComandaStatus(comanda.idComanda, 'Pendiente')}
                        className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-[11px] font-semibold border border-zinc-800 transition flex items-center justify-center gap-1.5"
                        title="Reabrir comanda como Pendiente"
                      >
                        <span>↩ Reabrir Comanda (Alertar Cocina)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
