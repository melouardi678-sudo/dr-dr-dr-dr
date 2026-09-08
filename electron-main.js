const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

// Load .env safely both in development and in production (process.resourcesPath)
const envPath = app.isPackaged && process.resourcesPath 
  ? path.join(process.resourcesPath, '.env') 
  : path.join(__dirname, '.env');
dotenv.config({ path: envPath });

let mainWindow;

function setupNativeMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name || 'MediCab',
            submenu: [
              { role: 'about', label: 'À propos de MediCab' },
              { type: 'separator' },
              { role: 'services', label: 'Services' },
              { type: 'separator' },
              { role: 'hide', label: 'Masquer MediCab' },
              { role: 'hideOthers', label: 'Masquer les autres' },
              { role: 'unhide', label: 'Tout afficher' },
              { type: 'separator' },
              { role: 'quit', label: 'Quitter MediCab' }
            ]
          }
        ]
      : []),
    {
      label: 'Fichier',
      submenu: [
        isMac ? { role: 'close', label: 'Fermer la fenêtre' } : { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'forceReload', label: 'Actualiser sans cache' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Taille réelle' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { role: 'minimize', label: 'Réduire' },
        { role: 'zoom', label: 'Agrandir' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front', label: 'Tout ramener au premier plan' },
              { type: 'separator' },
              { role: 'window', label: 'Fenêtre' }
            ]
          : [{ role: 'close', label: 'Fermer' }])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function waitForServer(url, timeout = 4000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - startTime > timeout) {
        resolve(true); // proceed anyway after timeout
      } else {
        setTimeout(check, 250);
      }
    };
    check();
  });
}

function getAppIconPath() {
  const isWin = process.platform === 'win32';
  const iconName = isWin ? 'icon.ico' : 'icon.png';
  const candidates = [
    path.join(__dirname, 'build', iconName),
    path.join(__dirname, 'build', 'icon.png'),
    process.resourcesPath ? path.join(process.resourcesPath, 'build', iconName) : null,
    process.resourcesPath ? path.join(process.resourcesPath, 'resources', 'icons', iconName) : null,
    path.join(__dirname, 'resources', 'icons', iconName),
    path.join(__dirname, 'public', isWin ? 'icon.ico' : 'icon.png'),
    path.join(__dirname, 'public', 'icon.png'),
    path.join(__dirname, 'public', 'favicon.ico'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

async function createWindow() {
  const appIcon = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false, // Critical: Prevents the initial blank white flash
    backgroundColor: '#090d16', // Dark slate background matching app theme
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
    }
  });

  // Smooth window display: Show only when content is ready to paint
  let isWindowVisible = false;
  const showMainWindow = () => {
    if (!isWindowVisible && mainWindow && !mainWindow.isDestroyed()) {
      isWindowVisible = true;
      mainWindow.show();
      mainWindow.focus();
    }
  };

  mainWindow.once('ready-to-show', showMainWindow);
  // Safety timeout: If ready-to-show is delayed, reveal window after 2.5s anyway
  setTimeout(showMainWindow, 2500);

  // Resolve paths safely for development and production packaged apps (asar/app.asar.unpacked/macOS app bundle)
  const localIndexPath = path.join(__dirname, 'dist', 'index.html');
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');

  // Critical WSOD prevention: Catch any navigation failure and fallback to local bundle
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[Electron] Navigation failed for ${validatedURL} (${errorCode}: ${errorDescription})`);
    if (fs.existsSync(localIndexPath) && !validatedURL.startsWith('file:')) {
      console.log('[Electron] Loading local bundled index.html fallback...');
      mainWindow.loadFile(localIndexPath);
    }
  });

  // Start Express & WebSocket sync server in-process
  try {
    if (fs.existsSync(serverPath)) {
      const serverModule = require(serverPath);
      if (serverModule && typeof serverModule.startServer === 'function') {
        await serverModule.startServer();
      }
    } else {
      console.warn('[Electron] server.cjs not found at:', serverPath);
    }
  } catch (err) {
    console.warn('[Electron] Notice on starting local server:', err.message || err);
  }

  // Check if Express server is responding
  const serverReady = await waitForServer('http://127.0.0.1:3000', 4000);

  if (serverReady) {
    mainWindow.loadURL('http://127.0.0.1:3000');
  } else if (fs.existsSync(localIndexPath)) {
    console.log('[Electron] Server port delayed or occupied, loading static bundle directly...');
    mainWindow.loadFile(localIndexPath);
  } else {
    mainWindow.loadURL('http://127.0.0.1:3000');
  }
}

app.whenReady().then(() => {
  setupNativeMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler for Excel Open Dialog
ipcMain.handle('excel-open-dialog', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win || {}, {
      title: 'Sélectionner un fichier Excel',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];
    const fileBuffer = fs.readFileSync(filePath);
    return { 
      success: true, 
      filePath, 
      fileName: path.basename(filePath),
      data: fileBuffer.toString('base64') 
    };
  } catch (err) {
    console.error('Excel open dialog error:', err);
    return { success: false, error: err.message };
  }
});

// IPC Handler for Excel Save Dialog
ipcMain.handle('excel-save-dialog', async (event, { defaultFilename, base64Data }) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { filePath, canceled } = await dialog.showSaveDialog(win || {}, {
      title: 'Enregistrer le fichier Excel',
      defaultPath: path.join(app.getPath('documents'), defaultFilename || 'Patients_MediCab.xlsx'),
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true, filePath };
  } catch (err) {
    console.error('Excel save dialog error:', err);
    return { success: false, error: err.message };
  }
});

// IPC Handler for Print Document
ipcMain.handle('print-document', async (event, options) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      throw new Error('No active window found for printing');
    }
    await win.webContents.print({
      silent: false,
      printBackground: true,
      ...options
    });
    return { success: true };
  } catch (err) {
    console.error('Print error:', err);
    return { success: false, error: err.message };
  }
});

// IPC Handler for Export PDF
ipcMain.handle('export-pdf', async (event, options) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      throw new Error('No active window found for PDF export');
    }

    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Exporter en PDF',
      defaultPath: path.join(app.getPath('documents'), options?.filename || 'Document_Medical.pdf'),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      landscape: options?.landscape || false,
      pageSize: options?.pageSize || 'A4'
    });

    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
  } catch (err) {
    console.error('Export PDF error:', err);
    return { success: false, error: err.message };
  }
});

// Window controls IPC
ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
  return { success: true };
});

ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
  return { success: true };
});

ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
  return { success: true };
});

