import {
  AppUser,
  CabinetSettings,
  Patient,
  Appointment,
  ConsultationItem,
  Prescription,
  PrescriptionTemplate,
  Medication,
  MedicalCertificate,
  AnalysisRequest,
  BioGroupPreset,
  UltrasoundReport,
  UltrasoundTemplate,
  Invoice,
  Expense,
  StockItem,
  AuditLog,
  ConnectionLog,
  UserRole,
  PrescriptionPrintSettings,
} from '../types';

export const DEFAULT_PRESCRIPTION_PRINT_SETTINGS: PrescriptionPrintSettings = {
  showAge: true,
  showHeader: true,
  showCabinetCoords: true,
  showPhone: true,
  showAddress: true,
  showEmail: true,
  showLogo: true,
  showCin: true,
  showWeight: true,
  showPatientName: true,
  showDate: true,
  showFooter: true,
  paperSize: 'A4',
  customHeaderSpaceMm: 45,
};
import {
  DEFAULT_PRESCRIPTION_TEMPLATES,
  getStoredPrescriptionTemplates,
  saveStoredPrescriptionTemplates,
} from './prescriptionTemplates';
import {
  DEFAULT_ULTRASOUND_TEMPLATES,
  getStoredUltrasoundTemplates,
  saveStoredUltrasoundTemplates,
  getStoredUltrasoundReports,
  saveStoredUltrasoundReports,
} from './ultrasoundTemplates';
import {
  DEFAULT_BIO_GROUPS,
  getStoredBioGroups,
  saveStoredBioGroups,
} from './bioCatalog';
import { MOROCCAN_MEDICATIONS_CATALOG } from './moroccanMedications';
import { mergeWithMoroccanCatalog } from './medicationSearch';

const STORAGE_KEYS = {
  SETTINGS: 'medicab_settings_v1',
  USERS: 'medicab_users_v1',
  CURRENT_USER: 'medicab_current_user_v1',
  PATIENTS: 'medicab_patients_v1',
  APPOINTMENTS: 'medicab_appointments_v1',
  CONSULTATIONS: 'medicab_consultations_v1',
  PRESCRIPTIONS: 'medicab_prescriptions_v1',
  PRESCRIPTION_TEMPLATES: 'medicab_prescription_templates_v1',
  MEDICATIONS: 'medicab_medications_v1',
  CERTIFICATES: 'medicab_certificates_v1',
  ANALYSIS_REQUESTS: 'medicab_analysis_requests_v1',
  BIO_GROUPS: 'medicab_bio_groups_catalog_v1',
  ULTRASOUND_REPORTS: 'medicab_ultrasound_reports_v1',
  ULTRASOUND_TEMPLATES: 'medicab_ultrasound_templates_v1',
  INVOICES: 'medicab_invoices_v1',
  EXPENSES: 'medicab_expenses_v1',
  STOCK: 'medicab_stock_v1',
  AUDIT_LOGS: 'medicab_audit_logs_v1',
  CONNECTION_LOGS: 'medicab_connection_logs_v1',
};

// No hardcoded default accounts
export const DEFAULT_USERS: AppUser[] = [];

export const DEFAULT_SETTINGS: CabinetSettings = {
  name: 'Cabinet Médical Dr. BENALI',
  doctorName: 'Dr. Karim BENALI',
  speciality: 'Médecine Générale & Chronique',
  address: '12 Avenue Mohammed V, Résidence Ibn Sina, 2ème étage',
  phone: '05 22 34 56 78 / 06 61 12 34 56',
  email: 'contact@cabinet-benali.ma',
  taxRate: 0,
  currency: 'DH',
  doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  language: 'fr',
  direction: 'ltr',
  theme: 'light',
  autoBackup: true,
  prescriptionPrintSettings: DEFAULT_PRESCRIPTION_PRINT_SETTINGS,
};

// Seed Medications - Référentiel National Marocain Hors-Ligne
export const INITIAL_MEDICATIONS: Medication[] = MOROCCAN_MEDICATIONS_CATALOG;

