import { LicenseInfo } from '../types';
import { safeGetItem, safeSetItem } from './safeStorage';

const LICENSE_STORAGE_KEY = 'medicab_license_v1';
const LAST_SEEN_KEY = '__eaccess_last_ts';
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const ACTIVATION_CODE_HASH = 'fab0d48d4932c4ff171454683fd8834fb5d3bd43c49eb12d63f3d5ecbfaec972';

export function getMachineId(): string {
  let stored = safeGetItem('medicab_machine_id');
  if (!stored) {
    const bytes = new Uint8Array(8);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    stored = `MC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`;
    safeSetItem('medicab_machine_id', stored);
  }
  return stored;
}

export function getClientId(machineId?: string): string {
  const mId = machineId || getMachineId();
  let stored = safeGetItem('medicab_client_id');
  if (!stored) {
    const raw = `${mId.trim().toUpperCase()}_MEDICAB_CLIENT_ID`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    stored = `CLI-${hex.substring(0, 4)}-${hex.substring(4, 8)}-8800`;
    safeSetItem('medicab_client_id', stored);
  }
  return stored;
}

export async function verifyActivationCode(code: string): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return false;
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is unavailable');
  }

  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalizedCode),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return hash === ACTIVATION_CODE_HASH;
}

function createTrialLicense(machineId: string, clientId: string, installDate = new Date().toISOString()): LicenseInfo {
  return {
    machineId,
    clientId,
    cabinetName: 'Cabinet Médical',
    installDate,
    trialDays: 7,
    isActivated: false,
    licenseType: 'trial',
  };
}

export function loadLicenseInfo(): LicenseInfo {
  const machineId = getMachineId();
  const clientId = getClientId(machineId);
  const raw = safeGetItem(LICENSE_STORAGE_KEY);

  if (!raw) {
    const initial = createTrialLicense(machineId, clientId);
    saveLicenseInfo(initial);
    safeSetItem(LAST_SEEN_KEY, String(Date.now()));
    return initial;
  }

  try {
    const saved = JSON.parse(raw) as Partial<LicenseInfo>;
    const savedMachineId = typeof saved.machineId === 'string' ? saved.machineId : machineId;
    const savedClientId = typeof saved.clientId === 'string' ? saved.clientId : clientId;

    if (
      saved.isActivated === true &&
      saved.licenseType === 'permanent' &&
      saved.activationVersion === 2 &&
      saved.activationCodeHash === ACTIVATION_CODE_HASH
    ) {
      return {
        ...saved,
        machineId,
        clientId,
        cabinetName: saved.cabinetName || 'Cabinet Médical',
        installDate: saved.installDate || new Date().toISOString(),
        trialDays: 0,
        isActivated: true,
        licenseType: 'permanent',
        activationCodeHash: ACTIVATION_CODE_HASH,
        activationVersion: 2,
      };
    }

    if (saved.isActivated === false && saved.licenseType === 'trial' && saved.installDate) {
      return {
        ...createTrialLicense(machineId, clientId, saved.installDate),
        cabinetName: saved.cabinetName || 'Cabinet Médical',
      };
    }

    const migratedTrial = createTrialLicense(savedMachineId, savedClientId);
    saveLicenseInfo(migratedTrial);
    safeSetItem(LAST_SEEN_KEY, String(Date.now()));
    return migratedTrial;
  } catch {
    const resetTrial = createTrialLicense(machineId, clientId);
    saveLicenseInfo(resetTrial);
    safeSetItem(LAST_SEEN_KEY, String(Date.now()));
    return resetTrial;
  }
}

export function saveLicenseInfo(info: LicenseInfo): void {
  safeSetItem(LICENSE_STORAGE_KEY, JSON.stringify(info));
}

export interface LicenseStatus {
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  statusText: string;
}

export function getLicenseStatus(info: LicenseInfo): LicenseStatus {
  if (
    info.isActivated &&
    info.licenseType === 'permanent' &&
    info.activationVersion === 2 &&
    info.activationCodeHash === ACTIVATION_CODE_HASH
  ) {
    return {
      isExpired: false,
      daysRemaining: 9999,
      hoursRemaining: 99999,
      statusText: 'Licence permanente activée',
    };
  }

  const now = Date.now();
  const installTime = Date.parse(info.installDate);
  const lastSeen = Number(safeGetItem(LAST_SEEN_KEY));
  const clockMovedBackwards = Number.isFinite(lastSeen) && lastSeen > 0 && now < lastSeen;
  safeSetItem(LAST_SEEN_KEY, String(Number.isFinite(lastSeen) ? Math.max(lastSeen, now) : now));

  const remainingMs = Number.isFinite(installTime)
    ? installTime + TRIAL_DURATION_MS - now
    : 0;
  const isExpired = clockMovedBackwards || remainingMs <= 0;
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000)));

  return {
    isExpired,
    daysRemaining,
    hoursRemaining,
    statusText: isExpired
      ? "Période d'essai terminée"
      : `Essai gratuit : ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`,
  };
}
