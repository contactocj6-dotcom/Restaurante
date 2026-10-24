import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  Table,
  Comanda,
  ComandaItem,
  ComandaStatus,
  StaffUser,
} from '../types/restaurant';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  MessageSquare,
  DollarSign,
  Utensils,
  Check,
  UserCheck,
} from 'lucide-react';
import { formatCOP, calculateColombiaTaxes } from '../utils/colombiaFiscal';

interface ComandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  menu: MenuItem[];
  initialTable?: Table | null;
  existingComanda?: Comanda | null;
  activeStaffUser?: StaffUser | null;
  onSaveComanda: (comandaData: {
    idComanda: string;
    idMesa: string;
    mesaNumero: number;
    listaItems: ComandaItem[];
    total: number;
    estado: ComandaStatus;
    clienteNombre?: string;
    notasGenerales?: string;
    meseroId?: string;
    meseroNombre?: string;
  }) => Promise<void>;
}

export const ComandaModal: React.FC<ComandaModalProps> = ({
  isOpen,
  onClose,
  tables,
  menu,
  initialTable,
  existingComanda,
  activeStaffUser,
  onSaveComanda,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(
    initialTable?.id || (tables.length > 0 ? tables[0].id : '')
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [items, setItems] = useState<ComandaItem[]>([]);
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [notasGenerales, setNotasGenerales] = useState<string>('');
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingComanda) {
        setSelectedTableId(existingComanda.idMesa);
        setItems(existingComanda.listaItems || []);
        setClienteNombre(existingComanda.clienteNombre || '');
        setNotasGenerales(existingComanda.notasGenerales || '');
      } else if (initialTable) {
        setSelectedTableId(initialTable.id);
        setClienteNombre(initialTable.clienteNombre || '');
        setItems([]);
        setNotasGenerales('');
      } else {
        setSelectedTableId(tables[0]?.id || '');
        setItems([]);
        setClienteNombre('');
        setNotasGenerales('');
      }
    }
  }, [isOpen, initialTable, existingComanda, tables]);

  if (!isOpen) return null;

  const categories = ['Todos', ...Array.from(new Set(menu.map((m) => m.categoria)))];

  const filteredMenu = menu.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.categoria === selectedCategory;
    const matchesSearch =
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addItemToOrder = (dish: MenuItem) => {
    if (!dish.disponible) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.menuId === dish.id);
      if (existing) {
        return prev.map((i) =>
          i.menuId === dish.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuId: dish.id,
          nombre: dish.nombre,
          precio: dish.precio,
          cantidad: 1,
        },
      ];
    });
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.menuId === menuId) {
            const newQty = i.cantidad + delta;
            return newQty > 0 ? { ...i, cantidad: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as ComandaItem[]
    );
  };

  const removeItem = (menuId: string) => {
    setItems((prev) => prev.filter((i) => i.menuId !== menuId));
  };

  const saveItemNote = (menuId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.menuId === menuId ? { ...i, notas: tempNoteText.trim() } : i))
    );
    setActiveNoteItemId(null);
    setTempNoteText('');
  };

  const totalAmount = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('Por favor agrega al menos un producto a la comanda');
      return;
    }
    if (!selectedTable) {
      alert('Por favor selecciona una mesa válida');
      return;
    }

    setIsSubmitting(true);
    try {
      const comandaId = existingComanda
        ? existingComanda.idComanda
        : `COM-${Date.now().toString().slice(-4)}`;

      const meseroId = activeStaffUser?.id || existingComanda?.meseroId || 'USR-004';
      const meseroNombre = activeStaffUser?.nombre || existingComanda?.meseroNombre || 'Personal de Turno';

      await onSaveComanda({
        idComanda: comandaId,
        idMesa: selectedTable.id,
        mesaNumero: selectedTable.numero,
        listaItems: items,
        total: totalAmount,
        estado: existingComanda?.estado || 'Pendiente',
        clienteNombre: clienteNombre.trim() || undefined,
        notasGenerales: notasGenerales.trim() || undefined,
        meseroId,
        meseroNombre,
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar la comanda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-5xl h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {existingComanda ? `Modificar Comanda ${existingComanda.idComanda}` : 'Nueva Comanda de Restaurante'}
                </h2>
                {activeStaffUser && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                    <UserCheck className="w-3 h-3 text-amber-400" />
                    <span>{activeStaffUser.rol}: {activeStaffUser.nombre}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Toma de pedido • Registrado a cargo de: <strong className="text-zinc-200">{activeStaffUser?.nombre || existingComanda?.meseroNombre || 'Personal de Turno'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Menu Picker (Left/Center) & Order Summary (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: Menu Explorer */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-hidden bg-zinc-900/30">
            {/* Table & Client Selection header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Mesa Asignada:
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Mesa {t.numero} ({t.capacidad} pers) - {t.estado}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nombre del Cliente (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                />
              </div>
            </div>

            {/* Search and Category pills */}
            <div className="p-4 space-y-3 border-b border-zinc-800 bg-zinc-950/40">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar platos, bebidas, entradas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 placeholder-zinc-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredMenu.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => dish.disponible && addItemToOrder(dish)}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                    dish.disponible
                      ? 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80 cursor-pointer shadow-sm active:scale-[0.98]'
                      : 'bg-zinc-950/60 border-zinc-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white leading-snug">{dish.nombre}</h4>
                      <span className="font-mono text-xs font-bold text-amber-400 shrink-0">
                        {formatCOP(dish.precio)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{dish.descripcion}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                      {dish.categoria}
                    </span>

                    {dish.disponible ? (
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        Agotado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Active Order Summary & Send to Kitchen */}
          <div className="w-full lg:w-96 flex flex-col bg-zinc-950 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div>
                <h3 className="text-sm font-bold text-white">Comanda en Preparación</h3>
                <p className="text-xs text-zinc-400">
                  {selectedTable ? `Mesa #${selectedTable.numero}` : 'Seleccione mesa'} • {items.length} productos
                </p>
              </div>

              {items.length > 0 && (
                <button
                  onClick={() => setItems([])}
                  className="text-xs text-zinc-500 hover:text-rose-400 transition"
                  title="Vaciar comanda"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Selected Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <Utensils className="w-10 h-10 stroke-1 text-zinc-700 mb-2" />
                  <p className="text-sm font-medium text-zinc-400">La comanda está vacía</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Toca cualquier producto del menú a la izquierda para agregarlo al pedido.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.menuId}
                    className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">{item.nombre}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {formatCOP(item.precio)} c/u
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {formatCOP(item.precio * item.cantidad)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls & Notes */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            activeNoteItemId === item.menuId
                              ? setActiveNoteItemId(null)
                              : (setActiveNoteItemId(item.menuId), setTempNoteText(item.notas || ''))
                          }
                          className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                            item.notas
                              ? 'bg-amber-500/20 text-amber-300 font-medium'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                          }`}
                          title="Agregar nota o instrucción para cocina"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[10px]">
                            {item.notas ? 'Nota lista' : 'Nota'}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800">
                        <button
                          onClick={() => updateQuantity(item.menuId, -1)}
                          className="text-zinc-400 hover:text-white p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-xs font-bold text-white w-4 text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuId, 1)}
                          className="text-zinc-400 hover:text-white p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.menuId)}
                        className="text-zinc-600 hover:text-rose-400 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Note Input if active */}
                    {activeNoteItemId === item.menuId && (
                      <div className="mt-2 p-2 bg-zinc-950 rounded-xl border border-zinc-700 flex gap-2">
                        <input
                          type="text"
                          placeholder="Ej. Sin cebolla, bien cocido..."
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => saveItemNote(item.menuId)}
                          className="p-1 rounded bg-amber-500 text-zinc-950 text-xs font-bold"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Displayed note badge */}
                    {item.notas && activeNoteItemId !== item.menuId && (
                      <div className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 italic">
                        "{item.notas}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* General notes & Total & Send button */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Instrucción general (ej. Todo junto, para llevar)..."
                  value={notasGenerales}
                  onChange={(e) => setNotasGenerales(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                />
              </div>

              <div className="space-y-1 pt-1">
                {(() => {
                  const taxes = calculateColombiaTaxes(totalAmount, 0, 'INC');
                  return (
                    <>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Subtotal (Base):</span>
                        <span className="font-mono text-zinc-300">{formatCOP(taxes.baseGravable)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>INC (8% Alimentos/Bebidas):</span>
                        <span className="font-mono text-zinc-300">{formatCOP(taxes.impuestoInc8)}</span>
                      </div>
                      <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-zinc-800">
                        <span>Total comanda (COP):</span>
                        <span className="text-emerald-400 font-mono">{formatCOP(totalAmount)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Enviando a Cocina...'
                    : existingComanda
                    ? 'Actualizar Comanda'
                    : 'Enviar a Cocina (Notificar)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
