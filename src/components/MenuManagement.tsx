import React, { useState } from 'react';
import { MenuItem } from '../types/restaurant';
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  BookOpen,
  DollarSign,
  Tag,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { formatCOP } from '../utils/colombiaFiscal';

interface MenuManagementProps {
  menu: MenuItem[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onToggleAvailability: (itemId: string) => void;
  isAdmin?: boolean;
  onRequireAdminAuth?: (action: () => void, title: string) => void;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({
  menu,
  onAddMenuItem,
  onUpdateMenuItem,
  onToggleAvailability,
  isAdmin = true,
  onRequireAdminAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Platos Fuertes');
  const [disponible, setDisponible] = useState(true);
  const [stockActual, setStockActual] = useState('15');
  const [stockMinimo, setStockMinimo] = useState('5');

  const categories = ['Todos', ...Array.from(new Set(menu.map((m) => m.categoria)))];

  const filteredMenu = menu.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.categoria === selectedCategory;
    const matchesSearch =
      item.nombre.toLowerCase().includes(search.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openNewItemModal = () => {
    setEditingItem(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoria('Platos Fuertes');
    setDisponible(true);
    setStockActual('15');
    setStockMinimo('5');
    setIsModalOpen(true);
  };

  const handleOpenNewItem = () => {
    if (!isAdmin && onRequireAdminAuth) {
      onRequireAdminAuth(openNewItemModal, 'Crear Nuevo Plato en el Menú');
      return;
    }
    openNewItemModal();
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setNombre(item.nombre);
    setDescripcion(item.descripcion);
    setPrecio(String(item.precio));
    setCategoria(item.categoria);
    setDisponible(item.disponible);
    setStockActual(String(item.stockActual ?? 15));
    setStockMinimo(String(item.stockMinimo ?? 5));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dish: MenuItem) => {
    if (!isAdmin && onRequireAdminAuth) {
      onRequireAdminAuth(() => openEditModal(dish), 'Modificar Plato o Precios del Menú');
      return;
    }
    openEditModal(dish);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = Math.round(parseFloat(precio) || 0);
    const numStock = parseInt(stockActual, 10) || 0;
    const numMin = parseInt(stockMinimo, 10) || 0;

    if (!nombre.trim() || numPrice <= 0) {
      alert('Por favor introduce un nombre válido y precio mayor a 0');
      return;
    }

    if (editingItem) {
      onUpdateMenuItem({
        ...editingItem,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: numPrice,
        categoria: categoria.trim(),
        disponible: numStock > 0 ? disponible : false,
        stockActual: numStock,
        stockMinimo: numMin,
      });
    } else {
      const newItem: MenuItem = {
        id: `MEN-${(menu.length + 1).toString().padStart(3, '0')}`,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: numPrice,
        categoria: categoria.trim(),
        disponible: numStock > 0 ? disponible : false,
        stockActual: numStock,
        stockMinimo: numMin,
      };
      onAddMenuItem(newItem);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Catálogo de Menú & Platos
              </h2>
              {isAdmin ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Modo Administrador
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  Modo Consulta (Modificaciones con PIN Admin)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {menu.length} productos registrados • {isAdmin ? 'Edición completa habilitada' : 'Solo Administrador puede crear platos o alterar precios'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewItem}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nuevo Plato</span>
          {!isAdmin && <Lock className="w-3 h-3 text-zinc-900" />}
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 placeholder-zinc-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 border-amber-400'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenu.map((dish) => (
          <div
            key={dish.id}
            className={`p-4 rounded-2xl border transition bg-zinc-900/80 flex flex-col justify-between ${
              dish.disponible
                ? 'border-zinc-800 hover:border-zinc-700'
                : 'border-zinc-800/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 font-semibold">{dish.id}</span>
                  <h3 className="text-base font-bold text-white leading-snug">{dish.nombre}</h3>
                </div>
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  {formatCOP(dish.precio)}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                {dish.descripcion || 'Sin descripción'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-300 font-medium">
                  {dish.categoria}
                </span>

                {/* Stock Level Badge */}
                {dish.stockActual <= 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Sin Stock (0 uds)
                  </span>
                ) : dish.stockActual <= dish.stockMinimo ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Stock Bajo ({dish.stockActual} / mín {dish.stockMinimo})
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                    Stock: <strong className="text-emerald-400">{dish.stockActual}</strong> uds (mín {dish.stockMinimo})
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/40">
                <button
                  onClick={() => onToggleAvailability(dish.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    dish.disponible
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                  title="Cambiar disponibilidad"
                >
                  {dish.disponible ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Disponible</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Agotado</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOpenEdit(dish)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1"
                  title={isAdmin ? "Editar plato y precio" : "Editar plato (requiere PIN de Administrador)"}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {!isAdmin && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingItem ? `Editar Plato (${editingItem.id})` : 'Nuevo Plato para el Menú'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nombre del Plato:</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Tacos al Pastor"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ingredientes principales, preparación..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Precio (COP sin decimales):</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="35000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Categoría:</label>
                  <input
                    type="text"
                    required
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Platos Fuertes, Bebidas, etc."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Stock Actual (Uds):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    placeholder="15"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Stock Mínimo (Alerta):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    placeholder="5"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="disponibleCheck"
                  checked={disponible}
                  onChange={(e) => setDisponible(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                />
                <label htmlFor="disponibleCheck" className="text-zinc-300 font-medium cursor-pointer">
                  Producto disponible en cocina y carta
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md transition"
                >
                  Guardar Plato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
