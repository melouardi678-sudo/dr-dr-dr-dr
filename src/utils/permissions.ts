import { StaffPermissions, UserRole } from '../types';

export const DEFAULT_ADMIN_PERMISSIONS: StaffPermissions = {
  canViewDashboard: true,
  canViewAgenda: true,
  canManageAppointments: true,
  canViewPatients: true,
  canEditPatients: true,
  canDeletePatients: true,
  canViewConsultations: true,
  canCreateConsultations: true,
  canCreatePrescriptions: true,
  canViewMedications: true,
  canManageMedications: true,
  canAddMedications: true,
  canEditMedications: true,
  canDeleteMedications: true,
  canManageDrugDatabase: true,
  canViewCertificates: true,
  canCreateCertificates: true,
  canViewBilling: true,
  canCreateInvoices: true,
  canViewAccounting: true,
  canManageExpenses: true,
  canViewStock: true,
  canManageStock: true,
  canViewMessaging: true,
  canViewSecurity: true,
  canManageBackup: true,
  canManageSettings: true,
  canManageStaff: true,
  canViewUltrasound: true,
  canCreateUltrasound: true,
};

export const DEFAULT_SECRETARY_PERMISSIONS: StaffPermissions = {
  canViewDashboard: true,
  canViewAgenda: true,
  canManageAppointments: true,
  canViewPatients: true,
  canEditPatients: true,
  canDeletePatients: false,
  canViewConsultations: false,
  canCreateConsultations: false,
  canCreatePrescriptions: false,
  canViewMedications: true,
  canManageMedications: false,
  canAddMedications: false,
  canEditMedications: false,
  canDeleteMedications: false,
  canManageDrugDatabase: false,
  canViewCertificates: false,
  canCreateCertificates: false,
  canViewBilling: true,
  canCreateInvoices: true,
  canViewAccounting: false,
  canManageExpenses: false,
  canViewStock: true,
  canManageStock: false,
  canViewMessaging: true,
  canViewSecurity: false,
  canManageBackup: false,
  canManageSettings: false,
  canManageStaff: false,
  canViewUltrasound: true,
  canCreateUltrasound: false,
};

export const DEFAULT_DOCTOR_PERMISSIONS: StaffPermissions = {
  ...DEFAULT_ADMIN_PERMISSIONS,
  canViewAccounting: false,
  canManageExpenses: false,
  canManageStaff: false,
  canManageBackup: false,
};

export const DEFAULT_ACCOUNTANT_PERMISSIONS: StaffPermissions = {
  canViewDashboard: true,
  canViewAgenda: false,
  canManageAppointments: false,
  canViewPatients: true,
  canEditPatients: false,
  canDeletePatients: false,
  canViewConsultations: false,
  canCreateConsultations: false,
  canCreatePrescriptions: false,
  canViewMedications: false,
  canManageMedications: false,
  canAddMedications: false,
  canEditMedications: false,
  canDeleteMedications: false,
  canManageDrugDatabase: false,
  canViewCertificates: false,
  canCreateCertificates: false,
  canViewBilling: true,
  canCreateInvoices: true,
  canViewAccounting: true,
  canManageExpenses: true,
  canViewStock: true,
  canManageStock: true,
  canViewMessaging: true,
  canViewSecurity: false,
  canManageBackup: false,
  canManageSettings: false,
  canManageStaff: false,
};

export function getDefaultPermissionsForRole(role: UserRole): StaffPermissions {
  switch (role) {
    case 'admin':
      return { ...DEFAULT_ADMIN_PERMISSIONS };
    case 'doctor':
      return { ...DEFAULT_DOCTOR_PERMISSIONS };
    case 'secretary':
    case 'receptionist':
    case 'nurse':
      return { ...DEFAULT_SECRETARY_PERMISSIONS };
    case 'accountant':
      return { ...DEFAULT_ACCOUNTANT_PERMISSIONS };
    default:
      return { ...DEFAULT_SECRETARY_PERMISSIONS };
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Médecin / Administrateur';
    case 'doctor':
      return 'Médecin Associé';
    case 'secretary':
      return 'Secrétaire Médicale';
    case 'receptionist':
      return 'Réceptionniste';
    case 'nurse':
      return 'Infirmier(e)';
    case 'accountant':
      return 'Comptable / Gestionnaire';
    default:
      return 'Employé';
  }
}
