import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Globe, Moon, Sun, Upload, Shield, Info, ExternalLink, Lock, Mail, AlertCircle, Users, Key, Building, Wifi, Printer } from 'lucide-react';
import { Logo } from '../Logo';
import { CabinetSettings, AppUser } from '../../types';
import { loadLicenseInfo, getLicenseStatus } from '../../utils/license';
import { hashPasswordWithSalt, generateSalt } from '../../utils/auth';
import { StaffManagementSection } from '../StaffManagementSection';
import { NetworkSettingsSection } from '../NetworkSettingsSection';
import { PrescriptionPrintSettingsSection } from '../PrescriptionPrintSettingsSection';

interface SettingsViewProps {
  settings: CabinetSettings;
  onSaveSettings: (settings: CabinetSettings) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentUser: AppUser;
  onUpdateUser: (user: AppUser) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  theme,
  onToggleTheme,
  currentUser,
  onUpdateUser,
}) => {
  const [settingsTab, setSettingsTab] = useState<'cabinet' | 'print' | 'staff' | 'network'>('cabinet');
  const [formData, setFormData] = useState<CabinetSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Account settings state
  const [accountEmail, setAccountEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [accountError, setAccountError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    setAccountSuccess(false);

    if (!currentPassword) {
      setAccountError('Veuillez entrer votre mot de passe actuel pour valider les modifications.');
      return;
    }

    try {
      const computedHash = await hashPasswordWithSalt(currentPassword, currentUser.passwordSalt || '');
      if (computedHash !== currentUser.passwordHash) {
        setAccountError('Mot de passe actuel incorrect.');
        return;
      }

      const updatedUser: AppUser = {
        ...currentUser,
        email: accountEmail.trim().toLowerCase(),
      };

      if (newPassword) {
        if (newPassword.length < 8) {
          setAccountError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setAccountError('Les nouveaux mots de passe ne correspondent pas.');
          return;
        }
        const newSalt = generateSalt();
        const newHash = await hashPasswordWithSalt(newPassword, newSalt);
        updatedUser.passwordHash = newHash;
        updatedUser.passwordSalt = newSalt;
      }

      onUpdateUser(updatedUser);
      setAccountSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setAccountSuccess(false), 3000);
    } catch (err: any) {
      setAccountError('Erreur lors de la mise à jour du compte.');
    }
  };

  const handleImageUpload = (field: 'logoUrl' | 'stampUrl' | 'signatureUrl' | 'doctorAvatar', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setFormData((prev) => ({ ...prev, [field]: url }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Paramètres du Cabinet & Administration</h1>
            <p className="text-xs text-slate-400">Identité du cabinet, en-tête des ordonnances, gestion des employés et droits d'accès</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
          <button
            onClick={() => setSettingsTab('cabinet')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              settingsTab === 'cabinet'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Informations Cabinet</span>
          </button>

          <button
            onClick={() => setSettingsTab('print')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              settingsTab === 'print'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Impression & Ordonnances (طباعة الوصفات)</span>
          </button>

          <button
            onClick={() => setSettingsTab('staff')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              settingsTab === 'staff'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Personnel & Droits d'Accès (الصلاحيات)</span>
          </button>

          <button
            onClick={() => setSettingsTab('network')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              settingsTab === 'network'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Réseau Local (شبكة العيادة)</span>
          </button>
        </div>
      </div>

      {settingsTab === 'print' ? (
        <PrescriptionPrintSettingsSection
          settings={settings}
          onSaveSettings={onSaveSettings}
        />
      ) : settingsTab === 'staff' ? (
        <StaffManagementSection
          currentUser={currentUser}
          onUpdateCurrentUser={onUpdateUser}
        />
      ) : settingsTab === 'network' ? (
        <NetworkSettingsSection />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column: Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Informations Officielles & Entête</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nom du Cabinet *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nom du Médecin *</label>
                <input
                  type="text"
                  required
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Spécialité Médicale</label>
                <input
                  type="text"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Téléphone(s)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Adresse Complète</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email du Cabinet</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Devise / Monnaie</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Taux TVA (%)</label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center space-x-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>Sauvegarder les Paramètres</span>
              </button>
            </div>
          </form>

          {/* Account & Security Section */}
          <form onSubmit={handleAccountSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Paramètres du Compte Administrateur (Email & Mot de Passe)</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">E-mail Administrateur *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mot de Passe Actuel (Requis) *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nouveau Mot de Passe (Optionnel)</label>
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Laisser vide pour ne pas changer"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Confirmer le Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                  />
                </div>
              </div>
            </div>

            {accountError && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{accountError}</span>
              </div>
            )}

            {accountSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Compte mis à jour avec succès !</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg flex items-center space-x-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>Mettre à jour le Compte</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Doctor Photo, Logo, Stamp, Lang & Theme (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Photo du Médecin & Visuels</h2>

          {/* Doctor Profile Photo Upload & Live Preview */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-200">Photo de Profil du Médecin</label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Aperçu 40×40 px
              </span>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <div className="relative shrink-0">
                <img
                  src={formData.doctorAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
                  alt="Aperçu Médecin"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full object-cover border-2 border-emerald-500/80 shadow-md ring-2 ring-emerald-500/20"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs truncate">{formData.doctorName || 'Dr. Karim BENALI'}</p>
                <p className="text-[11px] text-sky-400 font-semibold truncate">{formData.speciality || 'Médecin'}</p>
              </div>

              <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer text-[11px] font-bold shadow transition shrink-0">
                Changer
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload('doctorAvatar', e)} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">URL Directe de la Photo :</label>
              <input
                type="text"
                placeholder="https://..."
                value={formData.doctorAvatar || ''}
                onChange={(e) => setFormData({ ...formData, doctorAvatar: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-[11px] font-mono focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Logo du Cabinet</label>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-slate-500 italic">Aucun logo</span>
              )}
              <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer text-[11px] font-semibold">
                Charger
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload('logoUrl', e)} className="hidden" />
              </label>
            </div>
          </div>

          {/* Interface options */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span>Langue Interface :</span>
              <span className="px-3 py-1 bg-slate-800 text-emerald-400 font-bold rounded-lg text-xs">
                Français (Unique)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Mode Affichage :</span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3 py-1 bg-slate-800 text-slate-200 font-bold rounded-lg capitalize"
              >
                {theme === 'light' ? 'Mode Clair' : 'Mode Sombre'}
              </button>
            </div>
          </div>

          {/* About Window Section */}
          {(() => {
            const licenseText = 'Licence Illimitée (Permanente)';

            return (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-white font-bold text-xs">
                  <Info className="w-4 h-4 text-sky-400" />
                  <span>À Propos du Logiciel</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-3 shadow-inner">
                  <div className="flex items-center justify-center py-2">
                    <Logo variant="full" size="md" themeMode="dark" />
                  </div>

                  <div className="text-xs space-y-2.5 pt-3 border-t border-slate-800/80">
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Application :</span>
                      <strong className="text-white font-black">MediCab</strong>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Publisher :</span>
                      <strong className="text-slate-200 font-bold">E-ACCESS WEB</strong>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Version :</span>
                      <strong className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        2.4.0
                      </strong>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Support :</span>
                      <a
                        href="mailto:me@eaccessweb.com"
                        className="text-sky-400 font-mono font-bold hover:text-sky-300 hover:underline transition"
                      >
                        me@eaccessweb.com
                      </a>
                    </p>
                    <p className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                      <span className="text-slate-400 font-medium">License :</span>
                      <strong className="text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg text-[11px]">
                        {licenseText}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      )}
    </div>
  );
};
