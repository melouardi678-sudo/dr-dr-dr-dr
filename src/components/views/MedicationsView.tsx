import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Check,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  Building2,
  Layers,
  Coins,
  ShieldAlert,
  Info,
  ExternalLink,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  LayoutGrid,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Medication, Prescription, AppUser } from '../../types';
import { addAuditLog } from '../../utils/storage';
import {
  searchMedications,
  exportMedicationsToExcel,
  exportMedicationsToCSV,
  downloadMedicationExcelTemplate,
  parseMedicationsFromFile,
  resetOfficialMedicationsKeepingCustom,
} from '../../utils/medicationSearch';

interface MedicationsViewProps {
  medications: Medication[];
  prescriptions: Prescription[];
  currentUser: AppUser;
  onSaveMedications: (meds: Medication[]) => void;
}

const POPULAR_QUICK_CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'Antalgiques & Antipyrétiques', label: 'Antalgiques' },
  { id: 'Anti-inflammatoires (AINS)', label: 'AINS' },
  { id: 'Antibiotiques & Antibactériens', label: 'Antibiotiques' },
  { id: 'Cardiologie & Hypertension', label: 'Cardio / HTA' },
  { id: 'Diabétologie & Endocrinologie', label: 'Diabétologie' },
  { id: 'Gastro-Entérologie & Digestif', label: 'Gastro' },
  { id: 'Pneumologie & ORL', label: 'Pneumo / ORL' },
  { id: 'Neurologie & Psychiatrie', label: 'Neuro / Psy' },
  { id: 'Dermatologie', label: 'Dermato' },
  { id: 'Ophtalmologie', label: 'Ophtalmo' },
  { id: 'Vitamines & Minéraux', label: 'Vitamines' },
];

