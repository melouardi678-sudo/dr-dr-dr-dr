import React from 'react';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  Activity,
  Pill,
  Award,
  Receipt,
  TrendingUp,
  Package,
  MessageSquare,
  ShieldCheck,
  Database,
  Settings,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react';
import { UserRole } from '../types';
import { t, Language } from '../utils/translations';

export type NavTab =
  | 'dashboard'
  | 'agenda'
  | 'patients'
  | 'consultations'
  | 'prescriptions'
  | 'ultrasound'
  | 'medications'
  | 'certificates'
  | 'billing'
  | 'accounting'
  | 'stock'
  | 'messaging'
  | 'security'
  | 'backup'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  waitingPatientsCount: number;
  lowStockCount: number;
  language?: Language;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  waitingPatientsCount,
  lowStockCount,
  language = 'fr',
  isOpen = false,
  onClose,
}) => {
  const lang: Language = (language as Language) || 'fr';
  const menuItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: t('nav_dashboard', lang), icon: LayoutDashboard },
    { id: 'agenda', label: t('nav_agenda', lang), icon: Calendar, badge: waitingPatientsCount },
    { id: 'patients', label: t('nav_patients', lang), icon: Users },
    { id: 'consultations', label: t('nav_consultations', lang), icon: Stethoscope },
    { id: 'prescriptions', label: t('nav_prescriptions', lang), icon: FileText },
    { id: 'ultrasound', label: t('nav_ultrasound', lang), icon: Activity },
    { id: 'medications', label: t('nav_medications', lang), icon: Pill },
    { id: 'certificates', label: t('nav_certificates', lang), icon: Award },
    { id: 'billing', label: t('nav_billing', lang), icon: Receipt },
    { id: 'accounting', label: t('nav_accounting', lang), icon: TrendingUp, adminOnly: true },
    { id: 'stock', label: t('nav_stock', lang), icon: Package, badge: lowStockCount },
    { id: 'messaging', label: t('nav_messaging', lang), icon: MessageSquare },
    { id: 'security', label: t('nav_security', lang), icon: ShieldCheck, adminOnly: true },
    { id: 'backup', label: t('nav_backup', lang), icon: Database },
    { id: 'settings', label: t('nav_settings', lang), icon: Settings },
  ];

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between select-none shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="py-3 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
          {/* Brand Header */}
          <div className="px-3 pt-1 pb-3 mb-2 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <Logo variant="icon" size={32} themeMode="dark" />
              <div className="min-w-0">
                <h2 className="font-extrabold text-xs text-white tracking-wide truncate">E-ACCESS WEB</h2>
                <p className="text-[9px] text-sky-400 font-semibold truncate">Medical Software Solutions</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {t('nav_main', lang)}
          </div>

          {menuItems.map((item) => {
            if (item.adminOnly && userRole !== 'admin') {
              return null; // Restricted for secretary
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md font-semibold border-emerald-500'
                    : 'bg-transparent text-slate-300 hover:bg-slate-800/40 hover:border-slate-700/60 border-transparent hover:shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-emerald-700'
                          : item.id === 'stock'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info box */}
        <div className="p-3 m-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-slate-200 font-medium">
            <span>{t('nav_role_mode', lang)}</span>
            <span className="text-emerald-400 capitalize">
              {userRole === 'admin' ? t('nav_doctor_admin', lang) : t('nav_secretary', lang)}
            </span>
          </div>
          {userRole === 'secretary' && (
            <div className="flex items-center space-x-1 text-[10px] text-amber-400 pt-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{t('nav_restricted_notice', lang)}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
