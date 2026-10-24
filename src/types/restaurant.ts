export type TableStatus = 'Libre' | 'Ocupada' | 'Reservada';
export type ComandaStatus = 'Pendiente' | 'Cocinando' | 'Listo' | 'Entregado';
export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto';
export type InvoiceStatus = 'Emitida' | 'Anulada';

export interface DesglosePagoMixto {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  stockActual: number;
  stockMinimo: number;
  imagen?: string;
}

export type ReservaEstado = 'Confirmada' | 'Llegada' | 'Cancelada' | 'No_Presentado';

export interface Reserva {
  id: string;
  idMesa: string;
  mesaNumero: number;
  clienteNombre: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  comensales: number;
  notas?: string;
  estado: ReservaEstado;
  createdAt: string;
}

export interface Table {
  id: string;
  numero: number;
  estado: TableStatus;
  capacidad: number;
  clienteActualId?: string;
  clienteNombre?: string;
  activeComandaId?: string;
  reservaId?: string;
  reservaHora?: string;
  reservaComensales?: number;
  reservaNotas?: string;
  mesasUnidas?: number[];
  mesaPrincipalNumero?: number;
}

export interface ComandaItem {
  menuId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  notas?: string;
}

export type StaffRole = 'Administrador' | 'Cajero' | 'Mesero' | 'Cocina';

export interface AuditLogEntry {
  id: string;
  fecha: string;
  usuarioId: string;
  usuarioNombre: string;
  rol: StaffRole;
  accion: string;
  detalles?: string;
}

export interface StaffUser {
  id: string;
  nombre: string;
  pin: string; // PIN de 4 dígitos para inicio de sesión táctil en terminal POS
  rol: StaffRole;
  activo: boolean;
  telefono?: string;
  email?: string;
  avatarColor?: string;
  ultimoAcceso?: string;
}

export interface Comanda {
  idComanda: string;
  idMesa: string;
  mesaNumero?: number;
  listaItems: ComandaItem[];
  total: number;
  estado: ComandaStatus;
  timestamp: string;
  clienteNombre?: string;
  notasGenerales?: string;
  // Trazabilidad de usuarios y turnos
  meseroId?: string;
  meseroNombre?: string;
  cocineroId?: string;
  cocineroNombre?: string;
  historialCambios?: AuditLogEntry[];
}

export interface Venta {
  idVenta: string;
  idComanda: string;
  fecha: string;
  monto: number;
  metodoPago: PaymentMethod;
  desgloseMixto?: DesglosePagoMixto;
  propina?: number;
  mesaNumero?: number;
  cajeroId?: string;
  cajeroNombre?: string;
  sesionCajaId?: string;
}

export interface Compra {
  idCompra: string;
  proveedorId: string;
  proveedorNombre?: string;
  fecha: string;
  monto: number;
  descripcion: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  historialPedidos: string; // JSON string or summary
}

export interface Factura {
  idFactura: string;
  idVenta: string;
  fecha: string;
  nitCliente: string;
  nombreCliente?: string;
  monto: number;
  estado: InvoiceStatus;
  cajeroNombre?: string;
  anuladaMotivo?: string;
  // Normas de Facturación DIAN Colombia
  tipoDocumentoCliente?: string;
  cufe?: string;
  qrDianUrl?: string;
  resolucionDian?: string;
  tipoComprobante?: string;
  subtotal?: number;
  impuestoMonto?: number;
  propinaMonto?: number;
  propinaPorcentaje?: number;
  telefonoCliente?: string;
  emailCliente?: string;
  direccionCliente?: string;
  itemsSnapshot?: ComandaItem[];
}

export type CajeroRol = 'Cajero Principal' | 'Cajero Turno' | 'Supervisor de Caja';

export interface Cajero {
  id: string;
  nombre: string;
  codigo: string;
  rol: CajeroRol;
  activo: boolean;
  telefono?: string;
  avatarColor?: string;
}

export type TurnoTipo =
  | 'Turno Mañana (08:00 - 15:00)'
  | 'Turno Tarde/Noche (15:00 - 23:00)'
  | 'Jornada Completa'
  | 'Turno Extra / Especial';

export type MovimientoCajaTipo =
  | 'Base_Inicial'
  | 'Ingreso_Venta'
  | 'Entrada_Manual'
  | 'Salida_Gasto'
  | 'Retiro_Seguridad';

export interface MovimientoCaja {
  id: string;
  sesionId: string;
  cajeroId: string;
  cajeroNombre: string;
  tipo: MovimientoCajaTipo;
  concepto: string;
  monto: number;
  metodoPago: PaymentMethod | 'Efectivo';
  fecha: string;
  comprobanteRef?: string;
}

export interface DenominacionConteo {
  valor: number;
  cantidad: number;
}

export interface SesionCaja {
  id: string;
  cajeroId: string;
  cajeroNombre: string;
  fechaApertura: string;
  fechaCierre?: string;
  turno: TurnoTipo;
  montoBase: number;
  estado: 'Abierta' | 'Cerrada';
  notasApertura?: string;
  totalVentasEfectivo: number;
  totalVentasTarjeta: number;
  totalVentasTransferencia: number;
  totalEntradasManuales: number;
  totalSalidasManuales: number;
  efectivoEsperado: number;
  efectivoReal?: number;
  diferencia?: number;
  desgloseConteo?: DenominacionConteo[];
  notasCierre?: string;
  supervisorCierre?: string;
}

export interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl?: string;
  title?: string;
  connected: boolean;
  lastSync?: string;
}

