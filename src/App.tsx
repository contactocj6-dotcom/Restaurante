import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  MenuItem,
  Table,
  Comanda,
  Venta,
  Compra,
  Proveedor,
  Cliente,
  Factura,
  TableStatus,
  ComandaStatus,
  PaymentMethod,
  Reserva,
  Cajero,
  SesionCaja,
  MovimientoCaja,
  TurnoTipo,
  DenominacionConteo,
  StaffUser,
  StaffRole,
  AuditLogEntry,
} from './types/restaurant';
import { formatCOP } from './utils/colombiaFiscal';
import {
  INITIAL_MENU,
  INITIAL_TABLES,
  INITIAL_COMANDAS,
  INITIAL_VENTAS,
  INITIAL_COMPRAS,
  INITIAL_PROVEEDORES,
  INITIAL_CLIENTES,
  INITIAL_FACTURAS,
  INITIAL_RESERVAS,
  INITIAL_CAJEROS,
  INITIAL_SESIONES_CAJA,
  INITIAL_MOVIMIENTOS_CAJA,
  INITIAL_STAFF_USERS,
} from './data/initialData';
import {
  initAuth,
  googleSignIn,
  logout as authLogout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  createRestaurantSpreadsheet,
  fetchAllSheetsData,
  syncSheetFullRows,
  appendRowToGoogleSheet,
  getSpreadsheetDetails,
  extractSpreadsheetId,
} from './services/sheetsService';
import { audioService } from './services/audioService';
import { notificationService, AlertNotification } from './services/notificationService';
import { fcmService } from './services/fcmService';

import { Navbar, ActiveTab } from './components/Navbar';
import { TableGrid } from './components/TableGrid';
import { ComandaModal } from './components/ComandaModal';
import { KitchenDisplay } from './components/KitchenDisplay';
import { BillingModal } from './components/BillingModal';
import { SalesInvoiceView } from './components/SalesInvoiceView';
import { MenuManagement } from './components/MenuManagement';
import { InventorySuppliers } from './components/InventorySuppliers';
import { CustomerManagement } from './components/CustomerManagement';
import { SheetsSyncManager } from './components/SheetsSyncManager';
import { ConfirmationModal } from './components/ConfirmationModal';
import { KpiDashboard } from './components/KpiDashboard';
import { ReservationsManagement } from './components/ReservationsManagement';
import { ReservationModal } from './components/ReservationModal';
import { OpenCashModal } from './components/OpenCashModal';
import { CloseCashModal } from './components/CloseCashModal';
import { CashMovementModal } from './components/CashMovementModal';
import { CashierManagementModal } from './components/CashierManagementModal';
import { RestaurantProfileModal } from './components/RestaurantProfileModal';
import { StaffLoginModal } from './components/StaffLoginModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import {
  DianCompanyInfo,
  getSavedRestaurantInfo,
  saveRestaurantInfo,
} from './utils/colombiaFiscal';
import { Bell, CheckCircle, Info, X } from 'lucide-react';

