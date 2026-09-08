import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Pill,
  Plus,
  Sparkles,
  Building2,
  Check,
  AlertCircle,
  X,
  Layers,
  Clock,
} from 'lucide-react';
import { Medication, PrescriptionItem } from '../types';
import { searchMedications } from '../utils/medicationSearch';

interface MedicationAutocompleteInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelectMedication: (medication: Medication) => void;
  medications: Medication[];
  onAddNewMedication?: (medication: Medication) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const MedicationAutocompleteInput: React.FC<MedicationAutocompleteInputProps> = ({
  value: propValue,
  onChange: propOnChange,
  onSelectMedication,
  medications,
  onAddNewMedication,
  placeholder = 'Rechercher un médicament marocain par Nom commercial, DCI ou Dosage...',
  className = '',
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = propValue !== undefined;
  const value = isControlled ? propValue : internalValue;

  const handleValueChange = (newVal: string) => {
    if (!isControlled) {
      setInternalValue(newVal);
    }
    if (propOnChange) {
      propOnChange(newVal);
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Formulaire d'ajout rapide de médicament
  const [newMedName, setNewMedName] = useState('');
  const [newMedDci, setNewMedDci] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedForm, setNewMedForm] = useState('Comprimé');
  const [newMedCategory, setNewMedCategory] = useState('Général');
  const [newMedLab, setNewMedLab] = useState('');
  const [newMedPosology, setNewMedPosology] = useState('1 comprimé 3 fois par jour');
  const [newMedDuration, setNewMedDuration] = useState('5 à 7 jours');
  const [newMedInstructions, setNewMedInstructions] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrer les médicaments actifs
  const searchResults = React.useMemo(() => {
    if (!value || value.trim().length === 0) {
      // Si la barre de recherche est vide mais le dropdown est ouvert, suggérer les médicaments les plus courants
      return medications
        .filter((m) => m.isActive !== false)
        .slice(0, 15);
    }
    return searchMedications(value, medications, {
      includeInactive: false,
      limit: 25,
    });
  }, [value, medications]);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Défilement automatique dans la liste des résultats
  useEffect(() => {
    if (isOpen && listRef.current && searchResults.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen, searchResults.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setSelectedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex]);
      } else if (value.trim()) {
        openQuickAdd();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (medication: Medication) => {
    onSelectMedication(medication);
    if (!isControlled) {
      setInternalValue('');
    }
    setIsOpen(false);
  };

  const openQuickAdd = () => {
    setNewMedName(value.trim());
    setNewMedDci('');
    setNewMedDosage('');
    setNewMedForm('Comprimé');
    setNewMedCategory('Général');
    setNewMedLab('');
    setNewMedPosology('1 comprimé 3 fois par jour');
    setNewMedDuration('5 jours');
    setNewMedInstructions('');
    setShowQuickAddModal(true);
    setIsOpen(false);
  };

  const handleSaveQuickMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed: Medication = {
      id: `custom_med_${Date.now()}`,
      name: newMedName.trim(),
      dci: newMedDci.trim() || undefined,
      dosage: newMedDosage.trim() || undefined,
      dosageForm: newMedForm.trim() || 'Comprimé',
      category: newMedCategory.trim() || 'Général',
      laboratory: newMedLab.trim() || undefined,
      defaultDosage: newMedPosology.trim() || '1 comprimé par jour',
      defaultDuration: newMedDuration.trim() || '5 jours',
      defaultInstructions: newMedInstructions.trim() || undefined,
      contraindications: 'Aucune spécifiée',
      isActive: true,
      isCustom: true,
      isPreloaded: false,
      createdAt: new Date().toISOString(),
    };

    if (onAddNewMedication) {
      onAddNewMedication(newMed);
    }
    onSelectMedication(newMed);
    setShowQuickAddModal(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Champ de saisie principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            handleValueChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-sm transition-all shadow-inner"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              handleValueChange('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Menu déroulant des résultats de recherche */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md max-h-[380px] flex flex-col">
          {/* Entête du menu */}
          <div className="px-3.5 py-2 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-cyan-400" />
              {searchResults.length > 0
                ? `${searchResults.length} médicament(s) trouvé(s)`
                : 'Aucun médicament correspondant'}
            </span>
            <span className="text-[11px] text-slate-500">
              Naviguer <kbd className="px-1 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">↓</kbd> Valider <kbd className="px-1 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">Entrée</kbd>
            </span>
          </div>

          {/* Liste des résultats */}
          <ul
            ref={listRef}
            className="overflow-y-auto divide-y divide-slate-800/80 py-1 flex-1 text-left"
          >
            {searchResults.map((med, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={med.id}
                  onClick={() => handleSelect(med)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-l-4 border-cyan-500 pl-2.5'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-slate-100">
                        {med.name}
                      </span>
                      {med.dosage && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                          {med.dosage}
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {med.dosageForm}
                      </span>
                      {med.isPreloaded ? (
                        <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                          Maroc
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                          Cabinet
                        </span>
                      )}
                    </div>

                    {/* DCI / Principe Actif & Laboratoire */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {med.dci && (
                        <span className="flex items-center gap-1 text-amber-300/90 font-medium">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          DCI: {med.dci}
                        </span>
                      )}
                      {med.laboratory && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {med.laboratory}
                        </span>
                      )}
                    </div>

                    {/* Posologie recommandée par défaut */}
                    {med.defaultDosage && (
                      <div className="mt-1 text-xs text-slate-400/80 italic truncate">
                        Posologie usuelle: {med.defaultDosage}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(med);
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-600/30 text-cyan-200 hover:bg-cyan-600 hover:text-white transition-all border border-cyan-500/40"
                    >
                      Sélectionner
                    </button>
                  </div>
                </li>
              );
            })}

            {searchResults.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-400">
                <AlertCircle className="w-8 h-8 text-amber-400/80 mx-auto mb-2" />
                <p className="font-medium text-slate-200 mb-1">
                  Aucun médicament ne correspond à « {value} »
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
                  Vous pouvez ajouter ce médicament directement à votre base de données locale pour l’utiliser dans vos ordonnances.
                </p>
                <button
                  type="button"
                  onClick={openQuickAdd}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Créer le médicament « {value} »
                </button>
              </li>
            )}
          </ul>

          {/* Pied du menu avec bouton d'ajout manuel rapide */}
          <div className="p-2 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between">
            <button
              type="button"
              onClick={openQuickAdd}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium py-1 px-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + Nouveau médicament personnalisé...
            </button>
            <span className="text-[11px] text-slate-400">
              Base Médicaments Maroc (Offline)
            </span>
          </div>
        </div>
      )}

      {/* Modal d'ajout rapide d'un médicament */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Ajouter un médicament à la base
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sera sauvegardé localement et utilisable immédiatement
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickMed} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nom commercial du médicament *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="Ex: Doliprane 1000 mg"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    DCI / Principe actif
                  </label>
                  <input
                    type="text"
                    value={newMedDci}
                    onChange={(e) => setNewMedDci(e.target.value)}
                    placeholder="Ex: Paracétamol"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="Ex: 1000 mg, 500 mg, 1g"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Forme pharmaceutique
                  </label>
                  <select
                    value={newMedForm}
                    onChange={(e) => setNewMedForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    <option value="Spray nasal / Aérosol">Spray nasal / Aérosol</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Laboratoire
                  </label>
                  <input
                    type="text"
                    value={newMedLab}
                    onChange={(e) => setNewMedLab(e.target.value)}
                    placeholder="Ex: Sanofi, Laprophan, GSK..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Posologie usuelle par défaut
                  </label>
                  <input
                    type="text"
                    value={newMedPosology}
                    onChange={(e) => setNewMedPosology(e.target.value)}
                    placeholder="Ex: 1 comprimé 3 fois par jour au cours des repas"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Durée recommandée
                  </label>
                  <input
                    type="text"
                    value={newMedDuration}
                    onChange={(e) => setNewMedDuration(e.target.value)}
                    placeholder="Ex: 5 jours, 7 jours..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Instructions / Précautions
                  </label>
                  <input
                    type="text"
                    value={newMedInstructions}
                    onChange={(e) => setNewMedInstructions(e.target.value)}
                    placeholder="Ex: Prendre après les repas avec un grand verre d'eau"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow-lg transition-all"
                >
                  Enregistrer et insérer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