// Seed Patients
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat_1',
    lastName: 'EL AMrani',
    firstName: 'Omar',
    birthDate: '1984-05-14',
    age: 42,
    gender: 'M',
    cin: 'BE892104',
    insuranceNumber: 'CNSS-7849201',
    insuranceType: 'CNSS',
    privateInsuranceName: '',
    address: 'Avenue Hassan II, Casablanca',
    phone: '06 61 98 76 54',
    email: 'omar.elamrani@gmail.com',
    profession: 'Ingénieur informatique',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Salma El Amrani',
      phone: '06 61 11 22 33',
      relation: 'Épouse',
    },
    medicalRecord: {
      diseases: ['Hypertension artérielle légère'],
      allergies: ['Pénicilline'],
      treatments: ['Amlodipine 5mg'],
      vaccines: ['Tétanos (2022)', 'COVID-19 Booster'],
      antecedents: 'Appendicectomie en 2008',
      bloodGroup: 'A+',
      privateNotes: 'Patient très ponctuel. Préfère les RDV en fin d’après-midi.',
    },
    documents: [
      {
        id: 'doc_101',
        name: 'Radiographie Thoracique (Face/Profil)',
        type: 'xray',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
        date: '2026-07-15',
        notes: 'Numérisation HD. Pas d’anomalie pleuro-parenchymateuse évolutive.',
      },
      {
        id: 'doc_102',
        name: 'Bilan Biologique Sanguin (NFS, Glycémie)',
        type: 'lab',
        url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
        date: '2026-08-01',
        notes: 'Glycémie à jeun : 0.98 g/L. Cholestérol total : 1.85 g/L.',
      },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'pat_2',
    lastName: 'BENNANI',
    firstName: 'Fatima Zohra',
    birthDate: '1992-11-03',
    age: 33,
    gender: 'F',
    address: 'Quartier Gauthier, Casablanca',
    phone: '06 62 45 89 12',
    email: 'fz.bennani@outlook.com',
    profession: 'Architecte',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Youssef Bennani',
      phone: '06 62 99 88 77',
      relation: 'Frère',
    },
    medicalRecord: {
      diseases: ['Migraine chronique'],
      allergies: ['Aspirine'],
      treatments: ['Ibuprofène 400mg au besoin'],
      vaccines: ['Grippe annuelle'],
      antecedents: 'Aucune chirurgie',
      bloodGroup: 'O+',
      privateNotes: 'Sujette au stress professionnel. Bilan biologique récent normal.',
    },
    documents: [
      {
        id: 'doc_103',
        name: 'Scanner Cérébral & Angio-IRM',
        type: 'scanner',
        url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80',
        date: '2026-06-20',
        notes: 'Examen IRM normal. Absence de lésion anévrismale.',
      },
    ],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'pat_3',
    lastName: 'CHRAIBI',
    firstName: 'Mehdi',
    birthDate: '1976-08-22',
    age: 49,
    gender: 'M',
    address: 'Boulevard Anfa, Casablanca',
    phone: '06 63 12 34 56',
    email: 'm.chraibi@corporate.ma',
    profession: 'Directeur financier',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Nadia Chraibi',
      phone: '06 63 44 55 66',
      relation: 'Épouse',
    },
    medicalRecord: {
      diseases: ['Diabète de type 2', 'Hypercholestérolémie'],
      allergies: ['Aucune connue'],
      treatments: ['Metformine 850mg', 'Atorvastatine 20mg'],
      vaccines: ['Hépatite B', 'Tétanos'],
      antecedents: 'Ancien fumeur (arrêté en 2020)',
      bloodGroup: 'B+',
      privateNotes: 'Suivi trimestriel HBA1c obligatoire. Bon respect du traitement.',
    },
    documents: [],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

import { safeGetItem, safeSetItem } from './safeStorage';
import { getNetworkConfig } from './networkConfig';
import { syncClient } from './syncClient';

