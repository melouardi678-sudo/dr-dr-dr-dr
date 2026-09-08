import { AppUser, ConnectionStatus, NetworkConfig, SyncEvent } from '../types';
import { getBaseApiUrl, getNetworkConfig, getWebSocketUrl } from './networkConfig';

type StatusListener = (status: ConnectionStatus, message?: string) => void;
type MutationListener = (event: SyncEvent) => void;

class SyncClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private statusListeners: Set<StatusListener> = new Set();
  private mutationListeners: Set<MutationListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private currentUser: AppUser | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;

  constructor() {
    // Initial status based on saved network config
    const config = getNetworkConfig();
    this.status = config.mode === 'local' ? 'connected' : 'disconnected';

    // Set up cross-tab local BroadcastChannel for seamless instant multi-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('medicab_local_sync');
        this.broadcastChannel.onmessage = (evt) => {
          if (evt.data && evt.data.type) {
            this.mutationListeners.forEach((fn) => {
              try {
                fn(evt.data);
              } catch (err) {
                console.warn('[SyncClient] Cross-tab sync listener notice:', err);
              }
            });
          }
        };
      } catch (e) {
        // BroadcastChannel optional fallback
      }
    }
  }

  public setUser(user: AppUser | null) {
    this.currentUser = user;
    if (this.ws && this.ws.readyState === WebSocket.OPEN && user) {
      this.sendPresence(user);
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public onStatusChange(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  public onMutation(fn: MutationListener): () => void {
    this.mutationListeners.add(fn);
    return () => this.mutationListeners.delete(fn);
  }

  private setStatus(newStatus: ConnectionStatus, message?: string) {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => {
      try {
        fn(newStatus, message);
      } catch (e) {
        console.warn('[SyncClient] Status listener notice:', e);
      }
    });
  }

  /**
   * Connect to the WebSocket sync channel
   */
  public connect() {
    const config = getNetworkConfig();

    // 1. In Local Mode: The application runs self-contained without needing a remote socket
    if (config.mode === 'local') {
      this.disconnect();
      this.setStatus('connected', 'Mode Local Autonome');
      return;
    }

    // 2. Clean up any existing connection
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 3. Detect cloud preview sandbox (where external WSS to Cloud Run is restricted by auth iframe proxy)
    const isCloudPreview = typeof window !== 'undefined' &&
      (window.location.hostname.includes('.run.app') || window.location.hostname.includes('google'));

    if (isCloudPreview && config.mode === 'server') {
      this.setStatus('connected', 'Serveur Cloud Actif');
      return;
    }

    this.setStatus('connecting', 'Connexion au serveur en cours...');
    const wsUrl = getWebSocketUrl(config);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected', 'Connecté au serveur');

        if (this.currentUser) {
          this.sendPresence(this.currentUser);
        }

        // Start ping interval
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(JSON.stringify({ type: 'ping' }));
            } catch (e) {
              // Ignore ping send failures
            }
          }
        }, 15000);
      };

      this.ws.onmessage = (evt) => {
        try {
          const message: SyncEvent = JSON.parse(evt.data);
          if (message.type === 'pong') return;

          // Dispatch mutation to listeners
          this.mutationListeners.forEach((fn) => {
            try {
              fn(message);
            } catch (err) {
              console.warn('[SyncClient] Mutation listener notice:', err);
            }
          });
        } catch (err) {
          console.warn('[SyncClient] Parse notice:', err);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.setStatus('disconnected', 'Connexion au serveur perdue');
        this.scheduleReconnect();
      };

      this.ws.onerror = (_evt) => {
        // WebSocket error events in browser contain no details (isTrusted: true).
        // Treat as normal connectivity notice rather than a fatal unhandled error.
        console.warn('[SyncClient] Serveur WebSocket momentanément indisponible');
        this.setStatus('disconnected', 'Serveur en attente de connexion');
      };
    } catch (err: any) {
      console.warn('[SyncClient] Connection attempt notice:', err?.message || err);
      this.setStatus('disconnected', err?.message || 'Impossible de joindre le serveur');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const config = getNetworkConfig();
    if (config.mode === 'local') return; // Don't reconnect in local mode

    const delay = Math.min(1500 * Math.pow(1.5, this.reconnectAttempts), 20000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    const config = getNetworkConfig();
    this.setStatus(config.mode === 'local' ? 'connected' : 'disconnected');
  }

  public sendPresence(user: AppUser) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(
        JSON.stringify({
          type: 'sync:presence',
          sender: {
            userId: user.id,
            userName: user.fullName,
            role: user.role,
          },
        })
      );
    } catch (e) {
      // ignore
    }
  }

  /**
   * Broadcast a mutation from the current client to other PCs and browser tabs
   */
  public broadcastMutation(entity: string, action: 'create' | 'update' | 'delete' | 'refresh', data: any) {
    const message: SyncEvent = {
      type: 'sync:mutation',
      entity,
      action,
      data,
      sender: {
        userId: this.currentUser?.id,
        userName: this.currentUser?.fullName,
        role: this.currentUser?.role,
      },
      timestamp: new Date().toISOString(),
    };

    // 1. Broadcast locally across browser tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (e) {
        // ignore
      }
    }

    // 2. Broadcast across LAN via WebSocket if active
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (e) {
        // ignore
      }
    }
  }

  // ==========================================
  // HTTP REST API METHODS
  // ==========================================

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.currentUser) {
      headers['X-User-Role'] = this.currentUser.role || 'user';
      headers['X-User-Id'] = this.currentUser.id || 'anon';
      headers['X-User-Name'] = encodeURIComponent(this.currentUser.fullName || '');
    }
    const config = getNetworkConfig();
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }
    return headers;
  }

  public async fetchCollection<T>(collectionName: string): Promise<T | null> {
    const baseUrl = getBaseApiUrl();
    try {
      const res = await fetch(`${baseUrl}/api/data/${collectionName}`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[SyncClient] Failed to fetch collection '${collectionName}':`, err);
      return null;
    }
  }

  public async saveItem<T = any>(collectionName: string, item: any): Promise<{ success: boolean; item?: T; error?: string }> {
    const baseUrl = getBaseApiUrl();
    try {
      const method = item.id ? 'PUT' : 'POST';
      const endpoint = item.id ? `${baseUrl}/api/data/${collectionName}/${item.id}` : `${baseUrl}/api/data/${collectionName}`;

      const res = await fetch(endpoint, {
        method,
        headers: this.getAuthHeaders(),
        body: JSON.stringify(item),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || `Erreur ${res.status}` };
      }
      return { success: true, item: json.item };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau' };
    }
  }

  public async deleteItem(collectionName: string, id: string): Promise<{ success: boolean; error?: string }> {
    const baseUrl = getBaseApiUrl();
    try {
      const res = await fetch(`${baseUrl}/api/data/${collectionName}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || `Erreur ${res.status}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau' };
    }
  }

  public async saveBatch<T = any>(collectionName: string, items: T[]): Promise<{ success: boolean; error?: string }> {
    const baseUrl = getBaseApiUrl();
    try {
      const res = await fetch(`${baseUrl}/api/data/batch/${collectionName}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || `Erreur ${res.status}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau' };
    }
  }

  public async authenticateByPin(pin: string): Promise<{ success: boolean; user?: AppUser; token?: string; error?: string }> {
    const baseUrl = getBaseApiUrl();
    try {
      const res = await fetch(`${baseUrl}/api/auth/pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Identifiants invalides' };
      }
      return { success: true, user: json.user, token: json.token };
    } catch (err: any) {
      return { success: false, error: err.message || 'Impossible de joindre le serveur' };
    }
  }

  public async uploadMigrationData(payload: any): Promise<{ success: boolean; stats?: any; error?: string }> {
    const baseUrl = getBaseApiUrl();
    try {
      const res = await fetch(`${baseUrl}/api/migrate/import-local`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Erreur d\'importation' };
      }
      return { success: true, stats: json.stats };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau' };
    }
  }
}

export const syncClient = new SyncClient();
