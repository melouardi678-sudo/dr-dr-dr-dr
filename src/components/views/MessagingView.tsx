import React, { useState } from 'react';
import { MessageSquare, Mail, Phone, Send, ExternalLink, Check } from 'lucide-react';
import { Patient, Appointment, CabinetSettings } from '../../types';
import { openWhatsAppLink, openEmailClient } from '../../utils/pdfPrint';

interface MessagingViewProps {
  appointments: Appointment[];
  patients: Patient[];
  settings: CabinetSettings;
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  appointments,
  patients,
  settings,
}) => {
  const [template, setTemplate] = useState(
    'Bonjour {PATIENT}, nous vous rappelons votre rendez-vous médical le {DATE} à {HEURE} au {CABINET}. Merci de confirmer votre présence.'
  );

  const handleSendWhatsApp = (apt: Appointment) => {
    let msg = template
      .replace('{PATIENT}', apt.patientName)
      .replace('{DATE}', apt.date)
      .replace('{HEURE}', apt.time)
      .replace('{CABINET}', settings.name);
    openWhatsAppLink(apt.phone, msg);
  };

  const handleSendEmail = (apt: Appointment) => {
    const patientObj = patients.find((p) => p.id === apt.patientId);
    let msg = template
      .replace('{PATIENT}', apt.patientName)
      .replace('{DATE}', apt.date)
      .replace('{HEURE}', apt.time)
      .replace('{CABINET}', settings.name);
    openEmailClient(patientObj?.email || '', `Rappel RDV Médical - ${settings.name}`, msg);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Messagerie & Rappels de Rendez-vous</h1>
            <p className="text-xs text-slate-400">Envoi de rappels WhatsApp, SMS et e-mail automatisés</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Modèle de Message de Rappel</h2>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={5}
            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none"
          />
          <p className="text-[10px] text-slate-400">
            Variables disponibles : <code>&#123;PATIENT&#125;</code>, <code>&#123;DATE&#125;</code>, <code>&#123;HEURE&#125;</code>, <code>&#123;CABINET&#125;</code>
          </p>
        </div>

        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Envoyer Rappels aux Patients Prévus</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white uppercase">{apt.patientName}</div>
                  <div className="text-[10px] text-slate-400">{apt.date} à {apt.time} • Tél: {apt.phone}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSendWhatsApp(apt)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleSendEmail(apt)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center space-x-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