const KEY_TO_COLLECTION: Record<string, string> = {
  [STORAGE_KEYS.SETTINGS]: 'settings',
  [STORAGE_KEYS.USERS]: 'users',
  [STORAGE_KEYS.PATIENTS]: 'patients',
  [STORAGE_KEYS.APPOINTMENTS]: 'appointments',
  [STORAGE_KEYS.CONSULTATIONS]: 'consultations',
  [STORAGE_KEYS.PRESCRIPTIONS]: 'prescriptions',
  [STORAGE_KEYS.MEDICATIONS]: 'medications',
  [STORAGE_KEYS.CERTIFICATES]: 'certificates',
  [STORAGE_KEYS.ANALYSIS_REQUESTS]: 'analysisRequests',
  [STORAGE_KEYS.ULTRASOUND_REPORTS]: 'ultrasoundReports',
  [STORAGE_KEYS.INVOICES]: 'invoices',
  [STORAGE_KEYS.EXPENSES]: 'expenses',
  [STORAGE_KEYS.STOCK]: 'stock',
  [STORAGE_KEYS.AUDIT_LOGS]: 'auditLogs',
};

// Helper getters and setters
export function getStoredData<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    safeSetItem(key, JSON.stringify(data));
  } catch (e) {
    // Silent fallback
  }

  // Network sync propagation
  try {
    const netConfig = getNetworkConfig();
    const collection = KEY_TO_COLLECTION[key];
    if (collection && netConfig.mode !== 'local') {
      if (netConfig.mode === 'client') {
        if (Array.isArray(data)) {
          syncClient.saveBatch(collection, data).catch((err) => console.warn('[StorageSync] Batch save warning:', err));
        } else {
          syncClient.saveItem(collection, data).catch((err) => console.warn('[StorageSync] Item save warning:', err));
        }
      } else if (netConfig.mode === 'server') {
        syncClient.broadcastMutation(collection, 'refresh', data);
      }
    }
  } catch (err) {
    console.warn('[Storage] Sync trigger warning:', err);
  }
}

/**
 * Synchronize all collections with Central MediCab Server
 */
export async function syncWithCentralServer(): Promise<{ success: boolean; stats: Record<string, number> }> {
  const stats: Record<string, number> = {};
  const collections = [
    { key: STORAGE_KEYS.SETTINGS, name: 'settings' },
    { key: STORAGE_KEYS.USERS, name: 'users' },
    { key: STORAGE_KEYS.PATIENTS, name: 'patients' },
    { key: STORAGE_KEYS.APPOINTMENTS, name: 'appointments' },
    { key: STORAGE_KEYS.CONSULTATIONS, name: 'consultations' },
    { key: STORAGE_KEYS.PRESCRIPTIONS, name: 'prescriptions' },
    { key: STORAGE_KEYS.MEDICATIONS, name: 'medications' },
    { key: STORAGE_KEYS.CERTIFICATES, name: 'certificates' },
    { key: STORAGE_KEYS.ANALYSIS_REQUESTS, name: 'analysisRequests' },
    { key: STORAGE_KEYS.ULTRASOUND_REPORTS, name: 'ultrasoundReports' },
    { key: STORAGE_KEYS.INVOICES, name: 'invoices' },
    { key: STORAGE_KEYS.EXPENSES, name: 'expenses' },
    { key: STORAGE_KEYS.STOCK, name: 'stock' },
    { key: STORAGE_KEYS.AUDIT_LOGS, name: 'auditLogs' },
  ];

  let successCount = 0;
  for (const col of collections) {
    try {
      const data = await syncClient.fetchCollection(col.name);
      if (data !== null) {
        safeSetItem(col.key, JSON.stringify(data));
        stats[col.name] = Array.isArray(data) ? data.length : 1;
        successCount++;
      }
    } catch (e) {
      console.warn(`[Sync] Failed to sync ${col.name}:`, e);
    }
  }

  return { success: successCount > 0, stats };
}


// Higher-level storage functions
export function getSettings(): CabinetSettings {
  const settings = getStoredData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    prescriptionPrintSettings: {
      ...DEFAULT_PRESCRIPTION_PRINT_SETTINGS,
      ...(settings.prescriptionPrintSettings || {}),
    },
  };
}

export function saveSettings(settings: CabinetSettings): void {
  setStoredData(STORAGE_KEYS.SETTINGS, settings);
}

