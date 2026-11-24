const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = app.isPackaged && process.resourcesPath
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '.env');
dotenv.config({ path: envPath });

let mainWindow;

function setupNativeMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [{
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
            { role: 'quit', label: 'Quitter MediCab' },
          ],
        }]
      : []),
    {
      label: 'Fichier',
      submenu: [isMac ? { role: 'close', label: 'Fermer la fenêtre' } : { role: 'quit', label: 'Quitter' }],
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
        { role: 'selectAll', label: 'Tout sélectionner' },
      ],
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
        { role: 'togglefullscreen', label: 'Plein écran' },
      ],
    },
    {
      label: 'Fenêtre',
      submenu: [
        { role: 'minimize', label: 'Réduire' },
        { role: 'zoom', label: 'Agrandir' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front', label: 'Tout ramener au premier plan' }, { type: 'separator' }, { role: 'window', label: 'Fenêtre' }]
          : [{ role: 'close', label: 'Fermer' }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function getAppIconPath() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const candidates = [
    path.join(__dirname, 'build', iconName),
    path.join(__dirname, 'public', iconName),
    path.join(__dirname, 'public', 'icon.png'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function getPrintPageSize(pageSize) {
  return pageSize === 'A5' ? { width: 148000, height: 210000 } : { width: 210000, height: 297000 };
}

async function createWindow() {
  process.env.NODE_ENV = 'production';
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Le serveur intégré est introuvable : ${serverPath}`);
  }

  const serverModule = require(serverPath);
  if (!serverModule || typeof serverModule.startServer !== 'function') {
    throw new Error('Le point de démarrage du serveur intégré est manquant.');
  }

  const server = await serverModule.startServer();
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Le serveur local n’a pas fourni de port valide.');
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#090d16',
    icon: getAppIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`[Electron] Navigation failed for ${url} (${code}: ${description})`);
  });

  await mainWindow.loadURL(`http://127.0.0.1:${address.port}`);
}

function restoreMainWindowFocus(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  if (targetWindow.isMinimized()) {
    targetWindow.restore();
  }
  targetWindow.focus();
  if (targetWindow.webContents && !targetWindow.webContents.isDestroyed()) {
    targetWindow.webContents.focus();
  }
}

function closePrintWindowSafely(printWindow) {
  if (printWindow && !printWindow.isDestroyed()) {
    try {
      printWindow.destroy();
    } catch {
      // تجاهل أي خطأ أثناء الإغلاق
    }
  }
}

function createPrintHtmlWindow(html, parentWindow) {
  const printWindow = new BrowserWindow({
    show: false,
    width: 794,
    height: 1123,
    parent: parentWindow && !parentWindow.isDestroyed() ? parentWindow : undefined,
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const encodedHtml = Buffer.from(html, 'utf8').toString('base64');
  printWindow.loadURL(`data:text/html;base64,${encodedHtml}`);

  return printWindow;
}

function waitForPrintWindow(win, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!win || win.isDestroyed()) {
      reject(new Error('Print window destroyed'));
      return;
    }

    let settled = false;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(arg);
    };

    const timer = setTimeout(() => {
      finish(resolve);
    }, timeoutMs);

    const onLoaded = () => {
      // مهلة قصيرة جداً لضمان اكتمال رسم الخطوط والعناصر
      setTimeout(() => finish(resolve), 150);
    };

    if (!win.webContents.isLoading()) {
      onLoaded();
    } else {
      win.webContents.once('did-finish-load', onLoaded);
      win.webContents.once('did-fail-load', (_event, code, description) => {
        finish(reject, new Error(`${description} (${code})`));
      });
    }
  });
}

function triggerWebContentsPrint(webContents, printOptions) {
  return new Promise((resolve, reject) => {
    if (!webContents || webContents.isDestroyed()) {
      reject(new Error('Invalid webContents for printing'));
      return;
    }

    try {
      webContents.print(printOptions, (success, failureReason) => {
        if (!success && failureReason && failureReason !== 'cancelled') {
          reject(new Error(failureReason));
          return;
        }
        resolve({ success, failureReason });
      });
    } catch (err) {
      reject(err);
    }
  });
}

ipcMain.handle('print-document', async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  try {
    if (!win || win.isDestroyed()) {
      throw new Error('No active window found for printing');
    }
    const result = await triggerWebContentsPrint(win.webContents, {
      silent: false,
      printBackground: true,
      ...(options || {}),
    });
    restoreMainWindowFocus(win);
    return { success: true, ...result };
  } catch (err) {
    restoreMainWindowFocus(win);
    console.error('Print error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('print-html-document', async (event, options) => {
  let printWindow = null;
  const parentWindow = BrowserWindow.fromWebContents(event.sender);

  try {
    printWindow = createPrintHtmlWindow(options?.html || '<!doctype html>', parentWindow);
    await waitForPrintWindow(printWindow);

    const result = await triggerWebContentsPrint(printWindow.webContents, {
      silent: false,
      printBackground: true,
      pageSize: getPrintPageSize(options?.pageSize),
      margins: { marginType: 'none' },
    });

    closePrintWindowSafely(printWindow);
    restoreMainWindowFocus(parentWindow);
    return { success: true, ...result };
  } catch (err) {
    closePrintWindowSafely(printWindow);
    restoreMainWindowFocus(parentWindow);
    console.error('HTML print error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-html-pdf', async (event, options = {}) => {
  let printWindow = null;
  const parentWindow = BrowserWindow.fromWebContents(event.sender);

  try {
    const { filePath, canceled } = await dialog.showSaveDialog(parentWindow, {
      title: 'Exporter en PDF',
      defaultPath: path.join(app.getPath('documents'), options.filename || 'Document_Medical.pdf'),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { success: false, canceled: true };

    printWindow = createPrintHtmlWindow(options.html || '<!doctype html>', parentWindow);
    await waitForPrintWindow(printWindow);
    const pdfData = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: getPrintPageSize(options.pageSize),
      margins: { top: 0.3, bottom: 0.3, left: 0.3, right: 0.3 },
    });
    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
  } catch (err) {
    console.error('HTML PDF export error:', err);
    return { success: false, error: err.message };
  } finally {
    closePrintWindowSafely(printWindow);
    restoreMainWindowFocus(parentWindow);
  }
});

ipcMain.handle('excel-open-dialog', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Sélectionner un fichier Excel',
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) return { success: false, canceled: true };

    const filePath = filePaths[0];
    return {
      success: true,
      filePath,
      fileName: path.basename(filePath),
      data: fs.readFileSync(filePath).toString('base64'),
    };
  } catch (err) {
    console.error('Excel open dialog error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('excel-save-dialog', async (event, { defaultFilename, base64Data } = {}) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Enregistrer le fichier Excel',
      defaultPath: path.join(app.getPath('documents'), defaultFilename || 'Patients_MediCab.xlsx'),
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
    });
    if (canceled || !filePath) return { success: false, canceled: true };

    fs.writeFileSync(filePath, Buffer.from(base64Data || '', 'base64'));
    return { success: true, filePath };
  } catch (err) {
    console.error('Excel save dialog error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-pdf', async (event, options = {}) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) throw new Error('No active window found for PDF export');

    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Exporter en PDF',
      defaultPath: path.join(app.getPath('documents'), options.filename || 'Document_Medical.pdf'),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { success: false, canceled: true };

    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      landscape: options.landscape || false,
      pageSize: getPrintPageSize(options.pageSize),
    });
    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
  } catch (err) {
    console.error('Export PDF error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.minimize();
  return { success: true };
});

ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
  return { success: true };
});

ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.close();
  return { success: true };
});

app.whenReady().then(async () => {
  setupNativeMenu();
  try {
    await createWindow();
  } catch (err) {
    console.error('Application startup error:', err);
    dialog.showErrorBox('Erreur de démarrage', `Impossible de démarrer MediCab.\n\n${err.message}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((err) => {
        console.error('Application restart error:', err);
        dialog.showErrorBox('Erreur de démarrage', `Impossible de démarrer MediCab.\n\n${err.message}`);
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});