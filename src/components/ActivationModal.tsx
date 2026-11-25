import React, { useState } from 'react';
import { Check, Copy, HelpCircle, Key, ShieldAlert, X } from 'lucide-react';
import { LicenseInfo } from '../types';
import { verifyActivationCode, saveLicenseInfo, LicenseStatus } from '../utils/license';
import { Logo } from './Logo';

const ACTIVATION_CODE_HASH = 'MEDIACAB-11M23-2027-19O92';

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
  const [activationCode, setActivationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen && !isMandatoryBlock) return null;

  const handleCopyMachineId = async () => {
    try {
      await navigator.clipboard.writeText(licenseInfo.machineId);
      setCopied(true);
      setErrorMsg('');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMsg('Impossible de copier l’identifiant. Veuillez le sélectionner et le copier manuellement.');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!activationCode.trim()) {
      setErrorMsg("Code d'activation invalide.");
      return;
    }

    setIsActivating(true);
    try {
      const checkResult: any = await (verifyActivationCode as any)(licenseInfo.clientId || '', licenseInfo.machineId || '', activationCode);
      const isValid = typeof checkResult === 'boolean' ? checkResult : Boolean(checkResult?.isValid);
      if (!isValid) {
        setErrorMsg("Code d'activation invalide.");
        return;
      }

      const updated: LicenseInfo = {
        ...licenseInfo,
        isActivated: true,
        trialDays: 0,
        licenseType: 'permanent',
        activationCodeHash: ACTIVATION_CODE_HASH,
        activationVersion: 2,
        expiryDate: undefined,
      };

      saveLicenseInfo(updated);
      setSuccessMsg('Activation réussie. Votre licence est permanente.');
      window.setTimeout(() => {
        onLicenseUpdated(updated);
        if (!isMandatoryBlock) onClose();
      }, 1600);
    } catch {
      setErrorMsg('Une erreur est survenue lors de la vérification de la licence.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-700 bg-slate-800/80 px-6 py-4">
          <Logo variant="icon" size={40} themeMode="dark" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold tracking-wide text-white">MEDIACAB</h2>
            <p className="text-xs font-medium text-sky-400">Activation du logiciel</p>
          </div>
          {!isMandatoryBlock && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleActivate} className="space-y-5 p-6">
          {licenseStatus.isExpired && !licenseInfo.isActivated && (
            <div className="flex gap-3 rounded-xl border border-rose-800 bg-rose-950/70 p-3 text-sm text-rose-100">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div className="space-y-1">
                <h3 className="font-bold">Période d'essai terminée</h3>
                <p>Votre période d'essai de 7 jours est terminée.</p>
                <p>Veuillez contacter l'administration MEDIACAB pour obtenir votre code d'activation.</p>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Identifiant de cet ordinateur (Machine ID)
              </label>
              <div className="select-all rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-emerald-300">
                {licenseInfo.machineId}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyMachineId}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-sky-400" />}
              <span>{copied ? 'Code copié' : 'Copier le code'}</span>
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Veuillez copier cet identifiant et l'envoyer à l'administration MEDIACAB.
            </p>
          </section>

          <section className="space-y-2">
            <label htmlFor="medicab-activation-code" className="block text-xs font-semibold text-slate-300">
              Code d'activation
            </label>
            <input
              id="medicab-activation-code"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={activationCode}
              onChange={(event) => setActivationCode(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm uppercase tracking-widest text-white outline-none focus:border-emerald-500"
              placeholder="Saisissez votre code"
            />
          </section>

          {errorMsg && (
            <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/70 p-2.5 text-xs text-rose-200">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/70 p-2.5 text-xs text-emerald-200">
              <Check className="h-4 w-4 shrink-0" />
              {successMsg}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <HelpCircle className="h-4 w-4 shrink-0 text-slate-500" />
              Licence permanente, sans expiration.
            </p>
            <button
              type="submit"
              disabled={isActivating || Boolean(successMsg)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
            >
              <Key className="h-4 w-4" />
              <span>{isActivating ? 'Vérification…' : 'Activer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
