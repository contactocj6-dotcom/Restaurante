import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  X,
  CheckCircle,
  AlertCircle,
  Delete,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { StaffUser } from '../types/restaurant';

interface AdminPinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle: string;
  adminUsers: StaffUser[];
}

export const AdminPinVerificationModal: React.FC<AdminPinVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle,
  adminUsers,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        validateAdminPin(nextPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClearPin = () => {
    setPinInput('');
    setErrorMsg(null);
  };

  const validateAdminPin = (pin: string) => {
    // Check if the pin belongs to any active Administrator
    const matchedAdmin = adminUsers.find((admin) => admin.activo && admin.pin === pin);

    if (matchedAdmin) {
      setSuccessMsg(`¡Autorizado por ${matchedAdmin.nombre}!`);
      setErrorMsg(null);
      setTimeout(() => {
        setPinInput('');
        setSuccessMsg(null);
        onSuccess();
        onClose();
      }, 500);
    } else {
      setErrorMsg('PIN de Administrador inválido');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                Solo Administrador
              </span>
              <h2 className="text-sm font-black text-white mt-0.5">
                Autorización Requerida
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-center">
          <div>
            <p className="text-xs text-zinc-300 font-semibold">
              {actionTitle}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Ingresa el PIN de 4 dígitos de un usuario con rol <strong className="text-white">Administrador</strong> para continuar.
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex items-center justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? 'bg-rose-500 border-rose-500 scale-110 shadow-lg shadow-rose-500/40'
                      : 'bg-zinc-950 border-zinc-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Error / Success Feedback */}
          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold bg-rose-500/10 py-1.5 px-3 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[220px] mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white text-base font-bold transition flex items-center justify-center border border-zinc-700 shadow-sm"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClearPin}
              className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-zinc-400 text-xs font-bold transition flex items-center justify-center border border-zinc-800"
            >
              Borrar
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white text-base font-bold transition flex items-center justify-center border border-zinc-700 shadow-sm"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDeleteDigit}
              className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-zinc-400 hover:text-rose-400 transition flex items-center justify-center border border-zinc-800"
              title="Borrar dígito"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 px-4">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-rose-400" />
            <span>Seguridad RBAC del Restaurante</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition font-semibold"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};
