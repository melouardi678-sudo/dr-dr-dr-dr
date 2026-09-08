import React, { useState } from 'react';
import { Download, Terminal, Check, Copy, FileCode, Monitor, X, Apple } from 'lucide-react';
import { Logo } from './Logo';

interface ExeBuilderGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExeBuilderGuideModal: React.FC<ExeBuilderGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'win' | 'mac'>('win');

  if (!isOpen) return null;

  const electronPackageSnippetWin = `{
  "name": "e-access-web-desktop",
  "version": "2.4.0",
  "main": "electron/main.js",
  "scripts": {
    "build:exe": "vite build && electron-builder --win nsis"
  },
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^24.13.0"
  }
}`;

  const electronPackageSnippetMac = `{
  "name": "e-access-web-desktop",
  "version": "2.4.0",
  "main": "electron/main.js",
  "scripts": {
    "build:mac": "vite build && electron-builder --mac dmg"
  },
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^24.13.0"
  }
}`;

  const electronMainSnippet = `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 800,
    title: 'E-ACCESS WEB - Medical Software Solutions',
    icon: path.join(__dirname, process.platform === 'darwin' ? '../public/icon.png' : '../public/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // Load built index.html for production offline desktop app
  win.loadFile(path.join(__dirname, '../dist/index.html'));
  win.removeMenu(); // Clean desktop header
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <Logo variant="icon" size={36} themeMode="dark" />
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-wide">E-ACCESS WEB</h3>
              <p className="text-[11px] text-sky-400 font-medium">Créateur d'Application Bureau — Windows (.exe) & macOS (.app / .dmg)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setPlatform('win')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              platform === 'win'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Windows (.EXE)
          </button>
          <button
            onClick={() => setPlatform('mac')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              platform === 'mac'
                ? 'bg-sky-500 text-slate-950 shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Apple className="w-4 h-4" />
            macOS Apple (MacBook / iMac)
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {platform === 'win' ? (
            <>
              <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl text-xs text-blue-200 flex items-start space-x-2">
                <Download className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>E-ACCESS WEB</strong> est conçu avec une architecture hors-ligne 100% autonome. Vous pouvez générer un installateur <strong>E-Access-Web-Setup.exe</strong> en 2 commandes.
                </span>
              </div>

              {/* Windows Steps */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Commandes de Compilation Windows</span>
                  </h4>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1">
                    <div># 1. Installer Electron pour Windows</div>
                    <div className="text-white">npm install -D electron electron-builder</div>
                    <div className="pt-2 text-slate-500"># 2. Générer l'exécutable .EXE dans le dossier dist_electron/</div>
                    <div className="text-white">npx electron-builder --win nsis</div>
                  </div>
                </div>

                {/* Electron main.js snippet */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>Fichier <code className="text-emerald-400 font-mono">electron/main.js</code></span>
                    </h4>
                    <button
                      onClick={() => copyToClipboard(electronMainSnippet, 'main')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1"
                    >
                      {copiedScript === 'main' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript === 'main' ? 'Copié' : 'Copier script'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                    {electronMainSnippet}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* macOS Guide */}
              <div className="p-3 bg-sky-950/60 border border-sky-800 rounded-xl text-xs text-sky-200 flex items-start space-x-2">
                <Apple className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Application Native pour Mac (macOS Sonoma / Ventura / Sequoia) :</strong>
                  Vous avez deux options simples : la méthode ultra-rapide <strong>Safari "Ajouter au Dock"</strong> (recommandée, 10 secondes sans compilation), ou la création d'un installateur <strong>.DMG</strong> avec Electron.
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Option 1: Safari Dock */}
                <div className="p-4 bg-slate-950 rounded-xl border border-sky-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                      <Apple className="w-3.5 h-3.5 text-sky-400" />
                      Option Recommandée : Transformer en App Mac via Safari (10 secondes)
                    </span>
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[10px] font-bold">Sans code</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                    <li>Ouvrez <strong>Safari</strong> sur le Mac.</li>
                    <li>Ouvrez MEDICAB (ex: <code className="text-emerald-400">http://localhost:3000</code> ou l'adresse du cabinet).</li>
                    <li>Dans la barre de menus macOS (en haut à gauche de l'écran), cliquez sur <strong>Fichier &gt; Ajouter au Dock...</strong></li>
                    <li>Cliquez sur <strong>Ajouter</strong>.</li>
                  </ol>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ L'application se lance désormais depuis le Dock comme une véritable application Apple avec sa propre icône et sa fenêtre sans barre d'URL !
                  </p>
                </div>

                {/* Option 2: Electron DMG */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Option Complète : Compiler un fichier .DMG pour Mac</span>
                  </h4>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-sky-300 space-y-1">
                    <div># 1. Installer Electron sur votre Mac</div>
                    <div className="text-white">npm install -D electron electron-builder</div>
                    <div className="pt-2 text-slate-500"># 2. Générer l'installateur .DMG (compatible Intel & Apple Silicon M1/M2/M3/M4)</div>
                    <div className="text-white">npx electron-builder --mac dmg --universal</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
