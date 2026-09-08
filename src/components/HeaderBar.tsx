import React from 'react';
import { Logo } from './Logo';
import {
  ShieldCheck,
  KeyRound,
  LogOut,
  Moon,
  Sun,
  Minimize2,
  Square,
  X,
  Menu,
} from 'lucide-react';
import { AppUser, CabinetSettings, LicenseInfo } from '../types';
import { LicenseStatus } from '../utils/license';
import { t } from '../utils/translations';
import { NetworkStatusBadge } from './NetworkStatusBadge';

interface HeaderBarProps {
  licenseInfo: LicenseInfo;
  licenseStatus: LicenseStatus;
  currentUser: AppUser;
  settings?: CabinetSettings;
  onOpenActivation: () => void;
  onOpenKeyGen: () => void;
  onOpenLogin: () => void;
  onOpenExeGuide?: () => void;
  onOpenAbout?: () => void;
  onOpenNetwork?: () => void;
  onLogout?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  licenseInfo,
  licenseStatus,
  currentUser,
  settings,
  onOpenActivation,
  onOpenKeyGen,
  onOpenNetwork,
  onLogout,
  theme,
  onToggleTheme,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const doctorPhoto = currentUser.role === 'admin'
    ? (settings?.doctorAvatar || currentUser.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80')
    : (currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');

  const doctorName = currentUser.role === 'admin'
    ? (settings?.doctorName || currentUser.fullName)
    : currentUser.fullName;

  const handleMinimize = () => {
    if ((window as any).electron?.minimizeWindow) {
      (window as any).electron.minimizeWindow();
    } else if ((window as any).electron?.ipcRenderer?.invoke) {
      (window as any).electron.ipcRenderer.invoke('window-minimize');
    }
  };

  const handleMaximize = () => {
    if ((window as any).electron?.maximizeWindow) {
      (window as any).electron.maximizeWindow();
    } else if ((window as any).electron?.ipcRenderer?.invoke) {
      (window as any).electron.ipcRenderer.invoke('window-maximize');
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      } else {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    }
  };

  const handleClose = () => {
    if ((window as any).electron?.closeWindow) {
      (window as any).electron.closeWindow();
    } else if ((window as any).electron?.ipcRenderer?.invoke) {
      (window as any).electron.ipcRenderer.invoke('window-close');
    } else if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 flex flex-wrap md:flex-nowrap items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800 text-xs select-none sticky top-0 z-40 gap-2 sm:gap-3 shadow-md">
      {/* Left: Mobile Menu Toggle, Logo & MediCab Brand */}
      <div className="flex items-center space-x-2 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/80 md:hidden transition-all duration-200"
            title="Menu"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5 text-emerald-400" />}
          </button>
        )}
        <Logo variant="icon" size={28} themeMode={theme} />
        <span className="font-black text-sm text-white tracking-wide">
          Medi<span className="text-emerald-400">Cab</span>
        </span>
      </div>

      {/* Center: Doctor Info & Profile Photo (Centered Horizontally & Vertically) */}
      <div className="flex-1 flex items-center justify-center space-x-3 my-0.5 md:my-0 text-center">
        {/* Profile Photo (Circular 40x40 px) */}
        <div className="relative shrink-0">
          <img
            src={doctorPhoto}
            alt={doctorName}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full object-cover border-2 border-emerald-500/70 shadow-md ring-2 ring-emerald-500/20"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
        </div>

        {/* Doctor Full Name */}
        <h2 className="font-extrabold text-sm text-white tracking-tight leading-snug">
          {doctorName}
        </h2>
      </div>

      {/* Right Controls: Network status, License status, Vendor KeyGen, Theme & Logout */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* LAN Network Status Badge */}
        <NetworkStatusBadge onOpenNetworkSettings={onOpenNetwork} />

        {/* License status badge */}
        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/80 text-emerald-300 rounded-lg border border-emerald-700/60"
          title={t('header_license_active')}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-[11px] hidden sm:inline">{licenseStatus.statusText}</span>
        </div>

        {/* Vendor Key Generator Tool (only when activated and admin) */}
        {currentUser.role === 'admin' && licenseInfo.isActivated && (
          <button
            onClick={onOpenKeyGen}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-800/80 text-slate-300 rounded-lg border border-slate-700/80 hover:border-slate-500/80 hover:brightness-105 text-[10px] transition-all duration-200"
            title={t('header_keygen')}
          >
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline font-semibold">{t('header_keygen')}</span>
          </button>
        )}

        {/* Dark / Light theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/60 transition-all duration-200"
          title={t('header_theme_toggle')}
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-slate-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
        </button>

        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg border border-transparent hover:border-rose-800/50 transition-all duration-200"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Window Control Buttons */}
        <div className="hidden lg:flex items-center space-x-1 ml-1 pl-2 border-l border-slate-800">
          <button
            onClick={handleMinimize}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all duration-200"
            title="Réduire la fenêtre / Minimize"
            aria-label="Réduire"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all duration-200"
            title="Agrandir / Plein écran / Maximize"
            aria-label="Agrandir ou plein écran"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-rose-300 rounded hover:bg-rose-950/60 transition-all duration-200"
            title="Fermer la fenêtre / Close"
            aria-label="Fermer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