export function getUsers(): AppUser[] {
  const defaultUsers: AppUser[] = [
    {
      id: 'usr_1',
      username: 'admin',
      fullName: 'Dr. Karim BENALI',
      role: 'admin',
      email: 'admin@medicab.ma',
      phone: '06 61 12 34 56',
      pinCode: '1234',
      status: 'active',
      passwordHash: '',
      passwordSalt: 'salt123',
    },
    {
      id: 'usr_2',
      username: 'secretaire',
      fullName: 'Siham EL AMRI',
      role: 'secretary',
      email: 'secretaire@medicab.ma',
      phone: '06 61 98 76 54',
      pinCode: '5678',
      status: 'active',
      passwordHash: '',
      passwordSalt: 'salt456',
    },
  ];
  const stored = getStoredData<AppUser[]>(STORAGE_KEYS.USERS, defaultUsers);
  if (!stored || stored.length === 0) {
    saveUsers(defaultUsers);
    return defaultUsers;
  }
  return stored;
}

export function saveUsers(users: AppUser[]): void {
  setStoredData(STORAGE_KEYS.USERS, users);
}

export function findUserByEmail(email: string): AppUser | undefined {
  const users = getUsers();
  const clean = email.trim().toLowerCase();
  return users.find((u) => u.email && u.email.trim().toLowerCase() === clean);
}

export function findUserByPin(pin: string): AppUser | undefined {
  const users = getUsers();
  const cleanPin = pin.trim();
  if (!cleanPin) return undefined;
  return users.find((u) => u.pinCode === cleanPin && u.status !== 'suspended');
}

export function updateUser(updatedUser: AppUser): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
  } else {
    users.push(updatedUser);
  }
  saveUsers(users);
}

export function deleteUser(userId: string): boolean {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== userId);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}

export function getCurrentUser(): AppUser | null {
  return getStoredData<AppUser | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: AppUser): void {
  setStoredData(STORAGE_KEYS.CURRENT_USER, user);
}

