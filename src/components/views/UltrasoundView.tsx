import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Trash2,
  Printer,
  Share2,
  Mail,
  MessageSquare,
  Search,
  RotateCcw,
  User,
  Calendar,
  Sparkles,
  Bookmark,
  BookmarkPlus,
  X,
  FileText,
  Stethoscope,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  Upload,
} from 'lucide-react';
import {
  UltrasoundReport,
  UltrasoundTemplate,
  UltrasoundType,
  Patient,
  CabinetSettings,
  AppUser,
} from '../../types';
import {
  DEFAULT_ULTRASOUND_TEMPLATES,
  getStoredUltrasoundTemplates,
  saveStoredUltrasoundTemplates,
} from '../../utils/ultrasoundTemplates';
import { openWhatsAppLink, openEmailClient } from '../../utils/pdfPrint';

interface UltrasoundViewProps {
  reports: UltrasoundReport[];
  patients: Patient[];
  settings: CabinetSettings;
  currentUser: AppUser;
  onSaveReports: (reports: UltrasoundReport[]) => void;
  onOpenPrintable: (type: 'ultrasound', data: { ultrasound: UltrasoundReport }) => void;
  initialPatientId?: string;
}

const QUICK_EQUIPMENTS = [
  'Sonde Convexe 3.5 MHz (Abdominale)',
  'Sonde Linéaire Haute Fréquence 7.5 - 12 MHz (Superficielle)',
  'Sonde Endovaginale / Endocavitaire 6.5 MHz',
  'Sonde Micro-convexe Pédiatrique',
  'Doppler Couleur & Pulsé activé',
];

const QUICK_INDICATIONS = [
  'Douleurs abdominales aiguës',
  'Suspicion de colique néphrétique / Lombalgie',
  'Bilan de perturbation du bilan hépatique',
  'Bilan gynécologique / Métrorragies',
  'Suivi de grossesse / Échographie de datation',
  'Palpation d’un nodule thyroïdien / Cervical',
  'Bilan prostatique / Troubles mictionnels',
  'Bilan de masse mammaire palpable',
  'Bilan de contrôle systématique',
];

