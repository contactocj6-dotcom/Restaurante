import React, { useState } from 'react';
import {
  Venta,
  Factura,
  Comanda,
  Cajero,
  SesionCaja,
  MovimientoCaja,
  PaymentMethod,
} from '../types/restaurant';
import {
  DollarSign,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  Filter,
  FileCheck,
  TrendingUp,
  Download,
  Eye,
  Printer,
  FileDown,
  CheckCircle2,
  FileText,
  AlertCircle,
  LockOpen,
  Lock,
  PlusCircle,
  MinusCircle,
  Users,
  Wallet,
  Coins,
  Calculator,
  History,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Ban,
  ChevronRight,
  Store,
} from 'lucide-react';
import { SalesCharts } from './SalesCharts';
import { CajaResumen } from './CajaResumen';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import {
  resolveInvoiceDetails,
  downloadInvoicePDF,
} from '../services/invoicePdfService';
import { downloadCashClosingPDF } from '../services/cashRegisterPdfService';
import { formatCOP } from '../utils/colombiaFiscal';

interface SalesInvoiceViewProps {
  ventas: Venta[];
  facturas: Factura[];
  comandas?: Comanda[];
  cajeros: Cajero[];
  activeCajero: Cajero | null;
  activeSesionCaja: SesionCaja | null;
  historialSesiones: SesionCaja[];
  movimientosCaja: MovimientoCaja[];
  onOpenCashModal: () => void;
  onCloseCashModal: () => void;
  onOpenMovementModal: (type?: 'Entrada_Manual' | 'Salida_Gasto') => void;
  onOpenCashierManagement: () => void;
  onSelectActiveCajero: (cajeroId: string) => void;
  onAnularFactura?: (facturaId: string, motivo: string) => void;
  onOpenRestaurantProfile?: () => void;
}

