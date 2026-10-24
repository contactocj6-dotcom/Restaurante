import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  User,
  Users,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Sparkles,
  Delete,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { StaffUser, StaffRole } from '../types/restaurant';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  staffUsers: StaffUser[];
  activeUser: StaffUser | null;
  onSelectUser: (user: StaffUser) => void;
  isLockScreen?: boolean;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  staffUsers,
  activeUser,
  onSelectUser,
  isLockScreen = false,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(activeUser || staffUsers[0] || null);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg(null);

      // Auto-validate at 4 digits
      if (nextPin.length === 4 && selectedStaff) {
        validatePin(nextPin, selectedStaff);
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

  const validatePin = (pin: string, userToAuth: StaffUser) => {
    if (userToAuth.pin === pin) {
      setSuccessMsg(`¡Bienvenido/a, ${userToAuth.nombre}!`);
      setErrorMsg(null);
      setTimeout(() => {
        onSelectUser(userToAuth);
        setPinInput('');
        setSuccessMsg(null);
        if (onClose) onClose();
      }, 500);
    } else {
      setErrorMsg('PIN incorrecto. Intenta nuevamente.');
      setPinInput('');
    }
  };

  const getRoleBadge = (rol: StaffRole) => {
    switch (rol) {
      case 'Administrador':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          icon: ShieldCheck,
          label: 'Admin / Gerencia',
        };
      case 'Cajero':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          icon: Receipt,
          label: 'Caja & Cobros',
        };
      case 'Mesero':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: UtensilsCrossed,
          label: 'Mesero / Sala',
        };
      case 'Cocina':
        return {
          bg: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
          icon: ChefHat,
          label: 'Cocina & KDS',
        };
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 ${
        isLockScreen ? 'cursor-default' : ''
      }`}
    >
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  {isLockScreen ? 'Terminal Bloqueada • Inicio de Sesión' : 'Cambiar Usuario / Turno de Personal'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  PIN SEGURO
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Identifícate con tu usuario y PIN para registrar tus comandas, cobros y preparación
              </p>
            </div>
          </div>

          {!isLockScreen && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body: Two Columns (Left: User Selector, Right: PIN Pad) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Staff Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Selecciona tu Usuario
              </span>
              <span className="text-[11px] text-zinc-500">
                {staffUsers.filter((u) => u.activo).length} activos
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {staffUsers
                .filter((u) => u.activo)
                .map((u) => {
                  const isSelected = selectedStaff?.id === u.id;
                  const roleBadge = getRoleBadge(u.rol);
                  const Icon = roleBadge.icon;

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedStaff(u);
                        setPinInput('');
                        setErrorMsg(null);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-zinc-950/50 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                            u.avatarColor || 'from-zinc-700 to-zinc-800'
                          } flex items-center justify-center font-black text-white text-sm shadow shrink-0`}
                        >
                          {u.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                            <span className="truncate">{u.nombre}</span>
                            {activeUser?.id === u.id && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                Sesión actual
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${roleBadge.bg}`}
                            >
                              <Icon className="w-2.5 h-2.5" />
                              <span>{roleBadge.label}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Helper PIN badge for quick dev/demo testing */}
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded-lg bg-zinc-800/90 text-zinc-400 border border-zinc-700/60 shrink-0"
                        title={`PIN predeterminado: ${u.pin}`}
                      >
                        PIN: {u.pin}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Column: PIN Keypad */}
          <div className="flex flex-col items-center justify-center space-y-4 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80">
            {selectedStaff ? (
              <>
                <div className="text-center space-y-1">
                  <span className="text-xs text-zinc-400">Ingresa el PIN de 4 dígitos para:</span>
                  <div className="font-extrabold text-white text-base">
                    {selectedStaff.nombre}
                  </div>
                  <span className="text-[11px] text-amber-400 font-medium">
                    {selectedStaff.rol}
                  </span>
                </div>

                {/* PIN Display Dots */}
                <div className="flex items-center justify-center gap-3 my-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                          isFilled
                            ? 'bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/40'
                            : 'bg-zinc-900 border-zinc-700'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Status Messages */}
                {errorMsg && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 animate-shake">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Numeric Keypad (3x4 Grid) */}
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeyPress(digit)}
                      className="h-12 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-white text-lg font-bold transition flex items-center justify-center border border-zinc-700/60 shadow-sm"
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-400 text-xs font-bold transition flex items-center justify-center border border-zinc-800"
                  >
                    Borrar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKeyPress('0')}
                    className="h-12 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-white text-lg font-bold transition flex items-center justify-center border border-zinc-700/60 shadow-sm"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteDigit}
                    className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-400 hover:text-rose-400 transition flex items-center justify-center border border-zinc-800"
                    title="Retroceso"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Selecciona un usuario de la lista izquierda para ingresar su PIN.
              </div>
            )}
          </div>
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Cada acción (creación de comanda, cambio a cocina, cobro) queda registrada con el nombre del usuario activo.
            </span>
          </div>

          {!isLockScreen && activeUser && (
            <span className="font-mono text-zinc-500">
              Usuario en sesión: <strong className="text-zinc-300">{activeUser.nombre}</strong> ({activeUser.rol})
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