export function getPatients(): Patient[] {
  return getStoredData(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
}

export function savePatients(patients: Patient[]): void {
  setStoredData(STORAGE_KEYS.PATIENTS, patients);
}

export function getAppointments(): Appointment[] {
  const today = new Date().toISOString().split('T')[0];
  const defaults: Appointment[] = [
    {
      id: 'apt_1',
      patientId: 'pat_1',
      patientName: 'Omar EL AMRANI',
      phone: '06 61 98 76 54',
      date: today,
      time: '09:30',
      durationMinutes: 30,
      reason: 'Contrôle tension artérielle & renouvellement ordonnance',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt_2',
      patientId: 'pat_2',
      patientName: 'Fatima Zohra BENNANI',
      phone: '06 62 45 89 12',
      date: today,
      time: '10:30',
      durationMinutes: 30,
      reason: 'Consultation migraine aiguë',
      status: 'waiting',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt_3',
      patientId: 'pat_3',
      patientName: 'Mehdi CHRAIBI',
      phone: '06 63 12 34 56',
      date: today,
      time: '11:30',
      durationMinutes: 30,
      reason: 'Bilan diététique & contrôle diabète HBA1c',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
  ];
  return getStoredData(STORAGE_KEYS.APPOINTMENTS, defaults);
}

export function saveAppointments(apts: Appointment[]): void {
  setStoredData(STORAGE_KEYS.APPOINTMENTS, apts);
}

export function getMedications(): Medication[] {
  const stored = getStoredData<Medication[]>(STORAGE_KEYS.MEDICATIONS, []);
  if (!stored || stored.length === 0) {
    saveMedications(MOROCCAN_MEDICATIONS_CATALOG);
    return MOROCCAN_MEDICATIONS_CATALOG;
  }
  // If stored list doesn't have the full Moroccan catalog items, merge smoothly while preserving custom meds
  const hasMoroccan = stored.some((m) => m && m.id && m.id.startsWith('mar_med_'));
  if (!hasMoroccan || stored.length < MOROCCAN_MEDICATIONS_CATALOG.length) {
    const merged = mergeWithMoroccanCatalog(stored);
    saveMedications(merged);
    return merged;
  }
  return stored;
}

export function saveMedications(meds: Medication[]): void {
  setStoredData(STORAGE_KEYS.MEDICATIONS, meds);
}

export function getConsultations(): ConsultationItem[] {
  const today = new Date().toISOString().split('T')[0];
  const defaults: ConsultationItem[] = [
    {
      id: 'csl_1',
      patientId: 'pat_1',
      patientName: 'Omar EL AMRANI',
      date: today,
      symptoms: 'Céphalées modérées au réveil, asthénie légère',
      diagnosis: 'Hypertension artérielle essentielle sous-dosée',
      vitals: {
        weightKg: 82,
        heightCm: 178,
        temperatureC: 36.8,
        bloodPressureSystolic: 145,
        bloodPressureDiastolic: 92,
        heartRateBpm: 76,
        oxygenSaturation: 98,
      },
      observations: 'Bon état général. Examen cardiopulmonaire sans anomalie.',
      treatmentPlan: 'Poursuite Amlodipine 5mg + régime hyposodé. Contrôle dans 1 mois.',
      cost: 250,
      createdAt: new Date().toISOString(),
    },
  ];
  return getStoredData(STORAGE_KEYS.CONSULTATIONS, defaults);
}

export function saveConsultations(csls: ConsultationItem[]): void {
  setStoredData(STORAGE_KEYS.CONSULTATIONS, csls);
}

export function getPrescriptions(): Prescription[] {
  const today = new Date().toISOString().split('T')[0];
  const defaults: Prescription[] = [
    {
      id: 'prc_1',
      consultationId: 'csl_1',
      patientId: 'pat_1',
      patientName: 'Omar EL AMRANI',
      patientAge: 42,
      date: today,
      items: [
        {
          medicineName: 'Amlodipine (Amlor 5mg)',
          dosage: '1 gélule par jour le matin',
          duration: '30 jours',
          instructions: 'À prendre avec un grand verre d’eau au petit-déjeuner',
        },
        {
          medicineName: 'Paracétamol (Doliprane 1000mg)',
          dosage: '1 comprimé si maux de tête',
          duration: '5 jours',
          instructions: 'Maximum 3 comprimés par jour',
        },
      ],
      notes: 'Régime pauvre en sel préconisé.',
      createdAt: new Date().toISOString(),
    },
  ];
  return getStoredData(STORAGE_KEYS.PRESCRIPTIONS, defaults);
}

export function savePrescriptions(pres: Prescription[]): void {
  setStoredData(STORAGE_KEYS.PRESCRIPTIONS, pres);
}

export function getPrescriptionTemplates(): PrescriptionTemplate[] {
  return getStoredPrescriptionTemplates();
}

export function savePrescriptionTemplates(templates: PrescriptionTemplate[]): void {
  saveStoredPrescriptionTemplates(templates);
}

export function getCertificates(): MedicalCertificate[] {
  return getStoredData(STORAGE_KEYS.CERTIFICATES, []);
}

export function saveCertificates(certs: MedicalCertificate[]): void {
  setStoredData(STORAGE_KEYS.CERTIFICATES, certs);
}

export function getAnalysisRequests(): AnalysisRequest[] {
  return getStoredData(STORAGE_KEYS.ANALYSIS_REQUESTS, []);
}

export function saveAnalysisRequests(reqs: AnalysisRequest[]): void {
  setStoredData(STORAGE_KEYS.ANALYSIS_REQUESTS, reqs);
}

export function getBioGroups(): BioGroupPreset[] {
  return getStoredBioGroups();
}

export function saveBioGroups(groups: BioGroupPreset[]): void {
  saveStoredBioGroups(groups);
}

export function getUltrasoundReports(): UltrasoundReport[] {
  return getStoredUltrasoundReports();
}

export function saveUltrasoundReports(reports: UltrasoundReport[]): void {
  saveStoredUltrasoundReports(reports);
}

export function getUltrasoundTemplates(): UltrasoundTemplate[] {
  return getStoredUltrasoundTemplates();
}

export function saveUltrasoundTemplates(templates: UltrasoundTemplate[]): void {
  saveStoredUltrasoundTemplates(templates);
}

export function getInvoices(): Invoice[] {
  const today = new Date().toISOString().split('T')[0];
  const defaults: Invoice[] = [
    {
      id: 'inv_1',
      number: 'FAC-2026-0001',
      patientId: 'pat_1',
      patientName: 'Omar EL AMRANI',
      date: today,
      items: [{ description: 'Consultation médecine générale & ECG', amount: 250 }],
      subtotal: 250,
      taxAmount: 0,
      total: 250,
      amountPaid: 250,
      status: 'paid',
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
    },
  ];
  return getStoredData(STORAGE_KEYS.INVOICES, defaults);
}

export function saveInvoices(invs: Invoice[]): void {
  setStoredData(STORAGE_KEYS.INVOICES, invs);
}

export function getExpenses(): Expense[] {
  const today = new Date().toISOString().split('T')[0];
  const defaults: Expense[] = [
    {
      id: 'exp_1',
      description: 'Achat consommables médical (Draps d’examen, gants, seringues)',
      category: 'supplies',
      amount: 450,
      date: today,
      paymentMethod: 'Espèces',
      receiptNumber: 'REC-9981',
    },
  ];
  return getStoredData(STORAGE_KEYS.EXPENSES, defaults);
}

export function saveExpenses(exps: Expense[]): void {
  setStoredData(STORAGE_KEYS.EXPENSES, exps);
}

export function getStock(): StockItem[] {
  const defaults: StockItem[] = [
    {
      id: 'stk_1',
      name: 'Gants d’examen en latex (Taille M)',
      category: 'consumable',
      quantity: 12,
      minAlertThreshold: 5,
      unitPrice: 65,
      location: 'Armoire A - Étagère 2',
      lastRestocked: new Date().toISOString().split('T')[0],
    },
    {
      id: 'stk_2',
      name: 'Draps d’examen plastifiés (Rouleaux)',
      category: 'consumable',
      quantity: 3,
      minAlertThreshold: 5, // low stock alert!
      unitPrice: 120,
      location: 'Réserve',
      lastRestocked: new Date().toISOString().split('T')[0],
    },
    {
      id: 'stk_3',
      name: 'Tensiomètre électronique Omron Pro',
      category: 'equipment',
      quantity: 2,
      minAlertThreshold: 1,
      unitPrice: 1200,
      location: 'Bureau docteur',
      lastRestocked: '2025-12-01',
    },
  ];
  return getStoredData(STORAGE_KEYS.STOCK, defaults);
}

export function saveStock(stock: StockItem[]): void {
  setStoredData(STORAGE_KEYS.STOCK, stock);
}

export function getAuditLogs(): AuditLog[] {
  const defaults: AuditLog[] = [
    {
      id: 'log_1',
      timestamp: new Date().toISOString(),
      userId: 'usr_1',
      userName: 'Dr. Karim BENALI',
      role: 'admin',
      action: 'LOGIN',
      details: 'Connexion réussie à l’application MediCab Desktop',
      ipOrDevice: 'Poste-Doctor-Windows11',
    },
  ];
  return getStoredData(STORAGE_KEYS.AUDIT_LOGS, defaults);
}

export function addAuditLog(action: string, details: string): void {
  const currentUser = getCurrentUser();
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    userName: currentUser.fullName,
    role: currentUser.role,
    action,
    details,
    ipOrDevice: 'Poste-Local-WinEXE',
  };
  setStoredData(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs].slice(0, 500));
}

