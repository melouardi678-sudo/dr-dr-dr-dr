import React, { useMemo, useRef, useState } from 'react';
import {
  ConsultationItem,
  DentalConsultationDetails,
  DentalProcedureRecord,
  DentalSurface,
  DentalToothRecord,
  DentalToothStatus,
  DentalTreatmentRecord,
} from '../types';
import { DENTAL_PROCEDURES, DENTAL_TOOTH_STATUSES } from '../utils/medicalSpecialties';

interface DentalConsultationFieldsProps {
  value: DentalConsultationDetails;
  onChange: (value: DentalConsultationDetails) => void;
  previousVisits: ConsultationItem[];
  currency: string;
  onPrintReport: () => void;
  onPrintChart: () => void;
  onEditVisit: (consultation: ConsultationItem) => void;
}

const PERMANENT = {
  upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
  lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
};

const DECIDUOUS = {
  upperRight: ['55', '54', '53', '52', '51'],
  upperLeft: ['61', '62', '63', '64', '65'],
  lowerRight: ['85', '84', '83', '82', '81'],
  lowerLeft: ['71', '72', '73', '74', '75'],
};

const SURFACES: Array<{ key: DentalSurface; label: string }> = [
  { key: 'M', label: 'Mésial (M)' },
  { key: 'D', label: 'Distal (D)' },
  { key: 'O', label: 'Occlusal (O)' },
  { key: 'V', label: 'Vestibulaire (V)' },
  { key: 'LP', label: 'Lingual / Palatin (L/P)' },
];

const STATUS_COLORS: Record<DentalToothStatus, string> = {
  'Dent Saine': '#f8fafc',
  'Carie': '#dc2626',
  'Carie Profonde': '#991b1b',
  'Dent Absente': '#64748b',
  'Dent Extraite': '#64748b',
  'Dent Cassée': '#ea580c',
  'Obturation': '#0284c7',
  'Dévitalisée': '#7c3aed',
  'Traitement Endodontique': '#7c3aed',
  'Couronne': '#9333ea',
  'Bridge': '#9333ea',
  'Implant': '#059669',
  'Dent Mobile': '#ca8a04',
  'Infection': '#dc2626',
  'Abcès': '#b91c1c',
  'Fracture': '#ea580c',
  'Dent Incluse': '#475569',
  'Prothèse': '#9333ea',
  'À Traiter': '#f97316',
  'Dent à Traiter': '#f97316',
};

const EMPTY_TOOTH: DentalToothRecord = {
  status: 'Dent Saine',
  diagnosis: '',
  requiredTreatment: '',
  procedures: [],
  surfaces: {},
  notes: '',
  changeHistory: [],
};

const numberToothList = (dentition: typeof PERMANENT | typeof DECIDUOUS) => [
  ...dentition.upperRight,
  ...dentition.upperLeft,
  ...dentition.lowerRight,
  ...dentition.lowerLeft,
];

function getToothRecord(details: DentalConsultationDetails, tooth: string): DentalToothRecord {
  const saved = details.toothDetails?.[tooth];
  return saved ? {
    ...EMPTY_TOOTH,
    ...saved,
    procedures: Array.isArray(saved.procedures) ? saved.procedures : [],
    surfaces: saved.surfaces || {},
    changeHistory: Array.isArray(saved.changeHistory) ? saved.changeHistory : [],
  } : {
    ...EMPTY_TOOTH,
    status: details.toothStatuses[tooth] || 'Dent Saine',
  };
}

function getToothType(tooth: string): string {
  const position = Number(tooth.slice(-1));
  const deciduous = Number(tooth[0]) >= 5;
  if (position === 1) return 'Incisive central';
  if (position === 2) return 'Incisive latéral';
  if (position === 3) return 'Canine';
  if (deciduous) return 'Molaire temporaire';
  if (position === 4 || position === 5) return 'Prémolaire';
  return 'Molaire';
}

