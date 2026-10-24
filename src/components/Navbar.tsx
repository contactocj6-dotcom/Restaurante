import React from 'react';
import {
  UtensilsCrossed,
  Bell,
  BellOff,
  FileSpreadsheet,
  Layers,
  ChefHat,
  Receipt,
  BookOpen,
  Truck,
  Users,
  LogOut,
  RefreshCw,
  Sparkles,
  LayoutDashboard,
  Calendar,
  Flame,
  Store,
  Lock,
  KeyRound,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StaffUser } from '../types/restaurant';

export type ActiveTab =
  | 'dashboard'
  | 'mesas'
  | 'reservas'
  | 'pos'
  | 'kds'
  | 'ventas'
  | 'menu'
  | 'inventario'
  | 'clientes'
  | 'sheets';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingComandasCount: number;
  confirmedReservasCount?: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  isSheetsConnected: boolean;
  spreadsheetTitle?: string;
  isSyncing: boolean;
  onManualSync: () => void;
  lowStockCount?: number;
  cajaAbierta?: boolean;
  activeCajeroNombre?: string;
  restaurantName?: string;
  onOpenRestaurantProfile?: () => void;
  activeStaffUser?: StaffUser | null;
  onOpenStaffLogin?: () => void;
  onOpenStaffManagement?: () => void;
  onLockTerminal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingComandasCount,
  confirmedReservasCount = 0,
  lowStockCount = 0,
  cajaAbierta = false,
  activeCajeroNombre,
  restaurantName,
  onOpenRestaurantProfile,
  activeStaffUser,
  onOpenStaffLogin,
  onOpenStaffManagement,
  onLockTerminal,
  soundEnabled,
  onToggleSound,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  isSheetsConnected,
  spreadsheetTitle,
  isSyncing,
  onManualSync,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      {/* Top Brand & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          type="button"
          onClick={onOpenRestaurantProfile}
          className="flex items-center gap-3 text-left group transition hover:opacity-95 focus:outline-none"
          title="Ver o editar información del restaurante, NIT, dirección y redes"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight truncate max-w-[140px] sm:max-w-[220px]">
                {restaurantName || 'RestoFlow'}
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">Gestión Gastronómica Full-Stack</p>
          </div>
        </button>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Staff User & Shift Switcher */}
          {activeStaffUser ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenStaffLogin}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-xs transition shadow-sm"
                title={`Colaborador actual: ${activeStaffUser.nombre} (${activeStaffUser.rol}). Clic para cambiar de usuario con PIN`}
              >
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${
                    activeStaffUser.avatarColor || 'from-amber-500 to-orange-600'
                  } flex items-center justify-center font-black text-white text-[11px] shadow shrink-0`}
                >
                  {activeStaffUser.nombre.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="font-bold text-white text-xs truncate max-w-[100px] leading-tight">
                    {activeStaffUser.nombre.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-amber-400 font-medium leading-none">
                    {activeStaffUser.rol}
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 md:hidden">
                  {activeStaffUser.rol}
                </span>
              </button>

              {onOpenStaffManagement && (
                <button
                  type="button"
                  onClick={onOpenStaffManagement}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                  title="Gestionar equipo, roles, PINs y registro de auditoría"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              )}

              {onLockTerminal && (
                <button
                  type="button"
                  onClick={onLockTerminal}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition"
                  title="Bloquear terminal (requiere PIN para entrar)"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenStaffLogin && (
              <button
                type="button"
                onClick={onOpenStaffLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md"
                title="Iniciar sesión con PIN de colaborador"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ingresar PIN</span>
              </button>
            )
          )}

          {/* Direct Restaurant Info Button */}
          {onOpenRestaurantProfile && (
            <button
              onClick={onOpenRestaurantProfile}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-amber-500/40 hover:text-amber-300 transition shadow-sm"
              title="Configurar Nombre, NIT, Dirección, Teléfono, Email y Redes Sociales del Restaurante"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Mi Restaurante</span>
            </button>
          )}
          {/* Sheets Status indicator */}
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              isSheetsConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
            }`}
            title={isSheetsConnected ? `Conectado a Google Sheets: ${spreadsheetTitle || ''}` : 'Modo local. Haz clic para conectar Google Sheets'}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${isSheetsConnected ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span className="hidden md:inline">
              {isSheetsConnected ? (spreadsheetTitle ? `Sheets: ${spreadsheetTitle}` : 'Google Sheets Conectado') : 'Sheets: Modo Local'}
            </span>
            <span className="md:hidden">
              {isSheetsConnected ? 'Sheets ✓' : 'Local'}
            </span>
            {isSheetsConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Sync Trigger button */}
          {isSheetsConnected && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title="Sincronizar ahora con Google Sheets"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Silenciar campana de cocina' : 'Activar campana de cocina'}
            className={`p-2 rounded-xl border transition flex items-center justify-center ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Auth State & Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-6 h-6 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-zinc-200 hidden lg:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="text-zinc-400 hover:text-red-400 transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isLoggingIn ? 'Conectando...' : 'Acceder con Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto no-scrollbar gap-1 py-1.5 border-t border-zinc-800/80">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'dashboard'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab('mesas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'mesas'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mesas & Salón</span>
        </button>

        <button
          onClick={() => setActiveTab('reservas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
            activeTab === 'reservas'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Reservas</span>
          {confirmedReservasCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
              {confirmedReservasCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'pos'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Nueva Comanda (POS)</span>
        </button>

        <button
          onClick={() => setActiveTab('kds')}
          title={
            pendingComandasCount > 0
              ? `¡Atención! ${pendingComandasCount} comanda(s) pendiente(s) en cocina`
              : 'Cocina (KDS)'
          }
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
            activeTab === 'kds'
              ? pendingComandasCount > 0
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : pendingComandasCount > 0
              ? 'bg-rose-950/60 text-rose-200 border border-rose-500/60 ring-2 ring-rose-500/40 shadow-[0_0_16px_rgba(244,63,94,0.4)] animate-pulse hover:bg-rose-900/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <ChefHat
            className={`w-4 h-4 transition ${
              pendingComandasCount > 0 ? 'text-rose-400 animate-pulse' : ''
            }`}
          />
          <span className={pendingComandasCount > 0 ? 'font-bold' : ''}>Cocina (KDS)</span>
          {pendingComandasCount > 0 && (
            <span className="relative flex items-center ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shadow-md font-mono">
                <Flame className="w-2.5 h-2.5 text-amber-200 fill-amber-200" />
                {pendingComandasCount}
              </span>
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ventas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
            activeTab === 'ventas'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Caja & Facturación</span>
          {cajaAbierta ? (
            <span
              className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full"
              title={activeCajeroNombre ? `Caja abierta con ${activeCajeroNombre}` : 'Caja abierta'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Abierta
            </span>
          ) : (
            <span
              className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-full"
              title="Caja cerrada. Requiere apertura con Base."
            >
              Cerrada
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'menu'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Menú</span>
        </button>

        <button
          onClick={() => setActiveTab('inventario')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
            activeTab === 'inventario'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Inventario & Compras</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clientes')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'clientes'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ml-auto transition ${
            activeTab === 'sheets'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-zinc-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Sheets Sync</span>
        </button>
      </div>
    </header>
  );
};