export function getConnectionLogs(): ConnectionLog[] {
  const defaults: ConnectionLog[] = [
    {
      id: 'conn_1',
      timestamp: new Date().toISOString(),
      userName: 'Dr. Karim BENALI',
      role: 'admin',
      status: 'success',
      deviceInfo: 'Windows 11 x64 / MediCab v2.4 EXE',
    },
  ];
  return getStoredData(STORAGE_KEYS.CONNECTION_LOGS, defaults);
}

export function addConnectionLog(userName: string, role: UserRole, status: 'success' | 'failed'): void {
  const logs = getConnectionLogs();
  const newLog: ConnectionLog = {
    id: `conn_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userName,
    role,
    status,
    deviceInfo: 'Windows 11 x64 / Offline Local Storage',
  };
  setStoredData(STORAGE_KEYS.CONNECTION_LOGS, [newLog, ...logs].slice(0, 200));
}

/**
 * Full JSON export of cabinet database
 */
export function generateFullBackupJSON(): string {
  const backup = {
    exportDate: new Date().toISOString(),
    version: '2.4.0',
    app: 'MediCab Desktop',
    settings: getSettings(),
    patients: getPatients(),
    appointments: getAppointments(),
    consultations: getConsultations(),
    prescriptions: getPrescriptions(),
    prescriptionTemplates: getPrescriptionTemplates(),
    medications: getMedications(),
    certificates: getCertificates(),
    analysisRequests: getAnalysisRequests(),
    bioGroups: getBioGroups(),
    ultrasoundReports: getUltrasoundReports(),
    ultrasoundTemplates: getUltrasoundTemplates(),
    invoices: getInvoices(),
    expenses: getExpenses(),
    stock: getStock(),
    auditLogs: getAuditLogs(),
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Generate an offline SQLite SQL schema & seed script dump
 */
export function generateSQLiteScript(): string {
  const settings = getSettings();
  const patients = getPatients();
  const appointments = getAppointments();
  
  let sql = `-- ========================================================\n`;
  sql += `-- SCHÉMA ET DONNÉES SQLITE POUR MEDICAB DESKTOP\n`;
  sql += `-- Généré le : ${new Date().toLocaleString('fr-FR')}\n`;
  sql += `-- ========================================================\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS cabinet_settings (\n`;
  sql += `  id INTEGER PRIMARY KEY DEFAULT 1,\n`;
  sql += `  name TEXT,\n`;
  sql += `  doctor_name TEXT,\n`;
  sql += `  phone TEXT,\n`;
  sql += `  email TEXT\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS patients (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  last_name TEXT,\n`;
  sql += `  first_name TEXT,\n`;
  sql += `  birth_date TEXT,\n`;
  sql += `  phone TEXT,\n`;
  sql += `  blood_group TEXT\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS appointments (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  patient_id TEXT,\n`;
  sql += `  date TEXT,\n`;
  sql += `  time TEXT,\n`;
  sql += `  reason TEXT,\n`;
  sql += `  status TEXT\n`;
  sql += `);\n\n`;

  sql += `-- Insertion des paramètres du cabinet\n`;
  sql += `INSERT OR REPLACE INTO cabinet_settings (id, name, doctor_name, phone, email) VALUES (1, '${settings.name.replace(/'/g, "''")}', '${settings.doctorName.replace(/'/g, "''")}', '${settings.phone}', '${settings.email}');\n\n`;

  sql += `-- Insertion des patients (${patients.length} enregistrements)\n`;
  patients.forEach(p => {
    sql += `INSERT OR REPLACE INTO patients (id, last_name, first_name, birth_date, phone, blood_group) VALUES ('${p.id}', '${p.lastName.replace(/'/g, "''")}', '${p.firstName.replace(/'/g, "''")}', '${p.birthDate}', '${p.phone}', '${p.bloodGroup}');\n`;
  });

  sql += `\n-- Insertion des rendez-vous (${appointments.length} enregistrements)\n`;
  appointments.forEach(a => {
    sql += `INSERT OR REPLACE INTO appointments (id, patient_id, date, time, reason, status) VALUES ('${a.id}', '${a.patientId}', '${a.date}', '${a.time}', '${a.reason.replace(/'/g, "''")}', '${a.status}');\n`;
  });

  return sql;
}

export function restoreFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) saveSettings(data.settings);
    if (data.patients) savePatients(data.patients);
    if (data.appointments) saveAppointments(data.appointments);
    if (data.consultations) saveConsultations(data.consultations);
    if (data.prescriptions) savePrescriptions(data.prescriptions);
    if (data.prescriptionTemplates) savePrescriptionTemplates(data.prescriptionTemplates);
    if (data.medications) saveMedications(data.medications);
    if (data.certificates) saveCertificates(data.certificates);
    if (data.analysisRequests) saveAnalysisRequests(data.analysisRequests);
    if (data.bioGroups) saveBioGroups(data.bioGroups);
    if (data.ultrasoundReports) saveUltrasoundReports(data.ultrasoundReports);
    if (data.ultrasoundTemplates) saveUltrasoundTemplates(data.ultrasoundTemplates);
    if (data.invoices) saveInvoices(data.invoices);
    if (data.expenses) saveExpenses(data.expenses);
    if (data.stock) saveStock(data.stock);
    addAuditLog('RESTORE_DATABASE', 'Restauration complète de la base de données depuis un fichier JSON');
    return true;
  } catch (e) {
    console.error('Error restoring JSON', e);
    return false;
  }
}