function ToothButton({
  number,
  record,
  selected,
  changed,
  onSelect,
}: {
  number: string;
  record: DentalToothRecord;
  selected: boolean;
  changed: boolean;
  onSelect: () => void;
}) {
  const position = Number(number.slice(-1));
  const shape = position >= 6
    ? 'M4 8 Q4 2 11 3 L31 3 Q38 3 38 9 L38 23 Q38 30 33 37 L30 47 Q27 53 22 47 L21 43 L18 48 Q14 53 11 46 L7 35 Q3 28 4 22 Z'
    : position === 3
      ? 'M11 7 Q11 3 20 3 Q30 4 31 9 L32 26 Q31 34 27 42 L23 50 Q21 54 18 48 L13 40 Q9 31 9 23 Z'
      : position === 4 || position === 5
        ? 'M8 7 Q8 3 15 3 L27 3 Q34 3 34 8 L36 23 Q36 30 31 37 L28 47 Q25 52 21 47 L19 43 L16 48 Q12 52 10 45 L6 35 Q3 28 5 21 Z'
        : 'M11 6 Q11 3 17 3 L25 3 Q31 3 31 7 L32 24 Q31 31 27 39 L24 49 Q21 53 18 48 L14 40 Q10 31 10 23 Z';
  const surfaces = [
    { key: 'M' as const, points: '7,6 21,6 21,22 4,22', label: 'M' },
    { key: 'D' as const, points: '21,6 35,6 38,22 21,22', label: 'D' },
    { key: 'O' as const, points: '4,22 38,22 35,36 7,36', label: 'O' },
    { key: 'V' as const, points: '7,36 21,36 21,48 12,45', label: 'V' },
    { key: 'LP' as const, points: '21,36 35,36 30,45 21,48', label: 'L/P' },
  ];

  return (
    <button
      type="button"
      aria-label={`Dent ${number} — ${record.status}${changed ? ' — état modifié depuis la dernière visite' : ''}`}
      title={`Dent ${number} · ${record.status}${changed ? ' · modifiée' : ''}`}
      onClick={onSelect}
      className={`flex w-full min-w-0 flex-col items-center rounded-lg px-0.5 py-1 transition hover:bg-slate-800 ${selected ? 'bg-slate-800 ring-1 ring-emerald-400' : ''}`}
      style={changed && !selected ? { outline: '1px solid #fb923c' } : undefined}
    >
      <svg viewBox="0 0 42 54" className="h-10 w-9 max-w-full" role="img" aria-hidden="true">
        <path d={shape} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        {surfaces.map((surface) => (
          <polygon
            key={surface.key}
            points={surface.points}
            fill={STATUS_COLORS[record.surfaces[surface.key] || record.status]}
            stroke="#334155"
            strokeWidth="0.8"
          />
        ))}
        <path d={shape} fill="none" stroke="#0f172a" strokeWidth="1.5" />
      </svg>
      <span className="text-[9px] font-bold text-slate-300">{number}</span>
    </button>
  );
}