export const UltrasoundView: React.FC<UltrasoundViewProps> = ({
  reports,
  patients,
  settings,
  currentUser,
  onSaveReports,
  onOpenPrintable,
  initialPatientId,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patients[0]?.id || ''
  );

  // Template Catalog
  const [templates, setTemplates] = useState<UltrasoundTemplate[]>(() =>
    getStoredUltrasoundTemplates()
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');

  // Report Form State
  const [examType, setExamType] = useState<UltrasoundType>('abdominal');
  const [reportTitle, setReportTitle] = useState('Échographie Abdominale Complète');
  const [indication, setIndication] = useState('Douleurs abdominales diffuses et bilan de contrôle');
  const [equipment, setEquipment] = useState('Sonde convexe 3.5 MHz — Échographe Doppler couleur');
  const [findings, setFindings] = useState(templates[0]?.findings || '');
  const [conclusion, setConclusion] = useState(templates[0]?.conclusion || '');
  const [recommendations, setRecommendations] = useState(templates[0]?.recommendations || '');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [images, setImages] = useState<string[]>([]);

  // Search & Filter
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<UltrasoundType>('abdominal');
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Apply a template
  const handleSelectTemplate = (tmpl: UltrasoundTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setExamType(tmpl.examType);
    setReportTitle(tmpl.name);
    setFindings(tmpl.findings);
    setConclusion(tmpl.conclusion);
    if (tmpl.recommendations) {
      setRecommendations(tmpl.recommendations);
    }
    if (tmpl.indication) {
      setIndication(tmpl.indication);
    }
    if (tmpl.equipment) {
      setEquipment(tmpl.equipment);
    }
  };

  // Quick insertion of findings phrases
  const handleInsertSnippet = (snippet: string) => {
    setFindings((prev) => (prev ? `${prev}\n${snippet}` : snippet));
  };

  // Quick insertion of conclusion
  const handleSetConclusionQuick = (text: string) => {
    setConclusion(text);
  };

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result;
        if (typeof res === 'string') {
          setImages((prev) => [...prev, res].slice(0, 6));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Save report
  const handleSaveReport = () => {
    if (!currentPatient) {
      alert('Veuillez sélectionner un patient.');
      return;
    }
    if (!findings.trim() || !conclusion.trim()) {
      alert('Veuillez renseigner les résultats et la conclusion de l’examen.');
      return;
    }

    const newReport: UltrasoundReport = {
      id: `us_${Date.now()}`,
      patientId: currentPatient.id,
      patientName: `${currentPatient.lastName} ${currentPatient.firstName}`,
      patientAge: currentPatient.age,
      patientGender: currentPatient.gender,
      date: examDate,
      doctorName: currentUser.fullName || settings.doctorName,
      examType: examType,
      examTypeName: reportTitle,
      indication: indication.trim() || 'Bilan de contrôle',
      equipment: equipment.trim() || undefined,
      findings: findings.trim(),
      conclusion: conclusion.trim(),
      recommendations: recommendations.trim() || undefined,
      images: images.length > 0 ? images : undefined,
      templateUsed: selectedTemplateId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newReport, ...reports];
    onSaveReports(updated);
    onOpenPrintable('ultrasound', { ultrasound: newReport });
  };

  // Save current report as new reusable template
  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTmpl: UltrasoundTemplate = {
      id: `ustmpl_${Date.now()}`,
      name: newTemplateName.trim(),
      examType: newTemplateType,
      examTypeName: newTemplateName.trim(),
      indication: indication.trim() || undefined,
      equipment: equipment.trim() || undefined,
      findings: findings,
      conclusion: conclusion,
      recommendations: recommendations || undefined,
      isCustom: true,
    };

    const updated = [...templates, newTmpl];
    setTemplates(updated);
    saveStoredUltrasoundTemplates(updated);
    setSelectedTemplateId(newTmpl.id);
    setShowSaveTemplateModal(false);
    setNewTemplateName('');
  };

  const handleDeleteTemplate = (tmplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToDelete(tmplId);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;
    const tmplId = templateToDelete;
    const updated = templates.filter((t) => t.id !== tmplId);
    setTemplates(updated);
    saveStoredUltrasoundTemplates(updated);
    if (selectedTemplateId === tmplId) {
      setSelectedTemplateId(updated[0]?.id || '');
    }
    setTemplateToDelete(null);
  };

  // Reuse past report
  const handleReusePastReport = (r: UltrasoundReport) => {
    setExamType(r.examType);
    setReportTitle(r.examTypeName);
    setIndication(r.indication || '');
    setEquipment(r.equipment || '');
    setFindings(r.findings);
    setConclusion(r.conclusion);
    setRecommendations(r.recommendations || '');
    setExamDate(new Date().toISOString().split('T')[0]);
  };

  // WhatsApp share
  const handleShareWhatsApp = (r: UltrasoundReport) => {
    let msg = `*Compte Rendu d'Échographie - ${settings.doctorName}*\n`;
    msg += `Patient(e): ${r.patientName} (${r.patientAge || ''} ans)\n`;
    msg += `Examen: ${r.examTypeName}\n`;
    msg += `Date: ${r.date}\n\n`;
    msg += `*CONCLUSION :*\n${r.conclusion}\n`;
    if (r.recommendations) msg += `\n*Recommandations:* ${r.recommendations}\n`;
    openWhatsAppLink(currentPatient?.phone || '', msg);
  };

  const patientReports = reports.filter((r) => r.patientId === currentPatient?.id);
  const filteredAllReports = reports.filter(
    (r) =>
      r.patientName.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
      r.examTypeName.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
      r.conclusion.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 font-sans text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Module d'Échographie Médicale</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                Imagerie & Rapports
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Comptes rendus structurés, touches d'examens types, clichés & impression A4 / PDF
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="px-3.5 py-2 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-600 flex items-center space-x-1.5 transition-all duration-200"
            title="Enregistrer le rapport actuel comme modèle d'échographie réutilisable"
          >
            <BookmarkPlus className="w-4 h-4 text-cyan-400" />
            <span>Enregistrer Modèle</span>
          </button>

          <button
            onClick={handleSaveReport}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md border border-cyan-400 flex items-center space-x-2 transition-all duration-200"
          >
            <Printer className="w-4 h-4" />
            <span>Générer & Imprimer A4 / PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive Exam Touch Pills ("Touches d'Examens Types") */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Touches d'Examens & Modèles Standards (Remplissage en 1 Clic)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {templates.length} protocole(s) disponible(s)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {templates.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950 text-white'
                    : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-bold leading-tight group-hover:text-cyan-300">
                      {tmpl.name}
                    </span>
                    {tmpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        title="Supprimer ce modèle"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-mono block">
                    {tmpl.examTypeName || tmpl.examType}
                  </span>
                </div>

                <div className="pt-2 mt-1 border-t border-slate-900 flex items-center text-[10px] text-cyan-400 group-hover:underline">
                  <span>Charger</span>
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ultrasound Report Editor (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl text-xs">
          {/* Patient Selection & Exam Metadata */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1">
                <label className="block font-bold text-slate-300">Patient(e) concerné(e) :</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName} ({p.age} ans - {p.gender}) {p.cin ? `— CIN: ${p.cin}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="block font-bold text-slate-300">Date de l'examen :</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-7 space-y-1">
                <label className="block font-bold text-slate-300">Titre du Compte Rendu :</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="block font-bold text-slate-300">Type d'examen :</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as UltrasoundType)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="abdominal">Abdominale</option>
                  <option value="pelvic">Pelvienne / Gynécologique</option>
                  <option value="obstetric">Obstétricale (Grossesse)</option>
                  <option value="thyroid">Thyroïdienne & Cervicale</option>
                  <option value="renal">Rénale & Vésico-prostatique</option>
                  <option value="breast">Mammaire (Sénologie)</option>
                  <option value="cardiac">Cardiaque & Doppler Vasculaire</option>
                  <option value="other">Autre / Personnalisé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Indication & Equipment Quick Selector */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300 flex items-center space-x-1">
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Indication / Renseignements Cliniques :</span>
                </label>
              </div>
              <input
                type="text"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                placeholder="ex: Bilan de douleurs abdominales de l'hypochondre droit..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_INDICATIONS.map((ind, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIndication(ind)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 rounded text-[10px] transition"
                  >
                    + {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <label className="font-bold text-slate-300">Technique & Équipement utilisé :</label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="ex: Sonde convexe 3.5 MHz — Doppler couleur"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_EQUIPMENTS.map((eq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEquipment(eq)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 rounded text-[10px] transition"
                  >
                    + {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Findings Textarea Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Résultats Détaillés de l'Examen (Findings) *</span>
              </label>
              <span className="text-[11px] text-slate-400">Éditeur structuré</span>
            </div>

            <textarea
              rows={12}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Rédigez la description détaillée des organes explorés..."
              className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-serif leading-relaxed focus:outline-none focus:border-cyan-500 custom-scrollbar shadow-inner"
            />
          </div>

          {/* Clichés / Image Attachments */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Clichés Échographiques Joints ({images.length}/6)</span>
              </label>
              <label className="cursor-pointer px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Joindre Cliché(s)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                    <img src={img} alt={`Cliché ${i + 1}`} className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conclusion Box */}
          <div className="space-y-2 p-4 bg-cyan-950/40 border border-cyan-800/80 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Conclusion & Impression Diagnostique *</span>
              </label>
            </div>

            <textarea
              rows={3}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="ex: Examen échographique abdominal sans anomalie décelable ce jour."
              className="w-full p-2.5 bg-slate-950 border border-cyan-700/60 rounded-lg text-white font-semibold text-xs leading-relaxed focus:outline-none focus:border-cyan-400"
            />

            {/* Quick Conclusion Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleSetConclusionQuick("Examen échographique normal sans anomalie décelable.")}
                className="px-2 py-0.5 bg-cyan-900/40 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-700/50 rounded text-[10px]"
              >
                ✓ Examen normal
              </button>
              <button
                type="button"
                onClick={() => handleSetConclusionQuick("Grossesse intra-utérine évolutive de terme concordant avec la date des dernières règles.")}
                className="px-2 py-0.5 bg-cyan-900/40 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-700/50 rounded text-[10px]"
              >
                ✓ Grossesse évolutive
              </button>
              <button
                type="button"
                onClick={() => handleSetConclusionQuick("Absence de lithiase biliaire ni dilatation des voies biliaires.")}
                className="px-2 py-0.5 bg-cyan-900/40 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-700/50 rounded text-[10px]"
              >
                ✓ Vésicule alithiasique
              </button>
              <button
                type="button"
                onClick={() => handleSetConclusionQuick("Parenchyme thyroïdien homogène sans nodule suspect décelable (Score EU-TIRADS 1).")}
                className="px-2 py-0.5 bg-cyan-900/40 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-700/50 rounded text-[10px]"
              >
                ✓ EU-TIRADS 1
              </button>
              <button
                type="button"
                onClick={() => handleSetConclusionQuick("Examen échographique mammaire bilatéral classé ACR BI-RADS 1.")}
                className="px-2 py-0.5 bg-cyan-900/40 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-700/50 rounded text-[10px]"
              >
                ✓ ACR BI-RADS 1
              </button>
            </div>
          </div>

          {/* Recommendations / Follow up */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Conduite à tenir / Recommandations (Optionnel) :</span>
            </label>
            <input
              type="text"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="ex: Contrôle échographique dans 6 mois ou en cas de récidive symptomatique."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Right Column: Past Ultrasound History (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Historique Échographique ({patientReports.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Examens précédents de {currentPatient?.firstName}
            </p>
          </div>

          {/* Filter/Search past reports */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrer les comptes rendus..."
              value={searchHistoryQuery}
              onChange={(e) => setSearchHistoryQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
          </div>

          {patientReports.length === 0 ? (
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
              Aucun examen échographique antérieur pour ce patient.
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
              {patientReports.map((r) => (
                <div key={r.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-cyan-400 font-bold">{r.date}</span>
                    <button
                      onClick={() => handleReusePastReport(r)}
                      className="px-2 py-0.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded font-semibold text-[10px] hover:border-cyan-500/60 transition"
                    >
                      Dupliquer
                    </button>
                  </div>

                  <div className="font-bold text-white text-xs leading-snug">
                    {r.examTypeName}
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-900/70 p-2 rounded border border-slate-800 line-clamp-3">
                    <span className="font-bold text-cyan-400">Conclusion : </span>
                    {r.conclusion}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-slate-400">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onOpenPrintable('ultrasound', { ultrasound: r })}
                        className="p-1 hover:text-white"
                        title="Imprimer A4"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(r)}
                        className="p-1 hover:text-emerald-400"
                        title="Partager sur WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {r.doctorName || 'Dr. Médecin'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  Enregistrer comme nouveau modèle d'échographie
                </h3>
              </div>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nom du modèle d'examen *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Échographie Doppler Veineux Membres Inférieurs..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Catégorie d'examen *</label>
                <select
                  value={newTemplateType}
                  onChange={(e) => setNewTemplateType(e.target.value as UltrasoundType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="abdominal">Abdominale</option>
                  <option value="pelvic">Pelvienne / Gynécologique</option>
                  <option value="obstetric">Obstétricale</option>
                  <option value="thyroid">Thyroïdienne & Cervicale</option>
                  <option value="renal_urinary">Rénale & Urinaire</option>
                  <option value="breast">Mammaire</option>
                  <option value="custom">Autre / Personnalisé</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-slate-400 text-[11px]">Aperçu de la structure enregistrée :</div>
                <div className="text-[11px] text-slate-300 line-clamp-2">
                  <strong>Résultats : </strong> {findings.slice(0, 100)}...
                </div>
                <div className="text-[11px] text-cyan-300 line-clamp-1">
                  <strong>Conclusion par défaut : </strong> {conclusion}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md"
                >
                  Enregistrer le modèle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ultrasound Template Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer ce modèle d'échographie ?</h3>
              <p className="text-xs text-slate-300">
                Voulez-vous vraiment supprimer ce modèle personnalisé de votre catalogue ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
