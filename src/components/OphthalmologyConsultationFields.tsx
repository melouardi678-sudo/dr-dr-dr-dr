import React, { useState } from 'react';
import {
  ConsultationItem,
  EyeRefractionMeasurement,
  OphthalmologyConsultationDetails,
} from '../types';

interface OphthalmologyConsultationFieldsProps {
  value: OphthalmologyConsultationDetails;
  onChange: (value: OphthalmologyConsultationDetails) => void;
  previousVisits: ConsultationItem[];
  patientName: string;
  doctorName: string;
  onPrintPrescription: () => void;
  onPrintReport: () => void;
  onEditVisit: (consultation: ConsultationItem) => void;
}

type EyeKey = 'OD' | 'OS';
type RefractionKind = 'subjective' | 'objective' | 'autorefractometry' | 'cycloplegic';
type ExamTab = 'vision' | 'refraction' | 'anterior' | 'posterior' | 'treatment';

const REFRACTION_FIELDS: Array<{ key: keyof EyeRefractionMeasurement; label: string }> = [
  { key: 'sphere', label: 'SPH' },
  { key: 'cylinder', label: 'CYL' },
  { key: 'axis', label: 'AXIS' },
  { key: 'add', label: 'ADD' },
  { key: 'prism', label: 'PRISM' },
  { key: 'base', label: 'BASE' },
  { key: 'pd', label: 'PD' },
];

const TAB_OPTIONS: Array<{ id: ExamTab; label: string }> = [
  { id: 'vision', label: 'Acuité visuelle' },
  { id: 'refraction', label: 'Réfraction' },
  { id: 'anterior', label: 'Segment antérieur' },
  { id: 'posterior', label: 'Segment postérieur & PIO' },
  { id: 'treatment', label: 'Diagnostic & suivi' },
];

