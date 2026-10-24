import React, { useState } from 'react';
import { Cliente } from '../types/restaurant';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Search,
  ShoppingBag,
  History,
} from 'lucide-react';

interface CustomerManagementProps {
  clientes: Cliente[];
  onAddCliente: (cliente: Cliente) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  clientes,
  onAddCliente,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return alert('Nombre requerido');

    const newCliente: Cliente = {
      id: `CLI-${(clientes.length + 1).toString().padStart(3, '0')}`,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      historialPedidos: 'Nuevo cliente registrado',
    };

    onAddCliente(newCliente);
    setNombre('');
    setTelefono('');
    setEmail('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Base de Clientes & Fidelización
            </h2>
            <p className="text-xs text-zinc-400">
              {clientes.length} clientes registrados • Sincronizado con Google Sheets 'Clientes'
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl">
        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o correo electrónico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 placeholder-zinc-500"
        />
      </div>

      {/* Grid of Customers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.map((cliente) => (
          <div
            key={cliente.id}
            className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 font-semibold">{cliente.id}</span>
                <h3 className="text-base font-bold text-white">{cliente.nombre}</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center">
                {cliente.nombre[0].toUpperCase()}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span>{cliente.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span className="truncate">{cliente.email || 'Sin correo'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 text-xs text-zinc-400">
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate text-[11px]">{cliente.historialPedidos}</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Registrar Nuevo Cliente</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Laura Gómez"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
