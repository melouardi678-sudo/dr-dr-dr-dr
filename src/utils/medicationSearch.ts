import * as XLSX from 'xlsx';
import { Medication } from '../types';
import { MOROCCAN_MEDICATIONS_CATALOG } from './moroccanMedications';

/**
 * Supprime les accents et normalise la chaîne pour une recherche insensible à la casse et aux diacritiques.
 */
export function normalizeMedicationText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface MedicationSearchOptions {
  includeInactive?: boolean;
  category?: string;
  laboratory?: string;
  source?: 'all' | 'preloaded' | 'custom';
  limit?: number;
}

/**
 * Recherche rapide, multi-champs et multi-tokens dans la base de médicaments.
 * Prend en charge: Nom commercial, DCI (Principe actif), Dosage, Forme, Laboratoire, Catégorie.
 */
export function searchMedications(
  query: string,
  medications: Medication[],
  options: MedicationSearchOptions = {}
): Medication[] {
  const {
    includeInactive = false,
    category,
    laboratory,
    source = 'all',
    limit = 50,
  } = options;

  const normalizedQuery = normalizeMedicationText(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  let filtered = medications.filter((med) => {
    // Statut actif
    if (!includeInactive && med.isActive === false) {
      return false;
    }

    // Source (Base officielle vs Personnalisée)
    if (source === 'preloaded' && !med.isPreloaded) {
      return false;
    }
    if (source === 'custom' && med.isPreloaded) {
      return false;
    }

    // Filtre de catégorie
    if (category && category !== 'all' && med.category !== category) {
      return false;
    }

    // Filtre de laboratoire
    if (laboratory && laboratory !== 'all' && med.laboratory !== laboratory) {
      return false;
    }

    // Si pas de requête, valide
    if (tokens.length === 0) {
      return true;
    }

    // Préparation des champs de recherche textuelle
    const nameNorm = normalizeMedicationText(med.name);
    const dciNorm = normalizeMedicationText(med.dci || '');
    const dosageNorm = normalizeMedicationText(med.dosage || '');
    const formNorm = normalizeMedicationText(med.dosageForm || '');
    const labNorm = normalizeMedicationText(med.laboratory || '');
    const catNorm = normalizeMedicationText(med.category || '');

    const combinedSearchable = `${nameNorm} ${dciNorm} ${dosageNorm} ${formNorm} ${labNorm} ${catNorm}`;

    // Tous les tokens doivent correspondre à l'un des champs
    return tokens.every((token) => combinedSearchable.includes(token));
  });

  // Tri par pertinence si une recherche textuelle est active
  if (tokens.length > 0) {
    const firstToken = tokens[0];
    filtered.sort((a, b) => {
      const aName = normalizeMedicationText(a.name);
      const bName = normalizeMedicationText(b.name);
      const aDci = normalizeMedicationText(a.dci || '');
      const bDci = normalizeMedicationText(b.dci || '');

      // 1. Nom commence exactement par la requête
      const aNameStarts = aName.startsWith(firstToken);
      const bNameStarts = bName.startsWith(firstToken);
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;

      // 2. DCI commence exactement par la requête
      const aDciStarts = aDci.startsWith(firstToken);
      const bDciStarts = bDci.startsWith(firstToken);
      if (aDciStarts && !bDciStarts) return -1;
      if (!aDciStarts && bDciStarts) return 1;

      // 3. Présence dans le nom avant DCI
      const aInName = aName.includes(firstToken);
      const bInName = bName.includes(firstToken);
      if (aInName && !bInName) return -1;
      if (!aInName && bInName) return 1;

      return a.name.localeCompare(b.name, 'fr');
    });
  } else {
    // Tri alphabétique par défaut
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Fusionne la base officielle marocaine avec les médicaments enregistrés dans le navigateur,
 * en veillant à conserver scrupuleusement tous les médicaments personnalisés du cabinet.
 */
export function mergeWithMoroccanCatalog(existingMeds: Medication[] = []): Medication[] {
  const map = new Map<string, Medication>();

  // 1. Charger d'abord la base officielle marocaine complète
  for (const officialMed of MOROCCAN_MEDICATIONS_CATALOG) {
    map.set(officialMed.id, { ...officialMed });
  }

  // 2. Superposer les médicaments existants (personnalisés ou surcharges utilisateur)
  for (const existing of existingMeds) {
    if (!existing || !existing.name) continue;

    if (existing.isCustom || !existing.isPreloaded) {
      // Médicament personnalisé du médecin / cabinet
      map.set(existing.id, {
        ...existing,
        isCustom: true,
        isPreloaded: false,
      });
    } else {
      // Surcharge ou modification par l'utilisateur d'un médicament officiel
      const current = map.get(existing.id);
      if (current) {
        map.set(existing.id, {
          ...current,
          ...existing,
          isPreloaded: true,
        });
      } else {
        map.set(existing.id, { ...existing });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/**
 * Réinitialise la base officielle marocaine sans effacer les médicaments personnalisés créés par le cabinet.
 */
export function resetOfficialMedicationsKeepingCustom(existingMeds: Medication[]): Medication[] {
  const customMeds = existingMeds.filter((m) => m.isCustom && !m.isPreloaded);
  const catalogCloned = MOROCCAN_MEDICATIONS_CATALOG.map((m) => ({ ...m }));
  return [...catalogCloned, ...customMeds].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/**
 * Exportation de la base de médicaments au format Excel (.xlsx).
 */
export async function exportMedicationsToExcel(medications: Medication[]): Promise<void> {
  const rows = medications.map((med, idx) => ({
    'N°': idx + 1,
    'Nom du Médicament': med.name,
    'DCI / Principe Actif': med.dci || '',
    'Dosage': med.dosage || '',
    'Forme Pharmaceutique': med.dosageForm,
    'Laboratoire': med.laboratory || '',
    'Classe Thérapeutique': med.category,
    'Posologie Usuelle': med.defaultDosage,
    'Durée Recommandée': med.defaultDuration || '',
    'Conseils / Instructions': med.defaultInstructions || '',
    'Contre-indications': med.contraindications || '',
    'Effets Secondaires': med.sideEffects || '',
    'Conditionnement': med.presentation || '',
    'Statut': med.isActive !== false ? 'Actif' : 'Désactivé',
    'Origine': med.isPreloaded ? 'Base Officielle Maroc' : 'Personnalisé Cabinet',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Largeurs de colonnes esthétiques
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 28 },
    { wch: 15 },
    { wch: 22 },
    { wch: 25 },
    { wch: 25 },
    { wch: 35 },
    { wch: 18 },
    { wch: 35 },
    { wch: 35 },
    { wch: 25 },
    { wch: 12 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicaments_MediCab');

  const defaultFilename = `Medicaments_MediCab_${new Date().toISOString().split('T')[0]}.xlsx`;

  const electronApi = (window as any).electron;
  if (electronApi) {
    try {
      const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const res = await electronApi.ipcRenderer.invoke('excel-save-dialog', {
        defaultFilename,
        base64Data,
      });
      if (res && (res.success || res.canceled)) {
        return;
      }
    } catch (err) {
      console.error('Electron excel export failed:', err);
    }
  }

  XLSX.writeFile(workbook, defaultFilename);
}

/**
 * Exportation de la base de médicaments au format CSV.
 */
export function exportMedicationsToCSV(medications: Medication[]): void {
  const headers = [
    'Nom',
    'DCI',
    'Dosage',
    'Forme',
    'Laboratoire',
    'Categorie',
    'Posologie',
    'Duree',
    'Instructions',
    'ContreIndications',
    'Statut',
    'Origine',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.join(';'),
    ...medications.map((m) =>
      [
        escapeCSV(m.name),
        escapeCSV(m.dci || ''),
        escapeCSV(m.dosage || ''),
        escapeCSV(m.dosageForm),
        escapeCSV(m.laboratory || ''),
        escapeCSV(m.category),
        escapeCSV(m.defaultDosage),
        escapeCSV(m.defaultDuration || ''),
        escapeCSV(m.defaultInstructions || ''),
        escapeCSV(m.contraindications || ''),
        escapeCSV(m.isActive !== false ? 'Actif' : 'Désactivé'),
        escapeCSV(m.isPreloaded ? 'Base Officielle' : 'Cabinet'),
      ].join(';')
    ),
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // BOM pour encodage UTF-8 correct dans Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Medicaments_MediCab_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge une feuille modèle Excel vierge pour l'import de médicaments.
 */
export async function downloadMedicationExcelTemplate(): Promise<void> {
  const sample = [
    {
      'Nom du Médicament': 'Exemple Panadol Extra 500mg',
      'DCI / Principe Actif': 'Paracétamol + Caféine',
      'Dosage': '500 mg / 65 mg',
      'Forme Pharmaceutique': 'Comprimé',
      'Laboratoire': 'GSK Maroc',
      'Classe Thérapeutique': 'Antalgique / Antipyrétique',
      'Posologie Usuelle': '1 comprimé 3 fois par jour au besoin',
      'Durée Recommandée': '3 jours',
      'Conseils / Instructions': 'Ne pas prendre le soir (contient de la caféine)',
      'Contre-indications': 'Insuffisance hépatique sévère, troubles cardiaques',
      'Effets Secondaires': 'Insomnie, palpitations légères',
      'Conditionnement': 'Boîte de 16 comprimés',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sample);
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 35 },
    { wch: 18 },
    { wch: 35 },
    { wch: 35 },
    { wch: 25 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modele_Medicaments');

  const defaultFilename = 'Modele_Import_Medicaments_MediCab.xlsx';
  const electronApi = (window as any).electron;
  if (electronApi) {
    try {
      const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const res = await electronApi.ipcRenderer.invoke('excel-save-dialog', {
        defaultFilename,
        base64Data,
      });
      if (res && (res.success || res.canceled)) {
        return;
      }
    } catch (err) {
      console.error('Electron save template failed:', err);
    }
  }

  XLSX.writeFile(workbook, defaultFilename);
}

/**
 * Analyse un fichier Excel ou CSV importé et extrait les médicaments valides.
 */
export function parseMedicationsFromFile(
  fileBuffer: ArrayBuffer | Uint8Array
): { medications: Partial<Medication>[]; errors: string[] } {
  const errors: string[] = [];
  const parsedMeds: Partial<Medication>[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      errors.push('Le classeur ne contient aucune feuille.');
      return { medications: [], errors };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      errors.push('La feuille est vide ou ne contient aucune ligne de données.');
      return { medications: [], errors };
    }

    rawData.forEach((row, idx) => {
      const lineNum = idx + 2; // Entête en ligne 1

      // Détection souple des colonnes
      const name =
        row['Nom du Médicament'] ||
        row['Nom'] ||
        row['nom'] ||
        row['Médicament'] ||
        row['Medicament'] ||
        '';

      if (!String(name).trim()) {
        errors.push(`Ligne ${lineNum}: Le nom du médicament est obligatoire.`);
        return;
      }

      const dci =
        row['DCI / Principe Actif'] ||
        row['DCI'] ||
        row['dci'] ||
        row['Principe Actif'] ||
        '';

      const dosage = row['Dosage'] || row['dosage'] || '';

      const dosageForm =
        row['Forme Pharmaceutique'] ||
        row['Forme'] ||
        row['forme'] ||
        row['Forme galénique'] ||
        'Comprimé';

      const laboratory =
        row['Laboratoire'] ||
        row['Labo'] ||
        row['laboratoire'] ||
        row['Fabricant'] ||
        '';

      const category =
        row['Classe Thérapeutique'] ||
        row['Catégorie'] ||
        row['Categorie'] ||
        row['category'] ||
        'Général';

      const defaultDosage =
        row['Posologie Usuelle'] ||
        row['Posologie'] ||
        row['posologie'] ||
        '1 comprimé par jour';

      const defaultDuration =
        row['Durée Recommandée'] ||
        row['Durée'] ||
        row['Duree'] ||
        '';

      const defaultInstructions =
        row['Conseils / Instructions'] ||
        row['Instructions'] ||
        row['Conseils'] ||
        '';

      const contraindications =
        row['Contre-indications'] ||
        row['Contreindications'] ||
        row['Contre-indication'] ||
        'Aucune connue';

      const sideEffects =
        row['Effets Secondaires'] ||
        row['Effets indésirables'] ||
        '';

      const presentation =
        row['Conditionnement'] ||
        row['Présentation'] ||
        row['Presentation'] ||
        '';

      const rawPrice = row['Prix Public (PPV en DH)'] || row['Prix'] || row['PPV'] || row['unitPrice'];
      let unitPrice: number | undefined = undefined;
      if (rawPrice !== undefined && rawPrice !== '') {
        const parsedP = parseFloat(String(rawPrice).replace(',', '.').replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedP)) {
          unitPrice = parsedP;
        }
      }

      parsedMeds.push({
        name: String(name).trim(),
        dci: dci ? String(dci).trim() : undefined,
        dosage: dosage ? String(dosage).trim() : undefined,
        dosageForm: String(dosageForm).trim(),
        laboratory: laboratory ? String(laboratory).trim() : undefined,
        category: String(category).trim(),
        defaultDosage: String(defaultDosage).trim(),
        defaultDuration: defaultDuration ? String(defaultDuration).trim() : undefined,
        defaultInstructions: defaultInstructions ? String(defaultInstructions).trim() : undefined,
        contraindications: String(contraindications).trim(),
        sideEffects: sideEffects ? String(sideEffects).trim() : undefined,
        presentation: presentation ? String(presentation).trim() : undefined,
        unitPrice,
        isCustom: true,
        isPreloaded: false,
        isActive: true,
      });
    });
  } catch (err: any) {
    errors.push(`Erreur lors de la lecture du fichier: ${err?.message || 'Format invalide'}`);
  }

  return { medications: parsedMeds, errors };
}
