import React, { useState } from 'react';
import { Compra, Proveedor, MenuItem } from '../types/restaurant';
import {
  Truck,
  Plus,
  DollarSign,
  Phone,
  Mail,
  User,
  Calendar,
  Building,
  Package,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { formatCOP } from '../utils/colombiaFiscal';

interface InventorySuppliersProps {
  compras: Compra[];
  proveedores: Proveedor[];
  menu: MenuItem[];
  onAddCompra: (compra: Compra) => void;
  onAddProveedor: (proveedor: Proveedor) => void;
  onUpdateStock: (menuId: string, newStock: number) => void;
}

export const InventorySuppliers: React.FC<InventorySuppliersProps> = ({
  compras,
  proveedores,
  menu,
  onAddCompra,
  onAddProveedor,
  onUpdateStock,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'compras' | 'proveedores'>('stock');
  const [isCompraModalOpen, setIsCompraModalOpen] = useState(false);
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);

  // New Compra Form
  const [compraProveedorId, setCompraProveedorId] = useState(proveedores[0]?.id || '');
  const [compraMonto, setCompraMonto] = useState('');
  const [compraDescripcion, setCompraDescripcion] = useState('');

  // New Proveedor Form
  const [provNombre, setProvNombre] = useState('');
  const [provContacto, setProvContacto] = useState('');
  const [provTelefono, setProvTelefono] = useState('');
  const [provEmail, setProvEmail] = useState('');

  // Stock Filter
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');

  const totalGastosCompras = compras.reduce((acc, c) => acc + c.monto, 0);

  // Identify low stock items
  const lowStockItems = menu.filter((item) => item.stockActual <= item.stockMinimo);
  const criticalStockItems = menu.filter((item) => item.stockActual <= 0);

  const filteredMenuItems = menu.filter((item) => {
    if (stockFilter === 'low') return item.stockActual <= item.stockMinimo;
    if (stockFilter === 'ok') return item.stockActual > item.stockMinimo;
    return true;
  }).sort((a, b) => {
    // Sort items needing attention first
    const aUrgency = a.stockActual - a.stockMinimo;
    const bUrgency = b.stockActual - b.stockMinimo;
    return aUrgency - bUrgency;
  });

  const handleOpenCompraForDish = (dish: MenuItem) => {
    // Prefill purchase form for this dish
    setCompraDescripcion(`Reposición de stock: ${dish.nombre} (Mínimo requerido: ${dish.stockMinimo} uds)`);
    setCompraMonto(String(Math.round(dish.precio * 0.4 * 10))); // estimated wholesale cost in integer COP
    setIsCompraModalOpen(true);
  };

  const handleSaveCompra = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Math.round(parseFloat(compraMonto) || 0);
    if (monto <= 0) return alert('Monto inválido');

    const prov = proveedores.find((p) => p.id === compraProveedorId);
    const newCompra: Compra = {
      idCompra: `CMP-${(compras.length + 1).toString().padStart(3, '0')}`,
      proveedorId: compraProveedorId,
      proveedorNombre: prov?.nombre || 'Proveedor',
      fecha: new Date().toISOString().split('T')[0],
      monto,
      descripcion: compraDescripcion.trim(),
    };

    onAddCompra(newCompra);
    setCompraMonto('');
    setCompraDescripcion('');
    setIsCompraModalOpen(false);
  };

  const handleSaveProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provNombre.trim()) return alert('Nombre requerido');

    const newProv: Proveedor = {
      id: `PRV-${(proveedores.length + 1).toString().padStart(3, '0')}`,
      nombre: provNombre.trim(),
      contacto: provContacto.trim(),
      telefono: provTelefono.trim(),
      email: provEmail.trim(),
    };

    onAddProveedor(newProv);
    setProvNombre('');
    setProvContacto('');
    setProvTelefono('');
    setProvEmail('');
    setIsProveedorModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Módulo de Inventario & Existencias
              </h2>
              {lowStockItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  {lowStockItems.length} Alertas de Stock
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Control de nivel mínimo de stock sincronizado con Google Sheets 'Menú' y registro de compras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCompraModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra</span>
          </button>
          <button
            onClick={() => setIsProveedorModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition border border-zinc-700"
          >
            <Building className="w-4 h-4 text-amber-400" />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner for Administrators */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-zinc-900/80 border border-rose-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Alerta para Administración: Stock Mínimo Alcanzado</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500 text-white">
                  {lowStockItems.length} producto(s)
                </span>
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                Los siguientes productos han alcanzado o descendido del nivel mínimo establecido en la hoja de Menú:{' '}
                <strong className="text-amber-300 font-medium">
                  {lowStockItems.map((i) => `${i.nombre} (${i.stockActual}/${i.stockMinimo})`).join(', ')}.
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('stock');
              setStockFilter('low');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition whitespace-nowrap self-start sm:self-auto shadow-md"
          >
            Ver Productos en Alerta
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 p-2 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'stock'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Control de Stock & Alertas</span>
          {lowStockItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              {lowStockItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('compras')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'compras'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Compras de Insumos ({compras.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('proveedores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'proveedores'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Directorio de Proveedores ({proveedores.length})</span>
        </button>
      </div>

      {/* Content depending on tab */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Quick Filter buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  stockFilter === 'all'
                    ? 'bg-zinc-800 text-white border-zinc-700 shadow'
                    : 'text-zinc-400 border-transparent hover:text-zinc-200'
                }`}
              >
                Todos ({menu.length})
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  stockFilter === 'low'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800 shadow'
                    : 'text-zinc-400 border-transparent hover:text-rose-400'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>En Alerta Mínima ({lowStockItems.length})</span>
              </button>
              <button
                onClick={() => setStockFilter('ok')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  stockFilter === 'ok'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 shadow'
                    : 'text-zinc-400 border-transparent hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stock Saludable ({menu.length - lowStockItems.length})</span>
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Mínimos definidos en la columna <strong>Stock_Minimo</strong> de la hoja de Menú
            </p>
          </div>

          {/* Stock Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Producto / Plato</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Nivel Mínimo</th>
                  <th className="py-3 px-4">Estado de Alerta</th>
                  <th className="py-3 px-4 text-right">Acción de Reposición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredMenuItems.map((dish) => {
                  const isCritical = dish.stockActual <= 0;
                  const isLow = dish.stockActual <= dish.stockMinimo;
                  const pct = Math.min(100, Math.round((dish.stockActual / Math.max(dish.stockMinimo * 2, 1)) * 100));

                  return (
                    <tr
                      key={dish.id}
                      className={`hover:bg-zinc-800/40 transition ${
                        isLow ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm leading-snug">{dish.nombre}</div>
                        <div className="text-[11px] font-mono text-zinc-500">{dish.id} • {formatCOP(dish.precio)}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-300 font-medium">
                          {dish.categoria}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono text-sm font-black ${
                            isCritical
                              ? 'text-rose-400'
                              : isLow
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {dish.stockActual}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">unidades</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-300">
                        {dish.stockMinimo}
                        <span className="text-[10px] text-zinc-500 block">límite alerta</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isCritical ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              ¡AGOTADO!
                            </span>
                            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="w-0 h-full bg-rose-500" />
                            </div>
                          </div>
                        ) : isLow ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              STOCK BAJO
                            </span>
                            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500"
                                style={{ width: `${Math.max(10, pct)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Adecuado
                            </span>
                            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Add Stock Buttons */}
                          <button
                            onClick={() => onUpdateStock(dish.id, dish.stockActual + 5)}
                            className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold border border-zinc-700 transition"
                            title="Sumar 5 unidades inmediatamente"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => onUpdateStock(dish.id, dish.stockActual + 10)}
                            className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold border border-zinc-700 transition"
                            title="Sumar 10 unidades inmediatamente"
                          >
                            +10
                          </button>

                          <button
                            onClick={() => handleOpenCompraForDish(dish)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center gap-1"
                            title="Crear orden de compra para este insumo"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Comprar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compras Table */}
      {activeTab === 'compras' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID Compra</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Descripción / Insumos</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {compras.map((compra) => {
                const prov = proveedores.find((p) => p.id === compra.proveedorId);
                return (
                  <tr key={compra.idCompra} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {compra.idCompra}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {prov?.nombre || compra.proveedorNombre || compra.proveedorId}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{compra.fecha}</td>
                    <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">
                      {compra.descripcion}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {formatCOP(compra.monto)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Proveedores Grid */}
      {activeTab === 'proveedores' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedores.map((prov) => (
            <div
              key={prov.id}
              className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 font-semibold">{prov.id}</span>
                  <h3 className="text-base font-bold text-white">{prov.nombre}</h3>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800 text-amber-400">
                  <Building className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Contacto: {prov.contacto || 'Sin contacto'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{prov.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate">{prov.email || 'Sin correo'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Compra Modal */}
      {isCompraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Registrar Compra de Insumos</h3>
            <form onSubmit={handleSaveCompra} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Proveedor:</label>
                <select
                  value={compraProveedorId}
                  onChange={(e) => setCompraProveedorId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Monto de la Compra (COP sin decimales):</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  value={compraMonto}
                  onChange={(e) => setCompraMonto(e.target.value)}
                  placeholder="450000"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Descripción / Insumos Repuestos:</label>
                <textarea
                  rows={3}
                  required
                  value={compraDescripcion}
                  onChange={(e) => setCompraDescripcion(e.target.value)}
                  placeholder="Ej. Reposición de carne Angus, 10kg, queso cheddar..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCompraModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md transition"
                >
                  Guardar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Proveedor Modal */}
      {isProveedorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Registrar Nuevo Proveedor</h3>
            <form onSubmit={handleSaveProveedor} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Empresa / Proveedor:</label>
                <input
                  type="text"
                  required
                  value={provNombre}
                  onChange={(e) => setProvNombre(e.target.value)}
                  placeholder="Ej. Lácteos San Pedro"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Persona de Contacto:</label>
                <input
                  type="text"
                  value={provContacto}
                  onChange={(e) => setProvContacto(e.target.value)}
                  placeholder="Ej. Jorge Ramírez"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={provTelefono}
                    onChange={(e) => setProvTelefono(e.target.value)}
                    placeholder="+1 (555)..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Email:</label>
                  <input
                    type="email"
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    placeholder="ventas@..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProveedorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md transition"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