export const MedicationsView: React.FC<MedicationsViewProps> = ({
  medications,
  prescriptions,
  currentUser,
  onSaveMedications,
}) => {
  // Navigation & View Modes: 'dense' (compact cards), 'grid' (standard cards), 'table' (ultra-compact rows)
  const [viewMode, setViewMode] = useState<'dense' | 'grid' | 'table'>('dense');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'preloaded' | 'custom'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('active');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(60);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [inspectingMed, setInspectingMed] = useState<Medication | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Deletion / Deactivation modal states
  const [targetMed, setTargetMed] = useState<Medication | null>(null);
  const [deleteChoiceModalOpen, setDeleteChoiceModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportMeds, setParsedImportMeds] = useState<Partial<Medication>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [dci, setDci] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageForm, setDosageForm] = useState('Comprimé');
  const [laboratory, setLaboratory] = useState('');
  const [category, setCategory] = useState('Général');
  const [defaultDosage, setDefaultDosage] = useState('1 comprimé 3 fois par jour');
  const [defaultDuration, setDefaultDuration] = useState('5 à 7 jours');
  const [defaultInstructions, setDefaultInstructions] = useState('');
  const [contraindications, setContraindications] = useState('Aucune contre-indication majeure');
  const [sideEffects, setSideEffects] = useState('');
  const [presentation, setPresentation] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(50);
  const [isActive, setIsActive] = useState(true);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSource, selectedStatus, pageSize]);

  // Permissions
  const isAdminOrDoctor =
    currentUser.role === 'admin' || currentUser.role === 'doctor';
  const canAdd =
    isAdminOrDoctor || currentUser.permissions?.canAddMedications !== false;
  const canEdit =
    isAdminOrDoctor || currentUser.permissions?.canEditMedications !== false;
  const canDelete =
    isAdminOrDoctor || currentUser.permissions?.canDeleteMedications !== false;
  const canManageDB =
    isAdminOrDoctor || currentUser.permissions?.canManageDrugDatabase !== false;

  // Catégories uniques
  const categories = useMemo(() => {
    const set = new Set<string>();
    medications.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [medications]);

  // Médicaments filtrés selon la recherche et les critères
  const filteredMeds = useMemo(() => {
    return searchMedications(searchQuery, medications, {
      includeInactive: selectedStatus !== 'active',
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      source: selectedSource,
      limit: 10000,
    }).filter((m) => {
      if (selectedStatus === 'inactive' && m.isActive !== false) return false;
      return true;
    });
  }, [searchQuery, medications, selectedCategory, selectedSource, selectedStatus]);

  // Pagination calculation
  const totalPages = useMemo(() => {
    if (pageSize === 0) return 1;
    return Math.max(1, Math.ceil(filteredMeds.length / pageSize));
  }, [filteredMeds.length, pageSize]);

  const paginatedMeds = useMemo(() => {
    if (pageSize === 0) return filteredMeds;
    const start = (currentPage - 1) * pageSize;
    return filteredMeds.slice(start, start + pageSize);
  }, [filteredMeds, currentPage, pageSize]);

  // Statistiques rapides
  const stats = useMemo(() => {
    const total = medications.length;
    const preloaded = medications.filter((m) => m.isPreloaded).length;
    const custom = medications.filter((m) => !m.isPreloaded || m.isCustom).length;
    const active = medications.filter((m) => m.isActive !== false).length;
    return { total, preloaded, custom, active };
  }, [medications]);

  const showNotification = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleOpenNew = () => {
    if (!canAdd) {
      showNotification("Vous n'avez pas l'autorisation d'ajouter des médicaments.", true);
      return;
    }
    setEditingMed(null);
    setName('');
    setDci('');
    setDosage('');
    setDosageForm('Comprimé');
    setLaboratory('');
    setCategory('Général');
    setDefaultDosage('1 comprimé 3 fois par jour');
    setDefaultDuration('5 à 7 jours');
    setDefaultInstructions('');
    setContraindications('Aucune contre-indication majeure');
    setSideEffects('');
    setPresentation('');
    setStockQuantity(50);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleEdit = (m: Medication) => {
    if (!canEdit) {
      showNotification("Vous n'avez pas l'autorisation de modifier ce médicament.", true);
      return;
    }
    setEditingMed(m);
    setName(m.name);
    setDci(m.dci || '');
    setDosage(m.dosage || '');
    setDosageForm(m.dosageForm || 'Comprimé');
    setLaboratory(m.laboratory || '');
    setCategory(m.category || 'Général');
    setDefaultDosage(m.defaultDosage || '');
    setDefaultDuration(m.defaultDuration || '');
    setDefaultInstructions(m.defaultInstructions || '');
    setContraindications(m.contraindications || '');
    setSideEffects(m.sideEffects || '');
    setPresentation(m.presentation || '');
    setStockQuantity(m.stockQuantity !== undefined ? m.stockQuantity : 50);
    setIsActive(m.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('Le nom du médicament est requis.', true);
      return;
    }

    try {
      if (editingMed) {
        const updatedMed: Medication = {
          ...editingMed,
          name: name.trim(),
          dci: dci.trim() || undefined,
          dosage: dosage.trim() || undefined,
          dosageForm: dosageForm.trim(),
          laboratory: laboratory.trim() || undefined,
          category: category.trim() || 'Général',
          defaultDosage: defaultDosage.trim(),
          defaultDuration: defaultDuration.trim() || undefined,
          defaultInstructions: defaultInstructions.trim() || undefined,
          contraindications: contraindications.trim(),
          sideEffects: sideEffects.trim() || undefined,
          presentation: presentation.trim() || undefined,
          stockQuantity: stockQuantity === '' ? undefined : Number(stockQuantity),
          isActive,
          updatedAt: new Date().toISOString(),
        };

        const updated = medications.map((m) =>
          m.id === editingMed.id ? updatedMed : m
        );
        onSaveMedications(updated);
        addAuditLog(
          'UPDATE',
          `Modification du médicament ${updatedMed.name} par ${currentUser.fullName || currentUser.username} (${currentUser.role})`
        );
        showNotification(`Le médicament « ${updatedMed.name} » a été mis à jour avec succès.`);
      } else {
        const newM: Medication = {
          id: `custom_med_${Date.now()}`,
          name: name.trim(),
          dci: dci.trim() || undefined,
          dosage: dosage.trim() || undefined,
          dosageForm: dosageForm.trim(),
          laboratory: laboratory.trim() || undefined,
          category: category.trim() || 'Général',
          defaultDosage: defaultDosage.trim(),
          defaultDuration: defaultDuration.trim() || undefined,
          defaultInstructions: defaultInstructions.trim() || undefined,
          contraindications: contraindications.trim(),
          sideEffects: sideEffects.trim() || undefined,
          presentation: presentation.trim() || undefined,
          stockQuantity: stockQuantity === '' ? undefined : Number(stockQuantity),
          isActive,
          isCustom: true,
          isPreloaded: false,
          createdAt: new Date().toISOString(),
        };

        onSaveMedications([newM, ...medications]);
        addAuditLog(
          'CREATE',
          `Création du médicament personnalisé ${newM.name} par ${currentUser.fullName || currentUser.username} (${currentUser.role})`
        );
        showNotification(`Le médicament « ${newM.name} » a été ajouté au cabinet.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showNotification(err?.message || "Une erreur est survenue lors de l'enregistrement.", true);
    }
  };

  const handleDeleteTrigger = (med: Medication) => {
    if (!canDelete) {
      showNotification("Vous n'avez pas l'autorisation de supprimer des médicaments.", true);
      return;
    }
    setTargetMed(med);

    // Vérifier si le médicament est utilisé dans des ordonnances existantes
    const isUsed = prescriptions.some((p) =>
      p.items.some(
        (item) =>
          item.medicineName.toLowerCase().includes(med.name.toLowerCase()) ||
          (med.dci && item.medicineName.toLowerCase().includes(med.dci.toLowerCase()))
      )
    );

    if (isUsed) {
      setDeleteChoiceModalOpen(true);
    } else {
      setDeleteConfirmModalOpen(true);
    }
  };

  const handleDeactivate = () => {
    if (!targetMed) return;
    try {
      const updated = medications.map((m) =>
        m.id === targetMed.id ? { ...m, isActive: false } : m
      );
      onSaveMedications(updated);
      addAuditLog(
        'UPDATE',
        `Désactivation du médicament ${targetMed.name} par ${currentUser.fullName || currentUser.username} (${currentUser.role})`
      );
      setDeleteChoiceModalOpen(false);
      setTargetMed(null);
      showNotification(`Le médicament « ${targetMed.name} » a été désactivé.`);
    } catch (err: any) {
      showNotification(err?.message || 'Erreur lors de la désactivation.', true);
    }
  };

  const handleConfirmPermanentDelete = () => {
    if (!targetMed) return;
    try {
      const updated = medications.filter((m) => m.id !== targetMed.id);
      onSaveMedications(updated);
      addAuditLog(
        'DELETE',
        `Suppression définitive du médicament ${targetMed.name} par ${currentUser.fullName || currentUser.username} (${currentUser.role})`
      );
      setDeleteConfirmModalOpen(false);
      setDeleteChoiceModalOpen(false);
      setTargetMed(null);
      showNotification(`Le médicament « ${targetMed.name} » a été supprimé définitivement.`);
    } catch (err: any) {
      showNotification(err?.message || 'Erreur lors de la suppression.', true);
    }
  };

  const handleResetCatalog = () => {
    if (!canManageDB) {
      showNotification("Autorisation requise pour réinitialiser la base de données.", true);
      return;
    }
    try {
      const refreshed = resetOfficialMedicationsKeepingCustom(medications);
      onSaveMedications(refreshed);
      addAuditLog(
        'RESTORE',
        `Réinitialisation de la base officielle marocaine par ${currentUser.fullName || currentUser.username} (médicaments personnalisés préservés)`
      );
      setResetConfirmOpen(false);
      showNotification(
        'La base officielle des médicaments du Maroc a été réinitialisée avec succès, vos médicaments personnalisés ont été conservés.'
      );
    } catch (err: any) {
      showNotification('Erreur lors de la réinitialisation.', true);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportMedicationsToExcel(filteredMeds);
      showNotification(`${filteredMeds.length} médicaments exportés vers Microsoft Excel.`);
    } catch (err: any) {
      showNotification("Erreur lors de l'export Excel.", true);
    }
  };

  const handleExportCSV = () => {
    try {
      exportMedicationsToCSV(filteredMeds);
      showNotification(`${filteredMeds.length} médicaments exportés au format CSV.`);
    } catch (err: any) {
      showNotification("Erreur lors de l'export CSV.", true);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsImporting(true);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const { medications: parsed, errors } = parseMedicationsFromFile(buffer);
        setParsedImportMeds(parsed);
        setImportErrors(errors);
      } catch (err: any) {
        setImportErrors([`Erreur de traitement: ${err?.message || 'Format non reconnu'}`]);
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setImportErrors(['Erreur lors de la lecture physique du fichier.']);
      setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (parsedImportMeds.length === 0) return;

    const newMeds: Medication[] = parsedImportMeds.map((p, idx) => ({
      id: `imported_med_${Date.now()}_${idx}`,
      name: p.name || 'Médicament sans nom',
      dci: p.dci,
      dosage: p.dosage,
      dosageForm: p.dosageForm || 'Comprimé',
      laboratory: p.laboratory,
      category: p.category || 'Général',
      defaultDosage: p.defaultDosage || '1 comprimé par jour',
      defaultDuration: p.defaultDuration || '5 jours',
      defaultInstructions: p.defaultInstructions,
      contraindications: p.contraindications || 'Aucune connue',
      sideEffects: p.sideEffects,
      presentation: p.presentation,
      isCustom: true,
      isPreloaded: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    // Fusionner en évitant les doublons par nom exact
    const existingNames = new Set(medications.map((m) => m.name.toLowerCase().trim()));
    const finalToAdd = newMeds.filter((m) => !existingNames.has(m.name.toLowerCase().trim()));

    const merged = [...finalToAdd, ...medications];
    onSaveMedications(merged);

    addAuditLog(
      'IMPORT',
      `Importation de ${finalToAdd.length} médicaments via fichier Excel/CSV par ${currentUser.fullName || currentUser.username}`
    );

    setImportModalOpen(false);
    setImportFile(null);
    setParsedImportMeds([]);
    setImportErrors([]);
    showNotification(`${finalToAdd.length} nouveaux médicaments ont été importés et ajoutés au cabinet.`);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Messages de succès ou d'erreur */}
      {successMessage && (
        <div className="bg-emerald-950/90 border border-emerald-700/80 text-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xl text-xs font-semibold backdrop-blur-md animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950/90 border border-rose-700/80 text-rose-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xl text-xs font-semibold backdrop-blur-md animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bannière d'en-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Base de données des Médicaments (Maroc)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                100% Hors-Ligne
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Référentiel thérapeutique national marocain avec DCI, dosages, laboratoires, formes galéniques et posologies usuelles.
            </p>
          </div>
        </div>

        {/* Boutons d'action principaux */}
        <div className="flex items-center gap-2 flex-wrap">
          {canAdd && (
            <button
              onClick={handleOpenNew}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nouveau Médicament</span>
            </button>
          )}

          {canManageDB && (
            <button
              onClick={() => {
                setImportFile(null);
                setParsedImportMeds([]);
                setImportErrors([]);
                setImportModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition-all"
              title="Importer des médicaments depuis un fichier Excel ou CSV"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Importer Excel</span>
            </button>
          )}

          <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden bg-slate-800/80">
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-2 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
              title="Exporter au format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <div className="w-px h-4 bg-slate-700" />
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-2 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
              title="Exporter au format CSV"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>

          {canManageDB && (
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition"
              title="Réinitialiser la base officielle marocaine (préserve vos ajouts)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cartes de statistiques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Médicaments</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Enregistrés dans MediCab</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Base Officielle Maroc</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300">{stats.preloaded}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">Spécialités courantes</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ajoutés par le Cabinet</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300">{stats.custom}</div>
          <div className="text-[11px] text-purple-400/80 mt-0.5">Personnalisés / Modifiés</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Médicaments Actifs</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300">{stats.active}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Disponibles en ordonnance</div>
        </div>
      </div>

      {/* Barre d'outils, Recherche avancée et Filtres */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Champ de recherche instantanée multi-champs */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Recherche rapide parmi +1500 médicaments (Nom, DCI, Dosage, Forme, Labo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sélecteurs de filtres & Mode d'affichage */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtre Catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[170px] truncate"
            >
              <option value="all">Toutes les classes ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filtre Source */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Origine: Tout</option>
              <option value="preloaded">Maroc Officiel ({stats.preloaded})</option>
              <option value="custom">Cabinet ({stats.custom})</option>
            </select>

            {/* Filtre Statut */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="active">Actifs seulement</option>
              <option value="all">Actifs & Inactifs</option>
              <option value="inactive">Désactivés</option>
            </select>

            {/* Sélecteur de nombre d'éléments par page */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 px-2 py-1.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              title="Nombre de médicaments par page"
            >
              <option value={30}>30 / page</option>
              <option value={60}>60 / page</option>
              <option value={120}>120 / page</option>
              <option value={240}>240 / page</option>
              <option value={0}>Tous ({filteredMeds.length})</option>
            </select>

            {/* Bascule Vue Compacte / Standard / Tableau */}
            <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('dense')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'dense'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vue Compacte (Affiche un maximum de médicaments)"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Compact</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vue détaillée en cartes"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vue liste en tableau ultra-dense"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Boutons de catégories rapides 1-clic */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] pt-1 border-t border-slate-800/80">
          <span className="text-slate-400 font-semibold text-[10px] uppercase whitespace-nowrap mr-1">
            Filtre rapide :
          </span>
          {POPULAR_QUICK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Indicateur de résultats & pagination info */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              <strong className="text-white">{filteredMeds.length}</strong> médicament(s) trouvé(s)
              {searchQuery && (
                <span> pour « <span className="text-cyan-300 font-semibold">{searchQuery}</span> »</span>
              )}
            </span>
            {pageSize > 0 && totalPages > 1 && (
              <span className="text-slate-400 font-mono text-[11px]">
                (Page <span className="text-cyan-400 font-bold">{currentPage}</span> sur {totalPages})
              </span>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-cyan-400 hover:underline"
            >
              Effacer le filtre
            </button>
          )}
        </div>
      </div>

      {/* 1. VUE COMPACTE (DENSE) - Optimisée pour afficher le plus grand nombre */}
      {viewMode === 'dense' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 text-left">
          {paginatedMeds.map((med) => (
            <div
              key={med.id}
              onClick={() => setInspectingMed(med)}
              className={`bg-slate-900 border rounded-xl p-2.5 space-y-1.5 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-150 hover:border-cyan-500/60 hover:bg-slate-850 hover:shadow-cyan-500/5 group ${
                med.isActive === false
                  ? 'opacity-60 border-slate-800/50 bg-slate-950/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-1">
                {/* En-tête : Catégorie & Badges & Actions */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase text-cyan-400 px-1.5 py-0.2 bg-cyan-950/90 rounded border border-cyan-800/50 truncate max-w-[95px]">
                      {med.category}
                    </span>
                    {med.isPreloaded ? (
                      <span className="text-[8px] font-bold uppercase text-emerald-400 px-1 py-0.2 bg-emerald-950 rounded border border-emerald-800/50 shrink-0">
                        MA
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold uppercase text-purple-400 px-1 py-0.2 bg-purple-950 rounded border border-purple-800/50 shrink-0">
                        Cab
                      </span>
                    )}
                  </div>

                  {/* Actions Rapides */}
                  <div
                    className="flex items-center space-x-0.5 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setInspectingMed(med)}
                      className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800"
                      title="Consulter la fiche"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(med)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="Modifier"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTrigger(med)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Nom commercial & Dosage */}
                <div className="pt-0.5">
                  <div className="flex items-baseline justify-between gap-1">
                    <h3 className="font-bold text-xs text-white truncate leading-tight group-hover:text-cyan-200 transition-colors">
                      {med.name}
                    </h3>
                    {med.dosage && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 shrink-0 font-mono">
                        {med.dosage}
                      </span>
                    )}
                  </div>
                </div>

                {/* DCI */}
                {med.dci && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-300/95 font-medium truncate">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="truncate">{med.dci}</span>
                  </div>
                )}
              </div>

              {/* Forme & Labo & Posologie usuelle en bas */}
              <div className="pt-1 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate max-w-[120px]" title={`${med.dosageForm} • ${med.laboratory || ''}`}>
                  {med.dosageForm} {med.laboratory ? `• ${med.laboratory}` : ''}
                </span>
                <span className="text-slate-400 text-[9px] font-sans">
                  Stock: <strong className="text-slate-200 font-mono">{med.stockQuantity || 0}</strong>
                </span>
              </div>
            </div>
          ))}

          {filteredMeds.length === 0 && (
            <div className="col-span-full p-10 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-3">
              <Pill className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Aucun médicament trouvé</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Aucun résultat ne correspond à votre recherche. Vous pouvez créer un médicament personnalisé ou réinitialiser les filtres.
              </p>
              {canAdd && (
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Créer le médicament
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. VUE GRILLE STANDARD (DÉTAILLÉE) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-left">
          {paginatedMeds.map((med) => (
            <div
              key={med.id}
              onClick={() => setInspectingMed(med)}
              className={`bg-slate-900 border rounded-2xl p-3.5 space-y-2.5 shadow-md flex flex-col justify-between cursor-pointer transition-all duration-200 hover:border-cyan-500/50 hover:shadow-cyan-500/5 ${
                med.isActive === false
                  ? 'opacity-60 border-slate-800/50 bg-slate-950/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-2">
                {/* Badges d'origine et classe */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-cyan-400 px-2 py-0.5 bg-cyan-950/80 rounded-md border border-cyan-800/50">
                      {med.category}
                    </span>
                    {med.isPreloaded ? (
                      <span className="text-[9px] font-bold uppercase text-emerald-400 px-1.5 py-0.5 bg-emerald-950/80 rounded-md border border-emerald-800/50">
                        Maroc
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase text-purple-400 px-1.5 py-0.5 bg-purple-950/80 rounded-md border border-purple-800/50">
                        Cabinet
                      </span>
                    )}
                    {med.isActive === false && (
                      <span className="text-[9px] font-bold uppercase text-rose-400 px-1.5 py-0.5 bg-rose-950/80 rounded-md border border-rose-800/50">
                        Désactivé
                      </span>
                    )}
                  </div>

                  {/* Boutons Actions Rapides */}
                  <div
                    className="flex items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setInspectingMed(med)}
                      className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition"
                      title="Consulter la fiche complète"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(med)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="Modifier ce médicament"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTrigger(med)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                        title="Supprimer ou désactiver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Nom commercial & Dosage */}
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                    <span>{med.name}</span>
                    {med.dosage && (
                      <span className="px-1.5 py-0.2 text-xs font-semibold rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {med.dosage}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Forme: <span className="text-slate-300">{med.dosageForm}</span>
                  </p>
                </div>

                {/* DCI & Laboratoire */}
                <div className="space-y-1 text-xs">
                  {med.dci && (
                    <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">DCI: {med.dci}</span>
                    </div>
                  )}
                  {med.laboratory && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{med.laboratory}</span>
                    </div>
                  )}
                </div>

                {/* Posologie usuelle */}
                <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Posologie usuelle :
                  </span>
                  <p className="text-slate-200 line-clamp-2">{med.defaultDosage}</p>
                </div>
              </div>

              {/* Pied de carte avec Conditionnement & Stock */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 font-mono text-slate-400 mt-1">
                <span>
                  {med.presentation ? (
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px] block" title={med.presentation}>
                      {med.presentation}
                    </span>
                  ) : (
                    <span>{med.dosageForm}</span>
                  )}
                </span>
                <span>
                  Stock: <strong className="text-white">{med.stockQuantity || 0}</strong>
                </span>
              </div>
            </div>
          ))}

          {filteredMeds.length === 0 && (
            <div className="col-span-full p-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-3">
              <Pill className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Aucun médicament trouvé</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Aucun résultat ne correspond à vos filtres.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. VUE TABLEAU ULTRA-COMPACT */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-xs divide-y divide-slate-800">
              <thead className="bg-slate-800/90 text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Médicament</th>
                  <th className="px-3 py-2 text-left">DCI / Principe Actif</th>
                  <th className="px-3 py-2 text-left">Dosage</th>
                  <th className="px-3 py-2 text-left">Forme</th>
                  <th className="px-3 py-2 text-left">Laboratoire</th>
                  <th className="px-3 py-2 text-left">Classe</th>
                  <th className="px-3 py-2 text-left">Posologie Usuelle</th>
                  <th className="px-2.5 py-2 text-center">Origine</th>
                  <th className="px-2.5 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedMeds.map((med) => (
                  <tr
                    key={med.id}
                    onClick={() => setInspectingMed(med)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-1.5 font-bold text-white whitespace-nowrap">
                      {med.name}
                    </td>
                    <td className="px-3 py-1.5 text-amber-300 font-medium whitespace-nowrap">
                      {med.dci || '—'}
                    </td>
                    <td className="px-3 py-1.5 text-cyan-300 font-semibold whitespace-nowrap font-mono">
                      {med.dosage || '—'}
                    </td>
                    <td className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
                      {med.dosageForm}
                    </td>
                    <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap">
                      {med.laboratory || '—'}
                    </td>
                    <td className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {med.category}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-400 max-w-[200px] truncate">
                      {med.defaultDosage}
                    </td>
                    <td className="px-2.5 py-1.5 text-center whitespace-nowrap">
                      {med.isPreloaded ? (
                        <span className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                          Maroc
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-purple-950 text-purple-400 border border-purple-800/60">
                          Cabinet
                        </span>
                      )}
                    </td>
                    <td
                      className="px-2.5 py-1.5 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setInspectingMed(med)}
                          className="p-1 text-slate-400 hover:text-cyan-300 rounded"
                          title="Fiche détaillée"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(med)}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteTrigger(med)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BARRE DE PAGINATION MODERNE */}
      {pageSize > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Affichage des médicaments <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> à{' '}
              <strong className="text-white">{Math.min(currentPage * pageSize, filteredMeds.length)}</strong> sur{' '}
              <strong className="text-cyan-300">{filteredMeds.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Première page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Numéros de page clés */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition font-mono ${
                      currentPage === pageNum
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Dernière page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Fiche Détaille du Médicament */}
      {inspectingMed && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden text-left">
            <div className="bg-slate-800/90 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>{inspectingMed.name}</span>
                    {inspectingMed.dosage && (
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {inspectingMed.dosage}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {inspectingMed.isPreloaded ? 'Référentiel Officiel Marocain' : 'Médicament Cabinet'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingMed(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[11px] block">DCI / Principe Actif</span>
                  <span className="font-bold text-amber-300 text-sm">
                    {inspectingMed.dci || 'Non spécifié'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Laboratoire</span>
                  <span className="font-bold text-slate-200 text-sm">
                    {inspectingMed.laboratory || 'Non spécifié'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Forme Galénique</span>
                  <span className="font-medium text-slate-200">{inspectingMed.dosageForm}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Classe Thérapeutique</span>
                  <span className="font-medium text-slate-200">{inspectingMed.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Conditionnement</span>
                  <span className="font-medium text-slate-300">
                    {inspectingMed.presentation || 'Boîte standard'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Posologie Usuelle Recommandée</span>
                </label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
                  {inspectingMed.defaultDosage}
                </div>
              </div>

              {inspectingMed.defaultDuration && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 text-xs">Durée recommandée :</label>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
                    {inspectingMed.defaultDuration}
                  </div>
                </div>
              )}

              {inspectingMed.defaultInstructions && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 text-xs">Conseils & Instructions :</label>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 italic">
                    {inspectingMed.defaultInstructions}
                  </div>
                </div>
              )}

              {inspectingMed.contraindications && (
                <div className="space-y-1.5">
                  <label className="font-bold text-rose-400 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Contre-indications Majeures :</span>
                  </label>
                  <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-200">
                    {inspectingMed.contraindications}
                  </div>
                </div>
              )}

              {inspectingMed.sideEffects && (
                <div className="space-y-1.5">
                  <label className="font-bold text-amber-400 text-xs flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Effets Indésirables Fréquents :</span>
                  </label>
                  <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-200">
                    {inspectingMed.sideEffects}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Statut : <strong className={inspectingMed.isActive !== false ? 'text-emerald-400' : 'text-rose-400'}>
                  {inspectingMed.isActive !== false ? 'Actif' : 'Désactivé'}
                </strong>
              </span>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingMed(null);
                      handleEdit(inspectingMed);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
                  >
                    Modifier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectingMed(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout / Modification Complète */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden text-left">
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">
                  {editingMed ? `Modifier : ${editingMed.name}` : 'Nouveau Médicament au Répertoire'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nom Commercial du Médicament *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Doliprane, Augmentin, Inexium..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    DCI / Principe Actif
                  </label>
                  <input
                    type="text"
                    value={dci}
                    onChange={(e) => setDci(e.target.value)}
                    placeholder="Ex: Paracétamol, Amoxicilline..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ex: 1000 mg, 1 g, 500 mg..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Forme Pharmaceutique *
                  </label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Comprimé">Comprimé</option>
                    <option value="Gélule">Gélule</option>
                    <option value="Comprimé effervescent">Comprimé effervescent</option>
                    <option value="Sirop">Sirop</option>
                    <option value="Suspension buvable">Suspension buvable</option>
                    <option value="Sachet">Sachet</option>
                    <option value="Suppositoire">Suppositoire</option>
                    <option value="Injectable">Injectable</option>
                    <option value="Crème / Pommade">Crème / Pommade</option>
                    <option value="Collyre">Collyre</option>
                    <option value="Gouttes auriculaires">Gouttes auriculaires</option>
                    <option value="Spray nasal / Aérosol">Spray nasal / Aérosol</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Laboratoire
                  </label>
                  <input
                    type="text"
                    value={laboratory}
                    onChange={(e) => setLaboratory(e.target.value)}
                    placeholder="Ex: Laprophan, Sanofi Maroc, Sothema, GSK..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Classe Thérapeutique
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Antalgique / Antipyrétique, Antibiotique, Cardiologie..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Posologie Usuelle Recommandée *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={defaultDosage}
                    onChange={(e) => setDefaultDosage(e.target.value)}
                    placeholder="Ex: 1 comprimé toutes les 6 à 8h au besoin (max 4g/jour)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Durée Recommandée
                  </label>
                  <input
                    type="text"
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(e.target.value)}
                    placeholder="Ex: 5 jours, 7 jours..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Conditionnement
                  </label>
                  <input
                    type="text"
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    placeholder="Ex: Boîte de 16 comprimés, Flacon 150ml..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Stock d'avance (Facultatif)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Conseils / Instructions Particulières
                  </label>
                  <input
                    type="text"
                    value={defaultInstructions}
                    onChange={(e) => setDefaultInstructions(e.target.value)}
                    placeholder="Ex: À prendre au milieu des repas avec un grand verre d'eau"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-rose-300 mb-1">
                    Contre-indications
                  </label>
                  <textarea
                    rows={2}
                    value={contraindications}
                    onChange={(e) => setContraindications(e.target.value)}
                    placeholder="Ex: Insuffisance hépatique sévère, allergie aux pénicillines..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-amber-300 mb-1">
                    Effets Indésirables Notables
                  </label>
                  <input
                    type="text"
                    value={sideEffects}
                    onChange={(e) => setSideEffects(e.target.value)}
                    placeholder="Ex: Troubles digestifs légers, céphalées, somnolence..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="font-semibold text-slate-200">
                      Médicament actif (proposé automatiquement dans la recherche d'ordonnance)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'import Excel / CSV */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-100 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Importer des Médicaments (.xlsx / .csv)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajoutez vos listes ou catalogues personnalisés au cabinet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Vous pouvez importer un fichier Excel (.xlsx) ou CSV contenant vos spécialités pharmaceutiques.
                Les colonnes reconnues sont : <em>Nom, DCI, Dosage, Forme, Laboratoire, Classe, Posologie</em>.
              </p>

              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400">Besoin du format exact ?</span>
                <button
                  type="button"
                  onClick={() => downloadMedicationExcelTemplate()}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger le modèle Excel (.xlsx)
                </button>
              </div>

              {/* Sélecteur de fichier */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/60 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <FileSpreadsheet className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-200">
                  {importFile ? importFile.name : 'Cliquez pour sélectionner un fichier Excel ou CSV'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Formats acceptés : .xlsx, .xls, .csv</p>
              </div>

              {/* Erreurs de parsing */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Avertissements lors de l'analyse :</span>
                  </div>
                  <ul className="list-disc pl-4 text-rose-200/90 text-[11px] max-h-24 overflow-y-auto">
                    {importErrors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Aperçu des médicaments reconnus */}
              {parsedImportMeds.length > 0 && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl space-y-1.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{parsedImportMeds.length} médicament(s) valide(s) prêt(s) à être importé(s)</span>
                  </div>
                  <div className="text-[11px] text-slate-300 max-h-24 overflow-y-auto divide-y divide-slate-800">
                    {parsedImportMeds.slice(0, 5).map((m, i) => (
                      <div key={i} className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-white">{m.name}</span>
                        <span className="text-slate-400">{m.dosage || m.dosageForm}</span>
                      </div>
                    ))}
                    {parsedImportMeds.length > 5 && (
                      <div className="py-1 text-slate-500 italic">
                        + {parsedImportMeds.length - 5} autres médicaments...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={parsedImportMeds.length === 0 || isImporting}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-lg transition"
              >
                Confirmer l'importation ({parsedImportMeds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de réinitialisation */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-100 text-left space-y-4">
            <div className="flex items-center space-x-3 text-cyan-400">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Réinitialiser la base marocaine</h3>
                <p className="text-xs text-slate-400">Restauration du catalogue officiel</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-2 text-slate-300">
              <p>
                Cette action va réinstaller les <strong>114+ médicaments du référentiel national marocain</strong> avec leurs valeurs d'origine.
              </p>
              <p className="text-emerald-400 font-semibold">
                Vos médicaments personnalisés créés pour le cabinet seront scrupuleusement conservés.
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleResetCatalog}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Confirmer la réinitialisation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Choice Modal (When medication is used in prescriptions) */}
      {deleteChoiceModalOpen && targetMed && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 text-slate-100 text-left">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Médicament lié à des ordonnances</h3>
                <p className="text-xs text-slate-400">{targetMed.name}</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-3 text-slate-300">
              <p className="font-medium">
                Ce médicament figure dans l'historique d'ordonnances déjà prescrites aux patients.
              </p>
              <p className="text-slate-400">Veuillez sélectionner l'action appropriée :</p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleDeactivate}
                  className="w-full text-left p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white block">• Désactiver le médicament (recommandé)</span>
                    <span className="text-[11px] text-slate-400">
                      Il ne sera plus suggéré dans les futures ordonnances, mais l'historique médical reste intact.
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDeleteChoiceModalOpen(false);
                    setDeleteConfirmModalOpen(true);
                  }}
                  className="w-full text-left p-3 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/60 rounded-xl transition"
                >
                  <span className="font-bold text-rose-300 block">• Suppression définitive</span>
                  <span className="text-[11px] text-rose-400/80">
                    Retirer définitivement ce médicament de la base.
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDeleteChoiceModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression définitive directe */}
      {deleteConfirmModalOpen && targetMed && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-100 text-left">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Confirmer la suppression</h3>
                <p className="text-xs text-slate-400">{targetMed.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Êtes-vous sûr de vouloir supprimer définitivement « <strong>{targetMed.name}</strong> » de la base de données locale ?
            </p>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