export default function App() {
  // Navigation & User
  const [activeTab, setActiveTab] = useState<ActiveTab>('mesas');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(audioService.isEnabled());

  // Restaurant Profile & DIAN / Social Info State
  const [restaurantInfo, setRestaurantInfo] = useState<DianCompanyInfo>(() =>
    getSavedRestaurantInfo()
  );
  const [isRestaurantProfileOpen, setIsRestaurantProfileOpen] = useState(false);

  // Staff Users & Active Shift State
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem('restoflow_staff_users');
    return saved ? JSON.parse(saved) : INITIAL_STAFF_USERS;
  });

  const [activeStaffUser, setActiveStaffUser] = useState<StaffUser | null>(() => {
    const savedId = localStorage.getItem('restoflow_active_staff_user_id');
    const savedUsers = localStorage.getItem('restoflow_staff_users');
    const parsedUsers: StaffUser[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_STAFF_USERS;
    if (savedId) {
      const found = parsedUsers.find((u) => u.id === savedId && u.activo);
      if (found) return found;
    }
    return parsedUsers.find((u) => u.activo) || parsedUsers[0] || null;
  });

  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState(false);
  const [isTerminalLocked, setIsTerminalLocked] = useState(false);

  // Restaurant State (Memory / Cached)
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('restoflow_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('restoflow_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [comandas, setComandas] = useState<Comanda[]>(() => {
    const saved = localStorage.getItem('restoflow_comandas');
    return saved ? JSON.parse(saved) : INITIAL_COMANDAS;
  });

  const [ventas, setVentas] = useState<Venta[]>(() => {
    const saved = localStorage.getItem('restoflow_ventas');
    return saved ? JSON.parse(saved) : INITIAL_VENTAS;
  });

  const [compras, setCompras] = useState<Compra[]>(() => {
    const saved = localStorage.getItem('restoflow_compras');
    return saved ? JSON.parse(saved) : INITIAL_COMPRAS;
  });

  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    const saved = localStorage.getItem('restoflow_proveedores');
    return saved ? JSON.parse(saved) : INITIAL_PROVEEDORES;
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('restoflow_clientes');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTES;
  });

  const [facturas, setFacturas] = useState<Factura[]>(() => {
    const saved = localStorage.getItem('restoflow_facturas');
    return saved ? JSON.parse(saved) : INITIAL_FACTURAS;
  });

  const [reservas, setReservas] = useState<Reserva[]>(() => {
    const saved = localStorage.getItem('restoflow_reservas');
    return saved ? JSON.parse(saved) : INITIAL_RESERVAS;
  });

  // Cajeros y Control de Caja State
  const [cajeros, setCajeros] = useState<Cajero[]>(() => {
    const saved = localStorage.getItem('restoflow_cajeros');
    return saved ? JSON.parse(saved) : INITIAL_CAJEROS;
  });

  const [activeCajeroId, setActiveCajeroId] = useState<string>(() => {
    return localStorage.getItem('restoflow_active_cajero_id') || 'CAJ-001';
  });

  const [activeSesionCaja, setActiveSesionCaja] = useState<SesionCaja | null>(() => {
    const saved = localStorage.getItem('restoflow_active_sesion_caja');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SESIONES_CAJA[0];
      }
    }
    return INITIAL_SESIONES_CAJA[0];
  });

  const [historialSesiones, setHistorialSesiones] = useState<SesionCaja[]>(() => {
    const saved = localStorage.getItem('restoflow_historial_sesiones');
    return saved ? JSON.parse(saved) : [INITIAL_SESIONES_CAJA[1]];
  });

  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>(() => {
    const saved = localStorage.getItem('restoflow_movimientos_caja');
    return saved ? JSON.parse(saved) : INITIAL_MOVIMIENTOS_CAJA;
  });

  // Modals for Cash Register
  const [isOpenCashModalOpen, setIsOpenCashModalOpen] = useState<boolean>(false);
  const [isCloseCashModalOpen, setIsCloseCashModalOpen] = useState<boolean>(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [movementModalDefaultType, setMovementModalDefaultType] = useState<
    'Entrada_Manual' | 'Salida_Gasto'
  >('Salida_Gasto');
  const [isCashierManagementOpen, setIsCashierManagementOpen] = useState<boolean>(false);

  const activeCajero = cajeros.find((c) => c.id === activeCajeroId) || cajeros[0] || null;

  // Google Sheets Connection State
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('restoflow_sheet_id') || '';
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(() => {
    return localStorage.getItem('restoflow_sheet_title') || '';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Modals & UI Controls
  const [isComandaModalOpen, setIsComandaModalOpen] = useState<boolean>(false);
  const [selectedTableForComanda, setSelectedTableForComanda] = useState<Table | null>(null);
  const [selectedComandaToEdit, setSelectedComandaToEdit] = useState<Comanda | null>(null);

  const [isBillingModalOpen, setIsBillingModalOpen] = useState<boolean>(false);
  const [billingTable, setBillingTable] = useState<Table | null>(null);
  const [billingComanda, setBillingComanda] = useState<Comanda | null>(null);

  const [isReservationModalOpen, setIsReservationModalOpen] = useState<boolean>(false);
  const [selectedReservationToEdit, setSelectedReservationToEdit] = useState<Reserva | null>(null);
  const [defaultReservationTableId, setDefaultReservationTableId] = useState<string | null>(null);

  // Live Toast Notification
  const [activeToast, setActiveToast] = useState<AlertNotification | null>(null);

  // Workspace Confirmation Modal
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    action: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
  });

  // Save changes to localStorage for resilience
  useEffect(() => {
    localStorage.setItem('restoflow_menu', JSON.stringify(menu));
  }, [menu]);
  useEffect(() => {
    localStorage.setItem('restoflow_tables', JSON.stringify(tables));
  }, [tables]);
  useEffect(() => {
    localStorage.setItem('restoflow_comandas', JSON.stringify(comandas));
  }, [comandas]);
  useEffect(() => {
    localStorage.setItem('restoflow_ventas', JSON.stringify(ventas));
  }, [ventas]);
  useEffect(() => {
    localStorage.setItem('restoflow_compras', JSON.stringify(compras));
  }, [compras]);
  useEffect(() => {
    localStorage.setItem('restoflow_proveedores', JSON.stringify(proveedores));
  }, [proveedores]);
  useEffect(() => {
    localStorage.setItem('restoflow_clientes', JSON.stringify(clientes));
  }, [clientes]);
  useEffect(() => {
    localStorage.setItem('restoflow_facturas', JSON.stringify(facturas));
  }, [facturas]);
  useEffect(() => {
    localStorage.setItem('restoflow_reservas', JSON.stringify(reservas));
  }, [reservas]);
  useEffect(() => {
    localStorage.setItem('restoflow_cajeros', JSON.stringify(cajeros));
  }, [cajeros]);
  useEffect(() => {
    localStorage.setItem('restoflow_active_cajero_id', activeCajeroId);
  }, [activeCajeroId]);
  useEffect(() => {
    if (activeSesionCaja) {
      localStorage.setItem('restoflow_active_sesion_caja', JSON.stringify(activeSesionCaja));
    } else {
      localStorage.removeItem('restoflow_active_sesion_caja');
    }
  }, [activeSesionCaja]);
  useEffect(() => {
    localStorage.setItem('restoflow_historial_sesiones', JSON.stringify(historialSesiones));
  }, [historialSesiones]);
  useEffect(() => {
    localStorage.setItem('restoflow_movimientos_caja', JSON.stringify(movimientosCaja));
  }, [movimientosCaja]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (spreadsheetId && token) {
          setIsSheetsConnected(true);
        }
      },
      () => {
        setUser(null);
        setIsSheetsConnected(false);
      }
    );
    return () => unsubscribe();
  }, [spreadsheetId]);

  // Real-time Push Notification Listener (SSE)
  useEffect(() => {
    const unsub = notificationService.subscribe((notif) => {
      setActiveToast(notif);
      setTimeout(() => {
        setActiveToast((prev) => (prev?.id === notif.id ? null : prev));
      }, 7000);
    });
    return () => unsub();
  }, []);

  // Handle Google Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        if (spreadsheetId) {
          setIsSheetsConnected(true);
          await handleSyncFromSheets(res.accessToken, spreadsheetId);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      alert(`Error al iniciar sesión: ${err.message || err}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setIsSheetsConnected(false);
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const newState = audioService.toggleSound();
    setSoundEnabled(newState);
  };

  // Sync data from Google Sheets
  const handleSyncFromSheets = async (token?: string, sheetId?: string) => {
    const currentToken = token || (await getAccessToken());
    const targetSheetId = sheetId || spreadsheetId;

    if (!currentToken || !targetSheetId) return;

    setIsSyncing(true);
    try {
      const data = await fetchAllSheetsData(currentToken, targetSheetId);
      if (data.menu.length > 0) setMenu(data.menu);
      if (data.tables.length > 0) setTables(data.tables);
      if (data.comandas.length > 0) setComandas(data.comandas);
      if (data.ventas.length > 0) setVentas(data.ventas);
      if (data.compras.length > 0) setCompras(data.compras);
      if (data.proveedores.length > 0) setProveedores(data.proveedores);
      if (data.clientes.length > 0) setClientes(data.clientes);
      if (data.facturas.length > 0) setFacturas(data.facturas);

      setIsSheetsConnected(true);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to sync from sheets:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Push all local data to Google Sheets
  const handleSyncAllToSheets = async () => {
    const token = await getAccessToken();
    if (!token || !spreadsheetId) {
      alert('Debes conectar una hoja de cálculo con Google primero.');
      return;
    }

    setConfirmModalConfig({
      isOpen: true,
      title: 'Sincronizar Todas las Hojas en Google Sheets',
      description:
        '¿Deseas enviar los datos actuales de Menú, Mesas, Comandas, Ventas, Compras, Proveedores, Clientes y Facturación a tu hoja de Google Sheets?',
      confirmLabel: 'Sincronizar Ahora',
      isDestructive: false,
      action: async () => {
        setIsSyncing(true);
        try {
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Menú',
            menu.map((m) => [
              m.id,
              m.nombre,
              m.descripcion,
              m.precio,
              m.categoria,
              m.disponible ? 'SI' : 'NO',
              m.stockActual,
              m.stockMinimo,
            ])
          );
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Mesas',
            tables.map((t) => [t.id, t.numero, t.estado, t.capacidad, t.clienteActualId || ''])
          );
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Comandas',
            comandas.map((c) => [c.idComanda, c.idMesa, JSON.stringify(c.listaItems), c.total, c.estado, c.timestamp])
          );
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Ventas',
            ventas.map((v) => [v.idVenta, v.idComanda, v.fecha, v.monto, v.metodoPago])
          );
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Compras',
            compras.map((cp) => [cp.idCompra, cp.proveedorId, cp.fecha, cp.monto, cp.descripcion])
          );
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Proveedores',
            proveedores.map((p) => [p.id, p.nombre, p.contacto, p.telefono, p.email])
          );
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Clientes',
            clientes.map((cl) => [cl.id, cl.nombre, cl.telefono, cl.email, cl.historialPedidos])
          );
          await syncSheetFullRows(
            token,
            spreadsheetId,
            'Facturación',
            facturas.map((f) => [f.idFactura, f.idVenta, f.fecha, f.nitCliente, f.monto, f.estado])
          );

          setLastSyncTime(new Date().toLocaleTimeString());
          audioService.playSuccessTone();
        } catch (err: any) {
          console.error('Error syncing all:', err);
          alert(`Error al sincronizar: ${err.message || err}`);
        } finally {
          setIsSyncing(false);
          setConfirmModalConfig((c) => ({ ...c, isOpen: false }));
        }
      },
    });
  };

  // Create brand new sheet in Google Drive
  const handleCreateNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      await handleLogin();
      return;
    }

    const { spreadsheetId: newId, spreadsheetUrl: newUrl } =
      await createRestaurantSpreadsheet(token, 'RestoFlow - Gestión de Restaurante');

    setSpreadsheetId(newId);
    setSpreadsheetTitle('RestoFlow - Gestión de Restaurante');
    setSpreadsheetUrl(newUrl);
    localStorage.setItem('restoflow_sheet_id', newId);
    localStorage.setItem('restoflow_sheet_title', 'RestoFlow - Gestión de Restaurante');
    setIsSheetsConnected(true);
    setLastSyncTime(new Date().toLocaleTimeString());

    audioService.playSuccessTone();
  };

  // Connect existing sheet
  const handleConnectExistingSheet = async (idOrUrl: string) => {
    const token = await getAccessToken();
    if (!token) {
      await handleLogin();
      return;
    }

    const cleanId = extractSpreadsheetId(idOrUrl);
    const details = await getSpreadsheetDetails(token, cleanId);

    setSpreadsheetId(cleanId);
    setSpreadsheetTitle(details.properties?.title || 'Hoja de Restaurante');
    setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${cleanId}/edit`);
    localStorage.setItem('restoflow_sheet_id', cleanId);
    localStorage.setItem('restoflow_sheet_title', details.properties?.title || 'Hoja de Restaurante');
    setIsSheetsConnected(true);

    await handleSyncFromSheets(token, cleanId);
    audioService.playSuccessTone();
  };

  // Save new / modified Comanda (From Waiter POS)
  const handleSaveComanda = async (comandaData: {
    idComanda: string;
    idMesa: string;
    mesaNumero: number;
    listaItems: any[];
    total: number;
    estado: ComandaStatus;
    clienteNombre?: string;
    notasGenerales?: string;
    meseroId?: string;
    meseroNombre?: string;
  }) => {
    const nowIso = new Date().toISOString();
    const isEdit = comandas.some((c) => c.idComanda === comandaData.idComanda);
    const existingComandaObj = comandas.find((c) => c.idComanda === comandaData.idComanda);
    const existingLogs = existingComandaObj?.historialCambios || [];

    const actor = activeStaffUser;
    const meseroNombre =
      comandaData.meseroNombre ||
      actor?.nombre ||
      existingComandaObj?.meseroNombre ||
      'Mateo Gómez';
    const meseroId =
      comandaData.meseroId ||
      actor?.id ||
      existingComandaObj?.meseroId ||
      'USR-004';

    const logEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: nowIso,
      usuarioId: actor?.id || meseroId,
      usuarioNombre: actor?.nombre || meseroNombre,
      rol: (actor?.rol || 'Mesero') as StaffRole,
      accion: isEdit ? 'Comanda modificada / productos actualizados' : 'Comanda creada y enviada a cocina',
      detalles: `Mesa #${comandaData.mesaNumero} • ${comandaData.listaItems.length} productos • Total: $${comandaData.total}`,
    };

    const newComanda: Comanda = {
      ...comandaData,
      meseroId,
      meseroNombre,
      cocineroId: existingComandaObj?.cocineroId,
      cocineroNombre: existingComandaObj?.cocineroNombre,
      historialCambios: [logEntry, ...existingLogs],
      timestamp: nowIso,
    };

    // 1. Update state in memory
    setComandas((prev) => {
      const idx = prev.findIndex((c) => c.idComanda === newComanda.idComanda);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newComanda;
        return copy;
      }
      return [newComanda, ...prev];
    });

    // 2. Reduce stock of ordered items and detect minimum stock alerts
    const lowStockAlerts: string[] = [];
    setMenu((prevMenu) =>
      prevMenu.map((m) => {
        const ordered = newComanda.listaItems.find(
          (i) => i.menuId === m.id || i.nombre.toLowerCase() === m.nombre.toLowerCase()
        );
        if (ordered) {
          const updatedStock = Math.max(0, m.stockActual - ordered.cantidad);
          if (updatedStock <= m.stockMinimo && m.stockActual > m.stockMinimo) {
            lowStockAlerts.push(`${m.nombre} (quedan ${updatedStock} uds, mín: ${m.stockMinimo})`);
          }
          return {
            ...m,
            stockActual: updatedStock,
            disponible: updatedStock > 0 ? m.disponible : false,
          };
        }
        return m;
      })
    );

    // 3. Mark table as Ocupada
    setTables((prev) =>
      prev.map((t) =>
        t.id === newComanda.idMesa || t.numero === newComanda.mesaNumero
          ? {
              ...t,
              estado: 'Ocupada',
              activeComandaId: newComanda.idComanda,
              clienteNombre: newComanda.clienteNombre || t.clienteNombre,
            }
          : t
      )
    );

    // 4. Notify Kitchen via Backend / SSE / Push!
    const summaryItems = newComanda.listaItems
      .map((i) => `${i.cantidad}x ${i.nombre}`)
      .join(', ');

    await notificationService.notifyNewComanda({
      comandaId: newComanda.idComanda,
      mesaNumero: newComanda.mesaNumero || '?',
      itemsSummary: summaryItems,
      total: newComanda.total,
      estado: newComanda.estado,
    });

    // 5. If stock reached minimum threshold, dispatch admin stock alert notification!
    if (lowStockAlerts.length > 0) {
      setTimeout(() => {
        notificationService.notifyNewComanda({
          comandaId: 'ALERTA-STOCK',
          mesaNumero: 'ADMIN',
          itemsSummary: `⚠️ Alerta de Stock Mínimo: ${lowStockAlerts.join('; ')}`,
          total: 0,
          estado: 'Stock Mínimo',
        });
      }, 700);
    }

    // 4. If Google Sheets is connected, append or sync row to 'Comandas' sheet!
    const token = await getAccessToken();
    if (token && spreadsheetId) {
      appendRowToGoogleSheet(token, spreadsheetId, 'Comandas', [
        newComanda.idComanda,
        newComanda.idMesa,
        JSON.stringify(newComanda.listaItems),
        newComanda.total,
        newComanda.estado,
        newComanda.timestamp,
      ]).catch((err) => console.warn('Background sheet append comanda:', err));
    }
  };

  // Update comanda status (e.g. from KDS Kitchen Display)
  const handleUpdateComandaStatus = async (
    comandaId: string,
    newStatus: ComandaStatus,
    cookUser?: StaffUser | null
  ) => {
    const acting = cookUser || activeStaffUser;
    const nowIso = new Date().toISOString();

    setComandas((prev) =>
      prev.map((c) => {
        if (c.idComanda !== comandaId) return c;
        const newLog: AuditLogEntry = {
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fecha: nowIso,
          usuarioId: acting?.id || 'USR-006',
          usuarioNombre: acting?.nombre || 'Chef Juan David',
          rol: (acting?.rol || 'Cocina') as StaffRole,
          accion: `Estado cambiado a ${newStatus}`,
          detalles: `Por ${acting?.nombre || 'Cocina'} (${acting?.rol || 'Cocina'})`,
        };
        return {
          ...c,
          estado: newStatus,
          cocineroId: acting?.rol === 'Cocina' ? acting.id : c.cocineroId,
          cocineroNombre: acting?.rol === 'Cocina' ? acting.nombre : c.cocineroNombre,
          historialCambios: [newLog, ...(c.historialCambios || [])],
        };
      })
    );

    if (newStatus === 'Pendiente') {
      const targetComanda = comandas.find((c) => c.idComanda === comandaId);
      const mesa = tables.find((t) => t.id === targetComanda?.idMesa);
      const mesaNum = targetComanda?.mesaNumero || mesa?.numero || '?';
      const summaryItems = targetComanda?.listaItems
        ? targetComanda.listaItems.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')
        : 'Pedido reactivado a Pendiente';

      // 1. Send dedicated FCM push to mobile kitchen devices
      fcmService
        .dispatchPendingStatusAlert({
          comandaId,
          mesaNumero: mesaNum,
          itemsSummary: summaryItems,
          total: targetComanda?.total || 0,
          estado: 'Pendiente',
        })
        .catch(() => {});

      // 2. Broadcast via notifications service (SSE & browser push)
      notificationService.notifyNewComanda({
        comandaId,
        mesaNumero: mesaNum,
        itemsSummary: summaryItems,
        total: targetComanda?.total || 0,
        estado: 'Pendiente',
      });

      audioService.playKitchenBell();
    } else if (newStatus === 'Listo') {
      audioService.playKitchenBell();
    } else if (newStatus === 'Entregado') {
      audioService.playSuccessTone();
    }

    // Sync to Google Sheets if connected
    const token = await getAccessToken();
    if (token && spreadsheetId) {
      // Re-sync comandas in background
      const updatedComandas = comandas.map((c) =>
        c.idComanda === comandaId ? { ...c, estado: newStatus } : c
      );
      syncSheetFullRows(
        token,
        spreadsheetId,
        'Comandas',
        updatedComandas.map((c) => [
          c.idComanda,
          c.idMesa,
          JSON.stringify(c.listaItems),
          c.total,
          c.estado,
          c.timestamp,
        ])
      ).catch((e) => console.warn('Could not sync comanda status to sheets:', e));
    }
  };

  // Update table status
  const handleUpdateTableStatus = (
    tableId: string,
    status: TableStatus,
    clienteNombre?: string
  ) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              estado: status,
              clienteNombre: status === 'Libre' ? undefined : clienteNombre || t.clienteNombre,
              activeComandaId: status === 'Libre' ? undefined : t.activeComandaId,
              reservaId: status === 'Libre' ? undefined : t.reservaId,
              reservaHora: status === 'Libre' ? undefined : t.reservaHora,
              reservaComensales: status === 'Libre' ? undefined : t.reservaComensales,
              reservaNotas: status === 'Libre' ? undefined : t.reservaNotas,
            }
          : t
      )
    );
  };

  // Reservation management handlers
  const handleOpenNewReservationModal = (defaultTableId?: string) => {
    setSelectedReservationToEdit(null);
    setDefaultReservationTableId(defaultTableId || null);
    setIsReservationModalOpen(true);
  };

  const handleEditReservation = (reserva: Reserva) => {
    setSelectedReservationToEdit(reserva);
    setDefaultReservationTableId(reserva.idMesa);
    setIsReservationModalOpen(true);
  };

  const handleSaveReservation = (resData: {
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
    estado: any;
  }) => {
    if (resData.id) {
      // Update existing reservation
      setReservas((prev) =>
        prev.map((r) =>
          r.id === resData.id
            ? {
                ...r,
                ...resData,
              }
            : r
        )
      );

      // Keep table in sync
      setTables((prev) =>
        prev.map((t) => {
          if (t.id === resData.idMesa) {
            return {
              ...t,
              estado:
                resData.estado === 'Confirmada'
                  ? 'Reservada'
                  : resData.estado === 'Llegada'
                  ? 'Ocupada'
                  : 'Libre',
              clienteNombre: resData.clienteNombre,
              reservaId: resData.id,
              reservaHora: resData.hora,
              reservaComensales: resData.comensales,
              reservaNotas: resData.notas,
            };
          }
          if (t.reservaId === resData.id && t.id !== resData.idMesa) {
            return {
              ...t,
              estado: 'Libre',
              clienteNombre: undefined,
              reservaId: undefined,
              reservaHora: undefined,
              reservaComensales: undefined,
              reservaNotas: undefined,
            };
          }
          return t;
        })
      );

      setActiveToast({
        id: `toast-${Date.now()}`,
        title: 'Reserva Actualizada',
        body: `Mesa ${resData.mesaNumero} - ${resData.clienteNombre} (${resData.hora} hrs, ${resData.comensales} pax)`,
        timestamp: new Date().toISOString(),
        comandaId: resData.id,
      });
    } else {
      // Create brand-new reservation
      const nextId = `RES-${(reservas.length + 1).toString().padStart(3, '0')}`;
      const newReserva: Reserva = {
        id: nextId,
        idMesa: resData.idMesa,
        mesaNumero: resData.mesaNumero,
        clienteNombre: resData.clienteNombre,
        clienteTelefono: resData.clienteTelefono,
        clienteEmail: resData.clienteEmail,
        fecha: resData.fecha,
        hora: resData.hora,
        comensales: resData.comensales,
        notas: resData.notas,
        estado: resData.estado || 'Confirmada',
        createdAt: new Date().toISOString(),
      };

      setReservas((prev) => [newReserva, ...prev]);

      // Update table to Reservada with details
      setTables((prev) =>
        prev.map((t) =>
          t.id === resData.idMesa
            ? {
                ...t,
                estado: 'Reservada',
                clienteNombre: resData.clienteNombre,
                reservaId: nextId,
                reservaHora: resData.hora,
                reservaComensales: resData.comensales,
                reservaNotas: resData.notas,
              }
            : t
        )
      );

      audioService.playSuccessTone();

      setActiveToast({
        id: `toast-${Date.now()}`,
        title: 'Reserva Registrada',
        body: `Mesa ${resData.mesaNumero} reservada para ${resData.clienteNombre} a las ${resData.hora} (${resData.comensales} personas)`,
        timestamp: new Date().toISOString(),
        comandaId: nextId,
      });
    }
  };

  const handleCheckInReservation = (reserva: Reserva) => {
    // 1. Mark reservation as Llegada
    setReservas((prev) =>
      prev.map((r) => (r.id === reserva.id ? { ...r, estado: 'Llegada' } : r))
    );

    // 2. Set table to Ocupada with customer name
    setTables((prev) =>
      prev.map((t) =>
        t.id === reserva.idMesa
          ? {
              ...t,
              estado: 'Ocupada',
              clienteNombre: reserva.clienteNombre,
              reservaHora: reserva.hora,
              reservaComensales: reserva.comensales,
            }
          : t
      )
    );

    audioService.playKitchenBell();

    setActiveToast({
      id: `toast-${Date.now()}`,
      title: 'Llegada de Clientes',
      body: `${reserva.clienteNombre} ha llegado a Mesa ${reserva.mesaNumero} (${reserva.comensales} pax). Mesa lista para comanda.`,
      timestamp: new Date().toISOString(),
      comandaId: reserva.id,
    });

    // 3. Open comanda modal to immediately take order
    const targetTable = tables.find((t) => t.id === reserva.idMesa);
    if (targetTable) {
      setSelectedTableForComanda(targetTable);
      setSelectedComandaToEdit(null);
      setIsComandaModalOpen(true);
    }
  };

  const handleCancelReservation = (reservaId: string) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === reservaId ? { ...r, estado: 'Cancelada' } : r))
    );

    setTables((prev) =>
      prev.map((t) =>
        t.reservaId === reservaId && t.estado === 'Reservada'
          ? {
              ...t,
              estado: 'Libre',
              clienteNombre: undefined,
              reservaId: undefined,
              reservaHora: undefined,
              reservaComensales: undefined,
              reservaNotas: undefined,
            }
          : t
      )
    );

    setActiveToast({
      id: `toast-${Date.now()}`,
      title: 'Reserva Cancelada',
      body: `La reserva fue cancelada y la mesa ha quedado liberada.`,
      timestamp: new Date().toISOString(),
      comandaId: reservaId,
    });
  };

  const handleDeleteReservation = (reservaId: string) => {
    setReservas((prev) => prev.filter((r) => r.id !== reservaId));
    setTables((prev) =>
      prev.map((t) =>
        t.reservaId === reservaId && t.estado === 'Reservada'
          ? {
              ...t,
              estado: 'Libre',
              clienteNombre: undefined,
              reservaId: undefined,
              reservaHora: undefined,
              reservaComensales: undefined,
              reservaNotas: undefined,
            }
          : t
      )
    );
  };

  const handleCheckInTable = (table: Table) => {
    if (table.reservaId) {
      const res = reservas.find((r) => r.id === table.reservaId);
      if (res) {
        handleCheckInReservation(res);
        return;
      }
    }
    handleUpdateTableStatus(table.id, 'Ocupada', table.clienteNombre);
    setSelectedTableForComanda(table);
    setSelectedComandaToEdit(null);
    setIsComandaModalOpen(true);
  };

  // Process payment / closing table
  const handleProcessPayment = async (paymentData: {
    idVenta: string;
    idFactura: string;
    idComanda: string;
    mesaId: string;
    monto: number;
    metodoPago: PaymentMethod;
    nitCliente: string;
    nombreCliente: string;
    fecha: string;
    cajeroId?: string;
    cajeroNombre?: string;
  }) => {
    const targetCajeroId = paymentData.cajeroId || activeCajero?.id || 'CAJ-001';
    const targetCajeroNombre = paymentData.cajeroNombre || activeCajero?.nombre || 'Carlos Ramírez';
    const currentSesionId = activeSesionCaja?.id;

    // 1. Add Venta
    const newVenta: Venta = {
      idVenta: paymentData.idVenta,
      idComanda: paymentData.idComanda,
      fecha: paymentData.fecha,
      monto: paymentData.monto,
      metodoPago: paymentData.metodoPago,
      cajeroId: targetCajeroId,
      cajeroNombre: targetCajeroNombre,
      sesionCajaId: currentSesionId,
    };
    setVentas((prev) => [newVenta, ...prev]);

    // 2. Add Factura
    const newFactura: Factura = {
      idFactura: paymentData.idFactura,
      idVenta: paymentData.idVenta,
      fecha: paymentData.fecha.split('T')[0],
      nitCliente: paymentData.nitCliente,
      nombreCliente: paymentData.nombreCliente,
      monto: paymentData.monto,
      estado: 'Emitida',
      cajeroNombre: targetCajeroNombre,
    };
    setFacturas((prev) => [newFactura, ...prev]);

    // 3. Update Active Cash Register Session & Register Cash Movement
    if (activeSesionCaja && activeSesionCaja.estado === 'Abierta') {
      const isCash = paymentData.metodoPago === 'Efectivo';
      const isCard = paymentData.metodoPago === 'Tarjeta';
      const isTransfer = paymentData.metodoPago === 'Transferencia';

      setActiveSesionCaja((prev) => {
        if (!prev) return prev;
        const newVentasEfectivo = prev.totalVentasEfectivo + (isCash ? paymentData.monto : 0);
        const newVentasTarjeta = prev.totalVentasTarjeta + (isCard ? paymentData.monto : 0);
        const newVentasTransfer = prev.totalVentasTransferencia + (isTransfer ? paymentData.monto : 0);
        const newEfectivoEsperado =
          prev.montoBase +
          newVentasEfectivo +
          prev.totalEntradasManuales -
          prev.totalSalidasManuales;

        return {
          ...prev,
          totalVentasEfectivo: newVentasEfectivo,
          totalVentasTarjeta: newVentasTarjeta,
          totalVentasTransferencia: newVentasTransfer,
          efectivoEsperado: newEfectivoEsperado,
        };
      });

      const newMovimiento: MovimientoCaja = {
        id: `MOV-${Date.now().toString().slice(-5)}`,
        sesionId: activeSesionCaja.id,
        cajeroId: targetCajeroId,
        cajeroNombre: targetCajeroNombre,
        tipo: 'Ingreso_Venta',
        concepto: `Cobro Comanda ${paymentData.idComanda} (${paymentData.idVenta})`,
        monto: paymentData.monto,
        metodoPago: paymentData.metodoPago,
        fecha: paymentData.fecha,
        comprobanteRef: paymentData.idVenta,
      };
      setMovimientosCaja((prev) => [newMovimiento, ...prev]);
    }

    // 4. Close Comanda and Free Table
    setComandas((prev) =>
      prev.map((c) =>
        c.idComanda === paymentData.idComanda ? { ...c, estado: 'Entregado' } : c
      )
    );

    setTables((prev) =>
      prev.map((t) =>
        t.id === paymentData.mesaId
          ? { ...t, estado: 'Libre', clienteNombre: undefined, activeComandaId: undefined }
          : t
      )
    );

    audioService.playSuccessTone();

    // 5. Append to Google Sheets 'Ventas' & 'Facturación'
    const token = await getAccessToken();
    if (token && spreadsheetId) {
      appendRowToGoogleSheet(token, spreadsheetId, 'Ventas', [
        newVenta.idVenta,
        newVenta.idComanda,
        newVenta.fecha,
        newVenta.monto,
        newVenta.metodoPago,
      ]).catch((e) => console.warn(e));

      appendRowToGoogleSheet(token, spreadsheetId, 'Facturación', [
        newFactura.idFactura,
        newFactura.idVenta,
        newFactura.fecha,
        newFactura.nitCliente,
        newFactura.monto,
        newFactura.estado,
      ]).catch((e) => console.warn(e));
    }
  };

  // Cash Register Handlers
  const handleOpenCash = (openData: {
    cajeroId: string;
    cajeroNombre: string;
    turno: TurnoTipo;
    montoBase: number;
    notasApertura?: string;
    desglose?: DenominacionConteo[];
  }) => {
    const sesionId = `SES-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const newSesion: SesionCaja = {
      id: sesionId,
      cajeroId: openData.cajeroId,
      cajeroNombre: openData.cajeroNombre,
      fechaApertura: nowIso,
      turno: openData.turno,
      montoBase: openData.montoBase,
      estado: 'Abierta',
      notasApertura: openData.notasApertura,
      totalVentasEfectivo: 0,
      totalVentasTarjeta: 0,
      totalVentasTransferencia: 0,
      totalEntradasManuales: 0,
      totalSalidasManuales: 0,
      efectivoEsperado: openData.montoBase,
      desgloseConteo: openData.desglose,
    };

    const initialMovement: MovimientoCaja = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      sesionId,
      cajeroId: openData.cajeroId,
      cajeroNombre: openData.cajeroNombre,
      tipo: 'Base_Inicial',
      concepto: `Apertura de turno - Fondo Base en efectivo (${formatCOP(openData.montoBase)})`,
      monto: openData.montoBase,
      metodoPago: 'Efectivo',
      fecha: nowIso,
    };

    setActiveSesionCaja(newSesion);
    setActiveCajeroId(openData.cajeroId);
    setMovimientosCaja((prev) => [initialMovement, ...prev]);

    audioService.playSuccessTone();

    setActiveToast({
      id: `toast-${Date.now()}`,
      title: 'Caja Abierta Exitosamente',
      body: `Turno iniciado por ${openData.cajeroNombre} con Base de ${formatCOP(openData.montoBase)}.`,
      timestamp: nowIso,
      comandaId: sesionId,
    });
  };

  const handleConfirmCloseCash = (closingData: {
    efectivoReal: number;
    diferencia: number;
    notasCierre?: string;
    supervisorCierre?: string;
    desgloseConteo?: DenominacionConteo[];
  }) => {
    if (!activeSesionCaja) return;

    const closedSesion: SesionCaja = {
      ...activeSesionCaja,
      fechaCierre: new Date().toISOString(),
      estado: 'Cerrada',
      efectivoReal: closingData.efectivoReal,
      diferencia: closingData.diferencia,
      notasCierre: closingData.notasCierre,
      supervisorCierre: closingData.supervisorCierre,
      desgloseConteo: closingData.desgloseConteo,
    };

    setHistorialSesiones((prev) => [closedSesion, ...prev]);
    setActiveSesionCaja(null);

    audioService.playKitchenBell();

    const diffText =
      Math.abs(closingData.diferencia) < 1
        ? 'Cuadrado perfecto ($ 0)'
        : closingData.diferencia > 0
        ? `Sobrante de +${formatCOP(closingData.diferencia)}`
        : `Faltante de ${formatCOP(closingData.diferencia)}`;

    setActiveToast({
      id: `toast-${Date.now()}`,
      title: 'Cierre de Caja Finalizado',
      body: `Turno ${closedSesion.id} cerrado por ${closedSesion.cajeroNombre}. Balance: ${diffText}.`,
      timestamp: new Date().toISOString(),
      comandaId: closedSesion.id,
    });
  };

  const handleConfirmCashMovement = (movementData: {
    tipo: 'Entrada_Manual' | 'Salida_Gasto' | 'Retiro_Seguridad' | 'Ingreso_Venta' | 'Base_Inicial';
    concepto: string;
    monto: number;
    metodoPago: PaymentMethod | 'Efectivo';
    comprobanteRef?: string;
  }) => {
    const nowIso = new Date().toISOString();
    const cajeroName = activeCajero?.nombre || 'Carlos Ramírez';
    const cajeroId = activeCajero?.id || 'CAJ-001';
    const sesId = activeSesionCaja?.id || 'SES-GEN';

    const newMov: MovimientoCaja = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      sesionId: sesId,
      cajeroId,
      cajeroNombre: cajeroName,
      tipo: movementData.tipo,
      concepto: movementData.concepto,
      monto: movementData.monto,
      metodoPago: movementData.metodoPago,
      fecha: nowIso,
      comprobanteRef: movementData.comprobanteRef,
    };

    setMovimientosCaja((prev) => [newMov, ...prev]);

    if (activeSesionCaja && activeSesionCaja.estado === 'Abierta') {
      const isEntrada = movementData.tipo === 'Entrada_Manual' || movementData.tipo === 'Base_Inicial';
      setActiveSesionCaja((prev) => {
        if (!prev) return prev;
        const newEntradas = prev.totalEntradasManuales + (isEntrada ? movementData.monto : 0);
        const newSalidas = prev.totalSalidasManuales + (!isEntrada ? movementData.monto : 0);
        const newEsperado =
          prev.montoBase + prev.totalVentasEfectivo + newEntradas - newSalidas;

        return {
          ...prev,
          totalEntradasManuales: newEntradas,
          totalSalidasManuales: newSalidas,
          efectivoEsperado: newEsperado,
        };
      });
    }

    setActiveToast({
      id: `toast-${Date.now()}`,
      title: movementData.tipo === 'Entrada_Manual' ? 'Entrada de Efectivo (+)' : 'Salida de Efectivo (-)',
      body: `${movementData.concepto}: ${formatCOP(movementData.monto)} registrado por ${cajeroName}.`,
      timestamp: nowIso,
      comandaId: newMov.id,
    });
  };

  const handleAddCajero = (newCaj: Omit<Cajero, 'id'>) => {
    const nextId = `CAJ-${(cajeros.length + 1).toString().padStart(3, '0')}`;
    const cajeroFull: Cajero = {
      ...newCaj,
      id: nextId,
    };
    setCajeros((prev) => [...prev, cajeroFull]);

    setActiveToast({
      id: `toast-${Date.now()}`,
      title: 'Cajero Registrado',
      body: `${cajeroFull.nombre} agregado como ${cajeroFull.rol} (PIN: #${cajeroFull.codigo}).`,
      timestamp: new Date().toISOString(),
      comandaId: nextId,
    });
  };

  const handleToggleCajeroStatus = (cajeroId: string) => {
    setCajeros((prev) =>
      prev.map((c) => (c.id === cajeroId ? { ...c, activo: !c.activo } : c))
    );
  };

  const handleSelectActiveCajero = (cajeroId: string) => {
    setActiveCajeroId(cajeroId);
    const chosen = cajeros.find((c) => c.id === cajeroId);
    if (chosen && activeSesionCaja && activeSesionCaja.estado === 'Abierta') {
      setActiveSesionCaja((prev) =>
        prev
          ? {
              ...prev,
              cajeroId: chosen.id,
              cajeroNombre: chosen.nombre,
            }
          : null
      );
    }
  };

  const handleAnularFactura = (facturaId: string, motivo: string) => {
    setFacturas((prev) =>
      prev.map((f) =>
        f.idFactura === facturaId
          ? {
              ...f,
              estado: 'Anulada',
              anuladaMotivo: motivo,
            }
          : f
      )
    );
  };

  // Staff User Management & Session Switcher Handlers
  const handleSelectStaffUser = (user: StaffUser) => {
    setActiveStaffUser(user);
    localStorage.setItem('restoflow_active_staff_user_id', user.id);
    setIsTerminalLocked(false);
    setIsStaffLoginOpen(false);

    // If cashier, also sync with active cashier for caja and facturación
    if (user.rol === 'Cajero') {
      const matchingCajero = cajeros.find(
        (c) => c.nombre.toLowerCase() === user.nombre.toLowerCase()
      );
      if (matchingCajero) {
        handleSelectActiveCajero(matchingCajero.id);
      }
    }
  };

  const handleAddStaffUser = (newUser: Omit<StaffUser, 'id'>) => {
    const nextId = `USR-${(staffUsers.length + 1).toString().padStart(3, '0')}`;
    const created: StaffUser = { ...newUser, id: nextId };
    const updated = [...staffUsers, created];
    setStaffUsers(updated);
    localStorage.setItem('restoflow_staff_users', JSON.stringify(updated));

    if (created.rol === 'Cajero') {
      const newCajero: Cajero = {
        id: `CAJ-${(cajeros.length + 1).toString().padStart(3, '0')}`,
        nombre: created.nombre,
        codigo: created.pin,
        rol: 'Cajero Turno',
        activo: true,
        telefono: created.telefono,
        avatarColor: created.avatarColor,
      };
      const updatedCajeros = [...cajeros, newCajero];
      setCajeros(updatedCajeros);
      localStorage.setItem('restoflow_cajeros', JSON.stringify(updatedCajeros));
    }
  };

  const handleUpdateStaffUser = (updatedUser: StaffUser) => {
    const updated = staffUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setStaffUsers(updated);
    localStorage.setItem('restoflow_staff_users', JSON.stringify(updated));
    if (activeStaffUser?.id === updatedUser.id) {
      setActiveStaffUser(updatedUser);
    }
  };

  const handleToggleStaffStatus = (userId: string) => {
    const updated = staffUsers.map((u) =>
      u.id === userId ? { ...u, activo: !u.activo } : u
    );
    setStaffUsers(updated);
    localStorage.setItem('restoflow_staff_users', JSON.stringify(updated));
    if (activeStaffUser?.id === userId) {
      const activeRemaining = updated.find((u) => u.activo);
      setActiveStaffUser(activeRemaining || null);
    }
  };

  // Add new table
  const handleAddTable = () => {
    const nextNum = tables.length + 1;
    const newTable: Table = {
      id: `TAB-${nextNum.toString().padStart(3, '0')}`,
      numero: nextNum,
      estado: 'Libre',
      capacidad: 4,
    };
    setTables((prev) => [...prev, newTable]);
  };

  const pendingComandasCount = comandas.filter((c) => c.estado === 'Pendiente').length;
  const lowStockCount = menu.filter((item) => item.stockActual <= item.stockMinimo).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingComandasCount={pendingComandasCount}
        confirmedReservasCount={
          reservas.filter(
            (r) =>
              r.fecha === new Date().toISOString().split('T')[0] &&
              r.estado === 'Confirmada'
          ).length
        }
        lowStockCount={lowStockCount}
        cajaAbierta={!!(activeSesionCaja && activeSesionCaja.estado === 'Abierta')}
        activeCajeroNombre={activeCajero?.nombre}
        restaurantName={restaurantInfo.nombreComercial}
        onOpenRestaurantProfile={() => setIsRestaurantProfileOpen(true)}
        activeStaffUser={activeStaffUser}
        onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
        onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
        onLockTerminal={() => setIsTerminalLocked(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        isSheetsConnected={isSheetsConnected}
        spreadsheetTitle={spreadsheetTitle}
        isSyncing={isSyncing}
        onManualSync={() => handleSyncFromSheets()}
      />

      {/* Floating Push Notification Toast */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-gradient-to-r from-amber-600 to-orange-600 text-zinc-950 p-4 rounded-2xl shadow-2xl border border-amber-300 animate-in slide-in-from-bottom duration-300 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-black/20 text-white shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950">
              {activeToast.title}
            </h4>
            <p className="text-xs font-semibold mt-0.5 leading-snug text-zinc-900">
              {activeToast.body}
            </p>
            <span className="text-[10px] text-zinc-800 font-mono mt-1 block">
              {new Date(activeToast.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-zinc-950 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Views Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <KpiDashboard
            tables={tables}
            comandas={comandas}
            ventas={ventas}
            menu={menu}
            activeSesionCaja={activeSesionCaja}
            onOpenCashModal={() => setIsOpenCashModalOpen(true)}
            onNavigateToVentas={() => setActiveTab('ventas')}
          />
        )}

        {activeTab === 'mesas' && (
          <TableGrid
            tables={tables}
            comandas={comandas}
            onOpenComandaForTable={(table) => {
              setSelectedTableForComanda(table);
              const activeOrder = comandas.find(
                (c) => (c.idMesa === table.id || c.mesaNumero === table.numero) && c.estado !== 'Entregado'
              );
              setSelectedComandaToEdit(activeOrder || null);
              setIsComandaModalOpen(true);
            }}
            onOpenCheckoutForTable={(table, comanda) => {
              setBillingTable(table);
              setBillingComanda(comanda);
              setIsBillingModalOpen(true);
            }}
            onUpdateTableStatus={handleUpdateTableStatus}
            onAddTable={handleAddTable}
            onOpenReservationForTable={(table) => handleOpenNewReservationModal(table.id)}
            onCheckInTable={handleCheckInTable}
            onNavigateToReservations={() => setActiveTab('reservas')}
          />
        )}

        {activeTab === 'reservas' && (
          <ReservationsManagement
            reservas={reservas}
            tables={tables}
            clientes={clientes}
            onOpenNewReservationModal={handleOpenNewReservationModal}
            onEditReservation={handleEditReservation}
            onCheckInReservation={handleCheckInReservation}
            onCancelReservation={handleCancelReservation}
            onDeleteReservation={handleDeleteReservation}
          />
        )}

        {activeTab === 'pos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-white">Toma Rápida de Comanda (POS)</h2>
                <p className="text-xs text-zinc-400">Selecciona una mesa para iniciar o agregar pedidos</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTableForComanda(tables[0] || null);
                  setSelectedComandaToEdit(null);
                  setIsComandaModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition"
              >
                Abrir Selector de Pedido
              </button>
            </div>

            <TableGrid
              tables={tables}
              comandas={comandas}
              onOpenComandaForTable={(table) => {
                setSelectedTableForComanda(table);
                const activeOrder = comandas.find(
                  (c) => (c.idMesa === table.id || c.mesaNumero === table.numero) && c.estado !== 'Entregado'
                );
                setSelectedComandaToEdit(activeOrder || null);
                setIsComandaModalOpen(true);
              }}
              onOpenCheckoutForTable={(table, comanda) => {
                setBillingTable(table);
                setBillingComanda(comanda);
                setIsBillingModalOpen(true);
              }}
              onUpdateTableStatus={handleUpdateTableStatus}
              onAddTable={handleAddTable}
              onOpenReservationForTable={(table) => handleOpenNewReservationModal(table.id)}
              onCheckInTable={handleCheckInTable}
              onNavigateToReservations={() => setActiveTab('reservas')}
            />
          </div>
        )}

        {activeTab === 'kds' && (
          <KitchenDisplay
            comandas={comandas}
            onUpdateComandaStatus={handleUpdateComandaStatus}
            activeStaffUser={activeStaffUser}
          />
        )}

        {activeTab === 'ventas' && (
          <SalesInvoiceView
            ventas={ventas}
            facturas={facturas}
            comandas={comandas}
            cajeros={cajeros}
            activeCajero={activeCajero}
            activeSesionCaja={activeSesionCaja}
            historialSesiones={historialSesiones}
            movimientosCaja={movimientosCaja}
            onOpenCashModal={() => setIsOpenCashModalOpen(true)}
            onCloseCashModal={() => setIsCloseCashModalOpen(true)}
            onOpenMovementModal={(type) => {
              setMovementModalDefaultType(type || 'Salida_Gasto');
              setIsMovementModalOpen(true);
            }}
            onOpenCashierManagement={() => setIsCashierManagementOpen(true)}
            onSelectActiveCajero={handleSelectActiveCajero}
            onAnularFactura={handleAnularFactura}
            onOpenRestaurantProfile={() => setIsRestaurantProfileOpen(true)}
          />
        )}

        {activeTab === 'menu' && (
          <MenuManagement
            menu={menu}
            onAddMenuItem={(item) => setMenu((prev) => [...prev, item])}
            onUpdateMenuItem={(item) =>
              setMenu((prev) => prev.map((m) => (m.id === item.id ? item : m)))
            }
            onToggleAvailability={(id) =>
              setMenu((prev) =>
                prev.map((m) => (m.id === id ? { ...m, disponible: !m.disponible } : m))
              )
            }
          />
        )}

        {activeTab === 'inventario' && (
          <InventorySuppliers
            compras={compras}
            proveedores={proveedores}
            menu={menu}
            onAddCompra={(compra) => setCompras((prev) => [compra, ...prev])}
            onAddProveedor={(prov) => setProveedores((prev) => [...prev, prov])}
            onUpdateStock={(menuId, newStock) =>
              setMenu((prev) =>
                prev.map((m) =>
                  m.id === menuId
                    ? {
                        ...m,
                        stockActual: Math.max(0, newStock),
                        disponible: newStock > 0 ? true : m.disponible,
                      }
                    : m
                )
              )
            }
          />
        )}

        {activeTab === 'clientes' && (
          <CustomerManagement
            clientes={clientes}
            onAddCliente={(cli) => setClientes((prev) => [...prev, cli])}
          />
        )}

        {activeTab === 'sheets' && (
          <SheetsSyncManager
            user={user}
            onLogin={handleLogin}
            isLoggingIn={isLoggingIn}
            spreadsheetId={spreadsheetId}
            spreadsheetTitle={spreadsheetTitle}
            spreadsheetUrl={spreadsheetUrl}
            isSheetsConnected={isSheetsConnected}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onConnectExistingSheet={handleConnectExistingSheet}
            onCreateNewSheet={handleCreateNewSheet}
            onSyncAll={handleSyncAllToSheets}
            counts={{
              menu: menu.length,
              tables: tables.length,
              comandas: comandas.length,
              ventas: ventas.length,
              compras: compras.length,
              proveedores: proveedores.length,
              clientes: clientes.length,
              facturas: facturas.length,
              reservas: reservas.length,
            }}
          />
        )}
      </main>

      {/* POS Comanda Modal */}
      <ComandaModal
        isOpen={isComandaModalOpen}
        onClose={() => {
          setIsComandaModalOpen(false);
          setSelectedTableForComanda(null);
          setSelectedComandaToEdit(null);
        }}
        tables={tables}
        menu={menu}
        initialTable={selectedTableForComanda}
        existingComanda={selectedComandaToEdit}
        activeStaffUser={activeStaffUser}
        onSaveComanda={handleSaveComanda}
      />

      {/* Billing / Checkout Modal */}
      {billingTable && billingComanda && (
        <BillingModal
          isOpen={isBillingModalOpen}
          onClose={() => {
            setIsBillingModalOpen(false);
            setBillingTable(null);
            setBillingComanda(null);
          }}
          table={billingTable}
          comanda={billingComanda}
          cajeroActual={activeCajero}
          cajaAbierta={!!(activeSesionCaja && activeSesionCaja.estado === 'Abierta')}
          onRequireOpenCash={() => setIsOpenCashModalOpen(true)}
          onProcessPayment={handleProcessPayment}
        />
      )}

      {/* Open Cash Modal */}
      <OpenCashModal
        isOpen={isOpenCashModalOpen}
        onClose={() => setIsOpenCashModalOpen(false)}
        cajeros={cajeros}
        activeCajero={activeCajero}
        onConfirmOpen={handleOpenCash}
        onOpenAddCashier={() => {
          setIsOpenCashModalOpen(false);
          setIsCashierManagementOpen(true);
        }}
      />

      {/* Close Cash Modal */}
      {activeSesionCaja && (
        <CloseCashModal
          isOpen={isCloseCashModalOpen}
          onClose={() => setIsCloseCashModalOpen(false)}
          sesion={activeSesionCaja}
          movimientos={movimientosCaja.filter((m) => m.sesionId === activeSesionCaja.id)}
          ventas={ventas}
          facturas={facturas}
          onConfirmClose={handleConfirmCloseCash}
        />
      )}

      {/* Cash Movement (Inflow / Outflow) Modal */}
      <CashMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        defaultType={movementModalDefaultType}
        activeCajeroNombre={activeCajero?.nombre || 'Carlos Ramírez'}
        activeCajeroId={activeCajero?.id || 'CAJ-001'}
        onConfirmMovement={handleConfirmCashMovement}
      />

      {/* Cashier Team Management Modal */}
      <CashierManagementModal
        isOpen={isCashierManagementOpen}
        onClose={() => setIsCashierManagementOpen(false)}
        cajeros={cajeros}
        activeCajeroId={activeCajeroId}
        onSelectActiveCajero={handleSelectActiveCajero}
        onAddCajero={handleAddCajero}
        onToggleCajeroStatus={handleToggleCajeroStatus}
      />

      {/* Reservation Booking / Editing Modal */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setSelectedReservationToEdit(null);
          setDefaultReservationTableId(null);
        }}
        tables={tables}
        clientes={clientes}
        initialReservation={selectedReservationToEdit}
        defaultTableId={defaultReservationTableId}
        onSave={handleSaveReservation}
      />

      {/* Restaurant Profile (Nombre, NIT, Dirección, Redes, DIAN) Modal */}
      <RestaurantProfileModal
        isOpen={isRestaurantProfileOpen}
        onClose={() => setIsRestaurantProfileOpen(false)}
        currentInfo={restaurantInfo}
        onSave={(updated) => {
          setRestaurantInfo(updated);
          saveRestaurantInfo(updated);
        }}
      />

      {/* Staff Login / Quick PIN Shift Switcher & Lock Terminal Modal */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen || isTerminalLocked}
        onClose={isTerminalLocked ? undefined : () => setIsStaffLoginOpen(false)}
        staffUsers={staffUsers}
        activeUser={activeStaffUser}
        onSelectUser={handleSelectStaffUser}
        isLockScreen={isTerminalLocked}
      />

      {/* Staff Team Management & Audit History Modal */}
      <StaffManagementModal
        isOpen={isStaffManagementOpen}
        onClose={() => setIsStaffManagementOpen(false)}
        staffUsers={staffUsers}
        activeUser={activeStaffUser}
        comandas={comandas}
        onSelectUser={handleSelectStaffUser}
        onAddStaffUser={handleAddStaffUser}
        onUpdateStaffUser={handleUpdateStaffUser}
        onToggleStaffStatus={handleToggleStaffStatus}
      />

      {/* Confirmation Modal (Destructive / Sync Operations) */}
      <ConfirmationModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmLabel={confirmModalConfig.confirmLabel}
        isDestructive={confirmModalConfig.isDestructive}
        onConfirm={confirmModalConfig.action}
        onCancel={() => setConfirmModalConfig((c) => ({ ...c, isOpen: false }))}
      />
    </div>
  );
}