const TextField = ({ label, value, onChange, type = 'text' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <label className="block text-slate-400 font-medium">
    <span className="block mb-1">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
  </label>
);

export const OphthalmologyConsultationFields: React.FC<OphthalmologyConsultationFieldsProps> = ({
  value,
  onChange,
  previousVisits,
  patientName,
  doctorName,
  onPrintPrescription,
  onPrintReport,
  onEditVisit,
}) => {
  const [activeTab, setActiveTab] = useState<ExamTab>('vision');
  const setField = <K extends keyof OphthalmologyConsultationDetails>(key: K, fieldValue: OphthalmologyConsultationDetails[K]) =>
    onChange({ ...value, [key]: fieldValue });

  const refraction = (kind: RefractionKind, eye: EyeKey): EyeRefractionMeasurement => {
    if (kind === 'subjective') return eye === 'OD' ? value.refractionOD : value.refractionOS;
    const key = kind === 'objective'
      ? eye === 'OD' ? 'objectiveRefractionOD' : 'objectiveRefractionOS'
      : kind === 'autorefractometry'
        ? eye === 'OD' ? 'autorefractometryOD' : 'autorefractometryOS'
        : eye === 'OD' ? 'cycloplegicRefractionOD' : 'cycloplegicRefractionOS';
    const current = value[key];
    return current || { sphere: '', cylinder: '', axis: '', add: '', prism: '', base: '', pd: '' };
  };

  const updateRefraction = (kind: RefractionKind, eye: EyeKey, field: keyof EyeRefractionMeasurement, fieldValue: string) => {
    const next = { ...refraction(kind, eye), [field]: fieldValue };
    if (kind === 'subjective') {
      setField(eye === 'OD' ? 'refractionOD' : 'refractionOS', next);
      return;
    }

    const key = kind === 'objective'
      ? eye === 'OD' ? 'objectiveRefractionOD' : 'objectiveRefractionOS'
      : kind === 'autorefractometry'
        ? eye === 'OD' ? 'autorefractometryOD' : 'autorefractometryOS'
        : eye === 'OD' ? 'cycloplegicRefractionOD' : 'cycloplegicRefractionOS';
    setField(key, next);
  };

  const renderRefractionTable = (kind: RefractionKind, title: string) => (
    <div className="rounded-xl border border-slate-800 p-3 space-y-2">
      <h4 className="font-bold text-slate-200">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="text-slate-400">
            <tr><th className="p-2">Paramètre</th>{REFRACTION_FIELDS.map((field) => <th key={field.key} className="p-2">{field.label}</th>)}</tr>
          </thead>
          <tbody>
            {(['OD', 'OS'] as const).map((eye) => (
              <tr key={eye} className="border-t border-slate-800">
                <th className="p-2 text-sky-300">{eye}</th>
                {REFRACTION_FIELDS.map((field) => (
                  <td key={field.key} className="p-1">
                    <input
                      aria-label={`${title} ${eye} ${field.label}`}
                      value={refraction(kind, eye)[field.key]}
                      onChange={(event) => updateRefraction(kind, eye, field.key, event.target.value)}
                      className="w-full min-w-16 px-2 py-2 bg-slate-900 border border-slate-700 rounded-md text-white"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEyePair = (label: string, odKey: keyof OphthalmologyConsultationDetails, osKey: keyof OphthalmologyConsultationDetails) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <TextField label={`${label} — OD`} value={String(value[odKey] || '')} onChange={(next) => setField(odKey, next)} />
      <TextField label={`${label} — OS`} value={String(value[osKey] || '')} onChange={(next) => setField(osKey, next)} />
    </div>
  );

  return (
    <section className="p-4 bg-slate-950 rounded-xl border border-sky-800/60 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sky-300 text-sm">Dossier & examen ophtalmologique</h3>
          <p className="text-[11px] text-slate-500">{patientName} · Examens distincts OD / OS · données conservées à chaque visite</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrintReport} className="px-3 py-2 rounded-lg bg-sky-800 hover:bg-sky-700 text-white font-bold text-xs">Imprimer le rapport</button>
          <button type="button" onClick={onPrintPrescription} className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs">Imprimer ordonnance lunettes</button>
        </div>
      </div>

      <div role="tablist" aria-label="Onglets examen ophtalmologique" className="flex flex-wrap gap-2">
        {TAB_OPTIONS.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${activeTab === tab.id ? 'bg-sky-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'vision' && (
        <div className="rounded-xl border border-slate-800 p-3 space-y-3">
          <h4 className="font-bold text-slate-200">Acuité visuelle — mesures sans / avec correction</h4>
          <p className="text-[11px] text-slate-500">Saisissez les résultats dans le format utilisé au cabinet, par exemple 10/10, 6/6 ou 20/20.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {([
              ['Vision de loin sans correction', 'distanceWithoutCorrectionOD', 'distanceWithoutCorrectionOS'],
              ['Vision de loin avec correction', 'distanceWithCorrectionOD', 'distanceWithCorrectionOS'],
              ['Vision de près', 'nearVisionOD', 'nearVisionOS'],
              ['Acuité visuelle', 'visualAcuityOD', 'visualAcuityOS'],
              ['Avec sténopé (Pinhole)', 'pinholeOD', 'pinholeOS'],
              ['Meilleure acuité corrigée (BCVA)', 'bestCorrectedOD', 'bestCorrectedOS'],
            ] as const).map(([label, odKey, osKey]) => (
              <div key={odKey} className="rounded-lg bg-slate-900 p-3 space-y-2">
                <h5 className="text-xs font-bold text-slate-300">{label}</h5>
                <TextField label="OD — Œil droit" value={String(value[odKey] || '')} onChange={(next) => setField(odKey, next)} />
                <TextField label="OS — Œil gauche" value={String(value[osKey] || '')} onChange={(next) => setField(osKey, next)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'refraction' && (
        <div className="space-y-3">
          {renderRefractionTable('subjective', 'Réfraction subjective · prescription proposée')}
          {renderRefractionTable('objective', 'Réfraction objective')}
          {renderRefractionTable('autorefractometry', 'Autoréfractométrie')}
          <div className="rounded-xl border border-slate-800 p-3 space-y-3">
            <h4 className="font-bold text-slate-200">Kératométrie</h4>
            {renderEyePair('Kératométrie', 'keratometryOD', 'keratometryOS')}
          </div>
          <div className="rounded-xl border border-slate-800 p-3 space-y-3">
            <label className="flex items-center gap-2 text-slate-200">
              <input type="checkbox" checked={Boolean(value.cycloplegia)} onChange={(event) => setField('cycloplegia', event.target.checked)} />
              Cycloplégie réalisée / nécessaire
            </label>
            {value.cycloplegia && renderRefractionTable('cycloplegic', 'Réfraction sous cycloplégie')}
          </div>
        </div>
      )}

      {activeTab === 'anterior' && (
        <div className="rounded-xl border border-slate-800 p-3 space-y-3">
          <h4 className="font-bold text-slate-200">Examen du segment antérieur</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['Conjonctive', 'conjunctiva'],
              ['Cornée', 'cornea'],
              ['Chambre antérieure', 'anteriorChamber'],
              ['Iris', 'iris'],
              ['Pupille / réflexes', 'pupil'],
              ['Cristallin', 'lens'],
            ] as const).map(([label, field]) => (
              <TextField key={field} label={label} value={String(value[field] || '')} onChange={(next) => setField(field, next)} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'posterior' && (
        <div className="rounded-xl border border-slate-800 p-3 space-y-3">
          <h4 className="font-bold text-slate-200">Segment postérieur, fond d’œil et pression</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['Vitré', 'vitreous'],
              ['Rétine', 'retina'],
              ['Fond d’œil', 'fundus'],
              ['Nerf optique', 'opticNerve'],
              ['Macula', 'macula'],
              ['Champ visuel', 'visualField'],
            ] as const).map(([label, field]) => (
              <TextField key={field} label={label} value={String(value[field] || '')} onChange={(next) => setField(field, next)} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TextField label="Pression intraoculaire OD (mmHg)" value={value.intraocularPressureOD} onChange={(next) => setField('intraocularPressureOD', next)} />
            <TextField label="Pression intraoculaire OS (mmHg)" value={value.intraocularPressureOS} onChange={(next) => setField('intraocularPressureOS', next)} />
            <TextField label="Méthode de mesure" value={value.pressureMethod || ''} onChange={(next) => setField('pressureMethod', next)} />
          </div>
        </div>
      )}

      {activeTab === 'treatment' && (
        <div className="rounded-xl border border-slate-800 p-3 space-y-3">
          <h4 className="font-bold text-slate-200">Dossier patient, diagnostic, traitement et suivi</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-slate-400 font-medium">
              <span className="block mb-1">Maladies chroniques</span>
              <textarea value={value.chronicConditions || ''} onChange={(event) => setField('chronicConditions', event.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            </label>
            <label className="block text-slate-400 font-medium">
              <span className="block mb-1">Antécédents familiaux ophtalmologiques</span>
              <textarea value={value.familyEyeHistory || ''} onChange={(event) => setField('familyEyeHistory', event.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            </label>
            <label className="block text-slate-400 font-medium">
              <span className="block mb-1">Traitements actuels</span>
              <textarea value={value.currentMedications || ''} onChange={(event) => setField('currentMedications', event.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            </label>
            <label className="block text-slate-400 font-medium">
              <span className="block mb-1">Allergies</span>
              <textarea value={value.allergies || ''} onChange={(event) => setField('allergies', event.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
            </label>
          </div>
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Collyres / médicaments</span>
            <textarea value={value.eyeDrops} onChange={(event) => setField('eyeDrops', event.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </label>
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Plan de traitement</span>
            <textarea value={value.treatmentPlan} onChange={(event) => setField('treatmentPlan', event.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </label>
          <TextField label="Prochain suivi" type="date" value={value.followUp} onChange={(next) => setField('followUp', next)} />
        </div>
      )}

      <div className="rounded-lg border border-slate-800 p-3 space-y-2">
        <h4 className="font-bold text-slate-200">Examens ophtalmologiques précédents</h4>
        {previousVisits.length === 0 ? <p className="text-slate-500">Aucune visite précédente.</p> : previousVisits.map((visit) => (
          <div key={visit.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <span className="text-slate-300">{visit.date} · {visit.diagnosis}</span>
            <button type="button" onClick={() => onEditVisit(visit)} className="text-sky-300 hover:text-sky-200">Ouvrir / modifier</button>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">Prescripteur : {doctorName}</p>
    </section>
  );
};
