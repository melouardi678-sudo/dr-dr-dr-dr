import React from 'react';
import { Logo } from './Logo';
import { X, ShieldCheck, Mail, Building2, AppWindow, BadgeCheck } from 'lucide-react';
import { LicenseInfo } from '../types';
import { LicenseStatus, getLicenseStatus } from '../utils/license';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseInfo: LicenseInfo;
  licenseStatus?: LicenseStatus;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  licenseInfo,
  licenseStatus: customStatus,
}) => {
  if (!isOpen) return null;

  const status = customStatus || getLicenseStatus(licenseInfo);

  // Compute License Display Text
  const licenseText = 'Licence Illimitée (Permanente)';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full text-slate-100 overflow-hidden relative">
        {/* Subtle Gradient Accent Header */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-inner">
              <Logo variant="icon" size={44} themeMode="dark" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">MediCab</h2>
              <p className="text-xs text-sky-400 font-bold uppercase tracking-widest mt-0.5">
                E-ACCESS WEB
              </p>
            </div>
          </div>

          {/* Clean Information Table */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 space-y-3.5 text-xs">
            {/* Application */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2 text-slate-400">
                <AppWindow className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Application</span>
              </div>
              <span className="font-extrabold text-white text-sm">MediCab</span>
            </div>

            {/* Publisher */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2 text-slate-400">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Publisher</span>
              </div>
              <span className="font-bold text-slate-200">E-ACCESS WEB</span>
            </div>

            {/* Version */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2 text-slate-400">
                <BadgeCheck className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Version</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                2.4.0
              </span>
            </div>

            {/* Support */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2 text-slate-400">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Support</span>
              </div>
              <a
                href="mailto:me@eaccessweb.com"
                className="font-mono font-bold text-sky-400 hover:text-sky-300 hover:underline transition"
              >
                me@eaccessweb.com
              </a>
            </div>

            {/* License */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center space-x-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span className="font-medium">License</span>
              </div>
              <span className="font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-[11px]">
                {licenseText}
              </span>
            </div>
          </div>

          {/* Close Button Footer */}
          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition border border-slate-700/60 shadow-md"
            >
              Fermer / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
