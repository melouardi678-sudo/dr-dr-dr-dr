export type UserRole = 'admin' | 'doctor' | 'secretary' | 'receptionist' | 'nurse' | 'accountant';

export interface StaffPermissions {
  canViewDashboard: boolean;
  canViewAgenda: boolean;
  canManageAppointments: boolean;
  canViewPatients: boolean;
  canEditPatients: boolean;
  canDeletePatients: boolean;
  canViewConsultations: boolean;
  canCreateConsultations: boolean;
  canCreatePrescriptions: boolean;
  canViewMedications: boolean;
  canManageMedications: boolean;
  canAddMedications?: boolean;
  canEditMedications?: boolean;
  canDeleteMedications?: boolean;
  canManageDrugDatabase?: boolean;
  canViewCertificates: boolean;
  canCreateCertificates: boolean;
  canViewBilling: boolean;
  canCreateInvoices: boolean;
  canViewAccounting: boolean;
  canManageExpenses: boolean;
  canViewStock: boolean;
  canManageStock: boolean;
  canViewMessaging: boolean;
  canViewSecurity: boolean;
  canManageBackup: boolean;
  canManageSettings: boolean;
  canManageStaff: boolean;
  canViewUltrasound?: boolean;
  canCreateUltrasound?: boolean;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  phone?: string;
  pinCode?: string; // Code d'accès spécial / PIN
  status?: 'active' | 'suspended';
  permissions?: StaffPermissions;
  passwordHash: string;
  passwordSalt: string;
  lastLogin?: string;
  resetCode?: string;
  resetCodeExpiration?: string; // ISO string
  failedAttempts?: number;
  lockoutUntil?: string; // ISO string
  avatar?: string;
  mustChangePassword?: boolean;
}

export type LicenseType = 'trial' | 'permanent';

export interface LicenseInfo {
  machineId: string;
  clientId: string;
  cabinetName: string;
  installDate: string; // ISO string
  trialDays: number;
  isActivated: boolean;
  activationCode?: string;
  licenseType: LicenseType;
  expiryDate?: string; // ISO string if applicable
  lastChecksum?: string;
}

export interface PrescriptionPrintSettings {
  showAge: boolean; // Afficher l'âge du patient
  showHeader: boolean; // Afficher l'en-tête (Désactiver pour papier à en-tête pré-imprimé)
  showCabinetCoords: boolean; // Afficher les coordonnées du cabinet
  showPhone: boolean; // Afficher le téléphone
  showAddress: boolean; // Afficher l'adresse
  showEmail: boolean; // Afficher l'email
  showLogo: boolean; // Afficher le logo
  showCin: boolean; // Afficher le CIN du patient
  showWeight: boolean; // Afficher le poids du patient
  showPatientName: boolean; // Afficher Nom et Prénom
  showDate: boolean; // Afficher la date
  showFooter: boolean; // Afficher le pied de page (signature & cachet)
  paperSize: 'A4' | 'A5'; // Format par défaut
  customHeaderSpaceMm: number; // Marge supérieure en mm si en-tête désactivé
}

export interface CabinetSettings {
  name: string;
  doctorName: string;
  speciality: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number; // TVA %
  currency: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  doctorAvatar?: string;
  language: 'fr' | 'ar';
  direction: 'ltr' | 'rtl';
  theme: 'light' | 'dark';
  autoBackup: boolean;
  prescriptionPrintSettings?: PrescriptionPrintSettings;
}

export type AppointmentStatus = 'confirmed' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'urgent' | 'absent';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface MedicalRecord {
  diseases: string[];
  allergies: string[];
  treatments: string[];
  vaccines: string[];
  antecedents: string; // Past surgeries / family history
  bloodGroup: string;
  privateNotes: string;
}

export interface PatientDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'scanner' | 'mri' | 'xray' | 'lab';
  url: string;
  date: string;
  notes?: string;
}

export interface Patient {
  id: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  age: number;
  gender: 'M' | 'F';
  cin?: string;
  insuranceNumber?: string;
  insuranceType?: 'Aucune' | 'AMO' | 'CNSS' | 'CNOPS' | 'RAMED' | 'Assurance privée' | string;
  privateInsuranceName?: string;
  address: string;
  phone: string;
  email: string;
  profession: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  photoUrl?: string;
  medicalRecord: MedicalRecord;
  documents: PatientDocument[];
  createdAt: string;
}

export interface Vitals {
  weightKg?: number;
  heightCm?: number;
  temperatureC?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRateBpm?: number;
  oxygenSaturation?: number;
}

export interface ConsultationItem {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  vitals: Vitals;
  observations: string;
  treatmentPlan: string;
  followUpDate?: string;
  cost: number;
  createdAt: string;
}

export interface PrescriptionItem {
  medicineName: string;
  dosage: string; // e.g. "1 comprimé 3x par jour"
  duration: string; // e.g. "7 jours"
  instructions?: string;
  dci?: string; // DCI / Principe actif (e.g. "Paracétamol")
  dosageStrength?: string; // e.g. "1000 mg"
  dosageForm?: string; // e.g. "Comprimé"
  quantity?: string; // e.g. "1 boîte"
  medicationId?: string;
}

