import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, Laptop, Settings } from 'lucide-react';
import { ConnectionStatus, NetworkConfig } from '../types';
import { getNetworkConfig, subscribeToNetworkConfig } from '../utils/networkConfig';
import { syncClient } from '../utils/syncClient';

interface NetworkStatusBadgeProps {
  onOpenNetworkSettings?: () => void;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({ onOpenNetworkSettings }) => {
  const [config, setConfig] = useState<NetworkConfig>(getNetworkConfig());
  const [status, setStatus] = useState<ConnectionStatus>(syncClient.getStatus());
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const unsubConfig = subscribeToNetworkConfig((newConfig) => {
      setConfig(newConfig);
    });

    const unsubStatus = syncClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubConfig();
      unsubStatus();
    };
  }, []);

  const handleReconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReconnecting(true);
    syncClient.connect();
    setTimeout(() => setReconnecting(false), 2000);
  };

  if (config.mode === 'local') {
    return (
      <button
        type="button"
        onClick={onOpenNetworkSettings}
        className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700/80 text-[11px] font-semibold transition"
        title="Mode Local (Monoposte) - Cliquez pour configurer le réseau du cabinet"
      >
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span className="hidden sm:inline">Mode Local</span>
      </button>
    );
  }

  if (config.mode === 'server') {
    return (
      <button
        type="button"
        onClick={onOpenNetworkSettings}
        className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-700/60 text-[11px] font-semibold transition"
        title="PC Médecin (Serveur Principal Actif) - Cliquez pour voir l'adresse IP et les postes connectés"
      >
        <Server className="w-3.5 h-3.5 text-emerald-400" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="hidden sm:inline">Serveur Actif</span>
      </button>
    );
  }

  // Client mode (PC Secrétaire)
  const isConnected = status === 'connected';

  return (
    <div className="flex items-center space-x-1">
      <button
        type="button"
        onClick={onOpenNetworkSettings}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
          isConnected
            ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
            : 'bg-rose-950/90 hover:bg-rose-900 text-rose-300 border-rose-700/80 animate-pulse'
        }`}
        title={
          isConnected
            ? `Connecté au serveur du médecin (${config.serverIp}:${config.serverPort})`
            : `Serveur déconnecté (${config.serverIp}:${config.serverPort}) - Cliquez pour configurer`
        }
      >
        {isConnected ? (
          <>
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Réseau Connecté</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="hidden sm:inline">Serveur Déconnecté</span>
          </>
        )}
      </button>

      {!isConnected && (
        <button
          type="button"
          onClick={handleReconnect}
          disabled={reconnecting}
          className="p-1 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 transition"
          title="Tenter une reconnexion immédiate au serveur"
        >
          <RefreshCw className={`w-3 h-3 ${reconnecting ? 'animate-spin' : ''}`} />
          <span>Reconnecter</span>
        </button>
      )}
    </div>
  );
};
