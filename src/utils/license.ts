import { LicenseInfo, LicenseType } from '../types';
import { safeGetItem, safeSetItem, safeRemoveItem } from './safeStorage';

const LICENSE_STORAGE_KEY = 'medicab_license_v1';
const LAST_SEEN_KEY = '__eaccess_last_ts';
const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Generate a deterministic Machine ID based on browser/system attributes
 */
export function getMachineId(): string {
  let stored = safeGetItem('medicab_machine_id');
  if (!stored) {
    const nav = typeof window !== 'undefined' ? window.navigator : { userAgent: 'Browser', language: 'fr' };
    const screenDims = typeof screen !== 'undefined' && screen ? `${screen.width}x${screen.height}` : '1920x1080';
    const str = `${nav.userAgent || 'UA'}-${nav.language || 'fr'}-${screenDims}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    stored = `MC-${hex.substring(0, 4)}-${hex.substring(4, 8)}-4100`;
    safeSetItem('medicab_machine_id', stored);
  }
  return stored;
}

/**
 * Generate or retrieve a unique Client ID permanently linked to the Machine ID
 */
export function getClientId(machineId?: string): string {
  const mId = machineId || getMachineId();
  let stored = safeGetItem('medicab_client_id');
  if (!stored) {
    const salt = 'MEDICAB_CLIENT_ID_SALT_2026';
    const raw = `${mId.trim().toUpperCase()}_${salt}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    stored = `CLI-${hex.substring(0, 4)}-${hex.substring(4, 8)}-8800`;
    safeSetItem('medicab_client_id', stored);
  }
  return stored;
}

/**
 * Dual-key salt-based checksum generator using BOTH Client ID and Machine ID
 */
export function generateActivationCode(clientId: string, machineId: string, type: LicenseType): string {
  const secretSalt = 'MEDICAB_SECRET_2026_DUAL_KEY_VAULT';
  const cleanClient = clientId.trim().toUpperCase();
  const cleanMachine = machineId.trim().toUpperCase();
  const raw = `${cleanClient}::${cleanMachine}::${type.toUpperCase()}::${secretSalt}`;
  
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const posHash = Math.abs(hash);
  const codeSegment1 = posHash.toString(36).toUpperCase().padStart(5, 'X').substring(0, 5);
  
  let reverseHash = 0;
  for (let i = raw.length - 1; i >= 0; i--) {
    const char = raw.charCodeAt(i);
    reverseHash = (reverseHash << 3) - reverseHash + char;
    reverseHash |= 0;
  }
  const posRev = Math.abs(reverseHash);
  const codeSegment2 = posRev.toString(36).toUpperCase().padStart(5, 'Y').substring(0, 5);
  
  const prefixMap: Record<LicenseType, string> = {
    trial: 'TRL',
    permanent: 'PRM'
  };

  return `${prefixMap[type]}-${codeSegment1}-${codeSegment2}`;
}

export function verifyActivationCode(clientId: string, machineId: string, code: string): { isValid: boolean; type?: LicenseType } {
  const cleanCode = code.trim().toUpperCase();
  const types: LicenseType[] = ['permanent'];

  for (const t of types) {
    const expected = generateActivationCode(clientId, machineId, t);
    if (cleanCode === expected) {
      return { isValid: true, type: t };
    }
  }

  return { isValid: false };
}

function createTrialLicense(machineId: string, clientId: string, installDate = new Date().toISOString()): LicenseInfo {
  return {
    machineId,
    clientId,
    cabinetName: 'Cabinet Médical',
    installDate,
    trialDays: TRIAL_DURATION_DAYS,
    isActivated: false,
    licenseType: 'trial',
  };
}

/**
 * Load the local trial/license state and keep the machine identity stable.
 */
export function loadLicenseInfo(): LicenseInfo {
  const machineId = getMachineId();
  const clientId = getClientId(machineId);

  const rawMain = safeGetItem(LICENSE_STORAGE_KEY);
  if (!rawMain) {
    const initial = createTrialLicense(machineId, clientId);
    saveLicenseInfo(initial);
    safeSetItem(LAST_SEEN_KEY, initial.installDate);
    return initial;
  }

  try {
    const data: LicenseInfo = JSON.parse(rawMain);
    data.machineId = machineId;
    data.clientId = clientId;

    if (data.isActivated && data.activationCode) {
      const verification = verifyActivationCode(clientId, machineId, data.activationCode);
      if (!verification.isValid || verification.type !== 'permanent') {
        data.isActivated = false;
        data.licenseType = 'trial';
        data.activationCode = undefined;
      } else {
        data.licenseType = 'permanent';
      }
    } else if (!data.isActivated || data.licenseType !== 'permanent') {
      data.isActivated = false;
      data.licenseType = 'trial';
      data.trialDays = TRIAL_DURATION_DAYS;
    }

    if (!data.installDate) {
      data.installDate = new Date().toISOString();
    }

    const now = Date.now();
    const lastSeen = Number(safeGetItem(LAST_SEEN_KEY) || 0);
    if (lastSeen > now && !data.isActivated) {
      data.installDate = new Date(lastSeen).toISOString();
    }
    if (now > lastSeen) {
      safeSetItem(LAST_SEEN_KEY, String(now));
    }

    saveLicenseInfo(data);
    return data;
  } catch (e) {
    const reset = createTrialLicense(machineId, clientId);
    saveLicenseInfo(reset);
    safeSetItem(LAST_SEEN_KEY, reset.installDate);
    return reset;
  }
}

export function saveLicenseInfo(info: LicenseInfo): void {
  safeSetItem(LICENSE_STORAGE_KEY, JSON.stringify(info));
}

export function resetLocalLicense(): void {
  safeRemoveItem(LICENSE_STORAGE_KEY);
  safeRemoveItem('medicab_machine_id');
  safeRemoveItem('medicab_client_id');
}

export interface LicenseStatus {
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  statusText: string;
}

export function getLicenseStatus(info: LicenseInfo): LicenseStatus {
  if (info.isActivated && info.licenseType === 'permanent') {
    return {
      isExpired: false,
      daysRemaining: 9999,
      hoursRemaining: 99999,
      statusText: 'Licence Permanente Activée',
    };
  }

  const elapsedMs = Math.max(0, Date.now() - new Date(info.installDate).getTime());
  const remainingMs = Math.max(0, TRIAL_DURATION_MS - elapsedMs);
  const isExpired = remainingMs <= 0;
  const hoursRemaining = Math.ceil(remainingMs / (60 * 60 * 1000));
  const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  return {
    isExpired,
    daysRemaining,
    hoursRemaining,
    statusText: isExpired
      ? 'Essai expiré - Activation requise'
      : `Version d'essai - ${daysRemaining} jour${daysRemaining === 1 ? '' : 's'} restant${daysRemaining === 1 ? '' : 's'}`,
  };
}

