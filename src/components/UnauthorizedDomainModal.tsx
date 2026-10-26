import React, { useState } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Globe,
  RefreshCw,
  X,
  Info,
  Server,
  Sparkles,
  Users,
  AlertTriangle,
  Key,
} from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  projectId?: string;
  initialTab?: 'oauth403' | 'domain';
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  projectId = 'gen-lang-client-0083219337',
  initialTab = 'oauth403',
}) => {
  const [activeTab, setActiveTab] = useState<'oauth403' | 'domain'>(initialTab);
  const [copiedType, setCopiedType] = useState<'exact' | 'wildcard' | 'email' | null>(null);

  if (!isOpen) return null;

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : 'candid-baklava-360942.netlify.app';

  // Extract base domain (e.g., netlify.app)
  const isNetlify = currentHostname.includes('netlify.app');
  const recommendedDomain = isNetlify ? 'netlify.app' : currentHostname;

  const handleCopy = (text: string, type: 'exact' | 'wildcard' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const googleCloudConsentUrl = `https://console.cloud.google.com/apis/credentials/consent?project=${projectId}`;
  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/70 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Google OAuth & Firebase
                </span>
                <span className="text-xs font-mono text-amber-400/90 font-bold">
                  Error 403: access_denied / Solución
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1 tracking-tight">
                Configuración de Acceso Google
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Guía rápida de 1 minuto para autorizar tu cuenta y tu dominio de Netlify.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('oauth403')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'oauth403'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Solución Error 403 (Test Users Google)</span>
          </button>
          <button
            onClick={() => setActiveTab('domain')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'domain'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>2. Dominios Autorizados (Netlify)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar text-zinc-200 text-xs flex-1">
          {activeTab === 'oauth403' ? (
            <>
              {/* Error Explanation Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-amber-200 font-semibold">
                    ¿Por qué ocurre el Error 403: access_denied?
                  </p>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Tu proyecto de Google Cloud está en estado <strong className="text-white">"En modo de prueba" (Testing)</strong> y solicita permisos para guardar datos en Google Sheets. Por seguridad, Google <strong>solo permite el acceso a correos registrados como Usuarios de prueba (Test Users)</strong>.
                  </p>
                </div>
              </div>

              {/* Step by Step Fix */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  Pasos para habilitar tu correo (Toma 30 segundos)
                </h3>

                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="text-zinc-200">
                        Abre la <strong className="text-white">Pantalla de Consentimiento OAuth</strong> en tu consola de Google Cloud:
                      </p>
                      <a
                        href={googleCloudConsentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md"
                      >
                        <span>Abrir Pantalla de Consentimiento en Google Cloud</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      2
                    </span>
                    <div className="flex-1">
                      <p className="text-zinc-200">
                        Baja hasta la sección <strong className="text-white">"Usuarios de prueba" (Test users)</strong> y haz clic en:
                      </p>
                      <p className="text-amber-400 font-bold mt-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 inline-block">
                        + ADD USERS (+ AGREGAR USUARIOS)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="text-zinc-200">
                        Escribe el correo de Google que estás usando para iniciar sesión y haz clic en <strong className="text-white">Guardar (Save)</strong>.
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Puedes añadir hasta 100 correos de tu equipo (administradores, cajeros, gerentes).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-emerald-500/30">
                      4
                    </span>
                    <div className="flex-1">
                      <p className="text-emerald-400 font-semibold">
                        ¡Listo! Vuelve a esta ventana y haz clic en "Reintentar Conexión Google".
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative: Publish App */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
                <p className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Alternativa para habilitar cualquier correo:
                </p>
                <p>
                  En esa misma pantalla de Google Cloud, arriba haz clic en el botón <strong className="text-white">"PUBLICAR APLICACIÓN" (PUBLISH APP)</strong>. Así cualquier cuenta de Google podrá acceder sin necesidad de agregarla previamente.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Explanation Banner */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-zinc-200 leading-relaxed">
                    Al alojar la aplicación en <strong className="text-white">Netlify</strong>, Firebase requiere que registres tu dominio en la lista de dominios autorizados para permitir que el popup de Google complete la autenticación.
                  </p>
                </div>
              </div>

              {/* Quick Copy Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Dominios para Agregar a Firebase
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Recommended Wildcard */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400">Recomendado (Cubre todos los deploys)</span>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-xs font-mono font-bold text-white mt-1 break-all bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                        {recommendedDomain}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1.5">
                        Permite todos los enlaces y vistas previas de Netlify automáticamente.
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(recommendedDomain, 'wildcard')}
                      className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                    >
                      {copiedType === 'wildcard' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Copiado a portapapeles!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar "{recommendedDomain}"</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option B: Exact Hostname */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-zinc-300">Dominio exacto actual</span>
                      <p className="text-xs font-mono text-zinc-300 mt-1 break-all bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                        {currentHostname}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1.5">
                        Tu subdominio específico asignado en Netlify.
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(currentHostname, 'exact')}
                      className="mt-3 w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-zinc-700"
                    >
                      {copiedType === 'exact' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar dominio exacto</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-amber-400" />
                  Pasos para Activar en Firebase
                </h3>

                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="text-zinc-200">
                        Abre la configuración de Autenticación en Firebase:
                      </p>
                      <a
                        href={firebaseConsoleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md"
                      >
                        <span>Ir a Firebase Console (Settings Auth)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      2
                    </span>
                    <p className="text-zinc-300">
                      En la pestaña <strong className="text-white">Settings</strong>, baja hasta <strong className="text-white">Authorized domains</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Haz clic en <strong className="text-white">Add domain</strong>, pega <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded font-mono font-bold">{recommendedDomain}</code> y haz clic en <strong className="text-white">Save</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Offline/Local Resilience Notice */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-zinc-200">El restaurante sigue funcionando normalmente:</strong> Toda la toma de pedidos, cocina, mesas, caja y facturación están 100% operativos localmente.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition border border-zinc-700"
          >
            Continuar en Modo Local
          </button>

          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar Conexión Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
