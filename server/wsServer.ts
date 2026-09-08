import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface ConnectedClientInfo {
  id: string;
  ip: string;
  role?: string;
  userName?: string;
  clientType: 'doctor' | 'secretary' | 'client' | 'admin';
  connectedAt: string;
  lastPing: number;
}

export interface SyncMessage {
  type: 'sync:mutation' | 'sync:full' | 'sync:presence' | 'sync:alert' | 'ping' | 'pong';
  entity?: string;
  action?: 'create' | 'update' | 'delete' | 'refresh';
  data?: any;
  sender?: {
    userId?: string;
    userName?: string;
    role?: string;
  };
  timestamp?: string;
}

export class MediCabWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients = new Map<WebSocket, ConnectedClientInfo>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public initialize(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: '/api/ws' });

    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      const clientIp = req.socket.remoteAddress || 'unknown';
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const clientInfo: ConnectedClientInfo = {
        id: clientId,
        ip: clientIp,
        clientType: 'client',
        connectedAt: new Date().toISOString(),
        lastPing: Date.now(),
      };

      this.clients.set(ws, clientInfo);
      console.log(`[WebSocket] Client connected: ${clientId} (${clientIp}) - Total clients: ${this.clients.size}`);

      // Send initial welcome/handshake message
      ws.send(
        JSON.stringify({
          type: 'sync:presence',
          status: 'connected',
          clientId,
          activeClientsCount: this.clients.size,
          timestamp: new Date().toISOString(),
        })
      );

      // Broadcast updated presence to all clients
      this.broadcastPresence();

      ws.on('message', (messageRaw: string | Buffer) => {
        try {
          const message: SyncMessage = JSON.parse(messageRaw.toString());
          clientInfo.lastPing = Date.now();

          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            return;
          }

          if (message.type === 'sync:presence' && message.sender) {
            clientInfo.role = message.sender.role;
            clientInfo.userName = message.sender.userName;
            clientInfo.clientType = (message.sender.role === 'secretary' ? 'secretary' : 'doctor') as any;
            this.broadcastPresence();
            return;
          }

          // If it's a mutation message, broadcast it to all other connected clients
          if (message.type === 'sync:mutation') {
            this.broadcast(message, ws);
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message from client:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected: ${clientId} - Remaining: ${this.clients.size}`);
        this.broadcastPresence();
      });

      ws.on('error', (err) => {
        console.error(`[WebSocket] Error for client ${clientId}:`, err.message);
        this.clients.delete(ws);
      });
    });

    // Heartbeat check every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [ws, info] of this.clients.entries()) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.ping();
          } catch (e) {
            ws.terminate();
            this.clients.delete(ws);
          }
        } else if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          this.clients.delete(ws);
        }
      }
    }, 30000);

    console.log('[WebSocket] MediCab WebSocket Server initialized on /api/ws');
  }

  /**
   * Broadcast message to all connected clients (optionally excluding the sender)
   */
  public broadcast(message: SyncMessage, excludeWs?: WebSocket) {
    if (!this.wss) return;
    const payload = JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    });

    for (const [clientWs] of this.clients.entries()) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.send(payload);
        } catch (err) {
          console.error('[WebSocket] Failed to send to client:', err);
        }
      }
    }
  }

  /**
   * Send active presence count and user list
   */
  public broadcastPresence() {
    const activeList = Array.from(this.clients.values()).map((c) => ({
      id: c.id,
      ip: c.ip,
      userName: c.userName || 'Poste Connecté',
      role: c.role || 'client',
      clientType: c.clientType,
      connectedAt: c.connectedAt,
    }));

    const message: SyncMessage = {
      type: 'sync:presence',
      data: {
        totalConnected: activeList.length,
        clients: activeList,
      },
      timestamp: new Date().toISOString(),
    };

    if (this.wss) {
      const payload = JSON.stringify(message);
      for (const [ws] of this.clients.entries()) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(payload);
          } catch (e) {}
        }
      }
    }
  }

  public getConnectedClients(): ConnectedClientInfo[] {
    return Array.from(this.clients.values());
  }

  public close() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.wss) this.wss.close();
  }
}

export const wsSyncServer = new MediCabWebSocketServer();
