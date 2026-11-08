import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Sparkles,
  ShieldCheck,
  Server,
  Layers,
  Key,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
  Radio,
  Unplug,
  Zap,
} from 'lucide-react';
import {
  fetchMongoStatus,
  testMongoConnection,
  saveMongoConfig,
  disconnectMongo,
  pushAllToMongo,
  pullAllFromMongo,
  MongoStatusResponse,
} from '../services/mongoService';

interface MongoAtlasManagerProps {
  currentData: {
    menu: any[];
    tables: any[];
    comandas: any[];
    ventas: any[];
    clientes: any[];
    proveedores: any[];
    compras: any[];
    facturas: any[];
    reservas?: any[];
    staffUsers?: any[];
    restaurantInfo?: any;
  };
  onApplyPulledData: (data: any) => void;
  isAdmin?: boolean;
  onRequireAdminAuth?: (action: () => void, title: string) => void;
  onSwitchToSheets?: () => void;
}

export const MongoAtlasManager: React.FC<MongoAtlasManagerProps> = ({
  currentData,
  onApplyPulledData,
  isAdmin = true,
  onRequireAdminAuth,
}) => {
  const [status, setStatus] = useState<MongoStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connectionUri, setConnectionUri] = useState('');
  const [dbName, setDbName] = useState('restoflow');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    collectionsFound?: string[];
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [showGuide, setShowGuide] = useState(false);
  const [copiedSampleUri, setCopiedSampleUri] = useState(false);

  const refreshStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetchMongoStatus();
      setStatus(res);
      if (res.dbName) setDbName(res.dbName);
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!connectionUri.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'Por favor ingresa la cadena de conexión de MongoDB Atlas (mongodb+srv://...)',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setActionFeedback(null);
    try {
      const res = await testMongoConnection(connectionUri.trim(), dbName.trim() || 'restoflow');
      setTestResult({
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs,
        collectionsFound: res.collectionsFound,
      });
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `¡Conexión verificada exitosamente en ${res.latencyMs || 0}ms! Listo para guardar.`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          message: res.message || 'Error al conectar con MongoDB Atlas',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error de red',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!connectionUri.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'Ingresa la cadena de conexión de MongoDB Atlas para guardar',
      });
      return;
    }

    const executeSave = async () => {
      setIsSaving(true);
      setActionFeedback(null);
      try {
        const res = await saveMongoConfig(connectionUri.trim(), dbName.trim() || 'restoflow', true);
        setStatus(res);
        if (res.connected) {
          setActionFeedback({
            type: 'success',
            message: '¡Conexión a MongoDB Atlas guardada y activa para todos los dispositivos del restaurante!',
          });
          setConnectionUri('');
        } else {
          setActionFeedback({
            type: 'error',
            message: res.message || 'Error al guardar configuración',
          });
        }
      } catch (err: any) {
        setActionFeedback({
          type: 'error',
          message: err?.message || 'Error de red al guardar',
        });
      } finally {
        setIsSaving(false);
      }
    };

    if (!isAdmin && onRequireAdminAuth) {
      onRequireAdminAuth(executeSave, 'Configurar MongoDB Atlas');
    } else {
      executeSave();
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Seguro que deseas desconectar la base de datos de MongoDB Atlas?')) {
      return;
    }

    const executeDisconnect = async () => {
      try {
        await disconnectMongo();
        await refreshStatus();
        setTestResult(null);
        setActionFeedback({
          type: 'info',
          message: 'Base de datos MongoDB Atlas desconectada.',
        });
      } catch (err: any) {
        setActionFeedback({
          type: 'error',
          message: err?.message || 'Error al desconectar',
        });
      }
    };

    if (!isAdmin && onRequireAdminAuth) {
      onRequireAdminAuth(executeDisconnect, 'Desconectar Base de Datos');
    } else {
      executeDisconnect();
    }
  };

  const handlePushAll = async () => {
    const executePush = async () => {
      setIsPushing(true);
      setActionFeedback(null);
      try {
        const res = await pushAllToMongo(currentData);
        if (res.success) {
          setActionFeedback({
            type: 'success',
            message: '¡Todos los datos (menú, mesas, comandas, ventas, clientes) se subieron a MongoDB Atlas con éxito!',
          });
          await refreshStatus();
        } else {
          setActionFeedback({
            type: 'error',
            message: res.message || 'Error al sincronizar datos hacia MongoDB Atlas',
          });
        }
      } catch (err: any) {
        setActionFeedback({
          type: 'error',
          message: err?.message || 'Error al enviar datos',
        });
      } finally {
        setIsPushing(false);
      }
    };

    if (!isAdmin && onRequireAdminAuth) {
      onRequireAdminAuth(executePush, 'Sincronizar a MongoDB Atlas');
    } else {
      executePush();
    }
  };

  const handlePullAll = async () => {
    if (
      !window.confirm(
        '¿Deseas descargar los datos desde MongoDB Atlas y actualizar la memoria de esta pantalla?'
      )
    ) {
      return;
    }

    const executePull = async () => {
      setIsPulling(true);
      setActionFeedback(null);
      try {
        const res = await pullAllFromMongo();
        if (res.success && res.data) {
          onApplyPulledData(res.data);
          setActionFeedback({
            type: 'success',
            message: '¡Datos descargados y actualizados exitosamente desde MongoDB Atlas!',
          });
          await refreshStatus();
        } else {
          setActionFeedback({
            type: 'error',
            message: res.message || 'No se pudieron recuperar los datos de MongoDB Atlas',
          });
        }
      } catch (err: any) {
        setActionFeedback({
          type: 'error',
          message: err?.message || 'Error al descargar datos',
        });
      } finally {
        setIsPulling(false);
      }
    };

    if (!isAdmin && onRequireAdminAuth) {
      onRequireAdminAuth(executePull, 'Restaurar desde MongoDB Atlas');
    } else {
      executePull();
    }
  };

  const isConnected = !!(status && status.connected);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Base de Datos Cloud: MongoDB Atlas
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recomendado
              </span>
              {isConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Conexión Activa
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Desconectado
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Sincronización centralizada y transparente en la nube con documentos JSON nativos. 
              <strong> Sin pedir inicios de sesión de Google a los meseros ni problemas de permisos en Google Drive.</strong>
            </p>
          </div>
        </div>

        {/* Actions on top right */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={refreshStatus}
            disabled={loadingStatus}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs transition cursor-pointer"
            title="Actualizar estado"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in shadow-lg ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : actionFeedback.type === 'error'
              ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
              : 'bg-zinc-900 border-zinc-700 text-zinc-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : actionFeedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Server className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-semibold block">{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: Main Connection Configuration + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Connection Config Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Configuración de Conexión de MongoDB Atlas
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Cadena de conexión al cluster en la nube (URI mongodb+srv)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Ocultar Guía' : '¿Cómo obtenerla gratis?'}</span>
              </button>
            </div>

            {/* Quick 3-Step Guide Modal/Box */}
            {showGuide && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs text-zinc-300 animate-in fade-in">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Cómo crear tu Cluster Gratuito en MongoDB Atlas (3 Minutos, 100% Gratis)
                  </span>
                  <a
                    href="https://www.mongodb.com/cloud/atlas/register"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-amber-400 underline font-semibold hover:text-amber-300"
                  >
                    Abrir MongoDB Atlas <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <ol className="space-y-2 list-none pl-1 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      1
                    </span>
                    <div>
                      Regístrate gratis en <strong>mongodb.com/cloud/atlas</strong> y crea un cluster gratuito (Plan <strong>M0 Free Sandbox</strong>, no requiere tarjeta de crédito).
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      2
                    </span>
                    <div>
                      En <strong>Security → Network Access</strong>, añade una regla de IP y selecciona <strong className="text-emerald-400">"Allow Access from Anywhere" (0.0.0.0/0)</strong> para que la app se conecte desde cualquier dispositivo.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      3
                    </span>
                    <div>
                      En tu cluster, haz clic en <strong className="text-white">"Connect" → "Drivers" (Node.js)</strong> y copia la cadena de conexión. Reemplaza <code className="text-amber-300 bg-zinc-950 px-1 py-0.5 rounded">&lt;password&gt;</code> con la contraseña de tu usuario de base de datos.
                    </div>
                  </li>
                </ol>

                <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400 border-t border-amber-500/20">
                  <span>Ejemplo: <code>mongodb+srv://admin:miClave123@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority</code></span>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleTest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Cadena de Conexión (MongoDB Connection String URI) *</span>
                  {status?.sanitizedUri && isConnected && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Activo: {status.sanitizedUri}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={connectionUri}
                    onChange={(e) => {
                      setConnectionUri(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder={
                      isConnected
                        ? 'Pega una nueva cadena para cambiar de cluster'
                        : 'mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority'
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500 shadow-inner pr-24"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800 transition"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  El servidor de RestoFlow guarda las credenciales encriptadas localmente y gestiona las conexiones en segundo plano sin exponerlas a los meseros.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nombre de la Base de Datos
                  </label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="restoflow"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Por defecto: <strong>restoflow</strong> (se creará automáticamente en Atlas)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Seguridad & Acceso
                  </label>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Conexión cifrada TLS/SSL nativa de MongoDB Atlas</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isTesting || !connectionUri.trim()}
                    onClick={() => handleTest()}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Probando Conexión...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Probar Conexión</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSaving || !connectionUri.trim()}
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                        <span>Guardar y Conectar</span>
                      </>
                    )}
                  </button>
                </div>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unplug className="w-3.5 h-3.5 text-rose-400" />
                    <span>Desconectar Base de Datos</span>
                  </button>
                )}
              </div>
            </form>

            {/* Test Result Card */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <strong className="text-sm">
                    {testResult.success ? 'Conexión Exitosa con MongoDB Atlas' : 'Fallo de Conexión'}
                  </strong>
                </div>
                <p className="leading-relaxed">{testResult.message}</p>
                {testResult.collectionsFound && testResult.collectionsFound.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] flex items-center gap-2 flex-wrap">
                    <span className="text-zinc-400">Colecciones existentes en el cluster:</span>
                    {testResult.collectionsFound.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded bg-zinc-900 font-mono text-emerald-300 border border-emerald-500/30">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cloud Sync Operations: Upload all or Download all */}
          {isConnected && (
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Sincronización Masiva & Restauración
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Sube todo el estado del restaurante a MongoDB Atlas o restáuralo en este dispositivo
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Push All Card */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <UploadCloud className="w-4 h-4 text-emerald-400" />
                      <span>Subir Todo a MongoDB Atlas</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Envía todos tus platos del menú, mesas, comandas, clientes, facturas y ventas a las colecciones de MongoDB Atlas para que queden respaldadas en la nube.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isPushing}
                    onClick={handlePushAll}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10 disabled:opacity-50"
                  >
                    {isPushing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                        <span>Sincronizando a la Nube...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-zinc-950" />
                        <span>Exportar Todo a MongoDB</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pull All Card */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <DownloadCloud className="w-4 h-4 text-blue-400" />
                      <span>Descargar desde MongoDB Atlas</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Recupera las colecciones guardadas en la nube y actualiza esta pantalla (ideal para sincronizar una nueva tablet de mesero, terminal de caja o cocina).
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isPulling}
                    onClick={handlePullAll}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold border border-zinc-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPulling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Descargando desde Atlas...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-4 h-4 text-blue-400" />
                        <span>Restaurar desde MongoDB</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Status & Collections Summary */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Estado del Cluster
              </span>
              <span
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                }`}
              />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Motor de Base de Datos:</span>
                <strong className="text-white font-mono">MongoDB Atlas Cloud NoSQL</strong>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px]">Base de Datos Activa:</span>
                <strong className="text-amber-400 font-mono text-sm">
                  {status?.dbName || dbName || 'restoflow'}
                </strong>
              </div>

              <div>
                <span className="text-zinc-500 block text-[11px]">Estado de Conexión:</span>
                {isConnected ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" /> Conectado & Operativo
                  </span>
                ) : (
                  <span className="text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Sin conexión activa
                  </span>
                )}
              </div>

              {status?.lastSyncTime && (
                <div>
                  <span className="text-zinc-500 block text-[11px]">Última Sincronización:</span>
                  <span className="font-mono text-zinc-300">
                    {new Date(status.lastSyncTime).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Collections Document Counts in Atlas */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Colecciones en Atlas
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">Documentos</span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: 'Menú & Platos', key: 'menu', localCount: currentData.menu.length },
                { name: 'Mesas del Salón', key: 'mesas', localCount: currentData.tables.length },
                { name: 'Comandas & Órdenes', key: 'comandas', localCount: currentData.comandas.length },
                { name: 'Ventas Realizadas', key: 'ventas', localCount: currentData.ventas.length },
                { name: 'Clientes Registrados', key: 'clientes', localCount: currentData.clientes.length },
                { name: 'Facturas Emitidas', key: 'facturas', localCount: currentData.facturas.length },
                { name: 'Reservaciones', key: 'reservas', localCount: currentData.reservas?.length || 0 },
                { name: 'Usuarios & Personal', key: 'usuarios', localCount: currentData.staffUsers?.length || 0 },
              ].map((item) => {
                const cloudCount = status?.counts ? status.counts[item.key] : null;
                return (
                  <div
                    key={item.key}
                    className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <span className="text-zinc-300 font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {cloudCount !== null && cloudCount !== undefined ? cloudCount : item.localCount}
                      </span>
                      <span className="text-[10px] text-zinc-500">docs</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 text-center">
              MongoDB almacena cada entidad como documento JSON nativo de alta velocidad.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
