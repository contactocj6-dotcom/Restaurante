import React, { useState } from 'react';
import { Table, Comanda } from '../types/restaurant';
import {
  X,
  ArrowRightLeft,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Utensils,
  Sparkles,
} from 'lucide-react';
import { formatCOP } from '../utils/colombiaFiscal';

interface TableTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: Table;
  activeComanda: Comanda;
  allTables: Table[];
  allComandas: Comanda[];
  onTransferTable: (sourceTableId: string, targetTableId: string) => void;
  onMergeTables: (sourceTableId: string, targetTableId: string) => void;
}

export const TableTransferModal: React.FC<TableTransferModalProps> = ({
  isOpen,
  onClose,
  sourceTable,
  activeComanda,
  allTables,
  allComandas,
  onTransferTable,
  onMergeTables,
}) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'merge'>('transfer');
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('');

  if (!isOpen) return null;

  const targetTable = allTables.find((t) => t.id === selectedTargetTableId);
  const targetActiveComanda = targetTable
    ? allComandas.find(
        (c) => (c.idMesa === targetTable.id || c.mesaNumero === targetTable.numero) && c.estado !== 'Entregado'
      )
    : undefined;

  // Mesas disponibles para transferir (solo mesas Libres excluyendo la mesa actual)
  const availableTransferTables = allTables.filter(
    (t) => t.id !== sourceTable.id && t.estado === 'Libre'
  );

  // Mesas disponibles para unir (cualquier otra mesa del restaurante)
  const availableMergeTables = allTables.filter((t) => t.id !== sourceTable.id);

  const handleConfirmAction = () => {
    if (!selectedTargetTableId) return;

    if (activeTab === 'transfer') {
      onTransferTable(sourceTable.id, selectedTargetTableId);
    } else {
      onMergeTables(sourceTable.id, selectedTargetTableId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Mesa #{sourceTable.numero}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeComanda.idComanda}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Cliente: <strong className="text-zinc-200">{sourceTable.clienteNombre || 'Sin nombre'}</strong> • Total: {formatCOP(activeComanda.total)}
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

        {/* Tab Selection */}
        <div className="p-2 bg-zinc-900/60 border-b border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('transfer');
              setSelectedTargetTableId('');
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'transfer'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Mudar de Mesa (Cambio)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('merge');
              setSelectedTargetTableId('');
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'merge'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Unir Mesas (Merge)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'transfer' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                <p className="font-semibold text-white mb-1">Mudar clientes a otra mesa libre</p>
                <p className="text-zinc-400">
                  La comanda <strong className="text-amber-400">{activeComanda.idComanda}</strong> y todos sus ítems se transferirán a la mesa destino seleccionada. La <strong>Mesa #{sourceTable.numero}</strong> quedará Libre de inmediato.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Selecciona la Mesa Destino (Libres):
                </label>
                {availableTransferTables.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                    No hay mesas libres disponibles en este momento para transferir.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {availableTransferTables.map((tbl) => {
                      const isSelected = selectedTargetTableId === tbl.id;
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => setSelectedTargetTableId(tbl.id)}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
                          }`}
                        >
                          <span className="font-black text-sm">Mesa #{tbl.numero}</span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                            <Users className="w-3 h-3" />
                            {tbl.capacidad} pax
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                <p className="font-semibold text-white mb-1">Fusión o Unión de Mesas Físicas</p>
                <p className="text-zinc-400">
                  Une la <strong>Mesa #{sourceTable.numero}</strong> con otra mesa para grupos grandes. Si la otra mesa ya tiene comanda abierta, los platos de ambas se consolidarán en una sola cuenta maestra.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Selecciona la mesa a unir:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {availableMergeTables.map((tbl) => {
                    const isSelected = selectedTargetTableId === tbl.id;
                    const isTargetOccupied = tbl.estado === 'Ocupada';
                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setSelectedTargetTableId(tbl.id)}
                        className={`p-3 rounded-2xl border text-left transition space-y-1 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 shadow-lg'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black text-sm">Mesa #{tbl.numero}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              isTargetOccupied
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {tbl.estado}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                          <span>{tbl.capacidad} pax</span>
                          {tbl.clienteNombre && (
                            <span className="truncate max-w-[70px] text-zinc-300">
                              {tbl.clienteNombre}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary of Merge */}
              {targetTable && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Resultado de la Unión:</span>
                  </div>
                  <div className="text-zinc-300 text-[11px] space-y-1">
                    <p>
                      • <strong>Capacidad combinada:</strong>{' '}
                      {sourceTable.capacidad + targetTable.capacidad} comensales.
                    </p>
                    {targetActiveComanda ? (
                      <p className="text-amber-300">
                        • <strong>Fusión de cuentas:</strong> Se unificarán {activeComanda.listaItems.length} platos de Mesa #{sourceTable.numero} con {targetActiveComanda.listaItems.length} platos de Mesa #{targetTable.numero}.
                        Total combinado: <span className="font-mono font-bold text-emerald-400">{formatCOP(activeComanda.total + targetActiveComanda.total)}</span>.
                      </p>
                    ) : (
                      <p className="text-zinc-400">
                        • La Mesa #{targetTable.numero} quedará vinculada para la misma cuenta de Mesa #{sourceTable.numero}.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!selectedTargetTableId}
            onClick={handleConfirmAction}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs shadow-lg transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {activeTab === 'transfer'
                ? `Mudar a Mesa #${targetTable?.numero || '...'}`
                : `Confirmar Unión con Mesa #${targetTable?.numero || '...'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
