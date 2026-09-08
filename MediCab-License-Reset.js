/**
 * MediCab Standalone Developer Utility: MediCab-License-Reset
 * 
 * Clears local license storage, trial information, and activation codes
 * so MediCab starts fresh with a new 7-day trial.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('========================================');
console.log(' MediCab License Reset Utility');
console.log('========================================\n');

// Determine Electron / App local storage paths on Windows
const appName = 'medicab-desktop';
let roamingDir = '';

if (process.platform === 'win32') {
  roamingDir = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
} else {
  // macOS / Linux fallback
  roamingDir = path.join(os.homedir(), '.config', appName);
}

console.log(`Checking app data directory: ${roamingDir}`);

if (fs.existsSync(roamingDir)) {
  try {
    // Local storage levels or config json files
    const files = fs.readdirSync(roamingDir);
    let clearedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(roamingDir, file);
      // Remove Local Storage or JSON config files related to license
      if (file.includes('Local Storage') || file.includes('config') || file.endsWith('.json')) {
        console.log(`Clearing: ${file}`);
        // If directory, clean recursively or delete
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        clearedCount++;
      }
    });

    console.log(`\n[SUCCESS] Cleared ${clearedCount} license/storage items.`);
    console.log('MediCab will start with a fresh 7-day trial on next launch.');
  } catch (err) {
    console.error('[ERROR] Failed to clear app data:', err.message);
  }
} else {
  console.log('[INFO] No AppData directory found yet. Local storage might be in browser/Vite dev mode.');
}

console.log('\nDone.');
