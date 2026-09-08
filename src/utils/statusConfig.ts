import { AppointmentStatus } from '../types';

export interface StatusConfig {
  label: string;
  hex: string;
  textColor: string;
}

export const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, StatusConfig> = {
  confirmed: {
    label: 'Confirmé',
    hex: '#22C55E',
    textColor: '#FFFFFF',
  },
  waiting: {
    label: 'En attente',
    hex: '#F59E0B',
    textColor: '#0F172A',
  },
  urgent: {
    label: 'Urgence',
    hex: '#8B5CF6',
    textColor: '#FFFFFF',
  },
  completed: {
    label: 'Terminé',
    hex: '#3B82F6',
    textColor: '#FFFFFF',
  },
  cancelled: {
    label: 'Annulé',
    hex: '#EF4444',
    textColor: '#FFFFFF',
  },
  absent: {
    label: 'Absent',
    hex: '#6B7280',
    textColor: '#FFFFFF',
  },
  in_consultation: {
    label: 'En consultation',
    hex: '#06B6D4',
    textColor: '#FFFFFF',
  },
};

export function getStatusConfig(status: AppointmentStatus | string): StatusConfig {
  return APPOINTMENT_STATUS_MAP[status as AppointmentStatus] || {
    label: status || 'Inconnu',
    hex: '#6B7280',
    textColor: '#FFFFFF',
  };
}
