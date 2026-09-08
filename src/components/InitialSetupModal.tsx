import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Building2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Logo } from './Logo';
import { AppUser } from '../types';
import { saveUsers, getSettings, saveSettings, addAuditLog } from '../utils/storage';
import { safeSetItem } from '../utils/safeStorage';
import { hashPasswordWithSalt, generateSalt } from '../utils/auth';

interface InitialSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ isOpen, onComplete }) => {
  const settings = getSettings();
  const [clinicName, setClinicName] = useState(settings.name || 'Cabinet Médical');
  const [doctorName, setDoctorName] = useState(settings.doctorName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clinicName.trim() || !doctorName.trim() || !email.trim() || !password) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const salt = generateSalt();
      const passwordHash = await hashPasswordWithSalt(password, salt);

      const adminUser: AppUser = {
        id: 'usr_admin_1',
        username: email.split('@')[0],
        fullName: doctorName.trim(),
        role: 'admin',
        email: email.trim().toLowerCase(),
        passwordHash,
        passwordSalt: salt,
        avatar: settings.doctorAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        failedAttempts: 0,
      };

      saveUsers([adminUser]);

      const updatedSettings = {
        ...settings,
        name: clinicName.trim(),
        doctorName: doctorName.trim(),
        email: email.trim().toLowerCase(),
      };
      saveSettings(updatedSettings);

      addAuditLog('INITIAL_SETUP', `Création du compte administrateur initial pour ${doctorName} (${email})`);

      safeSetItem('medicab_remember_email', email.trim().toLowerCase());

      setIsLoading(false);
      onComplete();
    } catch (err: any) {
      setErrorMsg("Erreur lors de l'initialisation du système.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 text-slate-100 relative overflow-hidden my-auto">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4 shadow-inner">
            <Logo variant="icon" size={42} themeMode="dark" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Configuration Initiale de MediCab
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
            Premier lancement : Veuillez configurer le compte administrateur et les informations de votre cabinet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nom du Cabinet *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Cabinet Médical Dr. ..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nom Complet du Médecin *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Karim BENALI"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Adresse E-mail Administrateur *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cabinet.ma"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Mot de Passe (min 8 car.) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Confirmer le Mot de Passe *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-center space-x-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-emerald-950/50 border border-emerald-500/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Création du compte administrateur...</span>
                </>
              ) : (
                <span>Terminer la Configuration & Démarrer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
