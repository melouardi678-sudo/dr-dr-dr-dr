import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Server,
  Monitor,
  Laptop,
  Wifi,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Send,
  Database,
  Terminal,
  Activity,
  ArrowRight,
  Info,
  Radio,
  Cpu,
  Layers,
  Lock,
  Globe,
  HardDrive,
  Lightbulb,
  Apple,
  Sparkles,
  ExternalLink,
  Bookmark,
  UploadCloud,
  QrCode,
  X,
} from 'lucide-react';
import { NetworkConfig, NetworkMode, ConnectionStatus } from '../types';
import {
  getNetworkConfig,
  saveNetworkConfig,
  testServerConnection,
  fetchServerNetworkInfo,
  getLocalServerPort,
  getWindowsFirewallPowershellCommand,
  getWindowsStaticIpPowershellCommand,
  getMacTerminalCurlCommand,
  getMacBonjourUrl,
  ServerNetworkInfo,
} from '../utils/networkConfig';
import { syncClient } from '../utils/syncClient';
import { syncWithCentralServer, generateFullBackupJSON } from '../utils/storage';

interface NetworkSettingsSectionProps {
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const NetworkSettingsSection: React.FC<NetworkSettingsSectionProps> = ({ onNotify }) => {
  const [config, setConfig] = useState<NetworkConfig>(getNetworkConfig());
  const [serverInfo, setServerInfo] = useState<ServerNetworkInfo | null>(null);

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    latencyMs?: number;
    cabinetName?: string;
    activeClients?: number;
    error?: string;
  } | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(syncClient.getStatus());
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedStaticCmd, setCopiedStaticCmd] = useState(false);
  const [copiedBonjour, setCopiedBonjour] = useState(false);
  const [copiedMacCurl, setCopiedMacCurl] = useState(false);
  const [copiedWebUrl, setCopiedWebUrl] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [firewallTab, setFirewallTab] = useState<'windows' | 'mac'>('windows');
  const [secretaryMacTab, setSecretaryMacTab] = useState<'dock' | 'browser' | 'terminal' | 'doctor-mac'>('dock');
  const [staticGuideTab, setStaticGuideTab] = useState<'router' | 'windows' | 'mac'>('router');
  const [migratingData, setMigratingData] = useState(false);
  const [showMigrationConfirm, setShowMigrationConfirm] = useState(false);

  // Load server details if in server or local mode
  useEffect(() => {
    fetchServerNetworkInfo('127.0.0.1', getLocalServerPort(config.serverPort || 3000)).then((info) => {
      if (info) {
        setServerInfo(info);
      }
    });

    const unsubStatus = syncClient.onStatusChange((st) => {
      setConnectionStatus(st);
    });

    return () => unsubStatus();
  }, [config.serverPort]);

  const handleModeChange = (newMode: NetworkMode) => {
    const updated = saveNetworkConfig({ mode: newMode });
    setConfig(updated);
    setTestResult(null);

    if (newMode === 'client') {
      syncClient.connect();
    } else if (newMode === 'server') {
      syncClient.connect();
      fetchServerNetworkInfo('127.0.0.1', getLocalServerPort(updated.serverPort)).then((inf) => inf && setServerInfo(inf));
    } else {
      syncClient.disconnect();
    }

    if (onNotify) {
      const modeNames = {
        local: 'Mode Local (Monoposte autonome)',
        server: 'Mode Serveur (PC Médecin Principal)',
        client: 'Mode Client (PC Secrétaire)',
      };
      onNotify(`Configuration réseau mise à jour : ${modeNames[newMode]}`, 'info');
    }
  };

  const handleSaveClientConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveNetworkConfig({
      serverIp: config.serverIp.trim(),
      serverPort: Number(config.serverPort) || 3000,
    });
    setConfig(updated);
    handleTestConnection();
  };

  const getEffectiveServerPort = () => (
    config.mode === 'client'
      ? (config.serverPort || 3000)
      : (serverInfo?.port || getLocalServerPort(config.serverPort || 3000))
  );

  const getEffectiveServerIp = () => (
    config.mode === 'client'
      ? (config.serverIp || '127.0.0.1')
      : (serverInfo?.primaryIp || '127.0.0.1')
  );

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const targetIp = config.mode === 'client' ? config.serverIp : '127.0.0.1';
    const targetPort = config.mode === 'client'
      ? (config.serverPort || 3000)
      : getLocalServerPort(config.serverPort || 3000);

    const res = await testServerConnection(targetIp, targetPort);
    setTestingConnection(false);
    setTestResult({
      tested: true,
      ok: res.ok,
      latencyMs: res.latencyMs,
      cabinetName: res.cabinetName,
      activeClients: res.activeClients,
      error: res.error,
    });

    if (res.ok) {
      syncClient.connect();
      if (onNotify) onNotify('Connexion au serveur établie avec succès !', 'success');
    } else if (onNotify) {
      onNotify(res.error || 'Échec de la connexion au serveur', 'error');
    }
  };

  const handleSyncNow = async () => {
    setSyncingData(true);
    setSyncResult(null);
    try {
      const res = await syncWithCentralServer();
      if (res.success) {
        const statsSummary = Object.entries(res.stats)
          .map(([k, v]) => `${v} ${k}`)
          .slice(0, 4)
          .join(', ');
        setSyncResult(`Synchronisation réussie (${statsSummary})`);
        if (onNotify) onNotify('Données synchronisées avec la base centrale', 'success');
      } else {
        setSyncResult('Impossible de synchroniser. Vérifiez la connexion réseau.');
      }
    } catch (err: any) {
      setSyncResult(`Erreur: ${err.message}`);
    } finally {
      setSyncingData(false);
    }
  };

  const handleMigrateLocalDataToServer = () => {
    setShowMigrationConfirm(true);
  };

  const confirmMigrateLocalDataToServer = async () => {
    setShowMigrationConfirm(false);
    setMigratingData(true);
    try {
      const fullLocalJSON = generateFullBackupJSON();
      const parsed = JSON.parse(fullLocalJSON);
      const res = await syncClient.uploadMigrationData(parsed);
      if (res.success) {
        if (onNotify) onNotify('Données locales fusionnées avec succès dans la base centrale !', 'success');
      } else {
        if (onNotify) onNotify(res.error || 'Erreur lors de la migration', 'error');
      }
    } catch (e: any) {
      if (onNotify) onNotify(e.message, 'error');
    } finally {
      setMigratingData(false);
    }
  };

  const copyFirewallRule = () => {
    const cmd = getWindowsFirewallPowershellCommand(config.serverPort || 3000);
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
    if (onNotify) onNotify('Commande PowerShell Pare-feu copiée dans le presse-papier', 'success');
  };

  const copyServerIp = () => {
    const ip = serverInfo?.primaryIp || '192.168.1.100';
    navigator.clipboard.writeText(ip);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2500);
    if (onNotify) onNotify('Adresse IP copiée dans le presse-papier', 'info');
  };

  const copyServerMac = () => {
    const mac = serverInfo?.primaryMac || '00:1A:2B:3C:4D:5E';
    navigator.clipboard.writeText(mac);
    setCopiedMac(true);
    setTimeout(() => setCopiedMac(false), 2500);
    if (onNotify) onNotify(`Adresse MAC copiée : ${mac} (utile pour le routeur)`, 'success');
  };

  const copyStaticIpPowershell = () => {
    const ip = serverInfo?.primaryIp || '192.168.1.100';
    const cmd = getWindowsStaticIpPowershellCommand(ip, '192.168.1.1', serverInfo?.interfaceName || 'Wi-Fi');
    navigator.clipboard.writeText(cmd);
    setCopiedStaticCmd(true);
    setTimeout(() => setCopiedStaticCmd(false), 3000);
    if (onNotify) onNotify('Commande PowerShell IP Statique copiée !', 'success');
  };

  const copyBonjourUrl = () => {
    const url = serverInfo?.bonjourUrl || getMacBonjourUrl(serverInfo?.hostname, getEffectiveServerPort());
    navigator.clipboard.writeText(url);
    setCopiedBonjour(true);
    setTimeout(() => setCopiedBonjour(false), 2500);
    if (onNotify) onNotify('Lien Mac / Bonjour copié dans le presse-papier !', 'info');
  };

  const copyMacCurlCmd = () => {
    const cmd = getMacTerminalCurlCommand(getEffectiveServerIp(), getEffectiveServerPort());
    navigator.clipboard.writeText(cmd);
    setCopiedMacCurl(true);
    setTimeout(() => setCopiedMacCurl(false), 2500);
    if (onNotify) onNotify('Commande Terminal macOS copiée !', 'info');
  };

  const getAssistantWebUrl = () => {
    const ip = getEffectiveServerIp();
    const port = getEffectiveServerPort();
    return `http://${ip}:${port}`;
  };

  const copyWebUrl = () => {
    const url = getAssistantWebUrl();
    navigator.clipboard.writeText(url);
    setCopiedWebUrl(true);
    setTimeout(() => setCopiedWebUrl(false), 2500);
    if (onNotify) onNotify(`رابط اتصال المساعد تم نسخه : ${url}`, 'success');
  };

  const shareWhatsApp = () => {
    const url = getAssistantWebUrl();
    const message = `مرحباً، هادا هو رابط الاتصال ببرنامج MediCab على شبكة الـ Wi-Fi للعيادة :\n\n${url}\n\nقم بفتحه في متصفح Chrome أو Safari على حاسوب المساعد بدون الحاجة لأي تثبيت.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* PROMINENT ASSISTANT WEB CONNECTION CARD */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-sky-950/90 border-2 border-emerald-500/60 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40 shrink-0 mt-0.5">
              <Globe className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white">
                  🌐 رابط الاتصال المباشر بحاسوب المساعد (بدون تثبيت)
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-black rounded-full text-[10px] shadow">
                  ✓ يعمل على نفس الـ Wi-Fi
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-arabic mt-1 leading-relaxed" dir="rtl">
                يمكن للمساعد فتح البرنامج مباشرة من أي متصفح (Chrome, Safari, Edge) على حاسوبه أو هاتفه دون الحاجة لتثبيت أي شيء ولا يتعارض مع أي برنامج آخر.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300">الخادم محلي يعمل جاهز</span>
          </div>
        </div>

        {/* Main URL Box & Action Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* IP Address URL */}
          <div className="lg:col-span-8 bg-slate-950/90 p-3.5 rounded-xl border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                رابط المتصفح لحاسوب المساعد (انسخه والصقه في متصفح المساعد) :
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Port {config.serverPort || 3000}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getAssistantWebUrl()}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 font-mono font-black text-sm select-all shadow-inner tracking-wide"
              />
              <button
                type="button"
                onClick={copyWebUrl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg shrink-0"
              >
                {copiedWebUrl ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedWebUrl ? 'تم النسخ !' : 'نسخ الرابط'}
              </button>
            </div>
          </div>

          {/* Share Actions */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex-1 py-2 px-3 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-emerald-600/50 transition shadow"
            >
              <Send className="w-3.5 h-3.5 text-emerald-300" />
              <span>إرسال عبر واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="flex-1 py-2 px-3 bg-sky-800/80 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-sky-600/50 transition shadow"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-300" />
              <span>عرض رمز QR للربط</span>
            </button>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center">
                1
              </span>
              <span>الربط بنفس الويفي</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              تأكد أن بيسي المساعد متصل بنفس شبكة الـ Wi-Fi مع بيسي الطبيب.
            </p>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-black text-[11px] flex items-center justify-center">
                2
              </span>
              <span>فتح المتصفح فقط</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              افتح Chrome أو Safari على بيسي المساعد وألصق الرابط أعلاه.
            </p>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black text-[11px] flex items-center justify-center">
                3
              </span>
              <span>تسجيل الدخول الفوري</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              ادخل كود PIN للمساعد (الافتراضي: 5678) للعمل المباشر ومزامنة المرضى فورا!
            </p>
          </div>
        </div>
      </div>

      {/* Top Banner with Architecture overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Architecture Réseau Local & Multi-Postes
                  <span className="text-xs font-normal text-slate-400 font-arabic">(شبكة العيادة المحلية)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Permet de faire fonctionner MEDICAB simultanément sur le PC du Médecin et le PC de la Secrétaire
                </p>
              </div>
            </div>
          </div>

          {/* Top Status Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Statut :</span>
              {config.mode === 'local' ? (
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Mode Local (Monoposte)
                </span>
              ) : connectionStatus === 'connected' ? (
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-700/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connecté au Serveur
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-950 text-rose-400 rounded-full text-xs font-semibold border border-rose-700/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Serveur Déconnecté
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mode Selector Cards (3 options) */}
        <div className="pt-6">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Sélectionner le Rôle de cet Ordinateur :
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. SERVER (Doctor) */}
            <button
              type="button"
              onClick={() => handleModeChange('server')}
              className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                config.mode === 'server'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${config.mode === 'server' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Server className="w-5 h-5" />
                  </div>
                  {config.mode === 'server' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Sélectionné
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">PC Médecin (Serveur Principal)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Héberge la base de données centrale. Fournit les données à la secrétaire via le réseau local du cabinet.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center text-[11px] text-emerald-400 font-medium">
                Base centrale active sur ce PC
              </div>
            </button>

            {/* 2. CLIENT (Secretary) */}
            <button
              type="button"
              onClick={() => handleModeChange('client')}
              className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                config.mode === 'client'
                  ? 'bg-sky-950/40 border-sky-500 shadow-lg ring-2 ring-sky-500/20 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${config.mode === 'client' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Laptop className="w-5 h-5" />
                  </div>
                  {config.mode === 'client' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Sélectionné
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">PC Secrétaire (Poste Client)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Se connecte au PC du médecin via le réseau local. Utilise et met à jour les données du médecin en direct.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center text-[11px] text-sky-400 font-medium">
                Aucune base locale • Connexion LAN
              </div>
            </button>

            {/* 3. LOCAL (Standalone) */}
            <button
              type="button"
              onClick={() => handleModeChange('local')}
              className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                config.mode === 'local'
                  ? 'bg-amber-950/30 border-amber-500 shadow-lg ring-2 ring-amber-500/20 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${config.mode === 'local' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  {config.mode === 'local' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Sélectionné
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">Mode Local (Autonome)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fonctionnement classique sur un seul ordinateur sans partage réseau. Vos données restent uniquement sur ce PC.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center text-[11px] text-amber-400 font-medium">
                100% hors-ligne indépendant
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL VIEW BASED ON MODE */}

      {/* 1. PC MÉDECIN (SERVEUR) CONFIGURATION */}
      {config.mode === 'server' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Paramètres du Serveur Local Médecin
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                  Serveur : ACTIF
                </span>
              </div>

              {/* IP, MAC and Port display */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-4">
                {/* 1. Primary IP */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Adresse IP Locale pour le PC Secrétaire :
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">IPv4 Cabinet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={serverInfo?.primaryIp || '192.168.1.100'}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-sm select-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={copyServerIp}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                    >
                      {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedIp ? 'Copié !' : 'Copier IP'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    👉 Donnez cette adresse IP à votre secrétaire pour la saisir sur son PC.
                  </p>
                </div>

                {/* 1.bis. Mac / Bonjour Direct Address (Ideal when Secretary has a Mac) */}
                <div className="pt-2 border-t border-slate-800/80 bg-sky-950/20 -mx-4 px-4 py-3 border-y border-sky-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Apple className="w-3.5 h-3.5 text-sky-400" />
                      Lien Direct Mac / Bonjour (mDNS) pour la Secrétaire :
                    </label>
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[10px] font-bold border border-sky-500/30">
                      🍏 للمساعد لي عندو ماك (Apple)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={serverInfo?.bonjourUrl || `http://${(serverInfo?.hostname || 'MacBook-Medecin').replace(/\.local$/i, '')}.local:${getEffectiveServerPort()}`}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sky-300 font-mono font-bold text-xs select-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={copyBonjourUrl}
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                    >
                      {copiedBonjour ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedBonjour ? 'Copié !' : 'Copier Lien Mac'}
                    </button>
                  </div>
                  <p className="text-[11px] text-sky-200/90 mt-1 font-arabic" dir="rtl">
                    🍏 <strong>ميزة الماك الاستثنائية :</strong> بما أن المساعد عندو ماك، يقدر يفتح هاد الرابط مباشرة فـ Safari أو Chrome بلا ما يحتاج يعرف رقم الـ IP وما كيتبدلش نهائياً حتى لو طفى الروتر!
                  </p>
                </div>

                {/* 2. Physical MAC Address (Crucial for Router DHCP Reservation) */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      Adresse MAC Physique de cette Machine :
                    </label>
                    <span className="text-[10px] text-amber-300/80 font-arabic font-normal">
                      (الـ MAC ديال البيسي لحجز الـ IP فـ الروتر)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={serverInfo?.primaryMac || '00:1A:2B:3C:4D:5E'}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs select-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={copyServerMac}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                    >
                      {copiedMac ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedMac ? 'Copié !' : 'Copier MAC'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    💡 Adresse matérielle unique permettant de fixer définitivement l'IP dans le routeur de la clinique.
                  </p>
                </div>

                {/* 3. Hostname and Interface details */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Nom du Poste (Hostname) :</span>
                    <span className="text-slate-200 font-mono font-bold">{serverInfo?.hostname || 'PC-DOCTEUR'}</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Carte Réseau Active :</span>
                    <span className="text-slate-200 font-bold truncate block">{serverInfo?.interfaceName || 'Ethernet / Wi-Fi'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Port d'écoute :
                    </label>
                    <input
                      type="number"
                      value={config.serverPort || 3000}
                      onChange={(e) => setConfig({ ...config, serverPort: Number(e.target.value) || 3000 })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Postes connectés :
                    </label>
                    <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold flex items-center justify-between">
                      <span>Clients actifs :</span>
                      <span className="text-emerald-400 font-mono">{serverInfo?.connectedClients ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Test Server Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-2"
                  >
                    {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    Tester le Serveur
                  </button>
                </div>

                {/* Test Feedback */}
                {testResult?.tested && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.ok
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">
                        {testResult.ok ? '✓ Serveur local opérationnel et joignable' : '✕ Erreur de joignabilité'}
                      </p>
                      {testResult.latencyMs && (
                        <p className="text-[11px] opacity-80">Temps de réponse : {testResult.latencyMs} ms</p>
                      )}
                      {testResult.error && <p className="text-[11px] mt-0.5">{testResult.error}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Data migration to central server */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-white font-bold text-xs">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span>Synchroniser ou Migrer vers la Base Centrale</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleMigrateLocalDataToServer}
                    disabled={migratingData}
                    className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {migratingData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Migrer données locales
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Si vous avez des patients déjà enregistrés sur ce PC, cette action les intègre de manière sécurisée dans la base centrale du serveur sans écraser l'existant.
                </p>
              </div>
            </div>
          </div>

          {/* Windows / macOS Firewall & Instructions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Autorisation Pare-feu / Coupe-feu
                </h3>
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFirewallTab('windows')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      firewallTab === 'windows' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Windows
                  </button>
                  <button
                    type="button"
                    onClick={() => setFirewallTab('mac')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                      firewallTab === 'mac' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Apple className="w-3 h-3" />
                    macOS
                  </button>
                </div>
              </div>

              {firewallTab === 'windows' ? (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pour que le PC de la secrétaire puisse communiquer avec ce PC sans être bloqué par Windows Defender, le port TCP {config.serverPort || 3000} doit être autorisé.
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-slate-300">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        Commande PowerShell (Admin) :
                      </span>
                      <button
                        type="button"
                        onClick={copyFirewallRule}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                      >
                        {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCmd ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                    <div className="p-2 bg-slate-900 rounded text-slate-200 break-all select-all border border-slate-800">
                      {getWindowsFirewallPowershellCommand(config.serverPort || 3000)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
                    <p className="font-bold text-slate-200">Comment appliquer en 15 secondes :</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Cliquez sur [ Copier ] ci-dessus.</li>
                      <li>Ouvrez PowerShell en tant qu'Administrateur sur Windows.</li>
                      <li>Collez la commande (Ctrl+V) et appuyez sur Entrée.</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl text-sky-200 flex items-start gap-2">
                    <Apple className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Coupe-feu Apple macOS :</strong>
                      macOS gère la sécurité par application. Si une fenêtre vous demande d'autoriser les connexions entrantes pour l'application, cliquez sur <strong>Autoriser</strong>.
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                    <p className="font-bold text-slate-200">Pour vérifier dans les Réglages Système Mac :</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Menu <strong>Pomme  &gt; Réglages Système &gt; Réseau</strong>.</li>
                      <li>Cliquez sur <strong>Coupe-feu (Firewall)</strong> puis sur <strong>Options...</strong>.</li>
                      <li>Vérifiez que l'option <em>"Bloquer toutes les connexions entrantes"</em> est <strong>désactivée</strong>.</li>
                      <li>Vérifiez que MEDICAB est bien réglé sur <em>"Autoriser les connexions entrantes"</em>.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CRITICAL TECH TIP: FIX IP / STATIC IP & ROUTER DHCP RESERVATION GUIDE */}
          <div className="lg:col-span-12">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Title and Badge */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30 shrink-0 mt-0.5">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        Recommandation Réseau Cruciale : Fixer l'Adresse IP du PC Médecin (IP Statique)
                      </h3>
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[11px] font-bold border border-amber-500/40 uppercase tracking-wider">
                        ⭐ Essentiel pour la stabilité
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/80 font-arabic mt-1 font-medium text-right md:text-left" dir="rtl">
                      نصيحة تقنية مهمة: خاصك تفكسي الـ IP (تدير IP Statique / Fixe) للماك ديال الطبيب فـ إعدادات الـ Router ديال العيادة، باش الـ IP ما يتغيرش كل ما طفى الماك ولا تشعل الروتر، ويبقى الربط خدام ديماً بلا انقطاع.
                    </p>
                  </div>
                </div>
              </div>

              {/* Problem Explanation Card */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Pourquoi devez-vous fixer l'adresse IP de cet ordinateur ? (علاش خاصك تفكسي الـ IP ؟)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Par défaut, votre routeur Wi-Fi (Maroc Telecom Fibre, Inwi, Orange, Box 4G, TP-Link...) utilise le mode <strong>DHCP dynamique</strong>. 
                  Si cet ordinateur s'éteint ou si l'électricité se coupe, le routeur peut lui attribuer une nouvelle adresse IP (par exemple <code className="text-rose-400 bg-slate-900 px-1 py-0.5 rounded">192.168.1.108</code> au lieu de <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">192.168.1.100</code>). 
                  Résultat : la secrétaire perdra la connexion jusqu'à ce qu'elle saisisse le nouveau numéro IP.
                </p>
                <p className="text-emerald-400 font-semibold text-[11px] pt-1">
                  ✓ En fixant l'adresse IP (Bail DHCP statique ou IP fixe système), le lien entre le médecin et la secrétaire devient <strong>permanent, indestructible et 100% stable</strong> même après 100 coupures de courant !
                </p>
              </div>

              {/* Interactive Tabs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setStaticGuideTab('router')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      staticGuideTab === 'router'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Option 1 : Réservation DHCP dans le Routeur (الأفضل والأسهل)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaticGuideTab('windows')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      staticGuideTab === 'windows'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    Option 2 : IP Fixe sous Windows (PowerShell / Manuel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaticGuideTab('mac')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      staticGuideTab === 'mac'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    Option 3 : IP Fixe sous macOS (Apple Mac)
                  </button>
                </div>

                {/* TAB 1: ROUTER DHCP RESERVATION (RECOMMENDED) */}
                {staticGuideTab === 'router' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Méthode 1 (Recommandée) : Lier l'adresse MAC physique à l'IP dans la Box / Routeur
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono">DHCP Static Lease / MAC Binding</span>
                    </div>

                    {/* Quick copy bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          1. Adresse MAC de ce PC Médecin :
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-amber-400 font-mono font-bold text-xs select-all flex-1 truncate">
                            {serverInfo?.primaryMac || '00:1A:2B:3C:4D:5E'}
                          </span>
                          <button
                            type="button"
                            onClick={copyServerMac}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            {copiedMac ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedMac ? 'Copié' : 'Copier'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          2. Adresse IP à fixer définitivement :
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-xs select-all flex-1 truncate">
                            {serverInfo?.primaryIp || '192.168.1.100'}
                          </span>
                          <button
                            type="button"
                            onClick={copyServerIp}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedIp ? 'Copié' : 'Copier'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-step instructions */}
                    <div className="space-y-2 text-xs text-slate-300 leading-relaxed pt-1">
                      <p className="font-bold text-slate-100">Étapes simples dans votre Box / Routeur :</p>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                        <li>
                          Ouvrez votre navigateur et accédez à l'adresse de votre routeur :{' '}
                          <code className="text-sky-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">http://192.168.1.1</code>{' '}
                          ou <code className="text-sky-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">http://192.168.0.1</code>.
                        </li>
                        <li>
                          Connectez-vous avec les identifiants du routeur (généralement <code className="text-amber-300 font-mono">admin</code> et le mot de passe inscrit sur l'étiquette au dos de votre routeur Maroc Telecom / Inwi / Orange).
                        </li>
                        <li>
                          Allez dans le menu <strong>LAN / Réseau Local</strong> &gt; <strong>DHCP Server (Serveur DHCP)</strong> &gt; <strong>Static IP Lease</strong> (ou <strong>Réservation d'adresses / IP & MAC Binding</strong>).
                        </li>
                        <li>
                          Cliquez sur <strong>Ajouter / Add New</strong> : collez l'<strong>Adresse MAC</strong> copiée ci-dessus et attribuez l'adresse IP <code className="text-emerald-400 font-mono font-bold">{serverInfo?.primaryIp || '192.168.1.100'}</code>.
                        </li>
                        <li>
                          Cliquez sur <strong>Enregistrer / Sauvegarder</strong>. Votre routeur réservera désormais cette même IP à vie pour le PC du médecin !
                        </li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* TAB 2: WINDOWS STATIC IP */}
                {staticGuideTab === 'windows' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Méthode 2 : Fixer l'adresse IP directement dans Windows
                    </span>

                    {/* Method A: PowerShell Command */}
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5" />
                          Option Express : Commande PowerShell Administrateur (en 1 clic)
                        </span>
                        <button
                          type="button"
                          onClick={copyStaticIpPowershell}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 transition"
                        >
                          {copiedStaticCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedStaticCmd ? 'Copié !' : 'Copier Commande'}
                        </button>
                      </div>
                      <div className="p-2 bg-slate-950 rounded text-slate-200 font-mono text-[10px] break-all select-all border border-slate-800/80">
                        {getWindowsStaticIpPowershellCommand(
                          serverInfo?.primaryIp || '192.168.1.100',
                          '192.168.1.1',
                          serverInfo?.interfaceName || 'Wi-Fi'
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Ouvrez PowerShell en tant qu'Administrateur, collez la commande et appuyez sur Entrée.
                      </p>
                    </div>

                    {/* Method B: GUI Steps */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                      <p className="font-bold text-slate-100">Ou via l'interface Windows (Méthode Manuelle) :</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Appuyez sur <kbd className="px-1 bg-slate-800 rounded text-[10px]">Windows + R</kbd>, tapez <code className="text-amber-300 font-mono">ncpa.cpl</code> et appuyez sur Entrée.</li>
                        <li>Clic droit sur votre carte réseau (<strong className="text-white">{serverInfo?.interfaceName || 'Wi-Fi / Ethernet'}</strong>) &gt; <strong>Propriétés</strong>.</li>
                        <li>Double-cliquez sur <strong>Protocole Internet version 4 (TCP/IPv4)</strong>.</li>
                        <li>Cochez <strong>Utiliser l'adresse IP suivante</strong> et renseignez :
                          <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 font-mono text-[10px] text-slate-200">
                            <li>Adresse IP : <span className="text-emerald-400">{serverInfo?.primaryIp || '192.168.1.100'}</span></li>
                            <li>Masque de sous-réseau : <span className="text-sky-300">{serverInfo?.netmask || '255.255.255.0'}</span></li>
                            <li>Passerelle par défaut : <span className="text-amber-300">192.168.1.1</span></li>
                            <li>Serveurs DNS : <span className="text-slate-300">192.168.1.1</span> et <span className="text-slate-300">8.8.8.8</span></li>
                          </ul>
                        </li>
                        <li>Cliquez sur <strong>OK</strong> pour appliquer.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* TAB 3: MACOS STATIC IP */}
                {staticGuideTab === 'mac' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200 text-xs text-slate-300">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-sky-400" />
                      Méthode 3 : Fixer l'adresse IP sous macOS (Apple Mac)
                    </span>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
                      <li>Ouvrez le menu <strong>Pomme  &gt; Réglages Système</strong> (ou Préférences Système).</li>
                      <li>Dans la barre latérale, cliquez sur <strong>Réseau</strong>.</li>
                      <li>Sélectionnez votre connexion active (<strong>Wi-Fi</strong> ou <strong>Ethernet</strong>), puis cliquez sur <strong>Détails...</strong>.</li>
                      <li>Cliquez sur l'onglet <strong>TCP/IP</strong> à gauche.</li>
                      <li>Dans le menu déroulant <strong>Configurer IPv4</strong>, passez de <em>Via DHCP</em> à <strong>Manuellement</strong>.</li>
                      <li>Saisissez les valeurs :
                        <div className="p-2.5 my-1.5 bg-slate-900 rounded-lg font-mono text-[10px] space-y-0.5 border border-slate-800">
                          <div>• Adresse IPv4 : <strong className="text-emerald-400">{serverInfo?.primaryIp || '192.168.1.100'}</strong></div>
                          <div>• Masque de sous-réseau : <strong className="text-sky-300">255.255.255.0</strong></div>
                          <div>• Routeur : <strong className="text-amber-300">192.168.1.1</strong></div>
                        </div>
                      </li>
                      <li>Cliquez sur <strong>OK</strong> puis <strong>Appliquer</strong>. Votre Mac conservera toujours cette IP fixe !</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PC SECRÉTAIRE (CLIENT) CONFIGURATION */}
      {config.mode === 'client' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSaveClientConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-sky-400" />
                  Connexion au Serveur du Médecin
                </h3>
                {connectionStatus === 'connected' ? (
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Connecté
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 rounded-full text-xs font-bold border border-rose-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Non connecté
                  </span>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Adresse IP ou Nom Bonjour du PC Médecin * :
                    </label>
                    <span className="text-[10px] text-sky-400 font-medium flex items-center gap-1">
                      <Apple className="w-3 h-3" />
                      Supporte IP & Mac (.local)
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="ex: 192.168.1.100 ou MacBook-Medecin.local"
                    value={config.serverIp}
                    onChange={(e) => {
                      const cleanVal = e.target.value.trim().replace(/^https?:\/\//i, '').split(':')[0];
                      setConfig({ ...config, serverIp: cleanVal });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-sky-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Saisissez l'adresse IP (ex: <code className="text-emerald-400">192.168.1.100</code>) ou l'adresse Mac Bonjour (ex: <code className="text-sky-300">MacBook-Medecin.local</code>) affichée sur le poste du Dr. Karim BENALI.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Port du Serveur :
                    </label>
                    <input
                      type="number"
                      required
                      value={config.serverPort || 3000}
                      onChange={(e) => setConfig({ ...config, serverPort: Number(e.target.value) || 3000 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs font-bold"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      type="submit"
                      disabled={testingConnection}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-2"
                    >
                      {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                      Tester la Connexion
                    </button>
                  </div>
                </div>

                {/* Test Feedback Details */}
                {testResult?.tested && (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      testResult.ok
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {testResult.ok ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Connexion Réussie au Cabinet Médical</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>Impossible de joindre le PC Médecin</span>
                        </>
                      )}
                    </div>

                    {testResult.ok ? (
                      <div className="space-y-1 text-[11px] pt-1 border-t border-emerald-500/30">
                        <p>✓ <strong>Serveur trouvé :</strong> {config.serverIp}:{config.serverPort}</p>
                        <p>✓ <strong>Cabinet :</strong> {testResult.cabinetName || 'Cabinet Médical'}</p>
                        <p>✓ <strong>Base de données accessible</strong> (Latence : {testResult.latencyMs} ms)</p>
                        <p className="text-emerald-400 font-bold pt-1">
                          ➔ La secrétaire peut maintenant travailler en temps réel et utiliser son code PIN.
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] space-y-1 pt-1 border-t border-rose-500/30">
                        <p className="font-semibold">{testResult.error}</p>
                        <p className="opacity-80">
                          Assurez-vous que le PC du médecin est allumé, que les deux PC sont sur le même Wi-Fi/réseau, et que le pare-feu du médecin autorise le port {config.serverPort}.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sync Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={syncingData}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-2 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingData ? 'animate-spin text-sky-400' : ''}`} />
                  Actualiser les données maintenant
                </button>
                {syncResult && <span className="text-[11px] text-emerald-400 font-medium">{syncResult}</span>}
              </div>
            </form>
          </div>

          {/* Secretary instructions card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Info className="w-4 h-4 text-sky-400" />
                Guide du Poste Secrétaire
              </h3>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    1
                  </div>
                  <p>
                    <strong>Même Réseau Local :</strong> Le PC du médecin et le PC de la secrétaire doivent être reliés au même routeur Wi-Fi ou câble Ethernet du cabinet.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    2
                  </div>
                  <p>
                    <strong>Saisie de l'Adresse IP :</strong> Entrez l'adresse IP du médecin et cliquez sur <em>Tester la Connexion</em>.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    3
                  </div>
                  <p>
                    <strong>Connexion par PIN Secrétaire :</strong> Utilisez votre code PIN habituel (ex: 5678). Toutes les actions que vous saisissez (nouveaux rendez-vous, paiements) apparaissent instantanément chez le médecin.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <strong className="text-sky-300">Sécurité des dossiers médicaux :</strong>
                <p className="mt-1">
                  Les consultations détaillées et les suppressions de dossiers restent strictement réservées au médecin administrateur.
                </p>
              </div>

              {/* IP Stability advice for secretary */}
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>En cas de déconnexion après coupure électrique :</span>
                </div>
                <p className="leading-relaxed">
                  Si la connexion s'interrompt après que le routeur ou le PC du médecin a redémarré, vérifiez si l'adresse IP du médecin a changé. 
                  Pour éviter cela de manière définitive, appliquez la fixation d'IP statique (Bail DHCP) sur le PC du médecin.
                </p>
              </div>
            </div>
          </div>

          {/* SPECIAL SECTION: SECRETARY ON APPLE MAC */}
          <div className="lg:col-span-12">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border-2 border-sky-500/40 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/30 shrink-0 mt-0.5">
                    <Apple className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        🍏 Guide Dédié : Le Poste Secrétaire est sur Apple Mac (macOS)
                      </h3>
                      <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 rounded-full text-[11px] font-bold border border-sky-500/40 uppercase tracking-wider">
                        MacBook / iMac / Mac mini
                      </span>
                    </div>
                    <p className="text-xs text-sky-200/90 font-arabic mt-1 font-medium text-right md:text-left" dir="rtl">
                      دليل تشغيل وربط جهاز المساعد (الماك) مع عيادة MEDICAB بدون أي تعقيد، وبأعلى درجات الاستقرار والسرعة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSecretaryMacTab('dock')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      secretaryMacTab === 'dock'
                        ? 'bg-sky-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    1. Ajouter au Dock macOS (App Mac Autonome)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSecretaryMacTab('doctor-mac')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      secretaryMacTab === 'doctor-mac'
                        ? 'bg-sky-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    2. Duo 100% Mac (Docteur Mac + Secrétaire Mac)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSecretaryMacTab('browser')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      secretaryMacTab === 'browser'
                        ? 'bg-sky-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    3. Accès Direct Safari / Chrome
                  </button>

                  <button
                    type="button"
                    onClick={() => setSecretaryMacTab('terminal')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      secretaryMacTab === 'terminal'
                        ? 'bg-sky-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    4. Test Terminal macOS (1 Clic)
                  </button>
                </div>

                {/* TAB CONTENT 1: ADD TO DOCK */}
                {secretaryMacTab === 'dock' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Bookmark className="w-4 h-4 text-sky-400" />
                      <span>Transformer MEDICAB en véritable Application Mac dans le Dock (Sans rien installer !)</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sous macOS (Sonoma, Ventura, Sequoia), Safari permet de transformer instantanément n'importe quel serveur local en <strong>application Mac indépendante</strong>.
                      La secrétaire aura son icône MEDICAB dans son Dock Apple, s'ouvrant dans sa propre fenêtre sans barres de navigation Safari !
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Safari Steps */}
                      <div className="p-4 bg-slate-900 rounded-xl border border-sky-500/20 space-y-2.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-sky-300">
                          <Apple className="w-4 h-4" />
                          <span>Méthode Recommandée : Via Safari (Mac)</span>
                        </div>
                        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                          <li>Ouvrez <strong>Safari</strong> sur le Mac de la secrétaire.</li>
                          <li>Accédez à l'adresse du médecin : <code className="text-emerald-400 font-mono">http://{config.serverIp || '192.168.1.100'}:{config.serverPort || 3000}</code></li>
                          <li>Dans la barre de menus tout en haut de l'écran Mac, cliquez sur :<br />
                            <strong className="text-white bg-slate-800 px-2 py-0.5 rounded text-[11px] inline-block mt-1">Fichier &gt; Ajouter au Dock...</strong>
                          </li>
                          <li>Laissez le nom <strong className="text-white">MEDICAB</strong> ou saisissez <strong className="text-white">MEDICAB Secrétariat</strong>.</li>
                          <li>Cliquez sur <strong>Ajouter</strong>.</li>
                        </ol>
                        <p className="text-[11px] text-emerald-400 font-medium pt-1">
                          ✓ L'application est prête ! La secrétaire peut désormais la lancer directement depuis son Dock Mac d'un simple clic.
                        </p>
                      </div>

                      {/* Chrome Steps */}
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
                          <Globe className="w-4 h-4 text-amber-400" />
                          <span>Alternative : Via Google Chrome (Mac)</span>
                        </div>
                        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                          <li>Ouvrez <strong>Google Chrome</strong> sur le Mac de la secrétaire.</li>
                          <li>Ouvrez la page MEDICAB du médecin.</li>
                          <li>Cliquez sur le menu à 3 points <strong className="text-white">⋮</strong> en haut à droite.</li>
                          <li>Sélectionnez <strong>Enregistrer et partager &gt; Installer la page en tant qu'application</strong> (ou <em>Créer un raccourci...</em> en cochant <em>Ouvrir dans une nouvelle fenêtre</em>).</li>
                          <li>Cliquez sur <strong>Installer</strong>.</li>
                        </ol>
                        <p className="text-[11px] text-slate-400 pt-1">
                          L'application s'ajoute au dossier Applications du Mac et se lance dans sa propre fenêtre séparée.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 2: DOCTOR MAC + SECRETARY MAC */}
                {secretaryMacTab === 'doctor-mac' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>Architecture Duo 100% Mac (Docteur Mac + Secrétaire Mac)</span>
                    </div>

                    <div className="p-4 bg-sky-950/30 rounded-xl border border-sky-500/30 space-y-2 text-xs font-arabic" dir="rtl">
                      <p className="font-bold text-sky-300 text-sm">
                        بما أن الطبيب والمساعد يملكان معاً جهازي ماك (Mac)، فأنتم تتمتعون بأسهل نظام ربط على الإطلاق:
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-200 text-xs leading-relaxed">
                        <li>
                          <strong>خاصية Apple Bonjour (mDNS) :</strong> أجهزة ماك تتعرف على بعضها تلقائياً داخل نفس شبكة الواي فاي. المساعد لا يحتاج حتى لمعرفة عنوان الـ IP المتغير؛ يكفي كتابة اسم ماك الطبيب متبوعاً بـ <code className="text-sky-300 font-mono">.local</code> (مثلاً: <code className="text-emerald-400 font-mono">MacBook-Medecin.local:3000</code>).
                        </li>
                        <li>
                          <strong>لا يتأثر بانقطاع الكهرباء :</strong> اسم Bonjour ثابت في نظام macOS ولا يتغير حتى إذا أعيد تشغيل الراوتر أو انقطعت الكهرباء عن العيادة.
                        </li>
                        <li>
                          <strong>استجابة فورية بدون أي تأخير (Latency &lt; 2ms) :</strong> التحديثات ولائحة الانتظار تظهر عند الطبيب والمساعد في أجزاء من الثانية بفضل بروتوكول WebSocket المباشر.
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                      <p className="font-bold text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        Vérification Sécurité & Coupe-feu entre deux Mac :
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Sur le Mac du médecin, assurez-vous simplement que les deux ordinateurs sont connectés au <strong>même nom de réseau Wi-Fi</strong> du cabinet. 
                        Si le coupe-feu macOS affiche un message d'autorisation au lancement du serveur sur le Mac du médecin, cliquez sur <strong>Autoriser</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 3: BROWSER ACCESS */}
                {secretaryMacTab === 'browser' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span>Liens d'Accès Directs pour le Mac de la Secrétaire</span>
                    </div>

                    <div className="space-y-3">
                      {/* Link 1: IP URL */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Option A : Lien par Adresse IP</span>
                          <span className="font-mono text-xs text-emerald-400 font-bold select-all">
                            http://{getEffectiveServerIp()}:{getEffectiveServerPort()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `http://${getEffectiveServerIp()}:${getEffectiveServerPort()}`;
                            navigator.clipboard.writeText(url);
                            if (onNotify) onNotify('Lien IP copié !', 'info');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copier URL
                        </button>
                      </div>

                      {/* Link 2: Bonjour URL */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider">Option B : Lien Mac Bonjour (Recommandé Mac à Mac)</span>
                            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">mDNS</span>
                          </div>
                          <span className="font-mono text-xs text-sky-300 font-bold select-all">
                            http://MacBook-Medecin.local:{config.serverPort || 3000}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `http://MacBook-Medecin.local:${config.serverPort || 3000}`;
                            navigator.clipboard.writeText(url);
                            if (onNotify) onNotify('Lien Bonjour copié !', 'info');
                          }}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition shadow"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copier URL Mac
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <p className="font-bold text-slate-200">Astuce Productivité sur Mac :</p>
                      <p>
                        Sur le Mac de la secrétaire, appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white">Cmd + D</kbd> dans Safari pour ajouter MEDICAB dans les favoris, ou configurez-le comme page d'accueil.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 4: TERMINAL TEST */}
                {secretaryMacTab === 'terminal' && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>Test Express depuis le Terminal macOS (Vérification de connectivité)</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Si vous souhaitez vous assurer que le Mac de la secrétaire parvient à contacter le Mac du médecin sans le moindre obstacle pare-feu :
                    </p>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5" />
                          Commande de Test Terminal Mac :
                        </span>
                        <button
                          type="button"
                          onClick={copyMacCurlCmd}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 transition"
                        >
                          {copiedMacCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedMacCurl ? 'Copié !' : 'Copier Commande'}
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded text-slate-200 font-mono text-xs select-all border border-slate-800">
                        curl -I http://{getEffectiveServerIp()}:{getEffectiveServerPort()}/api/health
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Ouvrez le <strong>Terminal</strong> sur le Mac de la secrétaire (raccourci : <kbd className="px-1 bg-slate-800 rounded text-white font-mono">Cmd + Espace</kbd> &gt; tapez <em>Terminal</em> &gt; Entrée), collez la commande et appuyez sur Entrée.
                        Si vous recevez la réponse <code className="text-emerald-400">HTTP/1.1 200 OK</code>, le lien entre les deux ordinateurs est 100% opérationnel !
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODE LOCAL (STANDALONE) */}
      {config.mode === 'local' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="max-w-2xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Mode Monoposte Autonome Activé
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              MEDICAB fonctionne actuellement de manière 100% autonome sur cet ordinateur. Vos données (patients, rendez-vous, ordonnances) sont stockées localement et ne sont partagées sur aucun réseau.
            </p>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-200">
                Besoin d'ajouter un poste pour votre secrétaire plus tard ?
              </p>
              <p>
                Il vous suffira de sélectionner <strong>PC Médecin (Serveur Principal)</strong> ci-dessus, et d'installer MEDICAB sur l'ordinateur de votre secrétaire en mode <strong>PC Secrétaire</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Local Data Migration Confirmation Modal */}
      {showMigrationConfirm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Injecter les données locales ?</h3>
              <p className="text-xs text-slate-300">
                Voulez-vous injecter les données de ce poste dans la base centrale du serveur ? Aucune donnée existante ne sera écrasée (fusion intelligente).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowMigrationConfirm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmMigrateLocalDataToServer}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/30 transition flex items-center justify-center space-x-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Confirmer l'injection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 text-slate-100 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30 mb-2">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-white">رمز QR للربط السريع بحاسوب المساعد</h3>
              <p className="text-xs text-slate-400">
                افتح كاميرا الكاميرا أو ماسح QR للاتصال الفوري دون كتابة العنوان
              </p>
            </div>

            {/* Render QR Code */}
            <div className="flex justify-center p-6 bg-white rounded-2xl border-4 border-emerald-500/30 shadow-inner">
              <QRCodeSVG
                value={getAssistantWebUrl()}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-2 text-center">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs font-bold text-emerald-300 select-all">
                {getAssistantWebUrl()}
              </div>
              <p className="text-[11px] text-slate-400 font-arabic" dir="rtl">
                شغّال على نفس شبكة الـ Wi-Fi للعيادة • بدون أي تثبيت على حاسوب المساعد
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={copyWebUrl}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow"
              >
                {copiedWebUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedWebUrl ? 'تم نسخ الرابط !' : 'نسخ الرابط'}
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