export const SalesInvoiceView: React.FC<SalesInvoiceViewProps> = ({
  ventas,
  facturas,
  comandas = [],
  cajeros,
  activeCajero,
  activeSesionCaja,
  historialSesiones,
  movimientosCaja,
  onOpenCashModal,
  onCloseCashModal,
  onOpenMovementModal,
  onOpenCashierManagement,
  onSelectActiveCajero,
  onAnularFactura,
  onOpenRestaurantProfile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'caja' | 'facturas' | 'ventas' | 'cierres' | 'cajeros'
  >('caja');

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [movFilter, setMovFilter] = useState<string>('Todos');

  // Modal State for Invoice inspection & PDF download
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Quick download feedback
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Anular Factura Prompt
  const [anulandoFacturaId, setAnulandoFacturaId] = useState<string | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Calculations for current active session
  const isCajaAbierta = activeSesionCaja && activeSesionCaja.estado === 'Abierta';
  const sesionMovimientos = activeSesionCaja
    ? movimientosCaja.filter((m) => m.sesionId === activeSesionCaja.id)
    : [];

  const totalVentasMonto = ventas.reduce((acc, v) => acc + v.monto, 0);
  const promedioTicket = ventas.length > 0 ? totalVentasMonto / ventas.length : 0;
  const totalFacturado = facturas
    .filter((f) => f.estado === 'Emitida')
    .reduce((acc, f) => acc + f.monto, 0);

  // Filters for Ventas
  const filteredVentas = ventas.filter((v) => {
    const matchesSearch =
      v.idVenta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.idComanda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.cajeroNombre && v.cajeroNombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPayment = paymentFilter === 'Todos' || v.metodoPago === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  // Filters for Facturas
  const filteredFacturas = facturas.filter((f) => {
    const matchesSearch =
      f.idFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.idVenta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.nitCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.nombreCliente && f.nombreCliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.cajeroNombre && f.cajeroNombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || f.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filters for Movimientos de Caja
  const filteredMovimientos = sesionMovimientos.filter((m) => {
    const matchesSearch =
      m.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.comprobanteRef && m.comprobanteRef.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType =
      movFilter === 'Todos' ||
      (movFilter === 'Entradas' && (m.tipo === 'Entrada_Manual' || m.tipo === 'Base_Inicial')) ||
      (movFilter === 'Salidas' && (m.tipo === 'Salida_Gasto' || m.tipo === 'Retiro_Seguridad')) ||
      (movFilter === 'Ventas' && m.tipo === 'Ingreso_Venta');
    return matchesSearch && matchesType;
  });

  // Direct 1-click PDF download handler for Invoices
  const handleQuickDownloadPDF = (fac: Factura, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(fac.idFactura);
      const details = resolveInvoiceDetails(fac, ventas, comandas);
      downloadInvoicePDF(details);

      setToastMessage(`Factura PDF #${fac.idFactura} descargada con éxito`);
      setTimeout(() => {
        setToastMessage(null);
        setDownloadingId(null);
      }, 3000);
    } catch (err) {
      console.error('Error al generar PDF de la factura:', err);
      setToastMessage('Error al generar el archivo PDF');
      setTimeout(() => setToastMessage(null), 3000);
      setDownloadingId(null);
    }
  };

  const handleOpenDetailModal = (fac: Factura) => {
    setSelectedFactura(fac);
    setIsDetailModalOpen(true);
  };

  // Download Cash closing PDF from historical sessions
  const handleDownloadHistoricalClosing = (
    sesion: SesionCaja,
    format: 'executive' | 'thermal' = 'executive'
  ) => {
    try {
      const sesMovs = movimientosCaja.filter((m) => m.sesionId === sesion.id);
      downloadCashClosingPDF(
        {
          sesion,
          movimientos: sesMovs,
          ventas,
          facturas,
        },
        format
      );
      setToastMessage(`Acta de Cierre ${sesion.id} descargada exitosamente`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error al descargar acta:', err);
      setToastMessage('Error al generar el archivo PDF del acta');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleConfirmAnulacion = () => {
    if (!anulandoFacturaId) return;
    if (onAnularFactura) {
      onAnularFactura(anulandoFacturaId, motivoAnulacion.trim() || 'Anulada por solicitud');
      setToastMessage(`Factura #${anulandoFacturaId} marcada como Anulada`);
      setTimeout(() => setToastMessage(null), 3000);
    }
    setAnulandoFacturaId(null);
    setMotivoAnulacion('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-emerald-500/40 text-emerald-400 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="text-xs font-semibold text-white">{toastMessage}</span>
        </div>
      )}

      {/* Hero Cash Register Control Strip */}
      <div
        className={`p-5 rounded-3xl border shadow-xl transition relative overflow-hidden ${
          isCajaAbierta
            ? 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-emerald-500/30 shadow-emerald-500/5'
            : 'bg-zinc-950 border-amber-500/30 shadow-amber-500/5'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          {/* Left: Cash Status & Active Cashier */}
          <div className="flex items-center gap-4">
            <div
              className={`w-13 h-13 rounded-2xl p-3 flex items-center justify-center border shadow-inner ${
                isCajaAbierta
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              }`}
            >
              {isCajaAbierta ? (
                <LockOpen className="w-7 h-7 animate-pulse" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isCajaAbierta
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isCajaAbierta ? 'CAJA ABIERTA • TURNO EN CURSO' : 'CAJA CERRADA'}
                </span>
                {isCajaAbierta && activeSesionCaja && (
                  <span className="text-xs text-zinc-400 font-mono">
                    ID: {activeSesionCaja.id}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                {activeCajero ? (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white">
                      {activeCajero.nombre}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono">
                      PIN: #{activeCajero.codigo}
                    </span>
                    <span className="text-xs text-amber-400 font-medium">
                      ({activeCajero.rol})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-zinc-400">
                    Sin cajero asignado
                  </span>
                )}
              </div>

              {isCajaAbierta && activeSesionCaja && (
                <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                  <span>{activeSesionCaja.turno}</span>
                  <span>•</span>
                  <span>
                    Apertura:{' '}
                    {new Date(activeSesionCaja.fechaApertura).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {isCajaAbierta ? (
              <>
                <button
                  onClick={() => onOpenMovementModal('Entrada_Manual')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shadow-sm"
                  title="Inyectar dinero o reposición de sencillo en efectivo"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  + Entrada Dinero
                </button>

                <button
                  onClick={() => onOpenMovementModal('Salida_Gasto')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition shadow-sm"
                  title="Registrar compras menores urgentes o retiro de seguridad"
                >
                  <MinusCircle className="w-4 h-4 text-rose-400" />
                  - Gasto / Salida
                </button>

                <button
                  onClick={onCloseCashModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/20 transition"
                  title="Realizar conteo físico de efectivo y cerrar turno"
                >
                  <Lock className="w-4 h-4" />
                  Cierre & Arqueo
                </button>
              </>
            ) : (
              <button
                onClick={onOpenCashModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black shadow-lg shadow-amber-500/25 transition"
              >
                <LockOpen className="w-4 h-4" />
                Apertura de Caja con Base Inicial
              </button>
            )}

            <button
              onClick={onOpenCashierManagement}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold transition"
              title="Administrar cajeros, roles y turnos"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Equipo de Cajeros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('caja')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'caja'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <span>Control de Caja & Arqueo en Vivo</span>
            {isCajaAbierta && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('facturas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'facturas'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-indigo-400" />
            <span>Facturación Electrónica & Fiscal</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">
              {facturas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ventas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'ventas'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Libro Diario de Ventas</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
              {ventas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('cierres')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'cierres'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <History className="w-4 h-4 text-rose-400" />
            <span>Historial de Cierres Z</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
              {historialSesiones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('cajeros')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'cajeros'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Cajeros ({cajeros.length})</span>
          </button>
        </div>

        {onOpenRestaurantProfile && (
          <button
            type="button"
            onClick={onOpenRestaurantProfile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm whitespace-nowrap ml-auto"
            title="Modificar Nombre, NIT, Dirección, Teléfono, Redes Sociales y Parámetros DIAN"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Datos del Restaurante & Redes</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: CONTROL DE CAJA Y ARQUEO EN VIVO                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'caja' && (
        <div className="space-y-6">
          {/* Live Arqueo Metrics */}
          {activeSesionCaja ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Base Inicial */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Fondo Base Inicial</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-white font-mono">
                  {formatCOP(activeSesionCaja.montoBase)}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 truncate">
                  {activeSesionCaja.notasApertura || 'Fondo para sencillo'}
                </p>
              </div>

              {/* Card 2: Efectivo en Gaveta en Vivo */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-emerald-950/40 border border-emerald-500/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    Efectivo Teórico en Gaveta
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-black text-emerald-400 font-mono">
                  {formatCOP(activeSesionCaja.efectivoEsperado)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Base + Ventas Efectivo - Gastos</span>
                  <span className="text-emerald-400 font-semibold font-mono">Arqueo en Vivo</span>
                </div>
              </div>

              {/* Card 3: Ventas del Turno por Método */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Total Cobrado Turno</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
                  {formatCOP(
                    activeSesionCaja.totalVentasEfectivo +
                    activeSesionCaja.totalVentasTarjeta +
                    activeSesionCaja.totalVentasTransferencia
                  )}
                </div>
                <div className="space-y-1 text-[10px] text-zinc-400 mt-1.5 pt-1.5 border-t border-zinc-800">
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-semibold">Efectivo:</span>
                    <span className="font-mono text-zinc-300">
                      {formatCOP(activeSesionCaja.totalVentasEfectivo)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sky-400 font-semibold">Tarjetas:</span>
                    <span className="font-mono text-zinc-300">
                      {formatCOP(activeSesionCaja.totalVentasTarjeta)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400 font-semibold">Transferencia/QR:</span>
                    <span className="font-mono text-zinc-300">
                      {formatCOP(activeSesionCaja.totalVentasTransferencia)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Flujo Menor (Entradas vs Salidas) */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Caja Menor & Gastos</span>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <MinusCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-rose-400 font-mono">
                  -{formatCOP(activeSesionCaja.totalSalidasManuales)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Entradas manuales:</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    +{formatCOP(activeSesionCaja.totalEntradasManuales)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  No hay una sesión de caja abierta actualmente
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  Inicia la apertura con un fondo base de cambio para comenzar a controlar el dinero
                  en efectivo, registrar cobros y cuadrar el turno.
                </p>
              </div>
              <button
                onClick={onOpenCashModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
              >
                <LockOpen className="w-4 h-4" />
                Abrir Caja con Base Inicial
              </button>
            </div>
          )}

          {/* Movements of the Active Session */}
          {activeSesionCaja && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Movimientos y Flujo de Dinero en Este Turno
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Historial de cobros, inyecciones y gastos autorizados de la sesión actual
                  </p>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
                  {['Todos', 'Ventas', 'Entradas', 'Salidas'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setMovFilter(tab)}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        movFilter === tab
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table of Movements */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-semibold">
                        <th className="py-3 px-4">Hora</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Concepto / Motivo</th>
                        <th className="py-3 px-4">Comprobante</th>
                        <th className="py-3 px-4">Método</th>
                        <th className="py-3 px-4">Cajero</th>
                        <th className="py-3 px-4 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredMovimientos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-zinc-500">
                            No hay movimientos registrados para este filtro.
                          </td>
                        </tr>
                      ) : (
                        filteredMovimientos.map((m) => {
                          const isIngreso =
                            m.tipo === 'Ingreso_Venta' ||
                            m.tipo === 'Entrada_Manual' ||
                            m.tipo === 'Base_Inicial';
                          return (
                            <tr
                              key={m.id}
                              className="hover:bg-zinc-800/40 transition group"
                            >
                              <td className="py-3 px-4 text-zinc-400 font-mono whitespace-nowrap">
                                {new Date(m.fecha).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    m.tipo === 'Base_Inicial'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : m.tipo === 'Ingreso_Venta'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : m.tipo === 'Entrada_Manual'
                                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  }`}
                                >
                                  {m.tipo === 'Base_Inicial'
                                    ? 'BASE INICIAL'
                                    : m.tipo === 'Ingreso_Venta'
                                    ? 'VENTA (+)'
                                    : m.tipo === 'Entrada_Manual'
                                    ? 'ENTRADA (+)'
                                    : 'GASTO (-)'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white font-medium">
                                {m.concepto}
                              </td>
                              <td className="py-3 px-4 text-zinc-400 font-mono">
                                {m.comprobanteRef || '--'}
                              </td>
                              <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                                {m.metodoPago}
                              </td>
                              <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                                {m.cajeroNombre}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                                <span
                                  className={isIngreso ? 'text-emerald-400' : 'text-rose-400'}
                                >
                                  {isIngreso ? '+' : '-'}{formatCOP(m.monto)}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: FACTURACIÓN ELECTRÓNICA & FISCAL                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'facturas' && (
        <div className="space-y-5">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Total Facturación Emitida</span>
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-indigo-400 font-mono">
                {formatCOP(totalFacturado)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-zinc-500">{facturas.length} comprobantes en sistema</p>
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  PDF Oficial A4
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Comprobantes Válidos</span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-white font-mono">
                {facturas.filter((f) => f.estado === 'Emitida').length}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {facturas.filter((f) => f.estado === 'Anulada').length} anuladas
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Ticket Fiscal Promedio</span>
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-amber-400 font-mono">
                {formatCOP(promedioTicket)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Con IVA & servicio incluido</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por ID Factura, NIT, Cliente, Venta o Cajero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Emitida">Emitidas</option>
                <option value="Anulada">Anuladas</option>
              </select>
            </div>
          </div>

          {/* Facturas Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-semibold">
                    <th className="py-3.5 px-4">ID Factura</th>
                    <th className="py-3.5 px-4">Ref. Venta</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Cliente / Razón Social</th>
                    <th className="py-3.5 px-4">NIT / C.I.</th>
                    <th className="py-3.5 px-4">Cajero</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredFacturas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-zinc-500">
                        No se encontraron facturas registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredFacturas.map((fac) => (
                      <tr
                        key={fac.idFactura}
                        className="hover:bg-zinc-800/40 transition group cursor-pointer"
                        onClick={() => handleOpenDetailModal(fac)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {fac.idFactura}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 font-mono whitespace-nowrap">
                          {fac.idVenta}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                          {fac.fecha}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-white max-w-[160px] truncate">
                          {fac.nombreCliente || 'Consumidor Final'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                          {fac.nitCliente}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                          {fac.cajeroNombre || 'Cajero Principal'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              fac.estado === 'Emitida'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {fac.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatCOP(fac.monto)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Download PDF Button */}
                            <button
                              onClick={(e) => handleQuickDownloadPDF(fac, e)}
                              disabled={downloadingId === fac.idFactura}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition disabled:opacity-50"
                              title="Descargar Factura Oficial en PDF A4"
                            >
                              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{downloadingId === fac.idFactura ? '...' : 'PDF'}</span>
                            </button>

                            {/* View Detail Modal Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetailModal(fac);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                              title="Ver desglose y vista previa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Anular Factura if Emitida */}
                            {fac.estado === 'Emitida' && onAnularFactura && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnulandoFacturaId(fac.idFactura);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition"
                                title="Anular Factura Fiscal"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: LIBRO DIARIO DE VENTAS                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'ventas' && (
        <div className="space-y-6">
          <CajaResumen
            sesionCaja={activeSesionCaja}
            ventas={ventas}
            onOpenCash={onOpenCashModal}
            onViewDetails={() => setActiveSubTab('caja')}
          />

          <SalesCharts ventas={ventas} comandas={comandas} />

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por ID Venta, Comanda o Cajero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Todos">Todos los Métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          {/* Ventas Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-semibold">
                    <th className="py-3 px-4">ID Venta</th>
                    <th className="py-3 px-4">Comanda</th>
                    <th className="py-3 px-4">Fecha & Hora</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4">Cajero</th>
                    <th className="py-3 px-4 text-right">Total Cobrado</th>
                    <th className="py-3 px-4 text-center">Factura Asociada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredVentas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-zinc-500">
                        No hay ventas registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredVentas.map((v) => {
                      const facAsociada = facturas.find((f) => f.idVenta === v.idVenta);
                      return (
                        <tr key={v.idVenta} className="hover:bg-zinc-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                            {v.idVenta}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                            {v.idComanda}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                            {new Date(v.fecha).toLocaleString('es-ES', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                              {v.metodoPago === 'Efectivo' && (
                                <Banknote className="w-3 h-3 text-emerald-400" />
                              )}
                              {v.metodoPago === 'Tarjeta' && (
                                <CreditCard className="w-3 h-3 text-sky-400" />
                              )}
                              {v.metodoPago === 'Transferencia' && (
                                <Smartphone className="w-3 h-3 text-purple-400" />
                              )}
                              {v.metodoPago}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                            {v.cajeroNombre || 'Carlos Ramírez'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {formatCOP(v.monto)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {facAsociada ? (
                              <button
                                onClick={() => handleOpenDetailModal(facAsociada)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition"
                              >
                                <FileDown className="w-3 h-3 text-amber-400" />
                                <span>{facAsociada.idFactura}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                Sin Factura
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: HISTORIAL DE CIERRES DE CAJA (REPORTES Z)                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'cierres' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-rose-400" />
                Historial de Arqueos & Cierres de Turno (Reporte Fiscal Z)
              </h3>
              <p className="text-xs text-zinc-400">
                Auditoría completa de todas las sesiones de caja cerradas, diferencias y descarga de actas
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {historialSesiones.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
                No hay historial de cierres previos registrados.
              </div>
            ) : (
              historialSesiones.map((ses) => {
                const dif = ses.diferencia ?? 0;
                const isExact = Math.abs(dif) < 0.01;
                const isSobrante = dif > 0.01;
                return (
                  <div
                    key={ses.id}
                    className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300">
                          <Lock className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">
                              {ses.id}
                            </span>
                            <span className="text-xs font-semibold text-zinc-300">
                              • Cajero: {ses.cajeroNombre}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                              {ses.turno}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                            <span>
                              Apertura:{' '}
                              {new Date(ses.fechaApertura).toLocaleString('es-ES', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                            {ses.fechaCierre && (
                              <span>
                                • Cierre:{' '}
                                {new Date(ses.fechaCierre).toLocaleString('es-ES', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadHistoricalClosing(ses, 'executive')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition"
                          title="Descargar Acta A4 Oficial con Firmas"
                        >
                          <FileDown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Acta A4</span>
                        </button>
                        <button
                          onClick={() => handleDownloadHistoricalClosing(ses, 'thermal')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition"
                          title="Imprimir Ticket Térmico Z"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ticket Z</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block uppercase">Base</span>
                        <span className="font-bold text-white font-mono">
                          {formatCOP(ses.montoBase)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-[10px] text-emerald-400 block uppercase">
                          Ventas Efectivo
                        </span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {formatCOP(ses.totalVentasEfectivo)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-[10px] text-indigo-400 block uppercase">
                          Total Facturado
                        </span>
                        <span className="font-bold text-indigo-300 font-mono">
                          {formatCOP(
                            ses.totalVentasEfectivo +
                            ses.totalVentasTarjeta +
                            ses.totalVentasTransferencia
                          )}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 block uppercase">
                          Esperado en Gaveta
                        </span>
                        <span className="font-bold text-white font-mono">
                          {formatCOP(ses.efectivoEsperado)}
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isExact
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : isSobrante
                            ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        <span className="text-[10px] block uppercase font-bold">
                          {isExact ? 'Cuadrado' : isSobrante ? 'Sobrante' : 'Faltante'}
                        </span>
                        <span className="font-bold font-mono">
                          {isExact
                            ? '$ 0'
                            : isSobrante
                            ? `+${formatCOP(dif)}`
                            : formatCOP(dif)}
                        </span>
                      </div>
                    </div>

                    {ses.notasCierre && (
                      <p className="text-[11px] text-zinc-400 italic">
                        Observación: "{ses.notasCierre}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: EQUIPO DE CAJEROS                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'cajeros' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Cajeros Registrados y Asignación de Turnos
              </h3>
              <p className="text-xs text-zinc-400">
                Cambia de cajero activo para operar las ventas o administra el personal
              </p>
            </div>
            <button
              onClick={onOpenCashierManagement}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow transition"
            >
              + Agregar / Gestionar Cajeros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cajeros.map((caj) => {
              const isCurrent = activeCajero?.id === caj.id;
              const ventasCajero = ventas.filter((v) => v.cajeroId === caj.id);
              const totalVentasCajero = ventasCajero.reduce((acc, v) => acc + v.monto, 0);

              return (
                <div
                  key={caj.id}
                  className={`p-5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                      : 'bg-zinc-900/70 border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white bg-gradient-to-tr ${
                          caj.avatarColor || 'from-amber-500 to-orange-600'
                        }`}
                      >
                        {caj.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300">
                        PIN: #{caj.codigo}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-white">{caj.nombre}</h4>
                      <p className="text-xs text-amber-400/90 font-medium">{caj.rol}</p>
                      {caj.telefono && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">{caj.telefono}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 space-y-1 text-xs">
                      <div className="flex justify-between text-zinc-400">
                        <span>Ventas asignadas:</span>
                        <span className="font-mono text-zinc-200">{ventasCajero.length}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Monto total:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatCOP(totalVentasCajero)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    {isCurrent ? (
                      <div className="w-full py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black text-center shadow-md">
                        Cajero Activo en Turno
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectActiveCajero(caj.id)}
                        disabled={!caj.activo}
                        className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition disabled:opacity-50"
                      >
                        Asignar a Sesión
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for In-depth Invoice Inspection and PDF download */}
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFactura(null);
        }}
        factura={selectedFactura}
        ventas={ventas}
        comandas={comandas}
      />

      {/* Anulación de Factura Confirmation Prompt */}
      {anulandoFacturaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <Ban className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">
                Anular Factura #{anulandoFacturaId}
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              ¿Estás seguro de anular esta factura fiscal? Esta acción quedará registrada en el
              libro diario y no se borrará para trazabilidad de auditoría.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300">
                Motivo de la anulación (Requerido):
              </label>
              <input
                type="text"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ej. Error en NIT, cambio de método de pago..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAnulandoFacturaId(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAnulacion}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
