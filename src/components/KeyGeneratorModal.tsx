import React, { useState } from 'react';
import { KeyRound, Copy, Check, Sparkles, X, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { LicenseType } from '../types';
import { generateActivationCode } from '../utils/license';

interface KeyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClientId: string;
  currentMachineId: string;
}

export const KeyGeneratorModal: React.FC<KeyGeneratorModalProps> = ({
  isOpen,
  onClose,
  currentClientId,
  currentMachineId,
}) => {
  const [inputClientId, setInputClientId] = useState(currentClientId);
  const [inputMachineId, setInputMachineId] = useState(currentMachineId);
  const [licenseType, setLicenseType] = useState<LicenseType>('permanent');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClientId.trim() || !inputMachineId.trim()) return;
    const code = generateActivationCode(inputClientId.trim(), inputMachineId.trim(), licenseType);
    setGeneratedCode(code);
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full text-slate-100 overflow-hidden">
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo variant="icon" size={36} themeMode="dark" />
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-wide">E-ACCESS WEB</h3>
              <p className="text-[11px] text-sky-400 font-medium">Générateur de Clés — Medical Software Solutions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          {/* Required Field 1: Client ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Client ID du Client *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                required
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 uppercase"
                placeholder="ex: CLI-A1B2-C3D4-8800"
              />
              <button
                type="button"
                onClick={() => setInputClientId(currentClientId)}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 transition shrink-0"
              >
                Mon Client ID
              </button>
            </div>
          </div>

          {/* Required Field 2: Machine ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Machine ID du Client *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMachineId}
                onChange={(e) => setInputMachineId(e.target.value)}
                required
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 uppercase"
                placeholder="ex: MC-8F3A-992D-4100"
              />
              <button
                type="button"
                onClick={() => setInputMachineId(currentMachineId)}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 transition shrink-0"
              >
                Mon Machine ID
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Type de Licence
            </label>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Licence Permanente</span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Sans Expiration
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Générer le Code d'Activation</span>
          </button>

          {generatedCode && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-amber-500/40 space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Code d'activation généré :
              </span>
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-sm text-emerald-400 font-bold tracking-widest select-all">
                <span>{generatedCode}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-white transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Ce code est cryptographiquement lié à ce Client ID et Machine ID spécifiques.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
