/**
 * Safe local storage wrapper with in-memory fallback.
 * Prevents Uncaught DOMException / SecurityError in sandboxed iframes or restricted environments.
 */

const memoryFallback: Record<string, string> = {};

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const storageAvailable = isLocalStorageAvailable();

export function safeGetItem(key: string): string | null {
  if (storageAvailable) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      // Fall through to memory
    }
  }
  return memoryFallback[key] ?? null;
}

export function safeSetItem(key: string, value: string): void {
  if (storageAvailable) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Fall through to memory
    }
  }
  memoryFallback[key] = value;
}

export function safeRemoveItem(key: string): void {
  if (storageAvailable) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // Fall through to memory
    }
  }
  delete memoryFallback[key];
}