const Field = ({ label, value, onChange, type = 'text' }: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <label className="block text-slate-400 font-medium">
    <span className="block mb-1">{label}</span>
    <input
      type={type}
      min={type === 'number' ? 0 : undefined}
      step={type === 'number' ? '0.01' : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
    />
  </label>
);

export const DentalConsultationFields: React.FC<DentalConsultationFieldsProps> = ({
  value,
  onChange,
  previousVisits,
  currency,
  onPrintReport,
  onPrintChart,
  onEditVisit,
}) => {
  const [dentition, setDentition] = useState<'permanent' | 'deciduous'>('permanent');
  const [selectedTooth, setSelectedTooth] = useState('11');
  const [selectedSurface, setSelectedSurface] = useState<DentalSurface>('O');
  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null);
  const [treatmentDraft, setTreatmentDraft] = useState<DentalTreatmentRecord>({
    id: '',
    date: new Date().toISOString().slice(0, 10),
    toothNumber: '11',
    diagnosis: '',
    treatment: '',
    price: 0,
    payment: 0,
    notes: '',
  });
  const toothTextBaseline = useRef<{ tooth: string; snapshot: string } | null>(null);
  const setField = <K extends keyof DentalConsultationDetails>(key: K, fieldValue: DentalConsultationDetails[K]) =>
    onChange({ ...value, [key]: fieldValue });

  const teeth = dentition === 'permanent' ? PERMANENT : DECIDUOUS;
  const patientHistory = useMemo(() => previousVisits.slice(0, 8), [previousVisits]);
  const currentRecord = getToothRecord(value, selectedTooth);
  const latestVisit = previousVisits[0];
  const previousToothRecord = (tooth: string) => {
    const saved = latestVisit?.dentalDetails?.toothDetails?.[tooth];
    return saved || {
      ...EMPTY_TOOTH,
      status: latestVisit?.dentalDetails?.toothStatuses[tooth] || 'Dent Saine',
    };
  };
  const isToothChanged = (tooth: string) => {
    if (!latestVisit) return false;
    const current = getToothRecord(value, tooth);
    const previous = previousToothRecord(tooth);
    return current.status !== previous.status || SURFACES.some(({ key }) => (current.surfaces[key] || current.status) !== (previous.surfaces[key] || previous.status));
  };

  const toothSnapshot = (record: DentalToothRecord) =>
    `${record.status}; ${record.diagnosis}; ${record.requiredTreatment}; ${record.notes}; ${Object.entries(record.surfaces).map(([surface, status]) => `${surface}:${status}`).join(',')}`;

  const updateTooth = (patch: Partial<DentalToothRecord>, changeDescription: string, logChange = true) => {
    const current = getToothRecord(value, selectedTooth);
    const next = { ...current, ...patch };
    const details = { ...(value.toothDetails || {}), [selectedTooth]: next };
    const statuses = { ...value.toothStatuses, [selectedTooth]: next.status };
    const now = new Date().toISOString();
    const changed = toothSnapshot(current) !== toothSnapshot(next);
    onChange({
      ...value,
      toothStatuses: statuses,
      toothDetails: {
        ...details,
        [selectedTooth]: !logChange || !changed
          ? next
          : { ...next, changeHistory: [...current.changeHistory, { date: now, details: changeDescription }] },
      },
    });
  };

  const recordToothTextChange = (description: string) => {
    const baseline = toothTextBaseline.current;
    const current = getToothRecord(value, selectedTooth);
    if (!baseline || baseline.tooth !== selectedTooth || baseline.snapshot === toothSnapshot(current)) return;
    const details = { ...(value.toothDetails || {}), [selectedTooth]: {
      ...current,
      changeHistory: [...current.changeHistory, { date: new Date().toISOString(), details: description }],
    } };
    onChange({ ...value, toothDetails: details });
    toothTextBaseline.current = { tooth: selectedTooth, snapshot: toothSnapshot(current) };
  };

  const startToothTextEdit = () => {
    toothTextBaseline.current = { tooth: selectedTooth, snapshot: toothSnapshot(currentRecord) };
  };

  const renderQuadrant = (numbers: string[]) => (
    <div className="grid min-w-0 flex-1 grid-cols-8 items-end justify-self-center gap-0.5 max-w-[360px]">
      {numbers.map((number) => (
        <ToothButton
          key={number}
          number={number}
          record={getToothRecord(value, number)}
          selected={number === selectedTooth}
          changed={isToothChanged(number)}
          onSelect={() => {
            setSelectedTooth(number);
            setTreatmentDraft({ ...treatmentDraft, toothNumber: number });
          }}
        />
      ))}
    </div>
  );

  const renderArch = (left: string[], right: string[], label: string) => (
    <div className="space-y-1">
      <p className="text-center text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-end gap-1">
        {renderQuadrant(left)}
        <span className="h-10 border-l border-dashed border-slate-600" aria-hidden="true" />
        {renderQuadrant(right)}
      </div>
    </div>
  );

  const saveTreatment = () => {
    if (!treatmentDraft.toothNumber || !treatmentDraft.treatment.trim()) return;
    const editing = Boolean(editingTreatmentId);
    const record = {
      ...treatmentDraft,
      id: editingTreatmentId || `dent_tx_${Date.now()}`,
      price: Math.max(0, treatmentDraft.price),
      payment: Math.min(Math.max(0, treatmentDraft.payment), Math.max(0, treatmentDraft.price)),
    };
    const treatments = value.treatments || [];
    const nextTreatments = editing
      ? treatments.map((item) => item.id === record.id ? record : item)
      : [record, ...treatments];
    const totalPrice = nextTreatments.reduce((sum, item) => sum + item.price, 0);
    const totalPayment = nextTreatments.reduce((sum, item) => sum + item.payment, 0);
    const tooth = record.toothNumber;
    const previousTreatment = editing ? treatments.find((item) => item.id === record.id) : undefined;
    const currentTooth = getToothRecord(value, tooth);
    const toothDetails = { ...(value.toothDetails || {}) };
    if (previousTreatment && previousTreatment.toothNumber !== tooth) {
      const previousTooth = getToothRecord(value, previousTreatment.toothNumber);
      toothDetails[previousTreatment.toothNumber] = {
        ...previousTooth,
        procedures: previousTooth.procedures.filter((item) => item.id !== record.id),
        changeHistory: [...previousTooth.changeHistory, {
          date: new Date().toISOString(),
          details: `Correction : acte ${record.treatment} déplacé vers la dent ${tooth}`,
        }],
      };
    }
    const procedure: DentalProcedureRecord = {
      id: record.id,
      date: record.date,
      treatment: record.treatment,
      notes: record.notes,
    };
    const toothProcedures = editing
      ? currentTooth.procedures.map((item) => item.id === procedure.id ? procedure : item)
      : [procedure, ...currentTooth.procedures];
    onChange({
      ...value,
      procedure: record.treatment,
      procedureCost: totalPrice,
      amountPaid: totalPayment,
      treatments: nextTreatments,
      toothStatuses: { ...value.toothStatuses, [tooth]: currentTooth.status },
      toothDetails: {
        ...toothDetails,
        [tooth]: {
          ...currentTooth,
          diagnosis: record.diagnosis || currentTooth.diagnosis,
          requiredTreatment: currentTooth.requiredTreatment,
          procedures: toothProcedures,
          changeHistory: [...currentTooth.changeHistory, {
            date: new Date().toISOString(),
            details: `${editing ? 'Modification' : 'Ajout'} de l'acte ${record.treatment} (${record.date})`,
          }],
        },
      },
    });
    setEditingTreatmentId(null);
    setTreatmentDraft({ ...record, id: '', date: new Date().toISOString().slice(0, 10), diagnosis: '', treatment: '', price: 0, payment: 0, notes: '' });
  };

  const editTreatment = (record: DentalTreatmentRecord) => {
    setTreatmentDraft(record);
    setEditingTreatmentId(record.id);
    setSelectedTooth(record.toothNumber);
  };

  const removeTreatment = (record: DentalTreatmentRecord) => {
    const currentTooth = getToothRecord(value, record.toothNumber);
    const treatments = (value.treatments || []).filter((item) => item.id !== record.id);
    onChange({
      ...value,
      procedureCost: treatments.reduce((sum, item) => sum + item.price, 0),
      amountPaid: treatments.reduce((sum, item) => sum + item.payment, 0),
      treatments,
      toothDetails: {
        ...(value.toothDetails || {}),
        [record.toothNumber]: {
          ...currentTooth,
          procedures: currentTooth.procedures.filter((item) => item.id !== record.id),
          changeHistory: [...currentTooth.changeHistory, {
            date: new Date().toISOString(),
            details: `Correction : suppression de l'acte ${record.treatment} du ${record.date}`,
          }],
        },
      },
    });
  };

  const updateSurfaceStatus = (surface: DentalSurface, status: DentalToothStatus) =>
    updateTooth({ surfaces: { ...currentRecord.surfaces, [surface]: status } }, `Surface ${surface} : ${currentRecord.surfaces[surface] || 'Dent Saine'} → ${status}`);

  const allTeeth = numberToothList(teeth);
  const historyChanges = allTeeth.filter((tooth) => isToothChanged(tooth));
  const treatments = value.treatments || [];

  return (
    <section className="min-w-0 p-4 bg-slate-950 rounded-xl border border-emerald-800/60 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-emerald-300 text-sm">Dossier dentaire · Odontogramme interactif FDI</h3>
          <p className="text-[11px] text-slate-500">Cliquez une dent ou une surface. Les diagnostics, états et actes sont enregistrés avec la consultation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrintChart} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs">Imprimer / PDF l'odontogramme</button>
          <button type="button" onClick={onPrintReport} className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs">Imprimer le dossier dentaire</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setDentition('permanent')} className={`px-3 py-2 rounded-lg text-xs font-bold ${dentition === 'permanent' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Dents permanentes · 32</button>
        <button type="button" onClick={() => setDentition('deciduous')} className={`px-3 py-2 rounded-lg text-xs font-bold ${dentition === 'deciduous' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Dents temporaires · 20</button>
      </div>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-3">
        <div className="min-w-[650px] space-y-3">
        {renderArch(teeth.upperRight, teeth.upperLeft, 'Maxillaire supérieur')}
        <div className="border-t border-slate-800 pt-3">
          {renderArch(teeth.lowerRight, teeth.lowerLeft, 'Mandibule')}
        </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-300">
        {([
          ['Dent saine', '#f8fafc'],
          ['Carie / infection', '#dc2626'],
          ['Obturation', '#0284c7'],
          ['Absente / extraite', '#64748b'],
          ['Couronne / bridge / prothèse', '#9333ea'],
          ['Implant', '#059669'],
          ['À traiter', '#f97316'],
        ] as const).map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-slate-500" style={{ backgroundColor: color }} />{label}</span>
        ))}
        <span className="text-slate-500">L'anneau vert indique la dent sélectionnée · orange en contour : modifiée depuis la dernière visite.</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] gap-4">
        <div className="rounded-xl border border-slate-800 p-3 space-y-3">
          <h4 className="font-bold text-slate-100">Dent FDI {selectedTooth} · {getToothType(selectedTooth)}</h4>
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">État général</span>
            <select value={currentRecord.status} onChange={(event) => {
              const status = event.target.value as DentalToothStatus;
              updateTooth({ status }, `État : ${currentRecord.status} → ${status}`);
            }} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
              {DENTAL_TOOTH_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>

          <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 space-y-2">
            <h5 className="text-xs font-bold text-slate-300">État des surfaces</h5>
            <div className="flex flex-wrap gap-2">
              {SURFACES.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setSelectedSurface(key)} className={`rounded-lg px-2 py-1 text-[10px] font-bold border ${selectedSurface === key ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>
                  {key} {currentRecord.surfaces[key] || currentRecord.status}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">Surface sélectionnée : {SURFACES.find((surface) => surface.key === selectedSurface)?.label}</p>
            <select aria-label="État de la surface sélectionnée" value={currentRecord.surfaces[selectedSurface] || 'Dent Saine'} onChange={(event) => updateSurfaceStatus(selectedSurface, event.target.value as DentalToothStatus)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white">
              {DENTAL_TOOTH_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Diagnostic de la dent</span>
            <textarea value={currentRecord.diagnosis} onFocus={startToothTextEdit} onBlur={() => recordToothTextChange('Modification du diagnostic')} onChange={(event) => updateTooth({ diagnosis: event.target.value }, '', false)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </label>
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Traitement requis</span>
            <textarea value={currentRecord.requiredTreatment} onFocus={startToothTextEdit} onBlur={() => recordToothTextChange('Modification du traitement requis')} onChange={(event) => updateTooth({ requiredTreatment: event.target.value }, '', false)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </label>
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Notes du médecin</span>
            <textarea value={currentRecord.notes} onFocus={startToothTextEdit} onBlur={() => recordToothTextChange('Modification des notes')} onChange={(event) => updateTooth({ notes: event.target.value }, '', false)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </label>

          <div className="rounded-lg border border-slate-800 p-3 space-y-2">
            <h5 className="text-xs font-bold text-slate-300">Actes déjà réalisés sur cette dent</h5>
            {currentRecord.procedures.length === 0 ? <p className="text-[11px] text-slate-500">Aucun acte enregistré.</p> : currentRecord.procedures.map((procedure) => (
              <div key={procedure.id} className="border-t border-slate-800 pt-2 text-[11px] text-slate-300">
                {procedure.date} · {procedure.treatment} {procedure.notes && `· ${procedure.notes}`}
              </div>
            ))}
            {currentRecord.changeHistory.length > 0 && (
              <details className="pt-2">
                <summary className="cursor-pointer text-[11px] text-sky-300">Historique des corrections ({currentRecord.changeHistory.length})</summary>
                {currentRecord.changeHistory.slice().reverse().map((entry, index) => <p key={`${entry.date}-${index}`} className="pt-1 text-[10px] text-slate-400">{new Date(entry.date).toLocaleString('fr-FR')} · {entry.details}</p>)}
              </details>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 p-3 space-y-3">
          <h4 className="font-bold text-slate-100">Planifier un acte / une séance</h4>
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Dent FDI</span>
            <select value={treatmentDraft.toothNumber} onChange={(event) => {
              const toothNumber = event.target.value;
              setSelectedTooth(toothNumber);
              setTreatmentDraft({ ...treatmentDraft, toothNumber });
            }} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
              {numberToothList(PERMANENT).concat(numberToothList(DECIDUOUS)).map((tooth) => <option key={tooth} value={tooth}>{tooth}</option>)}
            </select>
          </label>
          <Field label="Date" type="date" value={treatmentDraft.date} onChange={(date) => setTreatmentDraft({ ...treatmentDraft, date })} />
          <Field label="Diagnostic" value={treatmentDraft.diagnosis} onChange={(diagnosis) => setTreatmentDraft({ ...treatmentDraft, diagnosis })} />
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Procédure</span>
            <select value={treatmentDraft.treatment} onChange={(event) => setTreatmentDraft({ ...treatmentDraft, treatment: event.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
              <option value="">Choisir un acte</option>
              {DENTAL_PROCEDURES.map((procedure) => <option key={procedure} value={procedure}>{procedure}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Prix (${currency})`} type="number" value={treatmentDraft.price} onChange={(raw) => setTreatmentDraft({ ...treatmentDraft, price: Math.max(0, Number(raw) || 0) })} />
            <Field label={`Paiement (${currency})`} type="number" value={treatmentDraft.payment} onChange={(raw) => setTreatmentDraft({ ...treatmentDraft, payment: Math.min(treatmentDraft.price, Math.max(0, Number(raw) || 0)) })} />
          </div>
          <label className="block text-slate-400 font-medium">
            <span className="block mb-1">Notes</span>
            <textarea value={treatmentDraft.notes} onChange={(event) => setTreatmentDraft({ ...treatmentDraft, notes: event.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </label>
          <button type="button" disabled={!treatmentDraft.treatment.trim()} onClick={saveTreatment} className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
            {editingTreatmentId ? 'Enregistrer la modification' : 'Ajouter à la séance'}
          </button>
          {editingTreatmentId && <button type="button" onClick={() => { setEditingTreatmentId(null); setTreatmentDraft({ ...treatmentDraft, id: '', treatment: '', diagnosis: '', price: 0, payment: 0, notes: '' }); }} className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300">Annuler la modification</button>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-slate-100">Registre des traitements et paiements</h4>
          <span className="text-[10px] text-slate-400">Le paiement global est repris dans la facture générée à l'enregistrement.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[11px]">
            <thead className="text-slate-400"><tr>{['Date', 'Dent', 'Diagnostic', 'Traitement', 'Prix', 'Paiement', 'Notes', 'Actions'].map((column) => <th key={column} className="p-2">{column}</th>)}</tr></thead>
            <tbody>
              {treatments.map((treatment) => (
                <tr key={treatment.id} className="border-t border-slate-800 text-slate-300">
                  <td className="p-2">{treatment.date}</td><td className="p-2">{treatment.toothNumber}</td><td className="p-2">{treatment.diagnosis}</td><td className="p-2">{treatment.treatment}</td><td className="p-2">{treatment.price.toFixed(2)}</td><td className="p-2">{treatment.payment.toFixed(2)}</td><td className="p-2">{treatment.notes}</td>
                  <td className="p-2 whitespace-nowrap">
                    <button type="button" onClick={() => editTreatment(treatment)} className="mr-2 text-sky-300 hover:text-sky-200">Modifier</button>
                    <button type="button" onClick={() => removeTreatment(treatment)} className="text-rose-300 hover:text-rose-200">Corriger</button>
                  </td>
                </tr>
              ))}
              {treatments.length === 0 && <tr><td colSpan={8} className="p-3 text-center text-slate-500">Aucun acte dans cette séance.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end"><button type="button" onClick={onPrintReport} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white">Imprimer le registre</button></div>
      </div>

      <div className="rounded-xl border border-slate-800 p-3 space-y-2">
        <div className="flex flex-wrap justify-between gap-2">
          <h4 className="font-bold text-slate-100">Comparaison avec la visite dentaire précédente</h4>
          <span className="text-[10px] text-slate-400">{historyChanges.length} dent(s) modifiée(s) dans le diagramme actuel</span>
        </div>
        {patientHistory.length === 0 ? <p className="text-[11px] text-slate-500">Aucune visite dentaire précédente.</p> : (
          <>
            <details className="rounded-lg bg-slate-900 p-2">
              <summary className="cursor-pointer text-[11px] text-amber-300">Voir la comparaison dent par dent</summary>
              {historyChanges.length === 0 ? <p className="pt-2 text-[10px] text-slate-400">Aucune différence d'état détectée.</p> : historyChanges.map((tooth) => {
                const current = getToothRecord(value, tooth);
                const previous = previousToothRecord(tooth);
                const surfaceChanges = SURFACES
                  .filter(({ key }) => (current.surfaces[key] || current.status) !== (previous.surfaces[key] || previous.status))
                  .map(({ key }) => `${key}: ${previous.surfaces[key] || previous.status} → ${current.surfaces[key] || current.status}`);
                return <p key={tooth} className="pt-2 text-[10px] text-slate-300">FDI {tooth}: {previous.status} → {current.status}{surfaceChanges.length > 0 ? ` · ${surfaceChanges.join(' · ')}` : ''}</p>;
              })}
            </details>
            {patientHistory.map((visit) => (
          <div key={visit.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-[11px]">
            <span className="text-slate-300">{visit.date} · {visit.diagnosis} · {visit.dentalDetails?.treatments?.length || 0} acte(s)</span>
            <button type="button" onClick={() => onEditVisit(visit)} className="text-sky-300 hover:text-sky-200">Ouvrir / modifier</button>
          </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
};
