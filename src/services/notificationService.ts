import { audioService } from './audioService';
import { formatCOP } from '../utils/colombiaFiscal';

export interface AlertNotification {
  id: string;
  title: string;
  body: string;
  comandaId?: string;
  mesaNumero?: number | string;
  items?: string;
  total?: number;
  estado?: string;
  timestamp: string;
}

type NotificationListener = (notif: AlertNotification) => void;

class NotificationService {
  private eventSource: EventSource | null = null;
  private listeners: Set<NotificationListener> = new Set();
  private isConnected = false;

  constructor() {
    this.connectStream();
    this.requestBrowserPermission();
  }

  public subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private connectStream() {
    try {
      if (typeof window === 'undefined') return;

      this.eventSource = new EventSource('/api/notifications/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'KITCHEN_ALERT' && data.notification) {
            // Play kitchen chime!
            audioService.playKitchenBell();

            // Show native OS notification if permitted
            this.showNativeNotification(data.notification);

            // Inform frontend subscribers
            this.listeners.forEach((listener) => listener(data.notification));
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        // EventSource automatically retries connection
      };
    } catch (e) {
      console.warn('SSE stream connection warning:', e);
    }
  }

  public async requestBrowserPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {}
      }
    }
  }

  public showNativeNotification(notif: AlertNotification) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.body,
          icon: '/favicon.ico',
        });
      } catch {}
    }
  }

  /**
   * Dispatch comanda notification to the backend
   */
  public async notifyNewComanda(payload: {
    comandaId: string;
    mesaNumero: number | string;
    itemsSummary: string;
    total: number;
    estado?: string;
  }) {
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `¡Nueva Comanda en Mesa #${payload.mesaNumero}!`,
          body: `${payload.itemsSummary} — Total: ${formatCOP(payload.total)}`,
          comandaId: payload.comandaId,
          mesaNumero: payload.mesaNumero,
          items: payload.itemsSummary,
          total: payload.total,
          estado: payload.estado || 'Pendiente',
        }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to dispatch notification to backend:', err);
      // Fallback local alert if backend unreachable
      audioService.playKitchenBell();
      return null;
    }
  }

  /**
   * Register FCM Token with server
   */
  public async registerFcmToken(token: string) {
    try {
      const res = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return await res.json();
    } catch (err) {
      console.warn('FCM registration failed:', err);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
