import { NetworkConfig, NetworkDiagnostics } from '../types';

const NETWORK_CONFIG_KEY = 'medicab_network_config';

const DEFAULT_CONFIG: NetworkConfig = {
  mode: 'local',
  serverIp: '127.0.0.1',
  serverPort: 3000,
  autoDiscovery: true,
};

type NetworkChangeListener = (config: NetworkConfig) => void;
const listeners: Set<NetworkChangeListener> = new Set();

export function getNetworkConfig(): NetworkConfig {
  try {
    const raw = localStorage.getItem(NETWORK_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('[NetworkConfig] Could not parse stored network config:', err);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveNetworkConfig(config: Partial<NetworkConfig>): NetworkConfig {
  const current = getNetworkConfig();
  const updated: NetworkConfig = {
    ...current,
    ...config,
  };

  try {
    localStorage.setItem(NETWORK_CONFIG_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[NetworkConfig] Error saving network config:', err);
  }

  listeners.forEach((fn) => {
    try {
      fn(updated);
    } catch (e) {
      console.error(e);
    }
  });

  return updated;
}

export function subscribeToNetworkConfig(listener: NetworkChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBaseApiUrl(config?: NetworkConfig): string {
  const cfg = config || getNetworkConfig();
  if (cfg.mode === 'client') {
    const cleanIp = cfg.serverIp.trim() || '127.0.0.1';
    const port = cfg.serverPort || 3000;
    return `http://${cleanIp}:${port}`;
  }
  // Local or Server mode uses the actual server port, which may differ from 3000.
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:3000';
}

export function getLocalServerPort(fallbackPort = 3000): number {
  if (typeof window !== 'undefined') {
    const port = Number(window.location.port);
    if (port > 0) return port;
  }
  return fallbackPort;
}

export function getWebSocketUrl(config?: NetworkConfig): string {
  const cfg = config || getNetworkConfig();
  if (cfg.mode === 'client') {
    const cleanIp = cfg.serverIp.trim() || '127.0.0.1';
    const port = cfg.serverPort || 3000;
    return `ws://${cleanIp}:${port}/api/ws`;
  }
  const host = window.location.host;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${host}/api/ws`;
}

/**
 * Ping test to verify if the server is reachable and running MediCab
 */
export async function testServerConnection(
  ip: string,
  port: number = 3000,
  timeoutMs: number = 4000
): Promise<{ ok: boolean; latencyMs: number; cabinetName?: string; error?: string; activeClients?: number }> {
  const cleanIp = ip.trim() || '127.0.0.1';
  const url = `http://${cleanIp}:${port}/api/network/ping`;
  const startTime = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        latencyMs,
        cabinetName: data.cabinetName,
        activeClients: data.activeClients,
      };
    } else {
      return {
        ok: false,
        latencyMs,
        error: `Erreur HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return {
        ok: false,
        latencyMs,
        error: 'Délai d\'attente dépassé (Timeout). Vérifiez que le PC Médecin est allumé et que le pare-feu autorise le port ' + port,
      };
    }
    return {
      ok: false,
      latencyMs,
      error: 'Impossible de joindre le serveur. Vérifiez l\'adresse IP et la connexion Wi-Fi/LAN.',
    };
  }
}

export interface ServerNetworkInfo {
  primaryIp: string;
  primaryMac?: string;
  interfaceName?: string;
  netmask?: string;
  hostname?: string;
  bonjourHostname?: string;
  bonjourUrl?: string;
  platform?: string;
  isMac?: boolean;
  port: number;
  interfaces: any[];
  connectedClients: number;
  serverStatus: string;
}

/**
 * Fetch server interface details from the server itself
 */
export async function fetchServerNetworkInfo(
  ip?: string,
  port: number = 3000
): Promise<ServerNetworkInfo | null> {
  const cleanIp = (ip || '127.0.0.1').trim();
  const url = `http://${cleanIp}:${port}/api/network/info`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[NetworkConfig] Could not fetch server network info:', err);
  }
  return null;
}

/**
 * Generates PowerShell rule for Windows Firewall to authorize MediCab server port
 */
export function getWindowsFirewallPowershellCommand(port: number = 3000): string {
  return `New-NetFirewallRule -DisplayName "MEDICAB Serveur Cabinet (Port ${port})" -Direction Inbound -LocalPort ${port} -Protocol TCP -Action Allow`;
}

/**
 * Generates PowerShell command to assign static IP on Windows
 */
export function getWindowsStaticIpPowershellCommand(
  ip: string = '192.168.1.100',
  gateway: string = '192.168.1.1',
  interfaceAlias: string = 'Wi-Fi'
): string {
  return `New-NetIPAddress -InterfaceAlias "${interfaceAlias}" -IPAddress "${ip}" -PrefixLength 24 -DefaultGateway "${gateway}" ; Set-DnsClientServerAddress -InterfaceAlias "${interfaceAlias}" -ServerAddresses ("${gateway}","8.8.8.8")`;
}

/**
 * Generates Mac Terminal command to test connection to Doctor's server
 */
export function getMacTerminalCurlCommand(ip: string = '192.168.1.100', port: number = 3000): string {
  return `curl -I http://${ip}:${port}/api/health`;
}

/**
 * Generates Mac Bonjour address
 */
export function getMacBonjourUrl(hostname?: string, port: number = 3000): string {
  if (!hostname) return `http://MacBook-Medecin.local:${port}`;
  const clean = hostname.replace(/\.local$/i, '');
  return `http://${clean}.local:${port}`;
}

