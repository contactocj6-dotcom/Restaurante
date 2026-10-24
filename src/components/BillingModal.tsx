import React, { useState } from 'react';
import {
  Table,
  Comanda,
  PaymentMethod,
  Cajero,
  DesglosePagoMixto,
  ComandaItem,
} from '../types/restaurant';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  CheckCircle2,
  Receipt,
  FileText,
  FileDown,
  User,
  AlertTriangle,
  Building2,
  Split,
  Users,
  Coins,
  ArrowRight,
  Sparkles,
  Percent,
} from 'lucide-react';
import {
  DIAN_COMPANY_INFO,
  formatCOP,
  calculateColombiaTaxes,
} from '../utils/colombiaFiscal';
import { generateThermalTicketPDF } from '../services/invoicePdfService';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  comanda: Comanda;
  cajeroActual?: Cajero | null;
  cajaAbierta?: boolean;
  onRequireOpenCash?: () => void;
  onProcessPayment: (paymentData: {
    idVenta: string;
    idFactura: string;
    idComanda: string;
    mesaId: string;
    monto: number;
    metodoPago: PaymentMethod;
    desgloseMixto?: DesglosePagoMixto;
    propina?: number;
    nitCliente: string;
    nombreCliente: string;
    fecha: string;
    cajeroId?: string;
    cajeroNombre?: string;
  }) => Promise<void>;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  table,
  comanda,
  cajeroActual,
  cajaAbierta = true,
  onRequireOpenCash,
  onProcessPayment,
}) => {
  // Modal View Modes
  const [billingTab, setBillingTab] = useState<'standard' | 'split'>('standard');
  const [splitMode, setSplitMode] = useState<'equal' | 'items'>('equal');

  // Standard Payment State
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('Tarjeta');
  const [tipoDocumento, setTipoDocumento] = useState<'CC' | 'NIT' | 'CE' | 'CF'>('CF');
  const [nitCliente, setNitCliente] = useState<string>('222222222222');
  const [nombreCliente, setNombreCliente] = useState<string>(
    comanda.clienteNombre || table.clienteNombre || 'Consumidor Final'
  );

  // Tip (Propina Voluntaria Modificable)
  const [propinaType, setPropinaType] = useState<'preset' | 'custom_amount'>('preset');
  const [propinaPct, setPropinaPct] = useState<number>(10);
  const [customPropinaMonto, setCustomPropinaMonto] = useState<number>(0);

  // Mixed Payment Breakdown
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [mixedCard, setMixedCard] = useState<number>(0);
  const [mixedTransfer, setMixedTransfer] = useState<number>(0);

  // Split Bill State (Equal parts)
  const [splitCount, setSplitCount] = useState<number>(2);
  const [splitPaidDiners, setSplitPaidDiners] = useState<Record<number, { method: PaymentMethod; paid: boolean }>>({});

  // Split Bill State (By items)
  const [selectedItemsForSubBill, setSelectedItemsForSubBill] = useState<Record<number, number>>({});

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen) return null;

  const subtotal = comanda.total;

  // Calculate tip and totals
  const isExactPropina = propinaType === 'custom_amount';
  const taxes = calculateColombiaTaxes(
    subtotal,
    isExactPropina ? customPropinaMonto : propinaPct,
    'INC',
    isExactPropina
  );
  const propinaMonto = taxes.propinaVoluntaria;
  const totalConPropina = taxes.totalConPropina;

  // Mixed payment balance calculations
  const totalMixedCovered = mixedCash + mixedCard + mixedTransfer;
  const remainingMixed = totalConPropina - totalMixedCovered;

  const generatedVentaId = `VEN-${Date.now().toString().slice(-5)}`;
  const generatedFacturaId = `FE-${Date.now().toString().slice(-5)}`;
  const fechaHoy = new Date().toISOString().split('T')[0];

  const handleDocumentTypeChange = (type: 'CC' | 'NIT' | 'CE' | 'CF') => {
    setTipoDocumento(type);
    if (type === 'CF') {
      setNitCliente('222222222222');
      if (nombreCliente === '' || nombreCliente === 'Consumidor Final') {
        setNombreCliente('Consumidor Final');
      }
    } else if (nitCliente === '222222222222' || nitCliente === 'CF') {
      setNitCliente('');
    }
  };

  // Quick fill remaining balance to a payment method in mixed payment
  const handleFillRemaining = (method: 'cash' | 'card' | 'transfer') => {
    const currentWithoutTarget =
      method === 'cash'
        ? mixedCard + mixedTransfer
        : method === 'card'
        ? mixedCash + mixedTransfer
        : mixedCash + mixedCard;

    const remainingForTarget = Math.max(0, totalConPropina - currentWithoutTarget);

    if (method === 'cash') setMixedCash(remainingForTarget);
    if (method === 'card') setMixedCard(remainingForTarget);
    if (method === 'transfer') setMixedTransfer(remainingForTarget);
  };

  // Confirm Full or Mixed Payment
  const handleConfirmStandard = async () => {
    if (metodoPago === 'Mixto' && remainingMixed !== 0) {
      alert(`El monto asignado (${formatCOP(totalMixedCovered)}) no coincide con el total (${formatCOP(totalConPropina)}). Restante: ${formatCOP(remainingMixed)}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const mixedBreakdown: DesglosePagoMixto | undefined =
        metodoPago === 'Mixto'
          ? {
              efectivo: mixedCash,
              tarjeta: mixedCard,
              transferencia: mixedTransfer,
            }
          : undefined;

      await onProcessPayment({
        idVenta: generatedVentaId,
        idFactura: generatedFacturaId,
        idComanda: comanda.idComanda,
        mesaId: table.id,
        monto: totalConPropina,
        metodoPago,
        desgloseMixto: mixedBreakdown,
        propina: propinaMonto,
        nitCliente: nitCliente.trim() || '222222222222',
        nombreCliente: nombreCliente.trim() || 'Consumidor Final',
        fecha: new Date().toISOString(),
        cajeroId: cajeroActual?.id,
        cajeroNombre: cajeroActual?.nombre,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al procesar el cobro');
    } finally {
      setIsProcessing(false);
    }
  };

  // Equal parts calculation
  const amountPerDiner = Math.floor(totalConPropina / splitCount);
  const remainderCents = totalConPropina - amountPerDiner * splitCount;

  // Process a single diner part in split bill
  const handlePaySplitDiner = async (dinerIndex: number, method: PaymentMethod) => {
    const isLastDiner = dinerIndex === splitCount - 1;
    const dinerAmount = isLastDiner ? amountPerDiner + remainderCents : amountPerDiner;

    setIsProcessing(true);
    try {
      const partVentaId = `VEN-S${dinerIndex + 1}-${Date.now().toString().slice(-4)}`;
      const partFacturaId = `FE-S${dinerIndex + 1}-${Date.now().toString().slice(-4)}`;

      await onProcessPayment({
        idVenta: partVentaId,
        idFactura: partFacturaId,
        idComanda: comanda.idComanda,
        mesaId: table.id,
        monto: dinerAmount,
        metodoPago: method,
        propina: Math.round(propinaMonto / splitCount),
        nitCliente: '222222222222',
        nombreCliente: `${nombreCliente} (Comensal ${dinerIndex + 1}/${splitCount})`,
        fecha: new Date().toISOString(),
        cajeroId: cajeroActual?.id,
        cajeroNombre: cajeroActual?.nombre,
      });

      setSplitPaidDiners((prev) => ({
        ...prev,
        [dinerIndex]: { method, paid: true },
      }));

      // If all diners are paid, close modal
      const newPaidCount = Object.keys(splitPaidDiners).length + 1;
      if (newPaidCount >= splitCount) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Error al procesar la parte');
    } finally {
      setIsProcessing(false);
    }
  };

  // Print Thermal Ticket PDF
  const handlePrintPDF = (customTotal?: number, customSubtitle?: string) => {
    try {
      const finalAmount = customTotal || totalConPropina;
      const details = {
        factura: {
          idFactura: generatedFacturaId,
          idVenta: generatedVentaId,
          fecha: fechaHoy,
          nitCliente: nitCliente || '222222222222',
          nombreCliente: customSubtitle ? `${nombreCliente} - ${customSubtitle}` : nombreCliente,
          monto: finalAmount,
          estado: 'Emitida' as const,
          cajeroNombre: cajeroActual?.nombre || 'Carlos Ramírez',
        },
        comanda,
        mesaNumero: table.numero,
        metodoPago,
        items: comanda.listaItems,
        subtotal: taxes.baseGravable,
        impuesto: taxes.impuestoInc8,
        propina: propinaMonto,
        total: finalAmount,
        cufe: '8f92a10b4c8104e76a91df20485601a4b87c23f109e45a892b11',
        qrUrl: 'https://catalogo-vpfe.dian.gov.co',
      };

      const doc = generateThermalTicketPDF(details);
      doc.save(`Tirilla_DIAN_${generatedFacturaId}_Mesa${table.numero}.pdf`);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el tiquete de factura');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Facturación & Cobro Mesa #{table.numero}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  DIAN COP
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Resolución DIAN 000165 • Comanda {comanda.idComanda}
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

        {/* View Mode Tabs (Cobro Completo vs Split Bill) */}
        <div className="p-2 bg-zinc-900/40 border-b border-zinc-800 grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setBillingTab('standard')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              billingTab === 'standard'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Cobro de Cuenta Completa</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingTab('split')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              billingTab === 'split'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>Dividir Cuenta (Split Bill)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 max-h-[75vh]">
          {/* Cash & Cashier Status Banner */}
          {!cajaAbierta ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 font-bold block">
                    Caja Cerrada - No hay sesión activa
                  </strong>
                  <span className="text-zinc-400">
                    Se recomienda abrir turno con Base inicial en pesos colombianos para el arqueo.
                  </span>
                </div>
              </div>
              {onRequireOpenCash && (
                <button
                  type="button"
                  onClick={onRequireOpenCash}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] whitespace-nowrap transition"
                >
                  Abrir Caja
                </button>
              )}
            </div>
          ) : (
            cajeroActual && (
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>
                    Cajero responsable: <strong className="text-white">{cajeroActual.nombre}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800">
                  PIN #{cajeroActual.codigo}
                </span>
              </div>
            )
          )}

          {/* Section: Propina Voluntaria Modificable (Ley 1935 de 2018 Colombia) */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Propina Voluntaria (Ley 1935 de 2018)</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                +{formatCOP(propinaMonto)}
              </span>
            </div>

            {/* Tip preset selection pills */}
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              {[0, 5, 10, 15].map((pct) => {
                const isSelected = propinaType === 'preset' && propinaPct === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setPropinaType('preset');
                      setPropinaPct(pct);
                    }}
                    className={`py-1.5 rounded-xl font-bold border transition ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {pct === 0 ? 'Sin propina' : `${pct}%`}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setPropinaType('custom_amount');
                  if (customPropinaMonto === 0) {
                    setCustomPropinaMonto(Math.round(subtotal * 0.1));
                  }
                }}
                className={`py-1.5 rounded-xl font-bold border transition ${
                  propinaType === 'custom_amount'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Monto $
              </button>
            </div>

            {/* Custom Tip Amount Input when selected */}
            {propinaType === 'custom_amount' && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-3 animate-in fade-in">
                <div className="flex-1 space-y-1">
                  <span className="text-[11px] text-zinc-400 block">
                    Monto personalizado de propina en pesos (COP):
                  </span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-400 text-xs">$</span>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={customPropinaMonto || ''}
                      onChange={(e) => setCustomPropinaMonto(Math.round(parseFloat(e.target.value) || 0))}
                      placeholder="10000"
                      className="w-full pl-7 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="text-right pt-4">
                  <span className="text-[10px] text-zinc-500 block">Equivale a:</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {subtotal > 0 ? ((customPropinaMonto / subtotal) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-zinc-500 italic">
              * La propina es 100% voluntaria. Puede ser aceptada, modificada o suprimida a solicitud del cliente.
            </p>
          </div>

          {/* Colombian Tax & Order Breakdown Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-300 border-b border-zinc-800 pb-2">
              <span>Desglose de Facturación DIAN</span>
              <span className="text-zinc-400 font-mono">{comanda.listaItems.length} ítems en mesa</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal (Base Gravable):</span>
                <span className="font-mono text-zinc-200">{formatCOP(taxes.baseGravable)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Impuesto Nacional al Consumo (INC 8%):</span>
                <span className="font-mono text-zinc-300">{formatCOP(taxes.impuestoInc8)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Propina Voluntaria ({propinaType === 'custom_amount' ? 'Personalizada' : `${propinaPct}%`}):</span>
                <span className="font-mono text-amber-400">+{formatCOP(propinaMonto)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                <span>Total a Cobrar:</span>
                <span className="font-mono text-emerald-400 text-lg">{formatCOP(totalConPropina, true)}</span>
              </div>
            </div>
          </div>

          {/* TAB 1: COBRO COMPLETO (Medio Único o Pago Mixto) */}
          {billingTab === 'standard' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">
                  Selecciona el Medio de Pago:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('Tarjeta')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      metodoPago === 'Tarjeta'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs font-bold">Tarjeta POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('Efectivo')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      metodoPago === 'Efectivo'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs font-bold">Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('Transferencia')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      metodoPago === 'Transferencia'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-xs font-bold">QR / Nequi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMetodoPago('Mixto');
                      if (mixedCash === 0 && mixedCard === 0 && mixedTransfer === 0) {
                        setMixedCash(Math.round(totalConPropina / 2));
                        setMixedCard(totalConPropina - Math.round(totalConPropina / 2));
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      metodoPago === 'Mixto'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Split className="w-5 h-5" />
                    <span className="text-xs font-bold">Pago Mixto</span>
                  </button>
                </div>
              </div>

              {/* Mixed Payment Details Fields */}
              {metodoPago === 'Mixto' && (
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Split className="w-4 h-4" />
                      Desglose de Pago Mixto
                    </span>
                    <span className={`text-xs font-mono font-bold ${remainingMixed === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {remainingMixed === 0 ? '✓ Cuadrado Exacto' : `Faltan: ${formatCOP(remainingMixed)}`}
                    </span>
                  </div>

                  {/* Cash input */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Efectivo en Caja (COP):
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={mixedCash || ''}
                        onChange={(e) => setMixedCash(Math.round(parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillRemaining('cash')}
                      className="mt-5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold transition"
                      title="Asignar el saldo restante a Efectivo"
                    >
                      Restante
                    </button>
                  </div>

                  {/* Card input */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Tarjeta POS / Datáfono (COP):
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={mixedCard || ''}
                        onChange={(e) => setMixedCard(Math.round(parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillRemaining('card')}
                      className="mt-5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold transition"
                      title="Asignar el saldo restante a Tarjeta"
                    >
                      Restante
                    </button>
                  </div>

                  {/* Transfer input */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Transferencia / QR (Nequi/Daviplata) (COP):
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={mixedTransfer || ''}
                        onChange={(e) => setMixedTransfer(Math.round(parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillRemaining('transfer')}
                      className="mt-5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold transition"
                      title="Asignar el saldo restante a Transferencia"
                    >
                      Restante
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs">
                    <span className="text-zinc-400">Total asignado:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCOP(totalMixedCovered)} / {formatCOP(totalConPropina)}
                    </span>
                  </div>
                </div>
              )}

              {/* Colombian Customer Identification (DIAN) */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Identificación del Adquirente (DIAN)
                  </span>
                  <div className="flex items-center gap-1">
                    {(['CF', 'CC', 'NIT', 'CE'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleDocumentTypeChange(t)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          tipoDocumento === t
                            ? 'bg-amber-500 text-zinc-950 border-amber-400'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      {tipoDocumento === 'CF' ? 'Cédula / Documento:' : `${tipoDocumento} del Cliente:`}
                    </label>
                    <input
                      type="text"
                      value={nitCliente}
                      onChange={(e) => setNitCliente(e.target.value)}
                      placeholder={tipoDocumento === 'CF' ? '222222222222' : 'Ej: 1018459201'}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Nombre / Razón Social:</label>
                    <input
                      type="text"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      placeholder="Consumidor Final"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIVIDIR CUENTA (SPLIT BILL) */}
          {billingTab === 'split' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Número de Comensales a Dividir:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setSplitCount(num);
                          setSplitPaidDiners({});
                        }}
                        className={`w-8 h-8 rounded-xl font-mono text-xs font-bold border transition ${
                          splitCount === num
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Cuota exacta por comensal:</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {formatCOP(amountPerDiner)}
                  </span>
                </div>
              </div>

              {/* Diners Split Cards List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {Array.from({ length: splitCount }).map((_, index) => {
                  const isPaid = !!splitPaidDiners[index]?.paid;
                  const isLast = index === splitCount - 1;
                  const dinerTotal = isLast ? amountPerDiner + remainderCents : amountPerDiner;

                  return (
                    <div
                      key={index}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isPaid
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-zinc-900/80 border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Comensal #{index + 1}</span>
                          {isPaid && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Cobrado ({splitPaidDiners[index]?.method})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-sm font-black text-amber-300 block mt-0.5">
                          {formatCOP(dinerTotal)}
                        </span>
                      </div>

                      {/* Payment Action for this diner */}
                      {!isPaid ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePaySplitDiner(index, 'Tarjeta')}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
                            title="Cobrar cuota con Tarjeta POS"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                            <span>Tarjeta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePaySplitDiner(index, 'Efectivo')}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
                            title="Cobrar cuota en Efectivo"
                          >
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Efectivo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePaySplitDiner(index, 'Transferencia')}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
                            title="Cobrar cuota con Transferencia / QR"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                            <span>QR</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePrintPDF(dinerTotal, `Comensal ${index + 1}`)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Descargar Tirilla POS individual"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tirilla</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrintPDF()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold transition"
              title="Descargar Tirilla POS térmica de 80mm antes o después del cobro"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir Tirilla POS</span>
            </button>
            {pdfSuccess && (
              <span className="text-[10px] text-emerald-400 font-bold animate-in fade-in">
                ✓ PDF generado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Cerrar
            </button>

            {billingTab === 'standard' && (
              <button
                type="button"
                disabled={isProcessing || (metodoPago === 'Mixto' && remainingMixed !== 0)}
                onClick={handleConfirmStandard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Procesando...'
                    : `Confirmar Cobro (${formatCOP(totalConPropina)})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
