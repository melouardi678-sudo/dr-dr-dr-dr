import { BioTestItem, BioGroupPreset } from '../types';

export const DEFAULT_BIO_TESTS: BioTestItem[] = [
  // Hématologie & Immuno-Hématologie
  { id: 't_nfs', name: 'NFS / FNS', category: 'Hématologie' },
  { id: 't_gs', name: 'Groupe sanguin', category: 'Hématologie' },
  { id: 't_ferritine', name: 'Ferritine', category: 'Hématologie' },
  { id: 't_fer', name: 'Fer sérique', category: 'Hématologie' },
  { id: 't_vitb12', name: 'Vitamine B12', category: 'Hématologie' },
  { id: 't_vitd', name: 'Vitamine D', category: 'Hématologie' },

  // Biochimie & Métabolisme
  { id: 't_glycemie', name: 'Glycémie à jeun', category: 'Biochimie' },
  { id: 't_hba1c', name: 'HbA1c', category: 'Biochimie' },
  { id: 't_uree', name: 'Urée', category: 'Biochimie' },
  { id: 't_creatinine', name: 'Créatinine', category: 'Biochimie' },
  { id: 't_acide_urique', name: 'Acide urique', category: 'Biochimie' },

  // Bilan Lipidique
  { id: 't_bilan_lipidique', name: 'Bilan lipidique', category: 'Bilan Lipidique' },
  { id: 't_cholesterol_total', name: 'Cholestérol total', category: 'Bilan Lipidique' },
  { id: 't_hdl', name: 'HDL', category: 'Bilan Lipidique' },
  { id: 't_ldl', name: 'LDL', category: 'Bilan Lipidique' },
  { id: 't_triglycerides', name: 'Triglycérides', category: 'Bilan Lipidique' },

  // Bilan Hépatique
  { id: 't_asat_alat', name: 'ASAT / ALAT', category: 'Bilan Hépatique' },
  { id: 't_bilirubine', name: 'Bilirubine', category: 'Bilan Hépatique' },
  { id: 't_ggt', name: 'Gamma GT', category: 'Bilan Hépatique' },

  // Hormonologie & Endocrinologie
  { id: 't_tsh', name: 'TSH', category: 'Hormonologie' },
  { id: 't_ft4', name: 'FT4', category: 'Hormonologie' },

  // Inflammation
  { id: 't_crp', name: 'CRP', category: 'Inflammation' },
  { id: 't_vs', name: 'VS', category: 'Inflammation' },

  // Ionogramme & Minéraux
  { id: 't_ionogramme', name: 'Ionogramme', category: 'Ionogramme & Minéraux' },
  { id: 't_sodium', name: 'Sodium', category: 'Ionogramme & Minéraux' },
  { id: 't_potassium', name: 'Potassium', category: 'Ionogramme & Minéraux' },
  { id: 't_calcium', name: 'Calcium', category: 'Ionogramme & Minéraux' },
  { id: 't_magnesium', name: 'Magnésium', category: 'Ionogramme & Minéraux' },

  // Hémostase & Coagulation
  { id: 't_tp_inr', name: 'TP / INR', category: 'Coagulation' },
  { id: 't_tca', name: 'TCA', category: 'Coagulation' },

  // Examens Urinaires & Parasitologiques
  { id: 't_ecbu', name: 'ECBU', category: 'Examens Urinaires & Parasitologie' },
  { id: 't_analyse_urines', name: 'Analyse d’urines', category: 'Examens Urinaires & Parasitologie' },
  { id: 't_proteinurie', name: 'Protéinurie', category: 'Examens Urinaires & Parasitologie' },
  { id: 't_hematurie', name: 'Hématurie', category: 'Examens Urinaires & Parasitologie' },
  { id: 't_parasitologie_selles', name: 'Parasitologie des selles', category: 'Examens Urinaires & Parasitologie' },
];

