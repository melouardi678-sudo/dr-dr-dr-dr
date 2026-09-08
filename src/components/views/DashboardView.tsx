import React from 'react';
import { Logo } from '../Logo';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Stethoscope,
  PlusCircle,
  FileText,
  Receipt,
  UserPlus,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Patient, Appointment, ConsultationItem, Invoice, CabinetSettings } from '../../types';
import { NavTab } from '../Sidebar';
import { t } from '../../utils/translations';
import { getStatusConfig } from '../../utils/statusConfig';

interface DashboardViewProps {
  patients: Patient[];
  appointments: Appointment[];
  consultations: ConsultationItem[];
  invoices: Invoice[];
  settings: CabinetSettings;
  onNavigate: (tab: NavTab) => void;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenNewConsultation: () => void;
  onOpenNewPrescription: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  appointments,
  consultations,
  invoices,
  settings,
  onNavigate,
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenNewConsultation,
  onOpenNewPrescription,
}) => {
  const lang = settings.language || 'fr';
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Metrics calculations
  const totalPatients = patients.length;
  const todayAppointments = appointments.filter((a) => a.date === today);
  const waitingPatients = appointments.filter((a) => a.date === today && a.status === 'waiting');

  const todayIncome = invoices
    .filter((inv) => inv.date === today && inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amountPaid, 0);

  const monthIncome = invoices
    .filter((inv) => inv.date.startsWith(currentMonth) && inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amountPaid, 0);

  const monthConsultations = consultations.filter((c) => c.date.startsWith(currentMonth)).length;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl text-white">
        <div className="flex items-center space-x-4">
          <div className="relative shrink-0">
            <img
              src={settings.doctorAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
              alt={settings.doctorName}
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/80 shadow-lg ring-2 ring-emerald-500/30"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">
              {settings.doctorName}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewAppointment}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md border border-emerald-500/80 hover:brightness-105 hover:border-emerald-400 flex items-center space-x-1.5 transition-all duration-200"
          >
            <Calendar className="w-4 h-4" />
            <span>+ {t('dash_btn_new_apt', lang)}</span>
          </button>
          <button
            onClick={onOpenNewPatient}
            className="px-3.5 py-2 bg-slate-800/90 text-slate-100 rounded-xl text-xs font-semibold border border-slate-700/80 hover:border-slate-500/80 hover:brightness-105 flex items-center space-x-1.5 transition-all duration-200"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>+ {t('dash_btn_new_patient', lang)}</span>
          </button>
          <button
            onClick={onOpenNewConsultation}
            className="px-3.5 py-2 bg-slate-800/90 text-slate-100 rounded-xl text-xs font-semibold border border-slate-700/80 hover:border-slate-500/80 hover:brightness-105 flex items-center space-x-1.5 transition-all duration-200"
          >
            <Stethoscope className="w-4 h-4 text-blue-400" />
            <span>+ {t('dash_btn_new_consultation', lang)}</span>
          </button>
          <button
            onClick={onOpenNewPrescription}
            className="px-3.5 py-2 bg-slate-800/90 text-slate-100 rounded-xl text-xs font-semibold border border-slate-700/80 hover:border-slate-500/80 hover:brightness-105 flex items-center space-x-1.5 transition-all duration-200"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>{t('dash_btn_new_prescription', lang)}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Patients */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Patients Total</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalPatients}</div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            <span>Base enregistrée</span>
          </div>
        </div>

        {/* Today Appointments */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">RDV Aujourd'hui</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{todayAppointments.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Planning du jour</div>
        </div>

        {/* Patients in Waiting Room */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">En Salle d'Attente</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{waitingPatients.length}</div>
          <div className="text-[10px] text-amber-400/80 mt-1 font-semibold">Patients prêts</div>
        </div>

        {/* Today Income */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Revenus du Jour</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {todayIncome.toFixed(0)} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Caisse journalière</div>
        </div>

        {/* Month Income */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Revenus du Mois</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {monthIncome.toFixed(0)} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">Cumul mensuel</div>
        </div>

        {/* Month Consultations */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Consultations Mois</span>
            <Stethoscope className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{monthConsultations}</div>
          <div className="text-[10px] text-slate-400 mt-1">Activité médicale</div>
        </div>
      </div>

      {/* Main Content Split: Waiting Room & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Room & Appointments (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-sm text-white">Salle d'Attente & Rendez-vous du Jour</h2>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Voir l'Agenda Complet →
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-600" />
              <p>Aucun rendez-vous prévu aujourd'hui.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 hover:brightness-105 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-center bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 min-w-[55px]">
                      <span className="font-mono text-xs font-bold text-emerald-400 block">{apt.time}</span>
                      <span className="text-[9px] text-slate-400 uppercase">{apt.durationMinutes} min</span>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-white uppercase">{apt.patientName}</div>
                      <div className="text-[11px] text-slate-400">{apt.reason}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      style={{
                        backgroundColor: getStatusConfig(apt.status).hex,
                        color: getStatusConfig(apt.status).textColor,
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase shadow-sm tracking-wide"
                    >
                      {getStatusConfig(apt.status).label}
                    </span>

                    <button
                      onClick={onOpenNewConsultation}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition"
                    >
                      Démarrer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Activity Stream & Cabinet Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-sm text-white">Activité Récente & Alertes</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-400">Sécurité et Licence</span>
                <span>En direct</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Base de données SQLite locale chiffrée. Sauvegarde automatique configurée.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-blue-400">Dernières Consultations</span>
                <span>{consultations.length} enregistrée(s)</span>
              </div>
              {consultations.slice(0, 3).map((c) => (
                <div key={c.id} className="text-[11px] text-slate-300 pt-1 border-t border-slate-900 flex justify-between">
                  <span className="font-medium text-white">{c.patientName}</span>
                  <span className="text-slate-500">{c.cost} {settings.currency}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <div className="font-semibold text-amber-400">Rappels WhatsApp & SMS</div>
              <p className="text-slate-400">
                Envoyez les confirmations de RDV en 1 clic par WhatsApp pour réduire les retards.
              </p>
              <button
                onClick={() => onNavigate('messaging')}
                className="text-emerald-400 hover:underline font-semibold pt-1 block"
              >
                Lancer le module de rappel →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
