import { PrescriptionTemplate, PrescriptionItem } from '../types';

export const DEFAULT_PRESCRIPTION_TEMPLATES: PrescriptionTemplate[] = [
  {
    id: 'tpl_angine',
    name: 'Angine bactérienne',
    category: 'ORL & Pneumologie',
    description: 'Traitement de première intention de l’angine à streptocoque',
    items: [
      {
        medicineName: 'Amoxicilline 1g',
        dosage: '1 comprimé matin et soir',
        duration: '6 jours',
        instructions: 'À prendre au début des repas',
      },
      {
        medicineName: 'Paracétamol 1000mg',
        dosage: '1 comprimé toutes les 6 à 8 heures si douleur ou fièvre',
        duration: '5 jours',
        instructions: 'Espacer les prises d’au moins 6 heures (max 3g/j)',
      },
      {
        medicineName: 'Collutoire antiseptique & anesthésique',
        dosage: '2 pulvérisations 3 fois par jour',
        duration: '4 jours',
        instructions: 'Après les repas',
      },
    ],
    notes: 'Boire abondamment, repos. Reconsulter si persistance de la fièvre après 48h.',
  },
  {
    id: 'tpl_hta',
    name: 'Hypertension Artérielle (Initiation)',
    category: 'Cardiologie',
    description: 'Monothérapie initiale pour HTA essentielle non compliquée',
    items: [
      {
        medicineName: 'Amlodipine 5mg',
        dosage: '1 gélule par jour',
        duration: '30 jours (Renouvelable 3 mois)',
        instructions: 'Le matin de préférence au réveil',
      },
    ],
    notes: 'Régime hyposodé, exercice physique régulier 30min/jour, auto-mesure tensionnelle matin et soir pendant 3 jours avant la prochaine consultation.',
  },
  {
    id: 'tpl_diabete',
    name: 'Diabète Type 2 (Monothérapie)',
    category: 'Métabolisme & Diabète',
    description: 'Traitement de fond initial pour diabète de type 2',
    items: [
      {
        medicineName: 'Metformine 850mg',
        dosage: '1 comprimé 2 fois par jour',
        duration: '3 mois renouvelable',
        instructions: 'Au milieu du petit-déjeuner et du dîner pour limiter les troubles digestifs',
      },
    ],
    notes: 'Régime diabétique adapté, autosurveillance glycémique, bilan biologique de contrôle (HbA1c, créatinine) dans 3 mois.',
  },
  {
    id: 'tpl_gea',
    name: 'Gastro-entérite Aiguë (GEA)',
    category: 'Gastro-entérologie',
    description: 'Traitement symptomatique des diarrhées aiguës et spasmes',
    items: [
      {
        medicineName: 'Phloroglucinol 80mg',
        dosage: '2 comprimés au moment des spasmes douloureux',
        duration: '4 jours',
        instructions: 'Laisser fondre sous la langue ou dissoudre dans un verre d’eau (max 6 cp/jour)',
      },
      {
        medicineName: 'Racécadotril 100mg',
        dosage: '1 gélule 3 fois par jour',
        duration: '3 à 5 jours',
        instructions: 'Au début des principaux repas',
      },
      {
        medicineName: 'Sels de Réhydratation Orale (SRO)',
        dosage: '1 sachet dans 1 litre d’eau minérale',
        duration: '3 jours',
        instructions: 'Boire par petites gorgées régulières tout au long de la journée',
      },
    ],
    notes: 'Alimentation de type féculents (riz blanc, carottes cuites, bananes). Éviter le lait, crudités et graisses.',
  },
  {
    id: 'tpl_lumbago',
    name: 'Lombalgie Aiguë / Lumbago',
    category: 'Rhumatologie',
    description: 'Syndrome douloureux rachidien lombaire aigu sans signe neurologique',
    items: [
      {
        medicineName: 'Ibuprofène 400mg',
        dosage: '1 comprimé 3 fois par jour',
        duration: '5 jours',
        instructions: 'Strictement au milieu des repas',
      },
      {
        medicineName: 'Paracétamol 1000mg',
        dosage: '1 comprimé 3 fois par jour',
        duration: '5 jours',
        instructions: 'En alternance avec l’anti-inflammatoire',
      },
      {
        medicineName: 'Thiocolchicoside 4mg',
        dosage: '1 comprimé matin et soir',
        duration: '5 jours',
        instructions: 'Myorelaxant après les repas',
      },
      {
        medicineName: 'Oméprazole 20mg',
        dosage: '1 gélule par jour',
        duration: '7 jours',
        instructions: 'Le matin à jeun pour protection gastrique',
      },
    ],
    notes: 'Maintenir une activité modérée sans forcer, application de compresses chaudes locales. Éviter le repos strict au lit prolongé.',
  },
  {
    id: 'tpl_cystite',
    name: 'Cystite Aiguë Simple',
    category: 'Infectiologie & Urologie',
    description: 'Infection urinaire basse simple de la femme non enceinte',
    items: [
      {
        medicineName: 'Fosfomycine Trométamol 3g',
        dosage: '1 sachet en prise unique',
        duration: '1 jour',
        instructions: 'Le soir au coucher après avoir vidé la vessie, à jeun depuis 2 heures',
      },
      {
        medicineName: 'Phloroglucinol 80mg',
        dosage: '2 comprimés en cas de brûlures ou spasmes mictionnels',
        duration: '3 jours',
        instructions: 'Max 6 comprimés par 24h',
      },
    ],
    notes: 'Boire abondamment (2 à 3 litres d’eau/jour), mictions fréquentes sans se retenir. Consulter si fièvre ou douleurs lombaires.',
  },
  {
    id: 'tpl_bronchite',
    name: 'Bronchite Aiguë de l’adulte',
    category: 'ORL & Pneumologie',
    description: 'Traitement symptomatique de la bronchite aiguë chez le sujet sain',
    items: [
      {
        medicineName: 'Paracétamol 1000mg',
        dosage: '1 comprimé 3 fois par jour',
        duration: '5 jours',
        instructions: 'En cas de fièvre ou courbatures',
      },
      {
        medicineName: 'Carbocistéine 750mg',
        dosage: '1 sachet ou cuillère 3 fois par jour',
        duration: '5 jours',
        instructions: 'Fluifiant bronchique après les repas, ne pas prendre après 18h',
      },
    ],
    notes: 'Boissons chaudes, arrêt impératif du tabac, aération du logement. Reconsulter si dyspnée ou fièvre > 3 jours.',
  },
  {
    id: 'tpl_grippe',
    name: 'Syndrome Grippal / Rhinopharyngite',
    category: 'Général',
    description: 'Prise en charge symptomatique de l’état fébrile et congestion rhinopharyngée',
    items: [
      {
        medicineName: 'Paracétamol 1000mg',
        dosage: '1 comprimé toutes les 6 heures si fièvre/céphalées',
        duration: '5 jours',
        instructions: 'Ne pas dépasser 3g à 4g par jour',
      },
      {
        medicineName: 'Sérum physiologique nasal / Spray marin hypertonique',
        dosage: '1 à 2 pulvérisations dans chaque narine 4 fois par jour',
        duration: '7 jours',
        instructions: 'Mouchage soigné après pulvérisation',
      },
      {
        medicineName: 'Vitamine C 1000mg',
        dosage: '1 comprimé effervescent par jour',
        duration: '10 jours',
        instructions: 'Le matin dans un verre d’eau',
      },
    ],
    notes: 'Repos au chaud, hydratation régulière, isolement relatif.',
  },
];

const PRESCRIPTION_TEMPLATES_STORAGE_KEY = 'medicab_prescription_templates_v1';

export function getStoredPrescriptionTemplates(): PrescriptionTemplate[] {
  try {
    const raw = localStorage.getItem(PRESCRIPTION_TEMPLATES_STORAGE_KEY);
    if (!raw) return DEFAULT_PRESCRIPTION_TEMPLATES;
    const customList: PrescriptionTemplate[] = JSON.parse(raw);
    const existingIds = new Set(customList.map((t) => t.id));
    const merged = [...customList];
    for (const def of DEFAULT_PRESCRIPTION_TEMPLATES) {
      if (!existingIds.has(def.id)) {
        merged.push(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_PRESCRIPTION_TEMPLATES;
  }
}

export function saveStoredPrescriptionTemplates(templates: PrescriptionTemplate[]): void {
  try {
    localStorage.setItem(PRESCRIPTION_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving prescription templates:', e);
  }
}