export const DEFAULT_BIO_GROUPS: BioGroupPreset[] = [
  {
    id: 'grp_general',
    name: 'Bilan général',
    description: 'Bilan de santé global et contrôle annuel',
    tests: ['NFS / FNS', 'Glycémie à jeun', 'Urée', 'Créatinine', 'Cholestérol total', 'Triglycérides', 'ASAT / ALAT', 'TSH', 'CRP', 'Analyse d’urines'],
  },
  {
    id: 'grp_preop',
    name: 'Bilan préopératoire',
    description: 'Bilan hémostase, NFS et fonction rénale avant chirurgie',
    tests: ['NFS / FNS', 'TP / INR', 'TCA', 'Groupe sanguin', 'Glycémie à jeun', 'Urée', 'Créatinine', 'ECBU'],
  },
  {
    id: 'grp_diabete',
    name: 'Bilan diabétique',
    description: 'Bilan de suivi métabolique et rénal du diabète',
    tests: ['Glycémie à jeun', 'HbA1c', 'Urée', 'Créatinine', 'Bilan lipidique', 'Cholestérol total', 'Triglycérides', 'Protéinurie', 'ECBU'],
  },
  {
    id: 'grp_lipidique',
    name: 'Bilan lipidique',
    description: 'Exploration d’une anomalie lipidique',
    tests: ['Bilan lipidique', 'Cholestérol total', 'HDL', 'LDL', 'Triglycérides', 'Glycémie à jeun'],
  },
  {
    id: 'grp_hepatique',
    name: 'Bilan hépatique',
    description: 'Exploration de la fonction hépatique et cytolyse',
    tests: ['ASAT / ALAT', 'Bilirubine', 'Gamma GT', 'TP / INR'],
  },
  {
    id: 'grp_renal',
    name: 'Bilan rénal',
    description: 'Exploration de la fonction rénale et ionique',
    tests: ['Urée', 'Créatinine', 'Acide urique', 'Ionogramme', 'Sodium', 'Potassium', 'Protéinurie', 'ECBU'],
  },
  {
    id: 'grp_thyroidien',
    name: 'Bilan thyroïdien',
    description: 'Exploration du fonctionnement de la thyroïde',
    tests: ['TSH', 'FT4'],
  },
  {
    id: 'grp_inflammatoire',
    name: 'Bilan inflammatoire',
    description: 'Recherche ou suivi d’un syndrome inflammatoire',
    tests: ['CRP', 'VS', 'Ferritine', 'NFS / FNS'],
  },
  {
    id: 'grp_anemique',
    name: 'Bilan anémique',
    description: 'Exploration d’une anémie ou carence en fer/vitamines',
    tests: ['NFS / FNS', 'Ferritine', 'Fer sérique', 'Vitamine B12', 'Vitamine D'],
  },
];

const TESTS_STORAGE_KEY = 'medicab_bio_tests_catalog_v1';
const GROUPS_STORAGE_KEY = 'medicab_bio_groups_catalog_v1';

export function getStoredBioTests(): BioTestItem[] {
  try {
    const raw = localStorage.getItem(TESTS_STORAGE_KEY);
    if (!raw) return DEFAULT_BIO_TESTS;
    const customList: BioTestItem[] = JSON.parse(raw);
    // Merge with defaults in case defaults are missing
    const existingNames = new Set(customList.map((t) => t.name.toLowerCase()));
    const merged = [...customList];
    for (const def of DEFAULT_BIO_TESTS) {
      if (!existingNames.has(def.name.toLowerCase())) {
        merged.push(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_BIO_TESTS;
  }
}

export function saveStoredBioTests(tests: BioTestItem[]): void {
  try {
    localStorage.setItem(TESTS_STORAGE_KEY, JSON.stringify(tests));
  } catch (e) {
    console.error('Error saving bio tests catalog:', e);
  }
}

export function getStoredBioGroups(): BioGroupPreset[] {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) return DEFAULT_BIO_GROUPS;
    const customList: BioGroupPreset[] = JSON.parse(raw);
    const existingNames = new Set(customList.map((g) => g.name.toLowerCase()));
    const merged = [...customList];
    for (const def of DEFAULT_BIO_GROUPS) {
      if (!existingNames.has(def.name.toLowerCase())) {
        merged.push(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_BIO_GROUPS;
  }
}

export function saveStoredBioGroups(groups: BioGroupPreset[]): void {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch (e) {
    console.error('Error saving bio groups catalog:', e);
  }
}
