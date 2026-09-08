import React, { useState } from 'react';
import {
  Printer,
  FileText,
  CheckCircle2,
  Save,
  Eye,
  Sliders,
  Sparkles,
  Info,
  Check,
  Building,
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Layers,
} from 'lucide-react';
import { CabinetSettings, PrescriptionPrintSettings } from '../types';
import { DEFAULT_PRESCRIPTION_PRINT_SETTINGS } from '../utils/storage';
import { Logo } from './Logo';

interface PrescriptionPrintSettingsSectionProps {
  settings: CabinetSettings;
  onSaveSettings: (settings: CabinetSettings) => void;
}

export const PrescriptionPrintSettingsSection: React.FC<PrescriptionPrintSettingsSectionProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [printOpt, setPrintOpt] = useState<PrescriptionPrintSettings>(() => ({
    ...DEFAULT_PRESCRIPTION_PRINT_SETTINGS,
    ...(settings.prescriptionPrintSettings || {}),
  }));

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof PrescriptionPrintSettings) => {
    setPrintOpt((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePaperSize = (size: 'A4' | 'A5') => {
    setPrintOpt((prev) => ({
      ...prev,
      paperSize: size,
    }));
  };

  const handleHeaderSpaceChange = (val: number) => {
    setPrintOpt((prev) => ({
      ...prev,
      customHeaderSpaceMm: Math.max(10, Math.min(100, val)),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: CabinetSettings = {
      ...settings,
      prescriptionPrintSettings: printOpt,
    };
    onSaveSettings(updatedSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetDefaults = () => {
    setPrintOpt({ ...DEFAULT_PRESCRIPTION_PRINT_SETTINGS });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Personnalisation de l'Impression des Ordonnances</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/60 font-semibold">
                Ordonnance A4 / A5
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Configurez les éléments visibles lors de l'impression (En-tête, Âge du patient, Coordonnées, Logo, Cachet)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            Rétablir par défaut
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs flex items-center space-x-1.5 transition"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 rounded-2xl text-xs flex items-center space-x-2.5 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">Paramètres d'impression enregistrés avec succès !</p>
            <p className="text-emerald-300/90 text-[11px]">Ces réglages s'appliqueront automatiquement à toutes les prochaines ordonnances imprimées ou exportées en PDF.</p>
          </div>
        </div>
      )}

      {/* Main Grid: Options on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Form Toggles (5 cols) */}
        <form onSubmit={handleSave} className="xl:col-span-5 space-y-4">
          {/* Paper Size Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Format de Papier par Défaut</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePaperSize('A4')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  printOpt.paperSize === 'A4'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="font-black text-sm">Format A4</span>
                <span className="text-[10px] text-slate-400">210 × 297 mm (Standard)</span>
                {printOpt.paperSize === 'A4' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => handlePaperSize('A5')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  printOpt.paperSize === 'A5'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="font-black text-sm">Format A5</span>
                <span className="text-[10px] text-slate-400">148 × 210 mm (Demi-page)</span>
                {printOpt.paperSize === 'A5' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Header & Logo Toggles */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building className="w-4 h-4 text-sky-400" />
              <span>En-tête & Identité du Cabinet</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* Show Header */}
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div className="space-y-0.5 pr-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Afficher l'en-tête du cabinet</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Nom du médecin, spécialité et cabinet imprimés en haut. Si désactivé, un espace est réservé pour le papier pré-imprimé.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={printOpt.showHeader}
                  onChange={() => handleToggle('showHeader')}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </label>

              {/* Custom Header Space if Header Disabled */}
              {!printOpt.showHeader && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Espace réservé pour pré-imprimé (Marge haute) :</span>
                    </span>
                    <span className="font-mono text-xs font-black text-amber-300 px-2 py-0.5 rounded bg-amber-900/50">
                      {printOpt.customHeaderSpaceMm} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={80}
                    step={5}
                    value={printOpt.customHeaderSpaceMm}
                    onChange={(e) => handleHeaderSpaceChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-amber-300/70 font-mono">
                    <span>15 mm (court)</span>
                    <span>45 mm (standard)</span>
                    <span>80 mm (grand en-tête)</span>
                  </div>
                </div>
              )}

              {/* Show Logo */}
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-white block">Afficher le logo</span>
                  <p className="text-[11px] text-slate-400">Logo central du cabinet dans l'en-tête de l'ordonnance</p>
                </div>
                <input
                  type="checkbox"
                  checked={printOpt.showLogo}
                  disabled={!printOpt.showHeader}
                  onChange={() => handleToggle('showLogo')}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0 disabled:opacity-40"
                />
              </label>

              {/* Show Cabinet Coords */}
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-white block">Afficher les coordonnées du cabinet</span>
                  <p className="text-[11px] text-slate-400">Bande de coordonnées avec téléphone, adresse et email en bas de page</p>
                </div>
                <input
                  type="checkbox"
                  checked={printOpt.showCabinetCoords}
                  onChange={() => handleToggle('showCabinetCoords')}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </label>

              {printOpt.showCabinetCoords && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-2 pt-1">
                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOpt.showPhone}
                      onChange={() => handleToggle('showPhone')}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span className="text-[11px] text-slate-300 font-medium">Téléphone</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOpt.showAddress}
                      onChange={() => handleToggle('showAddress')}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span className="text-[11px] text-slate-300 font-medium">Adresse</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOpt.showEmail}
                      onChange={() => handleToggle('showEmail')}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span className="text-[11px] text-slate-300 font-medium">Email</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Patient Info & Footer Toggles */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>Informations Patient & Pied de Page</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* Show Age Toggle - User requested item */}
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div className="space-y-0.5 pr-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Afficher l'âge du patient</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                      Option demandée
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Indique l'âge en années du patient (ex : <strong>42 ans</strong>). Si décoché, l'âge est masqué sur l'ordonnance imprimée.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={printOpt.showAge}
                  onChange={() => handleToggle('showAge')}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </label>

              {/* Show Patient Name */}
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-white block">Afficher le Nom & Prénom du patient</span>
                  <p className="text-[11px] text-slate-400">Nom et prénom en majuscules dans le bandeau supérieur</p>
                </div>
                <input
                  type="checkbox"
                  checked={printOpt.showPatientName}
                  onChange={() => handleToggle('showPatientName')}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </label>

              {/* Show Date */}
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-white block">Afficher la date de consultation</span>
                  <p className="text-[11px] text-slate-400">Date du jour ou date spécifiée lors de la prescription</p>
                </div>
                <input
                  type="checkbox"
                  checked={printOpt.showDate}
                  onChange={() => handleToggle('showDate')}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </label>

              {/* Show Footer & Stamp */}
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-white block">Afficher le bloc Signature & Cachet</span>
                  <p className="text-[11px] text-slate-400">Cadre réservé pour la signature et le tampon du médecin</p>
                </div>
                <input
                  type="checkbox"
                  checked={printOpt.showFooter}
                  onChange={() => handleToggle('showFooter')}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les préférences d'impression</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Interactive Prescription Preview (7 cols) */}
        <div className="xl:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Aperçu en Direct de l'Ordonnance ({printOpt.paperSize})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Mise à jour instantanée
            </span>
          </div>

          {/* Visual Paper Canvas */}
          <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex justify-center shadow-2xl overflow-hidden">
            <div
              className={`bg-white text-slate-900 rounded-lg shadow-2xl p-6 transition-all duration-300 flex flex-col justify-between border border-slate-300 ${
                printOpt.paperSize === 'A5'
                  ? 'w-full max-w-md min-h-[480px] text-[11px]'
                  : 'w-full max-w-lg min-h-[620px] text-xs'
              }`}
            >
              {/* Header Box */}
              <div>
                {printOpt.showHeader ? (
                  <div className="border-b-2 border-emerald-600 pb-3 mb-4 transition-all">
                    <div className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2 text-left space-y-0.5" style={{ direction: 'ltr' }}>
                        <h1 className="font-black text-slate-900 uppercase tracking-wide text-xs leading-tight">
                          {settings.name || 'Cabinet Médical Dr. BENALI'}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-800 leading-tight">
                          {settings.doctorName || 'Dr. Karim BENALI'}
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-700 leading-tight">
                          {settings.speciality || 'Médecine Générale'}
                        </p>
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        {printOpt.showLogo && (
                          settings.logoUrl ? (
                            <img
                              src={settings.logoUrl}
                              alt="Logo"
                              className="h-12 max-h-14 w-auto object-contain"
                            />
                          ) : (
                            <Logo variant="icon" size={36} themeMode="light" />
                          )
                        )}
                      </div>

                      <div className="col-span-2 text-right space-y-0.5" style={{ direction: 'rtl' }}>
                        <h1 className="font-black text-slate-900 text-xs leading-tight">
                          عيادة الدكتور كريم بنعلي
                        </h1>
                        <p className="text-[10px] font-bold text-slate-800 leading-tight">
                          طبيب عام
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-700 leading-tight">
                          أمراض باطنية
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ height: `${printOpt.customHeaderSpaceMm || 45}px` }}
                    className="border-2 border-dashed border-amber-300/80 bg-amber-50/50 rounded-lg mb-4 flex items-center justify-center text-center p-2 transition-all"
                  >
                    <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-amber-600" />
                      Espace réservé en-tête pré-imprimé ({printOpt.customHeaderSpaceMm} mm)
                    </span>
                  </div>
                )}

                {/* Patient Bar */}
                <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-[11px] mb-4">
                  {printOpt.showPatientName && (
                    <div>
                      <span className="text-slate-500 font-medium">Patient : </span>
                      <strong className="text-slate-900 uppercase">Omar EL AMRANI</strong>
                    </div>
                  )}

                  {printOpt.showAge && (
                    <div>
                      <span className="text-slate-500 font-medium">Âge : </span>
                      <strong className="text-slate-900">42 ans</strong>
                    </div>
                  )}

                  {printOpt.showDate && (
                    <div>
                      <span className="text-slate-500 font-medium">Date : </span>
                      <strong className="text-slate-900">
                        {new Date().toLocaleDateString('fr-FR')}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="text-center py-1 border-b border-slate-200 mb-3">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 underline decoration-emerald-500 underline-offset-4">
                    ORDONNANCE MÉDICALE
                  </h2>
                </div>

                {/* Sample Prescribed Medications */}
                <div className="space-y-3 py-1">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-mono">1.</span>
                      <span>Doliprane 1000 mg (Comprimé)</span>
                    </div>
                    <div className="pl-4 text-slate-700 font-medium text-[11px]">
                      • Posologie : 1 comprimé 3 fois par jour si douleur — pendant 5 jours
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-mono">2.</span>
                      <span>Augmentin 1g / 125mg (Sachet)</span>
                    </div>
                    <div className="pl-4 text-slate-700 font-medium text-[11px]">
                      • Posologie : 1 sachet matin et soir au milieu des repas — pendant 7 jours
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Section */}
              <div className="mt-4">
                {printOpt.showFooter && (
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-end text-[10px]">
                    <div className="text-slate-400">
                      <p>Fait le {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>

                    <div className="text-center w-32 space-y-0.5">
                      <span className="font-bold text-slate-800 block">
                        Signature & Cachet
                      </span>
                      <div className="h-12 border border-dashed border-slate-300 rounded flex items-center justify-center p-1 bg-slate-50">
                        {settings.signatureUrl ? (
                          <img src={settings.signatureUrl} alt="Signature" className="h-8 w-auto object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">[ Tampon ]</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cabinet contact line */}
                {printOpt.showCabinetCoords && (
                  <div className="border-t-2 border-slate-300 mt-2.5 pt-1.5 text-center text-[9px] text-slate-600">
                    <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-0.5">
                      {printOpt.showAddress && settings.address && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="h-2.5 w-2.5 text-emerald-700 shrink-0" /> {settings.address}
                        </span>
                      )}
                      {printOpt.showPhone && settings.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-2.5 w-2.5 text-emerald-700 shrink-0" /> {settings.phone}
                        </span>
                      )}
                      {printOpt.showEmail && settings.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5 text-emerald-700 shrink-0" /> {settings.email}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
