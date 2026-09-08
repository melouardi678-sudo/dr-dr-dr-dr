import os from 'os';

export interface LocalNetworkInterface {
  name: string;
  address: string;
  netmask: string;
  family: string;
  mac: string;
}

/**
 * Get all active IPv4 local network addresses (LAN / Wi-Fi / Ethernet)
 */
export function getLocalIpAddresses(): LocalNetworkInterface[] {
  const interfaces = os.networkInterfaces();
  const results: LocalNetworkInterface[] = [];

  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    for (const iface of list) {
      // We only care about IPv4 and non-internal (not 127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        results.push({
          name,
          address: iface.address,
          netmask: iface.netmask,
          family: iface.family,
          mac: iface.mac,
        });
      }
    }
  }

  return results;
}

/**
 * Get the best primary LAN IP address (e.g. 192.168.x.x, 10.x.x.x, 172.16.x.x)
 */
export function getPrimaryLocalIp(): string {
  const ips = getLocalIpAddresses();
  if (ips.length === 0) return '127.0.0.1';

  // Prioritize 192.168.* as standard medical clinic LAN
  const preferred192 = ips.find((i) => i.address.startsWith('192.168.'));
  if (preferred192) return preferred192.address;

  // Next 10.* or 172.*
  const preferredPrivate = ips.find(
    (i) => i.address.startsWith('10.') || i.address.startsWith('172.')
  );
  if (preferredPrivate) return preferredPrivate.address;

  return ips[0].address;
}
