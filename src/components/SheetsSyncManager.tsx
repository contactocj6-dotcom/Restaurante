import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Database,
  ArrowDownUp,
  Table as TableIcon,
  HelpCircle,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SHEET_NAMES, SHEET_HEADERS, extractSpreadsheetId } from '../services/sheetsService';

interface SheetsSyncManagerProps {
  user: User | null;
  onLogin: () => void;
  isLoggingIn: boolean;
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl?: string;
  isSheetsConnected: boolean;
  isSyncing: boolean;
  lastSyncTime?: string;
  onConnectExistingSheet: (idOrUrl: string) => Promise<void>;
  onCreateNewSheet: () => Promise<void>;
  onSyncAll: () => Promise<void>;
  onOpenDomainHelp?: () => void;
  counts: {
    menu: number;
    tables: number;
    comandas: number;
    ventas: number;
    compras: number;
    proveedores: number;
    clientes: number;
    facturas: number;
    reservas?: number;
    staffUsers?: number;
  };
}

export const SheetsSyncManager: React.FC<SheetsSyncManagerProps> = ({
  user,
  onLogin,
  isLoggingIn,
  spreadsheetId,
  spreadsheetTitle,
  spreadsheetUrl,
  isSheetsConnected,
  isSyncing,
  lastSyncTime,
  onConnectExistingSheet,
  onCreateNewSheet,
  onSyncAll,
  onOpenDomainHelp,
  counts,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const handleCopyShareLink = () => {
    if (!spreadsheetId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}?sheet=${spreadsheetId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  const handleCreate = async () => {
    setErrorMsg(null);
    setIsCreating(true);
    try {
      await onCreateNewSheet();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la hoja');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setErrorMsg(null);
    setIsConnecting(true);
    try {
      await onConnectExistingSheet(manualInput.trim());
      setManualInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar la hoja');
    } finally {
      setIsConnecting(false);
    }
  };

  const sheetRowsMap: Record<string, number> = {
    'Menú': counts.menu,
    'Mesas': counts.tables,
    'Comandas': counts.comandas,
    'Ventas': counts.ventas,
    'Compras': counts.compras,
    'Proveedores': counts.proveedores,
    'Clientes': counts.clientes,
    'Facturación': counts.facturas,
    'Reservas': counts.reservas || 0,
    'Usuarios': counts.staffUsers || 0,
  };

  const currentSheetLink = spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : spreadsheetUrl;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Integración con Google Sheets
              </h2>
              {isSheetsConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Conectado en Vivo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Modo Local / Sin Vincular
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Base de datos relacional en la nube para restaurantes utilizando la hoja de cálculo de Google
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDomainHelp && (
            <button
              type="button"
              onClick={onOpenDomainHelp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition shadow-sm"
              title="Guía de solución para Error 403 (access_denied) y dominios Netlify en Google/Firebase"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Ayuda Conexión Google & Error 403</span>
            </button>
          )}

          {isSheetsConnected && (
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Todas las Hojas'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          {onOpenDomainHelp && errorMsg.includes('unauthorized-domain') && (
            <button
              onClick={onOpenDomainHelp}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 transition"
            >
              Ver Solución Paso a Paso
            </button>
          )}
        </div>
      )}

      {/* Main Connection Card */}
      {!user ? (
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Inicia Sesión con Google</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Para crear y sincronizar las 8 tablas de tu restaurante directamente en tu cuenta de Google Drive, primero inicia sesión.
            </p>
          </div>
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs shadow-lg transition inline-flex items-center gap-2"
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
            <span>{isLoggingIn ? 'Iniciando sesión...' : 'Conectar con Google'}</span>
          </button>

          {onOpenDomainHelp && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenDomainHelp}
                className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4 inline-flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>¿Desplegaste en Netlify? Guía para autorizar dominio Firebase</span>
              </button>
            </div>
          )}
        </div>
      ) : isSheetsConnected ? (
        /* Connected State */
        <div className="p-5 rounded-3xl bg-zinc-900/80 border border-emerald-800/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-emerald-400">Hoja Activa en tu Google Drive:</span>
              <h3 className="text-lg font-black text-white">{spreadsheetTitle || 'RestoFlow - Sistema de Restaurante'}</h3>
              <p className="text-xs font-mono text-zinc-400 break-all mt-0.5">ID: {spreadsheetId}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 border border-emerald-500/30 shadow-sm"
                title="Copia el enlace para abrir en otros celulares, tablets de meseros o computadores sincronizados automáticamente a esta hoja"
              >
                {copiedShareLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiar Enlace Multidispositivo</span>
                  </>
                )}
              </button>

              {currentSheetLink && (
                <a
                  href={currentSheetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Abrir en Google Sheets</span>
                </a>
              )}
            </div>
          </div>

          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-start gap-2">
            <Share2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-zinc-200">Multidispositivo en Tiempo Real:</strong> Comparte el enlace con tus meseros o cajeros. Al abrir la app en otro navegador o celular con ese enlace, se conectará de inmediato a esta hoja de cálculo y cargará los datos reales sin mostrar datos de prueba.
            </span>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
            <span>
              Última sincronización: <strong className="text-zinc-200">{lastSyncTime || 'Recién sincronizado'}</strong>
            </span>
            <span className="text-emerald-400 font-medium">
              ✓ 10 hojas sincronizadas bidireccionalmente
            </span>
          </div>
        </div>
      ) : (
        /* Authenticated but No Sheet connected yet */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Create Auto */}
          <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 w-fit mb-3">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Opción 1: Crear Hoja Automática</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Crea una nueva hoja en tu Google Drive con las 10 pestañas formateadas (Menú, Mesas, Comandas, Ventas, Compras, Proveedores, Clientes, Facturación, Reservas y Usuarios) con encabezados y datos iniciales listos para operar.
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isCreating ? 'Generando Hoja...' : 'Crear Hoja en mi Google Drive'}</span>
            </button>
          </div>

          {/* Option B: Link Existing */}
          <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 w-fit mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Opción 2: Vincular Hoja Existente</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Pega el ID o la URL completa de una hoja de cálculo existente de Google Sheets a la que tengas acceso.
              </p>
            </div>

            <form onSubmit={handleConnect} className="mt-4 space-y-2">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/... o ID"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isConnecting || !manualInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
              >
                {isConnecting ? 'Verificando...' : 'Conectar Hoja'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10 Sheets Structure Inspection Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Estructura de las 10 Hojas en Google Sheets</h3>
          </div>
          <span className="text-xs text-zinc-500">Mapeo Exacto Requerido</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Pestaña (Sheet Name)</th>
                <th className="py-3 px-4">Columnas / Esquema</th>
                <th className="py-3 px-4 text-center">Registros Locales</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {SHEET_NAMES.map((name, idx) => {
                const headers = SHEET_HEADERS[name] || [];
                const rowCount = sheetRowsMap[name] || 0;
                return (
                  <tr key={name} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono text-zinc-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>{name}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                      {headers.join(' | ')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                      {rowCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {isSheetsConnected ? 'Sincronizado' : 'Listo en memoria'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
