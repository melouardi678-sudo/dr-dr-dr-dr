export const ACTIVATION_CODE_HASH = 'MEDIACAB-11M23-2027-19O92';
import { LicenseInfo, LicenseType } from '../types';
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
export function loadLicenseInfo(): LicenseInfo {
  const machineId = getMachineId();
  const clientId = getClientId(machineId);
  const raw = safeGetItem(LICENSE_STORAGE_KEY);

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
    return initial;
  }

  try {
    const parsedSource = typeof rawMain === 'string' ? rawMain : '';
    const saved = JSON.parse(parsedSource) as Partial<LicenseInfo>;
    const savedMachineId = typeof saved.machineId === 'string' ? saved.machineId : machineId;
    const savedClientId = typeof saved.clientId === 'string' ? saved.clientId : clientId;
    const data: LicenseInfo = {
      ...createTrialLicense(savedMachineId, savedClientId, nowIso),
      ...saved,
      machineId: savedMachineId,
      clientId: savedClientId,
    };

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
  }
}

export function saveLicenseInfo(info: LicenseInfo): void {
  safeSetItem(LICENSE_STORAGE_KEY, JSON.stringify(info));
}

export function resetLocalLicense(): void {
  safeRemoveItem(LICENSE_STORAGE_KEY);
  safeRemoveItem(LAST_SEEN_KEY);
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
  // Always active on Assistant web browser or when permanently activated
  if (isAssistantWebClient() || (info.isActivated && info.licenseType === 'permanent')) {
    return {
      isExpired: false,
      daysRemaining: 9999,
      hoursRemaining: 99999,
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

