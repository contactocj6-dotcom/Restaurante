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
} from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  projectId?: string;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  projectId = 'gen-lang-client-0083219337',
}) => {
  const [copiedType, setCopiedType] = useState<'exact' | 'wildcard' | null>(null);

  if (!isOpen) return null;

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : 'tu-dominio.netlify.app';

  // Extract base domain (e.g., netlify.app)
  const isNetlify = currentHostname.includes('netlify.app');
  const recommendedDomain = isNetlify ? 'netlify.app' : currentHostname;

  const handleCopy = (text: string, type: 'exact' | 'wildcard') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Firebase Security
                </span>
                <span className="text-xs font-mono text-zinc-400">auth/unauthorized-domain</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1 tracking-tight">
                Autorizar Dominio en Firebase
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Para iniciar sesión con Google desde Netlify o tu dominio, Firebase requiere autorizar el dominio por seguridad.
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

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar text-zinc-200 text-xs">
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-zinc-200 leading-relaxed">
                Por defecto, Firebase solo permite inicios de sesión en <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded font-mono">localhost</code>. 
                Al publicar tu restaurante en <strong className="text-white">Netlify</strong>, debes registrar tu dominio en la consola de Firebase (toma 30 segundos).
              </p>
            </div>
          </div>

          {/* Quick Copy Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              1. Dominios para Agregar (Copiar al portapapeles)
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
                    Tu subdominio específico asignado en este momento.
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
              2. Pasos para Activar en Firebase (Solo 30 segundos)
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                  1
                </span>
                <div className="flex-1">
                  <p className="text-zinc-200">
                    Abre la Consola de Firebase en la sección de autenticación de tu proyecto:
                  </p>
                  <a
                    href={firebaseConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md"
                  >
                    <span>Ir a Firebase Console (Configuración Auth)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                  2
                </span>
                <p className="text-zinc-300">
                  En la pestaña <strong className="text-white">Settings (Configuración)</strong>, baja hasta la sección <strong className="text-white">Authorized domains (Dominios autorizados)</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/30">
                  3
                </span>
                <p className="text-zinc-300">
                  Haz clic en <strong className="text-white">Add domain (Agregar dominio)</strong>, pega <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded font-mono font-bold">{recommendedDomain}</code> y haz clic en <strong className="text-white">Done / Guardar</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-emerald-500/30">
                  4
                </span>
                <p className="text-zinc-300">
                  Regresa aquí y haz clic en el botón <strong className="text-emerald-400">"Reintentar Conexión Google"</strong> abajo.
                </p>
              </div>
            </div>
          </div>

          {/* Offline/Local Resilience Notice */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-zinc-200">Tu restaurante no se detiene:</strong> Mesas, comandas, KDS de cocina, cobros, facturación e inventario funcionan 100% en almacenamiento local del navegador sin requerir Google Sheets.
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