export interface Prescription {
  id: string;
  consultationId?: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  date: string;
  items: PrescriptionItem[];
  templateUsed?: string;
  notes?: string;
  createdAt: string;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  category: string; // e.g. "Général", "ORL & Pneumologie", "Cardiologie", "Métabolisme & Diabète", "Gastro-entérologie", "Infectiologie", "Rhumatologie", "Pédiatrie"
  description?: string;
  items: PrescriptionItem[];
  notes?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface Medication {
  id: string;
  name: string; // Nom commercial (e.g. "Doliprane 1000 mg", "Amoxil 1g")
  dci?: string; // Dénomination Commune Internationale / Principe actif (e.g. "Paracétamol")
  dosage?: string; // Dosage unitaire (e.g. "1000 mg", "1 g / 125 mg")
  category: string; // Classe thérapeutique (e.g. "Antalgique / Antipyrétique")
  dosageForm: string; // Forme pharmaceutique (e.g. "Comprimé", "Sirop", "Gélule", "Sachet", "Suppositoire", "Injectable")
  laboratory?: string; // Laboratoire (e.g. "Sanofi Maroc", "Laprophan", "GSK Maroc", "Sothema", "Cooper Pharma", "Pharma 5")
  defaultDosage: string; // Posologie usuelle par défaut
  defaultDuration?: string; // Durée usuelle recommandée (e.g. "5 jours", "7 jours")
  defaultInstructions?: string; // Conseils / Précautions (e.g. "Après les repas, espacer de 6 heures")
  contraindications: string;
  sideEffects?: string;
  stockQuantity?: number;
  minStockAlert?: number;
  unitPrice?: number; // Prix Public de Vente au Maroc (PPV en DH)
  isActive?: boolean; // Actif pour la prescription
  isPreloaded?: boolean; // Issue de la base officielle marocaine
  isCustom?: boolean; // Créé par l'utilisateur / cabinet
  presentation?: string; // Conditionnement (e.g. "Boîte de 8 comprimés")
  reimbursementRate?: string; // Taux de remboursement (e.g. "Remboursable AMO")
  userNotes?: string;
  updatedAt?: string;
  createdAt?: string;
}

export type CertificateType = 'medical_standard' | 'sick_leave' | 'fitness' | 'work_resume';

export interface MedicalCertificate {
  id: string;
  patientId: string;
  patientName: string;
  type: CertificateType;
  date: string;
  durationDays?: number; // for sick leave
  startDate?: string;
  endDate?: string;
  reasonOrObservation: string;
  createdAt: string;
}

export interface BioTestItem {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

export interface BioGroupPreset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tests: string[];
  indication?: string;
  notes?: string;
  customTests?: string;
  isCustom?: boolean;
}

export interface AnalysisRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  date: string;
  categories: ('biology' | 'mri' | 'ct_scan' | 'xray' | 'ultrasound')[];
  testsRequested: string[]; // e.g. ["NFS / FNS", "Glycémie à jeun", "HbA1c"]
  customTests?: string; // Autres examens / Analyses personnalisées
  indication?: string; // Indication / Motif
  doctorName?: string;
  groupPresetName?: string;
  notes?: string;
  createdAt: string;
}

export type UltrasoundType =
  | 'abdominal'
  | 'pelvic'
  | 'obstetric'
  | 'thyroid'
  | 'renal_urinary'
  | 'breast'
  | 'custom';

export interface UltrasoundReport {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: 'M' | 'F';
  date: string; // YYYY-MM-DD
  doctorName: string;
  examType: UltrasoundType;
  examTypeName: string; // e.g. "Échographie Abdominale Complète"
  indication: string; // e.g. "Douleurs abdominales diffuses"
  equipment?: string; // e.g. "Sonde convexe multifréquence 3.5 MHz"
  findings: string; // Description détaillée par organe
  conclusion: string; // Conclusion / Impression diagnostique
  recommendations?: string; // Conduite à tenir / Examens complémentaires
  images?: string[]; // Snapshot URLs/base64
  templateUsed?: string;
  createdAt: string;
}

export interface UltrasoundTemplate {
  id: string;
  name: string;
  examType: UltrasoundType;
  examTypeName: string;
  indication?: string;
  equipment?: string;
  findings: string;
  conclusion: string;
  recommendations?: string;
  quickSnippets?: string[];
  isCustom?: boolean;
}

export type InvoiceStatus = 'paid' | 'pending' | 'partially_paid' | 'refunded';

export interface Invoice {
  id: string;
  number: string; // e.g. "FAC-2026-0042"
  patientId: string;
  patientName: string;
  date: string;
  items: { description: string; amount: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod: 'cash' | 'card' | 'check' | 'transfer';
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'rent' | 'supplies' | 'equipment' | 'utilities' | 'salary' | 'other';
  amount: number;
  date: string;
  paymentMethod: string;
  receiptNumber?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: 'medicine' | 'consumable' | 'equipment' | 'other';
  quantity: number;
  minAlertThreshold: number;
  unitPrice: number;
  location?: string;
  expiryDate?: string;
  lastRestocked: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  ipOrDevice: string;
}

export interface ConnectionLog {
  id: string;
  timestamp: string;
  userName: string;
  role: UserRole;
  status: 'success' | 'failed';
  deviceInfo: string;
}

export type NetworkMode = 'local' | 'server' | 'client';

export interface NetworkConfig {
  mode: NetworkMode;
  serverIp: string;
  serverPort: number;
  autoDiscovery: boolean;
  lastConnected?: string;
  authToken?: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface NetworkDiagnostics {
  status: ConnectionStatus;
  mode: NetworkMode;
  serverIp: string;
  serverPort: number;
  latencyMs?: number;
  lastChecked?: string;
  errorMessage?: string;
  activeClientsCount?: number;
}

export interface SyncEvent {
  type: 'sync:mutation' | 'sync:full' | 'sync:presence' | 'sync:alert' | 'ping' | 'pong';
  entity?: string;
  action?: 'create' | 'update' | 'delete' | 'refresh';
  data?: any;
  sender?: {
    userId?: string;
    userName?: string;
    role?: string;
  };
  timestamp?: string;
}

