import React, { useState, useEffect } from 'react';
import { Table, Cliente, Reserva, ReservaEstado } from '../types/restaurant';
import {
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  X,
  AlertTriangle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reserva: {
    id?: string;
    idMesa: string;
    mesaNumero: number;
    clienteNombre: string;
    clienteTelefono?: string;
    clienteEmail?: string;
    fecha: string;
    hora: string;
    comensales: number;
    notas?: string;
    estado: ReservaEstado;
  }) => void;
  tables: Table[];
  clientes: Cliente[];
  initialReservation?: Reserva | null;
  defaultTableId?: string | null;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tables,
  clientes,
  initialReservation,
  defaultTableId,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [comensales, setComensales] = useState<number>(2);
  const [notas, setNotas] = useState('');
  const [estado, setEstado] = useState<ReservaEstado>('Confirmada');
  const [suggestions, setSuggestions] = useState<Cliente[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialReservation) {
        setSelectedTableId(initialReservation.idMesa);
        setClienteNombre(initialReservation.clienteNombre);
        setClienteTelefono(initialReservation.clienteTelefono || '');
        setClienteEmail(initialReservation.clienteEmail || '');
        setFecha(initialReservation.fecha);
        setHora(initialReservation.hora);
        setComensales(initialReservation.comensales);
        setNotas(initialReservation.notas || '');
        setEstado(initialReservation.estado);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setFecha(todayStr);
        // Default time: round to next half hour or 20:00
        const now = new Date();
        const currentHour = now.getHours();
        const defaultHour = currentHour < 14 ? '14:00' : currentHour < 20 ? '20:30' : '21:30';
        setHora(defaultHour);

        if (defaultTableId) {
          setSelectedTableId(defaultTableId);
          const t = tables.find((tbl) => tbl.id === defaultTableId);
          if (t) setComensales(Math.min(t.capacidad, 4));
        } else if (tables.length > 0) {
          const firstFree = tables.find((t) => t.estado === 'Libre') || tables[0];
          setSelectedTableId(firstFree.id);
          setComensales(Math.min(firstFree.capacidad, 4));
        }

        setClienteNombre('');
        setClienteTelefono('');
        setClienteEmail('');
        setNotas('');
        setEstado('Confirmada');
      }
    }
  }, [isOpen, initialReservation, defaultTableId, tables]);

  if (!isOpen) return null;

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const isOverCapacity = selectedTable ? comensales > selectedTable.capacidad : false;

  const handleClientNameChange = (val: string) => {
    setClienteNombre(val);
    if (val.trim().length > 1) {
      const matches = clientes.filter((c) =>
        c.nombre.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(matches.slice(0, 4));
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectClient = (c: Cliente) => {
    setClienteNombre(c.nombre);
    if (c.telefono) setClienteTelefono(c.telefono);
    if (c.email) setClienteEmail(c.email);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      alert('Por favor selecciona una mesa.');
      return;
    }
    if (!clienteNombre.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }
    if (!fecha) {
      alert('Por favor ingresa la fecha de la reserva.');
      return;
    }
    if (!hora) {
      alert('Por favor especifica la hora de llegada.');
      return;
    }
    if (comensales < 1) {
      alert('La cantidad de comensales debe ser al menos 1.');
      return;
    }

    const targetTable = tables.find((t) => t.id === selectedTableId);
    if (!targetTable) return;

    onSave({
      id: initialReservation?.id,
      idMesa: targetTable.id,
      mesaNumero: targetTable.numero,
      clienteNombre: clienteNombre.trim(),
      clienteTelefono: clienteTelefono.trim() || undefined,
      clienteEmail: clienteEmail.trim() || undefined,
      fecha,
      hora,
      comensales: Number(comensales),
      notas: notas.trim() || undefined,
      estado,
    });
    onClose();
  };

  const setFastDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setFecha(d.toISOString().split('T')[0]);
  };

  const quickTimes = ['13:00', '13:30', '14:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {initialReservation ? 'Editar Reserva' : 'Registrar Nueva Reserva'}
              </h2>
              <p className="text-xs text-zinc-400">
                {initialReservation
                  ? `Modificando reserva ${initialReservation.id}`
                  : 'Programa una llegada futura y reserva la mesa correspondiente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Table & Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <span>Mesa Asignada</span>
                <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => {
                  setSelectedTableId(e.target.value);
                  const tbl = tables.find((t) => t.id === e.target.value);
                  if (tbl && comensales > tbl.capacidad) {
                    setComensales(tbl.capacidad);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.numero} ({t.capacidad} pers.) — {t.estado}
                  </option>
                ))}
              </select>
              {selectedTable && (
                <div className="mt-1 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Capacidad: {selectedTable.capacidad} personas</span>
                  <span
                    className={`font-medium ${
                      selectedTable.estado === 'Libre'
                        ? 'text-emerald-400'
                        : selectedTable.estado === 'Reservada'
                        ? 'text-indigo-400'
                        : 'text-amber-400'
                    }`}
                  >
                    Estado: {selectedTable.estado}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cantidad de Comensales</span>
                  <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-400">{comensales} pax</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={comensales}
                  onChange={(e) => setComensales(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                <div className="flex gap-1">
                  {[2, 4, 6].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setComensales(num)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold border transition ${
                        comensales === num
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {isOverCapacity && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/60 p-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Supera la capacidad de la mesa ({selectedTable?.capacidad} pers).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fecha de Llegada</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setFastDate(0)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setFastDate(1)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                  >
                    Mañana
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Hora de Llegada</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {quickTimes.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setHora(t)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition ${
                        hora === t
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nombre del Cliente / Titular</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Familia Gómez o Sofía Valenzuela"
                value={clienteNombre}
                onChange={(e) => handleClientNameChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-1.5 text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950 px-2.5">
                    Clientes frecuentes registrados
                  </div>
                  {suggestions.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => handleSelectClient(c)}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-indigo-600/30 flex items-center justify-between border-b border-zinc-800/40 last:border-0"
                    >
                      <span className="font-semibold">{c.nombre}</span>
                      <span className="text-[11px] text-zinc-400">{c.telefono || c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Teléfono de Contacto</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Email (Opcional)</span>
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Notas & Peticiones Especiales</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Cumpleaños, requiere silla alta para bebé, alergia a mariscos, cerca de la ventana..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Status (if editing) */}
          {initialReservation && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Estado de la Reserva
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Confirmada', 'Llegada', 'Cancelada', 'No_Presentado'] as ReservaEstado[]).map(
                  (st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setEstado(st)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                        estado === st
                          ? st === 'Confirmada'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : st === 'Llegada'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : st === 'Cancelada'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-zinc-800 text-amber-300 border-zinc-700'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {st === 'No_Presentado' ? 'No asistió' : st}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition border border-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{initialReservation ? 'Actualizar Reserva' : 'Confirmar Reserva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
