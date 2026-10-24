import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { app } from './firebaseAuth';
import { audioService } from './audioService';

export interface FcmDeviceInfo {
  token: string;
  role: 'cocina' | 'admin';
  deviceName: string;
  registeredAt: string;
}

export interface PendingComandaPayload {
  comandaId: string;
  mesaNumero: number | string;
  itemsSummary: string;
  total: number;
  estado?: string;
}

type PushAlertCallback = (payload: { title: string; body: string; comandaId?: string; mesaNumero?: any }) => void;

class FcmKitchenService {
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private isSupportedBrowser: boolean = false;
  private registeredDeviceName: string = '';
  private pushAlertListeners: Set<PushAlertCallback> = new Set();

  constructor() {
    this.checkSupport();
  }

  private async checkSupport() {
    try {
      if (typeof window === 'undefined') return;

      this.isSupportedBrowser = await isSupported();
      if (this.isSupportedBrowser) {
        this.messaging = getMessaging(app);
        this.setupForegroundListener();
        this.setupServiceWorkerListener();

        // Check saved token in session
        const saved = localStorage.getItem('restoflow_fcm_token');
        if (saved) {
          this.currentToken = saved;
        }
      }
    } catch (e) {
      console.warn('[FCM] Firebase Messaging inicialización en este entorno:', e);
    }
  }

  public getIsSupported(): boolean {
    return this.isSupportedBrowser;
  }

  public getCurrentToken(): string | null {
    return this.currentToken;
  }

  public onPushAlert(cb: PushAlertCallback) {
    this.pushAlertListeners.add(cb);
    return () => {
      this.pushAlertListeners.delete(cb);
    };
  }

  private setupServiceWorkerListener() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'FCM_PUSH_PENDIENTE') {
          console.log('[FCM] Evento de Service Worker push recibido en cocina:', event.data);
          this.triggerKitchenAlertBeepAndVibrate();
          this.pushAlertListeners.forEach((cb) => cb(event.data));
        }
      });
    }
  }

  private triggerKitchenAlertBeepAndVibrate() {
    // 1. Play kitchen bell sound chime
    audioService.playKitchenBell();

    // 2. Trigger mobile haptic vibration if supported on device
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 500]);
      } catch {}
    }
  }

  private setupForegroundListener() {
    if (!this.messaging) return;

    try {
      onMessage(this.messaging, (payload) => {
        console.log('[FCM] Mensaje push recibido en primer plano (Cocina):', payload);

        this.triggerKitchenAlertBeepAndVibrate();

        const title =
          payload.notification?.title ||
          payload.data?.title ||
          '🚨 ¡Nueva Comanda Pendiente en Cocina!';
        const body =
          payload.notification?.body ||
          payload.data?.body ||
          'Comanda con estado Pendiente requiere atención inmediata.';

        // Show OS / mobile notification if permitted
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: payload.data?.comandaId || 'cocina-foreground',
            });
          } catch {}
        }

        // Notify active listeners
        this.pushAlertListeners.forEach((cb) =>
          cb({
            title,
            body,
            comandaId: payload.data?.comandaId,
            mesaNumero: payload.data?.mesaNumero,
          })
        );
      });
    } catch (err) {
      console.warn('[FCM] Error configurando listener de primer plano:', err);
    }
  }

  /**
   * Request push notification permission and register kitchen mobile device with backend
   */
  public async registerKitchenDevice(deviceName?: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      if (typeof window === 'undefined') {
        return { success: false, error: 'Entorno no compatible con navegador' };
      }

      if (!('Notification' in window)) {
        return { success: false, error: 'Tu navegador o dispositivo no admite notificaciones push' };
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Permiso de notificaciones denegado por el usuario' };
      }

      // Register service worker if available
      let registration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        try {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;
        } catch (swErr) {
          console.warn('[FCM] Service Worker registro fallback:', swErr);
        }
      }

      if (!this.messaging) {
        this.messaging = getMessaging(app);
      }

      // Generate or retrieve token
      const name = deviceName || (this.isMobileDevice() ? 'Móvil Cocina' : 'Terminal Cocina (Tablet/Pantalla)');
      this.registeredDeviceName = name;

      let fcmToken: string;
      try {
        fcmToken = await getToken(this.messaging, {
          serviceWorkerRegistration: registration,
        });
      } catch (tokenErr: any) {
        console.warn('[FCM] Generando token FCM local con fallback:', tokenErr);
        // Fallback local token identifier for device representation
        fcmToken = `fcm_device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      this.currentToken = fcmToken;
      localStorage.setItem('restoflow_fcm_token', fcmToken);
      localStorage.setItem('restoflow_fcm_device_name', name);

      // Register device with backend
      const res = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: fcmToken,
          role: 'cocina',
          deviceName: name,
        }),
      });

      await res.json().catch(() => ({}));

      // Play success chime & vibrate
      this.triggerKitchenAlertBeepAndVibrate();

      return { success: true, token: fcmToken };
    } catch (err: any) {
      console.error('[FCM] Error registrando dispositivo de cocina:', err);
      return { success: false, error: err.message || 'Error al conectar con FCM' };
    }
  }

  /**
   * Send a test push notification to verify kitchen mobile device reception
   */
  public async testKitchenPush(): Promise<boolean> {
    try {
      const res = await fetch('/api/fcm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'cocina',
          title: '🚨 ¡Prueba de Alerta Push Cocina!',
          body: 'El canal push para dispositivos móviles de cocina está activo: Alertas en tiempo real para comandas Pendientes.',
        }),
      });
      const data = await res.json();
      this.triggerKitchenAlertBeepAndVibrate();
      return !!data.success;
    } catch (err) {
      console.error('[FCM] Error enviando push de prueba:', err);
      return false;
    }
  }

  /**
   * Dispatch push alert to all kitchen mobile devices when a comanda status becomes 'Pendiente'
   */
  public async dispatchPendingStatusAlert(data: PendingComandaPayload): Promise<boolean> {
    try {
      const res = await fetch('/api/fcm/push-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comandaId: data.comandaId,
          mesaNumero: data.mesaNumero,
          items: data.itemsSummary,
          total: data.total,
          title: `🚨 ¡Comanda Mesa #${data.mesaNumero} PENDIENTE!`,
          body: `${data.itemsSummary} — Atención Cocina`,
        }),
      });
      const result = await res.json();
      return !!result.success;
    } catch (err) {
      console.warn('[FCM] Fallback enviando comanda pendiente:', err);
      return false;
    }
  }

  /**
   * Helper to detect mobile device
   */
  public isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }
}

export const fcmService = new FcmKitchenService();
