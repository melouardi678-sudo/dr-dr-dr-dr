import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  Key,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  X,
  Sparkles,
  Lock,
  Building,
  HelpCircle,
} from 'lucide-react';
import { LicenseInfo, LicenseType } from '../types';
import { verifyActivationCode, saveLicenseInfo, LicenseStatus } from '../utils/license';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseInfo: LicenseInfo;
  licenseStatus: LicenseStatus;
  onLicenseUpdated: (updated: LicenseInfo) => void;
  isMandatoryBlock?: boolean;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  licenseInfo,
  licenseStatus,
  onLicenseUpdated,
  isMandatoryBlock = false,
}) => {
  const [cabinetName, setCabinetName] = useState(licenseInfo.cabinetName || 'Cabinet Médical');
  const [activationCode, setActivationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen && !isMandatoryBlock) return null;

  const handleCopyAllInfo = () => {
    const textToCopy = `Nom du Cabinet: ${cabinetName}\nClient ID: ${licenseInfo.clientId}\nMachine ID: ${licenseInfo.machineId}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!activationCode.trim()) {
      setErrorMsg("Code d'activation invalide.");
      return;
    }

    const verification = verifyActivationCode(licenseInfo.clientId, licenseInfo.machineId, activationCode);

    if (verification.isValid && verification.type) {
      const updated: LicenseInfo = {
        ...licenseInfo,
        cabinetName,
        isActivated: true,
        activationCode,
        licenseType: 'permanent',
        expiryDate: undefined,
      };

      saveLicenseInfo(updated);
      onLicenseUpdated(updated);
      setSuccessMsg('Licence Permanente Activée');
      setTimeout(() => {
        setSuccessMsg('');
        if (!isMandatoryBlock) onClose();
      }, 2000);
    } else {
      setErrorMsg("Code d'activation invalide.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full text-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo variant="icon" size={38} themeMode="dark" />
            <div>
              <h3 className="font-extrabold text-base text-white tracking-wide">E-ACCESS WEB</h3>
              <p className="text-xs text-sky-400 font-medium">Activation du Logiciel — Medical Software Solutions</p>
            </div>
          </div>
          {!isMandatoryBlock && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status banner */}
        <div
          className={`px-6 py-3 text-xs flex items-center space-x-2 border-b ${
            licenseStatus.isExpired
              ? 'bg-rose-950/80 text-rose-200 border-rose-800'
              : licenseInfo.isActivated
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : 'bg-amber-950/80 text-amber-200 border-amber-800'
          }`}
        >
          {licenseStatus.isExpired ? (
            <>
              <Lock className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                <strong>Accès Bloqué :</strong> La période d’essai de 5 jours est expirée. Activez votre licence pour débloquer toutes les fonctionnalités.
              </span>
            </>
          ) : licenseInfo.isActivated ? (
            <>
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Licence Active :</strong> {licenseStatus.statusText}
              </span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Période d’essai active : <strong>{licenseStatus.daysRemaining} jour(s) restant(s)</strong>.
              </span>
            </>
          )}
        </div>

        {/* Body Form */}
        <form onSubmit={handleActivate} className="p-6 space-y-4">
          {/* Cabinet Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Nom du Cabinet</span>
            </label>
            <input
              type="text"
              value={cabinetName}
              onChange={(e) => setCabinetName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="ex: Cabinet de Médecine Générale"
            />
          </div>

          {/* Client ID & Machine ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Client ID
              </label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-400 font-bold select-all tracking-wider">
                {licenseInfo.clientId}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Machine ID
              </label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 font-bold select-all tracking-wider">
                {licenseInfo.machineId}
              </div>
            </div>
          </div>

          {/* Copy Information Button */}
          <div>
            <button
              type="button"
              onClick={handleCopyAllInfo}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Informations copiées !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span>Copier les informations</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 mt-1 text-center">
              Transmettez ces informations à l’éditeur pour obtenir votre code d'activation.
            </p>
          </div>

          {/* Activation Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Code d'Activation
            </label>
            <input
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="ex: PRM-XXXXX-YYYYY"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-white focus:outline-none focus:border-emerald-500 uppercase tracking-widest"
            />
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-lg text-xs flex items-center space-x-2">
              <X className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-lg text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Help box */}
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center space-x-1 font-semibold text-emerald-300">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Licence Permanente</span>
            </div>
            <p className="text-slate-300 font-medium">Activation permanente. Aucun abonnement. Aucune expiration.</p>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            {!isMandatoryBlock && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Fermer
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-900/40 flex items-center space-x-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Activer MediCab</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
