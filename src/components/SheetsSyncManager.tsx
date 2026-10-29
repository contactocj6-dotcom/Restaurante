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

      {/* 1. Connected State Card (if sheet is active) */}
      {isSheetsConnected && (
        <div className="p-5 rounded-3xl bg-zinc-900/80 border border-emerald-800/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Hoja Conectada Globalmente:
              </span>
              <h3 className="text-lg font-black text-white">{spreadsheetTitle || 'RestoFlow - Hoja de Restaurante'}</h3>
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
                    <span>Copiar Enlace para Dispositivos</span>
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
              <strong className="text-zinc-200">Sincronización Transparente para Colaboradores:</strong> Los celulares y tablets de tus meseros, cocina y caja están sincronizados automáticamente con esta hoja sin que tengan que iniciar sesión con sus cuentas de Google personales.
            </span>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
            <span>
              Última sincronización: <strong className="text-zinc-200">{lastSyncTime || 'Recién sincronizado'}</strong>
            </span>
            <span className="text-emerald-400 font-medium">
              ✓ 10 pestañas sincronizadas automáticamente
            </span>
          </div>
        </div>
      )}

      {/* 2. Primary Connection Card: Direct URL/Link (No Google Login Required for Staff) */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isSheetsConnected ? 'Cambiar o Vincular Otra Hoja de Google Sheets' : 'Vincular Hoja mediante Enlace / URL'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Método Recomendado
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                Solo pega el enlace de tu Google Sheet. Todo el restaurante (meseros, cajeros, cocina) se sincronizará de inmediato sin que nadie deba iniciar sesión con Google en su celular.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl text-xs text-zinc-300">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
            <div>
              <strong className="text-white block font-semibold">Abre tu Google Sheet</strong>
              <span className="text-zinc-400 text-[11px]">En tu navegador con la cuenta del restaurante.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
            <div>
              <strong className="text-white block font-semibold">Compartir con el enlace</strong>
              <span className="text-zinc-400 text-[11px]">En Compartir, pon "Cualquier persona con el enlace puede leer".</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
            <div>
              <strong className="text-white block font-semibold">Pegar y Vincular</strong>
              <span className="text-zinc-400 text-[11px]">Pega el enlace abajo y presiona Vincular. ¡Eso es todo!</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConnect} className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit o el ID alfanumérico"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isConnecting || !manualInput.trim()}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs transition shadow-lg shadow-orange-500/20 disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Vinculando...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Vincular Hoja para el Restaurante</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Advanced Administrator Google Drive Options */}
      <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Opciones Avanzadas de Administrador (Google OAuth)
            </h4>
          </div>
          {user ? (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Google: {user.email || user.displayName}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">Solo necesario para autogenerar hojas</span>
          )}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Si eres el Administrador y no tienes una hoja creada todavía, puedes iniciar sesión una sola vez para que el sistema cree automáticamente una hoja en tu Google Drive con las 10 pestañas y columnas pre-formateadas.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!user ? (
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 transition inline-flex items-center gap-2 disabled:opacity-50"
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
              <span>{isLoggingIn ? 'Conectando...' : 'Acceder con Google (Admin)'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isCreating ? 'Generando en Drive...' : 'Crear Hoja Automática en mi Google Drive'}</span>
            </button>
          )}

          {onOpenDomainHelp && (
            <button
              type="button"
              onClick={onOpenDomainHelp}
              className="text-xs text-amber-400/80 hover:text-amber-300 underline underline-offset-4 inline-flex items-center gap-1.5 transition ml-auto"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ayuda para Error 403 / Dominios</span>
            </button>
          )}
        </div>
      </div>

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
