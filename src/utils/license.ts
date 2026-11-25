<<<<<<< HEAD
﻿import { LicenseInfo } from '../types';
import { safeGetItem, safeSetItem } from './safeStorage';

const LICENSE_STORAGE_KEY = 'medicab_license_v1';
const LAST_SEEN_KEY = '__eaccess_last_ts';
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const ACTIVATION_CODE_HASH = 'fab0d48d4932c4ff171454683fd8834fb5d3bd43c49eb12d63f3d5ecbfaec972';
=======
﻿import { LicenseInfo, LicenseType } from '../types';
import { safeGetItem, safeSetItem, safeRemoveItem } from './safeStorage';

const LICENSE_STORAGE_KEY = 'medicab_license_v1';
const LAST_SEEN_KEY = '__eaccess_last_ts';
const MASTER_PERMANENT_CODE = 'MEDIACAB-11M23-2027-19O92';
const TRIAL_DAYS_DURATION = 7;

/**
 * Detect if the app is opened via a web browser (Assistant / Secretary LAN link)
 * rather than the main Electron desktop application.
 */
function isAssistantWebClient(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = (window.navigator?.userAgent || '').toLowerCase();
  const hasElectronBridge = Boolean((window as any).electronAPI || (window as any).process?.versions?.electron);
  return !ua.includes('electron') && !hasElectronBridge;
}
>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)

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

<<<<<<< HEAD
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
=======
/**
 * Kept for compatibility with KeyGeneratorModal
 */
export function generateActivationCode(_clientId: string, _machineId: string, _type: LicenseType): string {
  return MASTER_PERMANENT_CODE;
}

export function verifyActivationCode(_clientId: string, _machineId: string, code: string): { isValid: boolean; type?: LicenseType } {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode === MASTER_PERMANENT_CODE) {
    return { isValid: true, type: 'permanent' };
  }
  return { isValid: false };
}

function createPermanentLicense(machineId: string, clientId: string, installDate = new Date().toISOString()): LicenseInfo {
>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)
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

<<<<<<< HEAD
=======
function createTrialLicense(machineId: string, clientId: string, installDate = new Date().toISOString()): LicenseInfo {
  const expiry = new Date(new Date(installDate).getTime() + TRIAL_DAYS_DURATION * 24 * 60 * 60 * 1000).toISOString();
  return {
    machineId,
    clientId,
    cabinetName: 'Cabinet Médical',
    installDate,
    expiryDate: expiry,
    trialDays: TRIAL_DAYS_DURATION,
    isActivated: false,
    licenseType: 'trial',
  };
}

/**
 * Load the local trial/license state and keep the machine identity stable.
 */
>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)
export function loadLicenseInfo(): LicenseInfo {
  const machineId = getMachineId();
  const clientId = getClientId(machineId);
  const raw = safeGetItem(LICENSE_STORAGE_KEY);

<<<<<<< HEAD
  if (!raw) {
    const initial = createTrialLicense(machineId, clientId);
    saveLicenseInfo(initial);
    safeSetItem(LAST_SEEN_KEY, String(Date.now()));
=======
  // Assistant link opened via browser on LAN is always permanently activated
  if (isAssistantWebClient()) {
    return createPermanentLicense(machineId, clientId);
  }

  const nowIso = new Date().toISOString();
  const rawMain = safeGetItem(LICENSE_STORAGE_KEY);

  if (!rawMain) {
    const initial = createTrialLicense(machineId, clientId, nowIso);
    saveLicenseInfo(initial);
    safeSetItem(LAST_SEEN_KEY, nowIso);
>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)
    return initial;
  }

  try {
    const saved = JSON.parse(raw) as Partial<LicenseInfo>;
    const savedMachineId = typeof saved.machineId === 'string' ? saved.machineId : machineId;
    const savedClientId = typeof saved.clientId === 'string' ? saved.clientId : clientId;

<<<<<<< HEAD
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
=======
    if (!data.installDate) {
      data.installDate = nowIso;
    }

    if (data.isActivated && data.licenseType === 'permanent') {
      data.trialDays = 0;
      data.expiryDate = undefined;
      saveLicenseInfo(data);
      return data;
    }

    // Track last seen timestamp to prevent clock rollback tampering
    const lastSeenRaw = safeGetItem(LAST_SEEN_KEY);
    if (!lastSeenRaw || new Date(nowIso).getTime() > new Date(lastSeenRaw).getTime()) {
      safeSetItem(LAST_SEEN_KEY, nowIso);
    }

    data.isActivated = false;
    data.licenseType = 'trial';
    data.trialDays = TRIAL_DAYS_DURATION;
    saveLicenseInfo(data);
    return data;
  } catch {
    const reset = createTrialLicense(machineId, clientId, nowIso);
    saveLicenseInfo(reset);
    safeSetItem(LAST_SEEN_KEY, nowIso);
    return reset;
>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)
  }
}

export function saveLicenseInfo(info: LicenseInfo): void {
  safeSetItem(LICENSE_STORAGE_KEY, JSON.stringify(info));
}

<<<<<<< HEAD
=======
export function resetLocalLicense(): void {
  safeRemoveItem(LICENSE_STORAGE_KEY);
  safeRemoveItem(LAST_SEEN_KEY);
  safeRemoveItem('medicab_machine_id');
  safeRemoveItem('medicab_client_id');
}

>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)
export interface LicenseStatus {
  isExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  statusText: string;
}

export function getLicenseStatus(info: LicenseInfo): LicenseStatus {
<<<<<<< HEAD
  if (
    info.isActivated &&
    info.licenseType === 'permanent' &&
    info.activationVersion === 2 &&
    info.activationCodeHash === ACTIVATION_CODE_HASH
  ) {
=======
  // Always active on Assistant web browser or when permanently activated
  if (isAssistantWebClient() || (info.isActivated && info.licenseType === 'permanent')) {
>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)
    return {
      isExpired: false,
      daysRemaining: 9999,
      hoursRemaining: 99999,
<<<<<<< HEAD
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
=======
      statusText: 'Licence Permanente Activée',
    };
  }

  const nowMs = Date.now();
  const lastSeenRaw = safeGetItem(LAST_SEEN_KEY);
  const lastSeenMs = lastSeenRaw ? new Date(lastSeenRaw).getTime() : nowMs;
  const effectiveNowMs = Math.max(nowMs, lastSeenMs);

  const installMs = info.installDate ? new Date(info.installDate).getTime() : effectiveNowMs;
  const expiryMs = installMs + TRIAL_DAYS_DURATION * 24 * 60 * 60 * 1000;
  const remainingMs = expiryMs - effectiveNowMs;

  if (remainingMs <= 0) {
    return {
      isExpired: true,
      daysRemaining: 0,
      hoursRemaining: 0,
      statusText: 'Période d’essai de 7 jours expirée',
    };
  }

  const hoursRemaining = Math.ceil(remainingMs / (1000 * 60 * 60));
  const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  return {
    isExpired: false,
    daysRemaining,
    hoursRemaining,
    statusText: `Essai gratuit (${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''})`,
  };
}
>>>>>>> 39eb84e (Configure macOS build workflow for Apple Silicon and Intel)
