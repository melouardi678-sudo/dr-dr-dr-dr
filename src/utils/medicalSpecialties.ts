import type { CabinetSettings, SpecialtyManagementSettings } from '../types';

export const GENERAL_MEDICAL_SPECIALTIES = [
  'Médecine Générale',
  'Cardiologie',
  'Pédiatrie',
  'Gynécologie',
  'Obstétrique',
  'Dermatologie',
  'Gastro-entérologie',
  'Pneumologie',
  'Neurologie',
  'Psychiatrie',
  'Endocrinologie',
  'Néphrologie',
  'Urologie',
  'Rhumatologie',
  'Orthopédie',
  'ORL',
  'Médecine Interne',
  'Hématologie',
  'Oncologie',
  'Infectiologie',
  'Allergologie',
  'Médecine du Travail',
  'Médecine d\'Urgence',
  'Médecine Physique et Réadaptation',
  'Gériatrie',
  'Anesthésie-Réanimation',
  'Chirurgie Générale',
  'Médecine du Sport',
  'Radiologie',
];

export const DENTAL_SPECIALTIES = ['Dentisterie'];

export const DENTAL_PROCEDURES = [
  'Consultation Dentaire',
  'Détartrage',
  'Extraction',
  'Obturation',
  'Traitement de Canal',
  'Couronne',
  'Bridge',
  'Implantologie',
  'Orthodontie',
  'Chirurgie Dentaire',
  'Blanchiment',
];

export const OPHTHALMOLOGY_SPECIALTIES = ['Ophtalmologie'];

export const DENTAL_TOOTH_STATUSES = [
  'Dent Saine',
  'Carie',
  'Carie Profonde',
  'Dent Absente',
  'Dent Extraite',
  'Dent Cassée',
  'Obturation',
  'Dévitalisée',
  'Traitement Endodontique',
  'Couronne',
  'Bridge',
  'Implant',
  'Dent Mobile',
  'Infection',
  'Abcès',
  'Fracture',
  'Dent Incluse',
  'Prothèse',
  'À Traiter',
  'Dent à Traiter',
] as const;

export const MEDICAL_SPECIALTY_OPTIONS = [
  ...GENERAL_MEDICAL_SPECIALTIES.map((specialty) => ({
    id: specialty,
    label: specialty,
    category: 'general' as const,
  })),
  ...DENTAL_SPECIALTIES.map((specialty) => ({
    id: specialty,
    label: specialty,
    category: 'dental' as const,
  })),
  ...OPHTHALMOLOGY_SPECIALTIES.map((specialty) => ({
    id: specialty,
    label: specialty,
    category: 'ophthalmology' as const,
  })),
];

export const DEFAULT_SPECIALTY_MANAGEMENT: SpecialtyManagementSettings = {
  defaultSpecialty: 'Médecine Générale',
  activeSpecialty: 'Médecine Générale',
  enabledSpecialties: [...GENERAL_MEDICAL_SPECIALTIES, ...DENTAL_SPECIALTIES, ...OPHTHALMOLOGY_SPECIALTIES],
  allowedSpecialtiesByUser: {},
};

export function getSpecialtyCategory(specialty: string): 'general' | 'dental' | 'ophthalmology' {
  return MEDICAL_SPECIALTY_OPTIONS.find((option) => option.id === specialty)?.category || 'general';
}

export function buildSpecialtyManagement(settings: Partial<CabinetSettings> = {}): SpecialtyManagementSettings {
  const fallback = settings.specialtyManagement || DEFAULT_SPECIALTY_MANAGEMENT;
  const enabledSpecialties = Array.isArray(fallback.enabledSpecialties) && fallback.enabledSpecialties.length > 0
    ? fallback.enabledSpecialties.filter((specialty) => MEDICAL_SPECIALTY_OPTIONS.some((option) => option.id === specialty))
    : [...GENERAL_MEDICAL_SPECIALTIES, ...DENTAL_SPECIALTIES, ...OPHTHALMOLOGY_SPECIALTIES];

  const defaultSpecialty = fallback.defaultSpecialty && MEDICAL_SPECIALTY_OPTIONS.some((option) => option.id === fallback.defaultSpecialty)
    ? fallback.defaultSpecialty
    : enabledSpecialties[0] || 'Médecine Générale';

  const activeSpecialty = fallback.activeSpecialty && MEDICAL_SPECIALTY_OPTIONS.some((option) => option.id === fallback.activeSpecialty)
    ? fallback.activeSpecialty
    : defaultSpecialty;

  return {
    ...DEFAULT_SPECIALTY_MANAGEMENT,
    ...fallback,
    defaultSpecialty,
    activeSpecialty,
    enabledSpecialties,
    allowedSpecialtiesByUser: fallback.allowedSpecialtiesByUser || {},
  };
}

export function getEnabledSpecialties(settings: Partial<CabinetSettings>): string[] {
  return buildSpecialtyManagement(settings).enabledSpecialties;
}

export function getActiveSpecialty(settings: Partial<CabinetSettings>): string {
  return buildSpecialtyManagement(settings).activeSpecialty;
}

export function canAccessSpecialty(settings: Partial<CabinetSettings>, userId: string, specialty: string): boolean {
  const specialtyManagement = buildSpecialtyManagement(settings);
  const allowedForUser = specialtyManagement.allowedSpecialtiesByUser?.[userId];

  if (allowedForUser && allowedForUser.length > 0) {
    return allowedForUser.includes(specialty);
  }

  return specialtyManagement.enabledSpecialties.includes(specialty);
}
