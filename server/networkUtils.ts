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
    // Ignore loopback, VPN, virtual, and peer-to-peer adapters. They can expose
    // a private IP that is not reachable by another device on the clinic LAN.
    const normalizedName = name.toLowerCase();
    const isVirtualAdapter = /^(utun|awdl|llw|bridge|docker|veth|virbr|vmnet|vboxnet|tailscale|tun|tap)/.test(normalizedName)
      || normalizedName.includes('virtual');
    if (isVirtualAdapter) continue;

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

  // macOS normally exposes Wi-Fi as en0 and Ethernet as en1. Prefer these
  // physical adapters before applying the generic private-network rules.
  const physicalMacIp = ips.find((iface) => iface.name === 'en0' || iface.name === 'en1');
  if (physicalMacIp) return physicalMacIp.address;

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
