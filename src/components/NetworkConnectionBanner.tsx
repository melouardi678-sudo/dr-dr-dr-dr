import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import { ConnectionStatus, NetworkConfig } from '../types';
import { getNetworkConfig, subscribeToNetworkConfig } from '../utils/networkConfig';
import { syncClient } from '../utils/syncClient';

interface NetworkConnectionBannerProps {
  onOpenNetworkSettings: () => void;
}

export const NetworkConnectionBanner: React.FC<NetworkConnectionBannerProps> = ({ onOpenNetworkSettings }) => {
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

  // Only show warning banner in client mode when disconnected
  if (config.mode !== 'client' || status === 'connected') {
    return null;
  }

  const handleReconnect = () => {
    setReconnecting(true);
    syncClient.connect();
    setTimeout(() => setReconnecting(false), 2000);
  };

  return (
    <div className="bg-rose-950/90 border-b border-rose-800 text-rose-200 px-4 py-2.5 flex items-center justify-between text-xs z-30 shadow-lg animate-in fade-in">
      <div className="flex items-center space-x-2.5">
        <div className="p-1 bg-rose-500/20 rounded-md">
          <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
        </div>
        <div>
          <span className="font-bold">Connexion au serveur perdue :</span>
          <span className="ml-1 text-rose-300">
            Impossible de joindre le PC Médecin ({config.serverIp}:{config.serverPort}). Vos modifications récentes restent sauvegardées.
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={handleReconnect}
          disabled={reconnecting}
          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
          <span>{reconnecting ? 'Reconnexion...' : 'Reconnecter'}</span>
        </button>
        <button
          onClick={onOpenNetworkSettings}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Paramètres Réseau</span>
        </button>
      </div>
    </div>
  );
};
