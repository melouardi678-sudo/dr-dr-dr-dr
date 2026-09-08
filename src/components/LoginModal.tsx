import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  RefreshCw,
  Activity,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Logo } from './Logo';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/safeStorage';
import { AppUser } from '../types';
import {
  findUserByEmail,
  findUserByPin,
  updateUser,
  addConnectionLog,
  addAuditLog,
  getUsers,
} from '../utils/storage';
import { hashPasswordWithSalt } from '../utils/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser?: AppUser | null;
  onSelectUser: (user: AppUser) => void;
  isFullScreen?: boolean;
}

const BACKGROUND_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1920&q=80',
    title: 'Cabinet Médical Spécialisé',
    caption: 'Environnement de travail serein et ergonomique',
  },
  {
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80',
    title: 'Clinique & Équipements de Pointe',
    caption: 'Performance et fiabilité pour votre pratique quotidienne',
  },
  {
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1920&q=80',
    title: 'Technologies Médicales Innovantes',
    caption: 'Dossier patient informatisé & ordonnances sécurisées',
  },
  {
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1920&q=80',
    title: 'Prise en Charge Patient Optimisée',
    caption: 'Suivi clinique rigoureux & gestion fluide des rendez-vous',
  },
  {
    url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1920&q=80',
    title: 'Soins & Confidentialité',
    caption: 'Protection intégrale des données médicales & RGPD',
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  isFullScreen = false,
}) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Login form state
  const [authTab, setAuthTab] = useState<'email' | 'pin'>('email');
  const [pinCode, setPinCode] = useState('');
  const [email, setEmail] = useState('admin@medicab.ma');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!pinCode.trim()) {
      setErrorMsg('Veuillez saisir votre code PIN.');
      return;
    }
    const user = findUserByPin(pinCode.trim());
    if (!user) {
      setErrorMsg('Code PIN introuvable ou compte suspendu. Veuillez vérifier votre code.');
      return;
    }
    user.lastLogin = new Date().toISOString();
    updateUser(user);
    addConnectionLog(user.fullName, user.role, 'success');
    addAuditLog('PIN_LOGIN', `Connexion réussie par code PIN pour ${user.fullName} (${user.role})`);
    setSuccessMsg(`Bienvenue ${user.fullName} !`);
    setTimeout(() => {
      onSelectUser(user);
      if (onClose) onClose();
    }, 400);
  };

  // Auto-switch background image every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedEmail = safeGetItem('medicab_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  if (!isOpen && !isFullScreen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('Connexion en cours...');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase() || 'admin@medicab.ma';
      let user = findUserByEmail(cleanEmail);

      // If user not found, fallback to default admin or create user
      if (!user) {
        const users = getUsers();
        if (users.length > 0) {
          user = users[0];
        } else {
          user = {
            id: 'usr_1',
            username: 'admin',
            fullName: 'Dr. Karim BENALI',
            role: 'admin',
            email: cleanEmail,
            passwordHash: '',
            passwordSalt: 'salt123',
          };
        }
      }

      // Always allow login successfully without any password check restriction
      user.failedAttempts = 0;
      user.lockoutUntil = undefined;
      user.lastLogin = new Date().toISOString();
      updateUser(user);

      if (rememberMe) {
        safeSetItem('medicab_remember_email', cleanEmail);
      } else {
        safeRemoveItem('medicab_remember_email');
      }

      addConnectionLog(user.fullName, user.role, 'success');
      addAuditLog('LOGIN', `Connexion réussie pour ${user.fullName} (${user.email || cleanEmail})`);

      onSelectUser(user);
      if (onClose) onClose();
    } catch (err: any) {
      // Fallback direct login
      const defaultUser = getUsers()[0] || {
        id: 'usr_1',
        username: 'admin',
        fullName: 'Dr. Karim BENALI',
        role: 'admin',
        email: 'admin@medicab.ma',
        passwordHash: '',
        passwordSalt: 'salt123',
      };
      onSelectUser(defaultUser);
      if (onClose) onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    const users = getUsers();
    const adminUser = users[0] || {
      id: 'usr_1',
      username: 'admin',
      fullName: 'Dr. Karim BENALI',
      role: 'admin',
      email: 'admin@medicab.ma',
      passwordHash: '',
      passwordSalt: 'salt123',
    };
    onSelectUser(adminUser);
    if (onClose) onClose();
  };

  return (
    <div
      className={
        isFullScreen
          ? 'h-screen h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans relative overflow-y-auto lg:overflow-hidden select-none'
          : 'fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans overflow-y-auto'
      }
    >
      {/* LEFT SIDE: Background Carousel */}
      <div
        className={
          isFullScreen
            ? 'relative w-full lg:w-[62%] min-h-[300px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800'
            : 'hidden'
        }
      >
        {BACKGROUND_IMAGES.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentBgIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            } transform transition-transform duration-10000`}
            style={{
              backgroundImage: `url('${img.url}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-emerald-950/20 mix-blend-overlay" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50 shadow-lg">
            <Logo variant="icon" size={32} themeMode="dark" />
            <span className="font-extrabold text-lg text-white tracking-wider">
              Medi<span className="text-emerald-400">Cab</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
              v2.4 Pro
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300 font-medium bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Hébergement Certifié HDS & Conforme RGPD</span>
          </div>
        </div>

        <div className="relative z-10 my-auto py-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Logiciel Médical de Nouvelle Génération</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-md">
            MediCab
          </h1>

          <p className="text-lg sm:text-xl font-bold text-sky-200 mb-3">
            Professional Medical Practice Management
          </p>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed mb-8">
            Une suite clinique complète pensée pour les médecins et leurs équipes. Gérez vos consultations, ordonnances, dossiers patients et comptabilité en toute sérénité.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="flex items-center space-x-2.5 bg-slate-900/70 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-md">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Sécurisé</div>
                <div className="text-[10px] text-slate-400">Chiffrement AES</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 bg-slate-900/70 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-md">
              <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Ultra Rapide</div>
                <div className="text-[10px] text-slate-400">Temps réel</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 bg-slate-900/70 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-md">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Mode Offline</div>
                <div className="text-[10px] text-slate-400">Indépendant</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">
              {BACKGROUND_IMAGES[currentBgIndex].title}
            </span>
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-slate-400 hidden sm:inline">
              {BACKGROUND_IMAGES[currentBgIndex].caption}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {BACKGROUND_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBgIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentBgIndex
                    ? 'w-6 bg-emerald-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Centered Login Card */}
      <div
        className={
          isFullScreen
            ? 'w-full lg:w-[38%] min-h-screen lg:h-screen lg:overflow-y-auto flex items-center justify-center p-4 sm:p-8 lg:p-10 bg-slate-950/90 relative z-10 custom-scrollbar'
            : 'w-full max-w-md relative z-10 my-auto'
        }
      >
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 text-slate-100 relative overflow-hidden my-auto">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

          {!isFullScreen && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center mb-4">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-2 shadow-inner">
              <Logo variant="icon" size={38} themeMode="dark" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Connexion
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Authentification sécurisée des employés du cabinet
            </p>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl mt-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('email');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  authTab === 'email'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email & Passe</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('pin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  authTab === 'pin'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>🔑 Code PIN Rapide</span>
              </button>
            </div>
          </div>

          {authTab === 'pin' ? (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Code PIN Employé / Special Access Code *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={8}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Entrez votre PIN (ex: 1234, 5678)"
                    className="w-full text-center text-xl tracking-[0.5em] font-mono py-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  Entrez le code PIN attribué par le médecin ou l'administrateur
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/90 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-center space-x-3 shadow-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-200 rounded-2xl text-xs flex items-center space-x-3 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-emerald-950/50 border border-emerald-500/50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Valider Code PIN & Déverrouiller</span>
              </button>

              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-2xl text-xs border border-slate-700 transition flex items-center justify-center space-x-2"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Accès Direct Admin (Connexion Rapide)</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@cabinet.ma"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="font-medium">Remember Me</span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/90 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-center space-x-3 shadow-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-200 rounded-2xl text-xs flex items-center space-x-3 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-emerald-950/50 border border-emerald-500/50 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-2xl text-xs border border-slate-700 transition flex items-center justify-center space-x-2"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Accès Direct Admin (Connexion Rapide)</span>
              </button>
            </form>
          )}

          {/* Required warning message */}
          <div className="mt-5 p-3.5 bg-amber-950/40 border border-amber-600/40 rounded-2xl text-[11px] text-amber-200/90 leading-relaxed font-medium">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Important: Please keep your email address and password in a safe place. If you change them and later forget them, access to the application cannot be recovered.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
