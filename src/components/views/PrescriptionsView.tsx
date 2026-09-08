import React, { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Share2,
  Mail,
  MessageSquare,
  Search,
  RotateCcw,
  Pill,
  User,
  Calendar,
  CheckCircle,
  Sparkles,
  Bookmark,
  BookmarkPlus,
  X,
  Layers,
  ChevronRight,
  Stethoscope,
  Download,
  Check,
  ArrowDown,
} from 'lucide-react';
import {
  Prescription,
  PrescriptionItem,
  PrescriptionTemplate,
  Patient,
  Medication,
  CabinetSettings,
} from '../../types';
import {
  getStoredPrescriptionTemplates,
  saveStoredPrescriptionTemplates,
} from '../../utils/prescriptionTemplates';
import { triggerPrintDocument, openWhatsAppLink, openEmailClient } from '../../utils/pdfPrint';
import { MedicationAutocompleteInput } from '../MedicationAutocompleteInput';

interface PrescriptionsViewProps {
  prescriptions: Prescription[];
  patients: Patient[];
  medications: Medication[];
  settings: CabinetSettings;
  onSavePrescriptions: (pres: Prescription[]) => void;
  onSaveMedications?: (meds: Medication[]) => void;
  onOpenPrintable: (type: 'prescription', data: { prescription: Prescription }) => void;
  initialPatientId?: string;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  prescriptions,
  patients,
  medications,
  settings,
  onSavePrescriptions,
  onSaveMedications,
  onOpenPrintable,
  initialPatientId,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patients[0]?.id || ''
  );
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      medicineName: medications[0]?.name || 'Paracétamol 1000mg',
      dosage: medications[0]?.defaultDosage || '1 comprimé 3 fois par jour',
      duration: '5 jours',
      instructions: 'Après les repas avec de l’eau',
    },
  ]);
  const [notes, setNotes] = useState('Se conformer strictement aux doses indiquées.');

  // Templates State
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>(() =>
    getStoredPrescriptionTemplates()
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Général');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Interactive feedback states for templates
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<{ message: string; subMessage?: string } | null>(null);
  const [isTableHighlighted, setIsTableHighlighted] = useState(false);
  const prescriptionEditorRef = useRef<HTMLDivElement>(null);

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleAddItem = (med?: Medication) => {
    if (med) {
      const displayTitle = med.dosage ? `${med.name} ${med.dosage}` : med.name;
      setItems([
        ...items,
        {
          medicineName: displayTitle,
          dci: med.dci,
          dosage: med.defaultDosage || '1 prise par jour',
          duration: med.defaultDuration || '5 à 7 jours',
          instructions: med.defaultInstructions || '',
          quantity: '1 boîte',
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          medicineName: '',
          dosage: '1 comprimé 3 fois par jour',
          duration: '5 jours',
          instructions: '',
          quantity: '1 boîte',
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleApplyTemplate = (tmpl: PrescriptionTemplate, mode: 'replace' | 'append' = 'replace') => {
    const clonedItems = tmpl.items.map((it) => ({ ...it }));

    if (mode === 'replace') {
      setItems(clonedItems);
      if (tmpl.notes) setNotes(tmpl.notes);
      setToastNotice({
        message: `Modèle « ${tmpl.name} » chargé avec succès !`,
        subMessage: `${clonedItems.length} médicament(s) configuré(s) dans l'ordonnance.`,
      });
    } else {
      setItems((prev) => [...prev, ...clonedItems]);
      if (tmpl.notes && !notes.includes(tmpl.notes)) {
        setNotes((prev) => (prev ? `${prev}\n${tmpl.notes}` : tmpl.notes || ''));
      }
      setToastNotice({
        message: `Médicaments ajoutés avec succès !`,
        subMessage: `+${clonedItems.length} médicament(s) du modèle « ${tmpl.name} » ajoutés à l'ordonnance.`,
      });
    }

    // Set feedback indicator on the clicked card
    setLoadedTemplateId(tmpl.id);
    setTimeout(() => {
      setLoadedTemplateId(null);
    }, 2500);

    // Auto-dismiss toast
    setTimeout(() => {
      setToastNotice(null);
    }, 4000);

    // Highlight the table visually
    setIsTableHighlighted(true);
    setTimeout(() => {
      setIsTableHighlighted(false);
    }, 2500);

    // Auto-scroll to the prescription editor so user immediately sees the items
    setTimeout(() => {
      prescriptionEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    if (items.length === 0) {
      setToastNotice({
        message: "Attention : Aucun médicament dans l'ordonnance",
        subMessage: "Veuillez d'abord ajouter au moins 1 médicament pour créer ce modèle.",
      });
      return;
    }

    const newTmpl: PrescriptionTemplate = {
      id: `tmpl_${Date.now()}`,
      name: newTemplateName.trim(),
      category: newTemplateCategory.trim() || 'Général',
      description: newTemplateDescription.trim() || undefined,
      items: items.map((it) => ({ ...it })),
      notes: notes.trim() || undefined,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTmpl, ...templates];
    setTemplates(updated);
    saveStoredPrescriptionTemplates(updated);
    setShowSaveTemplateModal(false);
    setNewTemplateName('');
    setNewTemplateDescription('');

    setToastNotice({
      message: `Nouveau modèle « ${newTmpl.name} » créé avec succès !`,
      subMessage: `Disponible avec ${newTmpl.items.length} médicament(s) dans vos Touches Rapides.`,
    });
  };

  const handleDeleteTemplate = (tmplId: string) => {
    setTemplateToDelete(tmplId);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;
    const tmplId = templateToDelete;
    const updated = templates.filter((t) => t.id !== tmplId);
    setTemplates(updated);
    saveStoredPrescriptionTemplates(updated);
    setTemplateToDelete(null);
  };

  const handleSavePrescription = () => {
    if (!currentPatient || items.length === 0) return;

    const newPrescription: Prescription = {
      id: `prc_${Date.now()}`,
      patientId: currentPatient.id,
      patientName: `${currentPatient.lastName} ${currentPatient.firstName}`,
      patientAge: currentPatient.age,
      date: new Date().toISOString().split('T')[0],
      items,
      notes,
      createdAt: new Date().toISOString(),
    };

    onSavePrescriptions([newPrescription, ...prescriptions]);
    onOpenPrintable('prescription', { prescription: newPrescription });
  };

  const handleReusePastPrescription = (past: Prescription) => {
    setItems(past.items);
    setNotes(past.notes || '');
  };

  // WhatsApp share generator
  const handleShareWhatsApp = (p: Prescription) => {
    let msg = `*Ordonnance Médicale - ${settings.doctorName}*\n`;
    msg += `Patient: ${p.patientName}\n`;
    msg += `Date: ${p.date}\n\n`;
    msg += `*Médicaments :*\n`;
    p.items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.medicineName} — ${item.dosage} (${item.duration})\n`;
    });
    if (p.notes) msg += `\n*Conseils:* ${p.notes}`;
    openWhatsAppLink(currentPatient?.phone || '', msg);
  };

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const filteredTemplates = templates.filter((t) => {
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(templateSearch.toLowerCase())) ||
      t.items.some((it) => it.medicineName.toLowerCase().includes(templateSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const patientHistory = prescriptions.filter((p) => p.patientId === currentPatient?.id);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Éditeur & Protocoles d'Ordonnances</h1>
            <p className="text-xs text-slate-400">
              Prescription rapide, modèles types ("Touches"), impression A4 & export
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="px-3.5 py-2 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-600 flex items-center space-x-1.5 transition-all duration-200"
            title="Enregistrer la prescription actuelle comme modèle réutilisable"
          >
            <BookmarkPlus className="w-4 h-4 text-emerald-400" />
            <span>Enregistrer Modèle</span>
          </button>

          <button
            onClick={handleSavePrescription}
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md border border-emerald-500/80 hover:brightness-105 hover:border-emerald-400 flex items-center space-x-2 transition-all duration-200"
          >
            <Printer className="w-4 h-4" />
            <span>Générer & Imprimer A4</span>
          </button>
        </div>
      </div>

      {/* Floating Action Confirmation Toast */}
      {toastNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce-short">
          <div className="flex items-center space-x-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm">{toastNotice.message}</div>
              {toastNotice.subMessage && (
                <div className="text-xs text-emerald-100 font-medium">{toastNotice.subMessage}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToastNotice(null)}
              className="ml-2 text-white/80 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Touch Template Bar ("Touches Rapides de Protocoles") */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider whitespace-nowrap">
              Touches & Protocoles Rapides
            </span>
            <span className="hidden xl:inline-block text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-medium">
              Remplissage 1-Clic
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick jump to editor indicator */}
            <button
              type="button"
              onClick={() => prescriptionEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-all shrink-0"
              title="Descendre vers l'ordonnance en cours"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ordonnance ({items.length} méd.)</span>
              <ArrowDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Quick create template */}
            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-all shrink-0 border border-emerald-500"
              title="Créer ou enregistrer un nouveau modèle"
            >
              <Plus className="w-3.5 h-3.5 text-white shrink-0" />
              <span>+ Créer Modèle</span>
            </button>

            {/* Quick Search */}
            <div className="relative w-full sm:w-52 shrink-0">
              <input
                type="text"
                placeholder="Rechercher un modèle..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Tous ({templates.length})
          </button>
          {categories.map((cat) => {
            const count = templates.filter((t) => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Interactive Template Touch Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pt-1">
          {filteredTemplates.map((tmpl) => {
            const isJustLoaded = loadedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                className={`group relative bg-slate-950 hover:bg-slate-900 border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg cursor-pointer text-left min-h-[125px] ${
                  isJustLoaded
                    ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-800 hover:border-emerald-500/60'
                }`}
                onClick={() => handleApplyTemplate(tmpl, 'replace')}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-bold text-slate-100 group-hover:text-emerald-400 text-xs leading-snug line-clamp-2">
                      {tmpl.name}
                    </span>
                    {tmpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(tmpl.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-0.5 shrink-0"
                        title="Supprimer ce modèle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 line-clamp-1 font-medium">
                    {tmpl.items.length} médicament(s) • <span className="text-slate-300">{tmpl.category}</span>
                  </div>
                </div>

                <div className="pt-2.5 flex items-center justify-between border-t border-slate-800/80 mt-2.5 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTemplate(tmpl, 'replace');
                    }}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm active:scale-95 transition-all whitespace-nowrap"
                    title="Remplacer l'ordonnance actuelle par ce modèle"
                  >
                    {isJustLoaded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>Chargé !</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>Charger</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTemplate(tmpl, 'append');
                    }}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white rounded-lg border border-slate-700 font-bold text-xs shadow-sm active:scale-95 transition-all whitespace-nowrap"
                    title="Ajouter ces médicaments à l'ordonnance en cours sans effacer les existants"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>+ Ajouter</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prescription Form (8 cols) */}
        <div
          ref={prescriptionEditorRef}
          className={`lg:col-span-8 bg-slate-900 border rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl text-xs transition-all duration-300 ${
            isTableHighlighted ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-800'
          }`}
        >
          {/* Patient Header Selector */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block font-bold text-slate-300 mb-1">Sélectionner le Patient :</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName} ({p.age} ans) {p.cin ? `— CIN: ${p.cin}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right text-xs text-slate-400">
                <div className="font-semibold text-emerald-400">{settings.doctorName}</div>
                <div>{new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>

          {/* Quick Drug Lookup Bar with Moroccan Offline Drug Database */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">
                      Banque de Médicaments du Maroc
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                      Offline
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Recherche instantanée par Nom, DCI, Dosage, Forme ou Laboratoire
                  </span>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-mono border border-slate-800">
                {medications.length} références
              </span>
            </div>

            <MedicationAutocompleteInput
              medications={medications}
              placeholder="Rechercher : Doliprane, Paracétamol, Augmentin, Inexium, 1000mg, Laprophan..."
              onSelectMedication={(med) => {
                handleAddItem(med);
              }}
              onAddNewMedication={
                onSaveMedications
                  ? (newMed) => {
                      const updated = [newMed, ...medications];
                      onSaveMedications(updated);
                      handleAddItem(newMed);
                    }
                  : undefined
              }
            />
          </div>

          {/* Prescription Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Liste des Médicaments Prescrits ({items.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="px-3 py-1 bg-slate-800 text-emerald-400 rounded-lg font-semibold flex items-center space-x-1 border border-slate-700 hover:border-slate-500 hover:brightness-105 transition-all duration-200 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ligne personnalisée</span>
              </button>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/90 space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                      Médicament #{index + 1}
                    </span>
                    {item.dci && (
                      <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        DCI: {item.dci}
                      </span>
                    )}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Nom Commercial / Spécialité
                    </label>
                    <input
                      type="text"
                      value={item.medicineName}
                      onChange={(e) => handleUpdateItem(index, 'medicineName', e.target.value)}
                      placeholder="Nom du médicament & dosage"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Posologie usuelle
                    </label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleUpdateItem(index, 'dosage', e.target.value)}
                      placeholder="ex: 1 cp 3x/jour"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Durée
                    </label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => handleUpdateItem(index, 'duration', e.target.value)}
                      placeholder="ex: 7 jours"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Quantité / Conditionnement
                    </label>
                    <input
                      type="text"
                      value={item.quantity || ''}
                      onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                      placeholder="ex: 1 boîte, 2 flacons..."
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Instructions & Conseils particuliers
                    </label>
                    <input
                      type="text"
                      value={item.instructions || ''}
                      onChange={(e) => handleUpdateItem(index, 'instructions', e.target.value)}
                      placeholder="Instructions particulières (pendant le repas, à jeun, espacer de 6h)..."
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 italic focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Recommandations & Conseils Généraux
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Régime hyposodé, boire abondamment, repos recommandé..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right Column: History & Reuse Ordonnance (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Anciennes Ordonnances du Patient</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Réutilisez un traitement précédent en 1 clic
            </p>
          </div>

          {patientHistory.length === 0 ? (
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
              Aucune ancienne ordonnance enregistrée pour ce patient.
            </div>
          ) : (
            <div className="space-y-3 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
              {patientHistory.map((p) => (
                <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-emerald-400 font-bold">{p.date}</span>
                    <button
                      onClick={() => handleReusePastPrescription(p)}
                      className="px-2 py-0.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold text-[10px] hover:border-emerald-500/60 hover:brightness-105 transition-all duration-200"
                    >
                      Réutiliser
                    </button>
                  </div>

                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    {p.items.map((item, i) => (
                      <li key={i} className="truncate">
                        {item.medicineName} ({item.duration})
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-900">
                    <button
                      onClick={() => onOpenPrintable('prescription', { prescription: p })}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Imprimer A4"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp(p)}
                      className="p-1 text-slate-400 hover:text-emerald-400"
                      title="Partager sur WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Enregistrer l'ordonnance actuelle comme modèle
                </h3>
              </div>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nom du modèle / Protocole *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Angine adulte, Bilan Diabète, Sciatalgie..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Catégorie / Spécialité *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: ORL, Cardiologie, Gastro-entérologie, Général..."
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Description / Indication (Optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Traitement de première intention pour angine rouge fébrile"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Preview of Items */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-400 text-[11px]">
                  Médicaments inclus ({items.length}) :
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {items.map((it, idx) => (
                    <li key={idx}>
                      <span className="font-semibold text-white">{it.medicineName || 'Non spécifié'}</span> — {it.dosage} ({it.duration})
                    </li>
                  ))}
                </ul>
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
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 shadow-md"
                >
                  Enregistrer le modèle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer ce modèle d'ordonnance ?</h3>
              <p className="text-xs text-slate-300">
                Voulez-vous vraiment supprimer ce modèle d’ordonnance personnalisé ?
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
