import React, { useState, useEffect } from 'react';
import {
  TestTube2,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  Printer,
  FileDown,
  Copy,
  Sparkles,
  Bookmark,
  BookmarkPlus,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { AnalysisRequest, Patient, CabinetSettings, AppUser, BioTestItem, BioGroupPreset } from '../types';
import {
  getStoredBioTests,
  saveStoredBioTests,
  getStoredBioGroups,
  saveStoredBioGroups,
} from '../utils/bioCatalog';

interface BioPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  settings: CabinetSettings;
  currentUser: AppUser;
  existingAnalysisRequests?: AnalysisRequest[];
  initialRequest?: AnalysisRequest | null;
  onSaveBioPrescription: (req: AnalysisRequest) => void;
  onOpenPrintable: (type: 'analysis', data: { analysis: AnalysisRequest }) => void;
}

export const BioPrescriptionModal: React.FC<BioPrescriptionModalProps> = ({
  isOpen,
  onClose,
  patient,
  settings,
  currentUser,
  existingAnalysisRequests = [],
  initialRequest = null,
  onSaveBioPrescription,
  onOpenPrintable,
}) => {
  // Master Catalog State
  const [catalogTests, setCatalogTests] = useState<BioTestItem[]>(() => getStoredBioTests());
  const [presetGroups, setPresetGroups] = useState<BioGroupPreset[]>(() => getStoredBioGroups());
  
  // Active Form State
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTests, setCustomTests] = useState('');
  const [indication, setIndication] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Search & New Test State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isAddingNewTest, setIsAddingNewTest] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('Biochimie');

  // Custom Group Creation State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [newTestError, setNewTestError] = useState('');

  // Permission check
  const canEditOrCreate =
    currentUser.role === 'admin' ||
    currentUser.role === 'doctor' ||
    (currentUser.permissions?.canCreatePrescriptions ?? false);

  // Load initial request if editing or creating
  useEffect(() => {
    if (initialRequest) {
      setSelectedTests(initialRequest.testsRequested || []);
      setCustomTests(initialRequest.customTests || '');
      setIndication(initialRequest.indication || '');
      setNotes(initialRequest.notes || '');
      setPrescriptionDate(initialRequest.date || new Date().toISOString().split('T')[0]);
      setSelectedPresetId(initialRequest.groupPresetName || null);
    } else {
      // Default reset
      setSelectedTests([]);
      setCustomTests('');
      setIndication('');
      setNotes('');
      setPrescriptionDate(new Date().toISOString().split('T')[0]);
      setSelectedPresetId(null);
    }
  }, [initialRequest, isOpen]);

  if (!isOpen) return null;

  // Patient previous bio prescriptions history for "Dupliquer"
  const patientBioHistory = existingAnalysisRequests
    .filter((r) => r.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const latestPreviousBio = patientBioHistory[0];

  // Unique categories for filtering
  const categories = Array.from(new Set(catalogTests.map((t) => t.category)));

  // Filtered tests list
  const filteredTests = catalogTests.filter((t) => {
    const matchesQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategoryFilter === 'all' || t.category === activeCategoryFilter;
    return matchesQuery && matchesCategory;
  });

  // Toggle individual test
  const handleToggleTest = (testName: string) => {
    if (!canEditOrCreate) return;
    if (selectedTests.includes(testName)) {
      setSelectedTests(selectedTests.filter((t) => t !== testName));
    } else {
      setSelectedTests([...selectedTests, testName]);
    }
  };

  // Apply a preset group
  const handleApplyGroup = (group: BioGroupPreset) => {
    if (!canEditOrCreate) return;
    setSelectedPresetId(group.name);
    // Combine existing selected tests with group tests (no duplicates)
    const combined = Array.from(new Set([...selectedTests, ...group.tests]));
    setSelectedTests(combined);
  };

  // Duplicate previous lab prescription
  const handleDuplicatePrevious = () => {
    if (!latestPreviousBio || !canEditOrCreate) return;
    setSelectedTests(latestPreviousBio.testsRequested || []);
    setCustomTests(latestPreviousBio.customTests || '');
    setIndication(latestPreviousBio.indication || '');
    setNotes(latestPreviousBio.notes || '');
    setSelectedPresetId(latestPreviousBio.groupPresetName || null);
  };

  // Add custom group to catalog
  const handleSaveCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedTests.length === 0) return;

    const trimmed = newGroupName.trim();
    if (presetGroups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Un groupe portant ce nom existe déjà.');
      return;
    }

    const newGroup: BioGroupPreset = {
      id: `custom_grp_${Date.now()}`,
      name: trimmed,
      description: newGroupDesc.trim() || undefined,
      tests: [...selectedTests],
      isCustom: true,
    };

    const updated = [...presetGroups, newGroup];
    setPresetGroups(updated);
    saveStoredBioGroups(updated);
    setSelectedPresetId(newGroup.name);
    setIsCreatingGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleDeleteCustomGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupToDelete(groupId);
  };

  const confirmDeleteCustomGroup = () => {
    if (!groupToDelete) return;
    const updated = presetGroups.filter((g) => g.id !== groupToDelete);
    setPresetGroups(updated);
    saveStoredBioGroups(updated);
    setGroupToDelete(null);
  };

  // Add custom test to catalog
  const handleAddNewTestToCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    setNewTestError('');
    if (!newTestName.trim()) return;

    const trimmed = newTestName.trim();
    if (catalogTests.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewTestError('Ce bilan/analyse existe déjà dans le catalogue.');
      return;
    }

    const newItem: BioTestItem = {
      id: `custom_test_${Date.now()}`,
      name: trimmed,
      category: newTestCategory,
      isCustom: true,
    };

    const updatedCatalog = [...catalogTests, newItem];
    setCatalogTests(updatedCatalog);
    saveStoredBioTests(updatedCatalog);

    // Auto select it
    setSelectedTests([...selectedTests, trimmed]);
    setNewTestName('');
    setNewTestError('');
    setIsAddingNewTest(false);
  };

  // Build the AnalysisRequest object
  const buildCurrentRequest = (): AnalysisRequest => {
    return {
      id: initialRequest?.id || `anl_bio_${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.lastName} ${patient.firstName}`,
      patientAge: patient.age,
      date: prescriptionDate,
      categories: ['biology'],
      testsRequested: selectedTests,
      customTests: customTests.trim() || undefined,
      indication: indication.trim() || undefined,
      doctorName: currentUser.fullName || settings.doctorName,
      groupPresetName: selectedPresetId || undefined,
      notes: notes.trim() || undefined,
      createdAt: initialRequest?.createdAt || new Date().toISOString(),
    };
  };

  // Save prescription
  const handleSave = () => {
    if (selectedTests.length === 0 && !customTests.trim()) {
      alert('Veuillez sélectionner au moins un bilan biologique ou saisir un examen personnalisé.');
      return;
    }

    const req = buildCurrentRequest();
    onSaveBioPrescription(req);
    onClose();
  };

  // Save & Print
  const handleSaveAndPrint = () => {
    if (selectedTests.length === 0 && !customTests.trim()) {
      alert('Veuillez sélectionner au moins un bilan biologique ou saisir un examen personnalisé.');
      return;
    }

    const req = buildCurrentRequest();
    onSaveBioPrescription(req);
    onOpenPrintable('analysis', { analysis: req });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <TestTube2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>Prescription de Bilan Biologique</span>
                <span className="text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-semibold">
                  Analyses Médicales
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Patient : <strong className="text-white uppercase">{patient.lastName} {patient.firstName}</strong> ({patient.age} ans • {patient.gender})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {latestPreviousBio && canEditOrCreate && (
              <button
                onClick={handleDuplicatePrevious}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-950/80 border border-amber-700/70 text-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-900 transition-all duration-200 shadow-sm"
                title={`Dupliquer le bilan précédent du ${new Date(latestPreviousBio.date).toLocaleDateString('fr-FR')}`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Dupliquer le bilan précédent</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Dual Pane Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* Top Info Bar: Date, Indication & Preset Groups */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            {/* Prescription Date */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Date de Prescription</span>
              </label>
              <input
                type="date"
                value={prescriptionDate}
                disabled={!canEditOrCreate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            {/* Indication / Motif */}
            <div className="md:col-span-9 space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
                <span>Indication / Motif médical (Optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="ex: Bilan annuel de contrôle, Exploration d'anémie, Suivi du diabète type 2..."
                value={indication}
                disabled={!canEditOrCreate}
                onChange={(e) => setIndication(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Preset Groups Section ("Groupes de bilans") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Groupes de Bilans Préconfigurés & Modèles (Sélection Rapide)</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400">
                  {selectedTests.length} bilan(s) sélectionné(s)
                </span>
                {canEditOrCreate && selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg flex items-center space-x-1 transition"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Sauvegarder sélection comme Groupe</span>
                  </button>
                )}
              </div>
            </div>

            {isCreatingGroup && (
              <form
                onSubmit={handleSaveCustomGroup}
                className="p-3 bg-slate-950 rounded-xl border border-emerald-800/70 space-y-2 animate-in fade-in"
              >
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>Créer un nouveau groupe avec les {selectedTests.length} analyses sélectionnées</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Nom du groupe (ex: Bilan Préopératoire, Bilan Thyroïde complet...)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Description / Indication (Optionnel)"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500"
                  >
                    Enregistrer le Groupe
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {presetGroups.map((group) => {
                const isAllSelected = group.tests.every((t) => selectedTests.includes(t));
                return (
                  <div
                    key={group.id}
                    className={`group/btn relative rounded-xl text-xs font-semibold flex items-center transition-all duration-200 border ${
                      isAllSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!canEditOrCreate}
                      onClick={() => handleApplyGroup(group)}
                      className="px-3 py-1.5 flex items-center space-x-1.5"
                      title={group.description || group.name}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isAllSelected ? 'text-white' : 'text-emerald-400'}`} />
                      <span>{group.name}</span>
                      <span className="text-[10px] opacity-75 px-1.5 py-0.2 rounded-full bg-slate-900/50">
                        {group.tests.length}
                      </span>
                    </button>
                    {group.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomGroup(group.id, e)}
                        className="pr-2 pl-0.5 text-slate-400 hover:text-rose-400"
                        title="Supprimer ce groupe"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Catalog Search & Selection Grid */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher un bilan (ex: NFS, Glycémie, CRP, TSH, Fer...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <select
                  value={activeCategoryFilter}
                  onChange={(e) => setActiveCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-xs font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {canEditOrCreate && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewTest(!isAddingNewTest)}
                    className="px-3 py-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-900 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ajouter Analyse</span>
                  </button>
                )}
              </div>
            </div>

            {/* Form to add a new custom test to catalog */}
            {isAddingNewTest && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <form
                  onSubmit={handleAddNewTestToCatalog}
                  className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-xl flex flex-col sm:flex-row items-center gap-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="Nom de la nouvelle analyse (ex: Calprotectine fécale)"
                    value={newTestName}
                    onChange={(e) => {
                      setNewTestName(e.target.value);
                      if (newTestError) setNewTestError('');
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newTestCategory}
                    onChange={(e) => setNewTestCategory(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-xs"
                  >
                    <option value="Biochimie">Biochimie</option>
                    <option value="Hématologie">Hématologie</option>
                    <option value="Bilan Lipidique">Bilan Lipidique</option>
                    <option value="Bilan Hépatique">Bilan Hépatique</option>
                    <option value="Hormonologie">Hormonologie</option>
                    <option value="Inflammation">Inflammation</option>
                    <option value="Ionogramme & Minéraux">Ionogramme & Minéraux</option>
                    <option value="Coagulation">Coagulation</option>
                    <option value="Examens Urinaires & Parasitologie">Urines & Parasitologie</option>
                  </select>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewTest(false);
                        setNewTestError('');
                      }}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
                {newTestError && (
                  <p className="text-[11px] text-rose-400 font-semibold px-2">{newTestError}</p>
                )}
              </div>
            )}

            {/* Filtered Test Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
              {filteredTests.map((test) => {
                const isSelected = selectedTests.includes(test.name);
                return (
                  <div
                    key={test.id}
                    onClick={() => handleToggleTest(test.name)}
                    className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-150 flex items-start justify-between space-x-2 select-none ${
                      isSelected
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs leading-tight">{test.name}</div>
                      <div className="text-[10px] text-slate-400">{test.category}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md border shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Autres examens / Analyses personnalisées & Recommandations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Autres Examens / Analyses Personnalisées</span>
                <span className="text-[10px] text-slate-500 font-normal">Saisir un examen non répertorié</span>
              </label>
              <textarea
                rows={3}
                disabled={!canEditOrCreate}
                placeholder="ex: Dosages spécifiques, Marqueurs tumoraux, Hémocultures..."
                value={customTests}
                onChange={(e) => setCustomTests(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Notes & Recommandations pour le Laboratoire</span>
                <span className="text-[10px] text-slate-500 font-normal">ex: À jeun depuis 12h</span>
              </label>
              <textarea
                rows={3}
                disabled={!canEditOrCreate}
                placeholder="ex: Prélèvement à jeun impératif. Transmettre les résultats en urgence..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Selected Summary Badge List */}
          {selectedTests.length > 0 && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Récapitulatif de la Prescription ({selectedTests.length} analyses) :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTests.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-medium"
                  >
                    <span>{t}</span>
                    {canEditOrCreate && (
                      <button
                        type="button"
                        onClick={() => handleToggleTest(t)}
                        className="text-emerald-400 hover:text-rose-400 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Médecin : <strong className="text-white">{currentUser.fullName || settings.doctorName}</strong></span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700 transition-colors"
            >
              Fermer
            </button>

            {canEditOrCreate && (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-slate-800 text-emerald-400 border border-emerald-800 font-bold rounded-xl text-xs hover:bg-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndPrint}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950 flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Aperçu & Imprimer / PDF</span>
                </button>
              </>
            )}

            {!canEditOrCreate && (
              <button
                type="button"
                onClick={() => onOpenPrintable('analysis', { analysis: buildCurrentRequest() })}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950 flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / Exporter PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Group Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer ce groupe personnalisé ?</h3>
              <p className="text-xs text-slate-300">
                Êtes-vous sûr de vouloir supprimer ce modèle de groupe d'analyses ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomGroup}
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
