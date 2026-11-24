import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Wind,
  Plus,
  Save,
  FileText,
  User,
  DollarSign,
  CheckCircle2,
  TestTube2,
  ShieldPlus,
} from 'lucide-react';
import {
  ConsultationItem,
  Patient,
  Invoice,
  Vitals,
  CabinetSettings,
  DentalConsultationDetails,
  OphthalmologyConsultationDetails,
} from '../../types';
import { getSpecialtyCategory } from '../../utils/medicalSpecialties';
import { DentalConsultationFields } from '../DentalConsultationFields';
import { OphthalmologyConsultationFields } from '../OphthalmologyConsultationFields';
import { printDentalOdontogram, printMedicalReport } from '../../utils/printMedicalReport';

interface ConsultationViewProps {
  patients: Patient[];
  consultations: ConsultationItem[];
  invoices: Invoice[];
  settings: CabinetSettings;
  onSaveConsultation: (csl: ConsultationItem, invoice?: Invoice) => void;
  onOpenPrescriptionForConsultation: (patientId: string) => void;
  onOpenBioPrescriptionModal?: (patient: Patient) => void;
  onOpenUltrasoundForConsultation?: (patientId: string) => void;
}

export const ConsultationView: React.FC<ConsultationViewProps> = ({
  patients,
  consultations,
  invoices,
  settings,
  onSaveConsultation,
  onOpenPrescriptionForConsultation,
  onOpenBioPrescriptionModal,
  onOpenUltrasoundForConsultation,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [observations, setObservations] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [cost, setCost] = useState(250);
  const [selectedActId, setSelectedActId] = useState('');

  // Vitals
  const [weightKg, setWeightKg] = useState<number | undefined>(70);
  const [heightCm, setHeightCm] = useState<number | undefined>(175);
  const [temperatureC, setTemperatureC] = useState<number | undefined>(37.0);
  const [systolic, setSystolic] = useState<number | undefined>(120);
  const [diastolic, setDiastolic] = useState<number | undefined>(80);
  const [heartRate, setHeartRate] = useState<number | undefined>(72);
  const [oxygenSat, setOxygenSat] = useState<number | undefined>(98);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [editingConsultationId, setEditingConsultationId] = useState<string | null>(null);
  const [dentalDetails, setDentalDetails] = useState<DentalConsultationDetails>({
    procedure: 'Consultation Dentaire',
    toothStatuses: {},
    treatmentPlan: '',
    sessionNotes: '',
    procedureCost: 250,
    amountPaid: 250,
  });
  const [ophthalmologyDetails, setOphthalmologyDetails] = useState<OphthalmologyConsultationDetails>({
    visualAcuityOD: '',
    visualAcuityOS: '',
    distanceWithoutCorrectionOD: '',
    distanceWithoutCorrectionOS: '',
    distanceWithCorrectionOD: '',
    distanceWithCorrectionOS: '',
    nearVisionOD: '',
    nearVisionOS: '',
    refractionOD: { sphere: '', cylinder: '', axis: '', add: '', prism: '', base: '', pd: '' },
    refractionOS: { sphere: '', cylinder: '', axis: '', add: '', prism: '', base: '', pd: '' },
    cornea: '',
    iris: '',
    pupil: '',
    lens: '',
    retina: '',
    fundus: '',
    intraocularPressureOD: '',
    intraocularPressureOS: '',
    visualField: '',
    eyeDrops: '',
    treatmentPlan: '',
    followUp: '',
  });

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const activeSpecialty = settings.speciality || settings.specialtyManagement?.activeSpecialty || 'Médecine Générale';
  const specialtyCategory = getSpecialtyCategory(activeSpecialty);
  const dentalVisits = consultations
    .filter((consultation) => consultation.patientId === currentPatient?.id && consultation.dentalDetails)
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);
  const ophthalmologyVisits = consultations
    .filter((consultation) => consultation.patientId === currentPatient?.id && consultation.ophthalmologyDetails)
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);

  const specialtyBanner =
    specialtyCategory === 'dental'
      ? 'Suivi dentaire • Traitements, odonto-gramme et plan de soins'
      : specialtyCategory === 'ophthalmology'
        ? 'Examen ophtalmologique • Acuité visuelle, réfraction et suivi thérapeutique'
        : 'Consultation médicale spécialisée • Diagnostic, traitement et suivi';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient || !diagnosis.trim()) return;

    const vitals: Vitals = {
      weightKg,
      heightCm,
      temperatureC,
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      heartRateBpm: heartRate,
      oxygenSaturation: oxygenSat,
    };

    const newConsultation: ConsultationItem = {
      id: editingConsultationId || `csl_${Date.now()}`,
      patientId: currentPatient.id,
      patientName: `${currentPatient.lastName} ${currentPatient.firstName}`,
      date: consultations.find((consultation) => consultation.id === editingConsultationId)?.date || new Date().toISOString().split('T')[0],
      symptoms,
      diagnosis,
      vitals,
      observations,
      treatmentPlan: specialtyCategory === 'dental'
        ? dentalDetails.treatmentPlan || treatmentPlan
        : specialtyCategory === 'ophthalmology'
          ? ophthalmologyDetails.treatmentPlan || treatmentPlan
          : treatmentPlan,
      specialtyCategory,
      ...(specialtyCategory === 'dental' ? { dentalDetails } : {}),
      ...(specialtyCategory === 'ophthalmology' ? { ophthalmologyDetails } : {}),
      ...(specialtyCategory === 'ophthalmology' && ophthalmologyDetails.followUp ? { followUpDate: ophthalmologyDetails.followUp } : {}),
      cost: specialtyCategory === 'dental' ? dentalDetails.procedureCost : cost,
      createdAt: consultations.find((consultation) => consultation.id === editingConsultationId)?.createdAt || new Date().toISOString(),
    };

    const invoiceTotal = specialtyCategory === 'dental' ? dentalDetails.procedureCost : cost;
    const invoicePaid = specialtyCategory === 'dental' ? dentalDetails.amountPaid : cost;
    const selectedAct = (settings.actTariffs || []).find((act) => act.id === selectedActId);
    const existingInvoice = invoices.find((invoice) => invoice.consultationId === editingConsultationId);
    // Auto-generate invoice
    const newInvoice: Invoice = {
      id: existingInvoice?.id || `inv_${Date.now()}`,
      consultationId: editingConsultationId || undefined,
      number: existingInvoice?.number || `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: currentPatient.id,
      patientName: `${currentPatient.lastName} ${currentPatient.firstName}`,
      date: existingInvoice?.date || new Date().toISOString().split('T')[0],
      items: [{
        description: specialtyCategory === 'dental'
          ? `${dentalDetails.procedure} : ${diagnosis}`
          : `${selectedAct?.name || 'Consultation'} : ${diagnosis}`,
        amount: invoiceTotal,
      }],
      subtotal: invoiceTotal,
      taxAmount: (invoiceTotal * settings.taxRate) / 100,
      total: invoiceTotal + (invoiceTotal * settings.taxRate) / 100,
      amountPaid: invoicePaid,
      status: invoicePaid >= invoiceTotal + (invoiceTotal * settings.taxRate) / 100 ? 'paid' : invoicePaid > 0 ? 'partially_paid' : 'pending',
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
    };

    onSaveConsultation(newConsultation, newInvoice);
    setEditingConsultationId(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleEditVisit = (consultation: ConsultationItem) => {
    setSelectedPatientId(consultation.patientId);
    setSymptoms(consultation.symptoms);
    setDiagnosis(consultation.diagnosis);
    setObservations(consultation.observations);
    setTreatmentPlan(consultation.treatmentPlan);
    setCost(consultation.cost);
    setEditingConsultationId(consultation.id);
    if (consultation.dentalDetails) {
      setDentalDetails({
        procedure: 'Consultation Dentaire',
        toothStatuses: {},
        treatmentPlan: '',
        sessionNotes: '',
        procedureCost: consultation.cost,
        amountPaid: 0,
        ...consultation.dentalDetails,
        toothDetails: consultation.dentalDetails.toothDetails || {},
        treatments: consultation.dentalDetails.treatments || [],
      });
    }
    if (consultation.ophthalmologyDetails) {
      const emptyMeasurement = { sphere: '', cylinder: '', axis: '', add: '', prism: '', base: '', pd: '' };
      setOphthalmologyDetails({
        visualAcuityOD: '',
        visualAcuityOS: '',
        distanceWithoutCorrectionOD: '',
        distanceWithoutCorrectionOS: '',
        distanceWithCorrectionOD: '',
        distanceWithCorrectionOS: '',
        nearVisionOD: '',
        nearVisionOS: '',
        refractionOD: emptyMeasurement,
        refractionOS: emptyMeasurement,
        cornea: '',
        iris: '',
        pupil: '',
        lens: '',
        retina: '',
        fundus: '',
        intraocularPressureOD: '',
        intraocularPressureOS: '',
        visualField: '',
        eyeDrops: '',
        treatmentPlan: '',
        followUp: '',
        ...consultation.ophthalmologyDetails,
      });
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Nouvelle Consultation & Bilan Médical</h1>
            <p className="text-xs text-slate-400">{specialtyBanner}</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Consultation & Facture enregistrées !</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl text-xs">
          {/* Patient Selector */}
          <div>
            <label className="block font-bold text-slate-200 mb-1 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Sélectionner le Patient *</span>
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lastName} {p.firstName} — {p.age} ans (Tél: {p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-emerald-400 text-xs flex items-center space-x-1.5">
                <Activity className="w-4 h-4" />
                <span>Constantes Vitales du Patient</span>
              </h3>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1">
                <ShieldPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-300 font-bold uppercase">{activeSpecialty}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1">
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  <span>Poids (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg || ''}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <span>Taille (cm)</span>
                </label>
                <input
                  type="number"
                  value={heightCm || ''}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Température (°C)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperatureC || ''}
                  onChange={(e) => setTemperatureC(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Pouls (BPM)</span>
                </label>
                <input
                  type="number"
                  value={heartRate || ''}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tension Systolique</label>
                <input
                  type="number"
                  value={systolic || ''}
                  onChange={(e) => setSystolic(Number(e.target.value))}
                  placeholder="ex: 120"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tension Diastolique</label>
                <input
                  type="number"
                  value={diastolic || ''}
                  onChange={(e) => setDiastolic(Number(e.target.value))}
                  placeholder="ex: 80"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sat O2 (%)</span>
                </label>
                <input
                  type="number"
                  value={oxygenSat || ''}
                  onChange={(e) => setOxygenSat(Number(e.target.value))}
                  placeholder="ex: 98"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {specialtyCategory === 'dental' && (
            <DentalConsultationFields
              value={dentalDetails}
              onChange={setDentalDetails}
              previousVisits={dentalVisits}
              currency={settings.currency}
              onEditVisit={handleEditVisit}
              onPrintReport={() => printMedicalReport(`Rapport dentaire — ${currentPatient?.lastName || ''} ${currentPatient?.firstName || ''}`, [
                { label: 'Patient', value: currentPatient ? `${currentPatient.lastName} ${currentPatient.firstName}` : '' },
                { label: 'Diagnostic', value: diagnosis },
                { label: 'Acte', value: dentalDetails.procedure },
                { label: 'Historique des procédures', value: Object.entries(dentalDetails.toothDetails || {}).flatMap(([tooth, record]) => record.procedures.map((procedure) => `${procedure.date} · FDI ${tooth} · ${procedure.treatment} · ${procedure.notes}`)).join('\n') },
                { label: 'Odontogramme FDI', value: Object.entries(dentalDetails.toothStatuses).map(([tooth, status]) => `${tooth}: ${status}`).join('\n') },
                { label: 'Plan de traitement', value: dentalDetails.treatmentPlan },
                { label: 'Notes de séance', value: dentalDetails.sessionNotes },
                { label: 'Registre des actes', value: (dentalDetails.treatments || []).map((treatment) => `${treatment.date} · ${treatment.toothNumber} · ${treatment.diagnosis} · ${treatment.treatment} · ${treatment.price} ${settings.currency} · payé ${treatment.payment} ${settings.currency} · ${treatment.notes}`).join('\n') },
                { label: 'Coût / payé / restant', value: `${dentalDetails.procedureCost} / ${dentalDetails.amountPaid} / ${Math.max(0, dentalDetails.procedureCost - dentalDetails.amountPaid)} ${settings.currency}` },
              ])}
              onPrintChart={() => printDentalOdontogram(
                currentPatient ? `${currentPatient.lastName} ${currentPatient.firstName}` : '',
                dentalDetails,
              )}
            />
          )}

          {specialtyCategory === 'ophthalmology' && (
            <OphthalmologyConsultationFields
              value={ophthalmologyDetails}
              onChange={setOphthalmologyDetails}
              previousVisits={ophthalmologyVisits}
              patientName={currentPatient ? `${currentPatient.lastName} ${currentPatient.firstName}` : ''}
              doctorName={settings.doctorName}
              onEditVisit={handleEditVisit}
              onPrintReport={() => printMedicalReport(`Rapport ophtalmologique — ${currentPatient?.lastName || ''} ${currentPatient?.firstName || ''}`, [
                { label: 'Patient', value: currentPatient ? `${currentPatient.lastName} ${currentPatient.firstName}` : '' },
                { label: 'Diagnostic', value: diagnosis },
                { label: 'Acuité OD / OS', value: `${ophthalmologyDetails.visualAcuityOD} / ${ophthalmologyDetails.visualAcuityOS}` },
                { label: 'Réfraction OD', value: `SPH ${ophthalmologyDetails.refractionOD.sphere}, CYL ${ophthalmologyDetails.refractionOD.cylinder}, AXIS ${ophthalmologyDetails.refractionOD.axis}, ADD ${ophthalmologyDetails.refractionOD.add}, PD ${ophthalmologyDetails.refractionOD.pd}` },
                { label: 'Réfraction OS', value: `SPH ${ophthalmologyDetails.refractionOS.sphere}, CYL ${ophthalmologyDetails.refractionOS.cylinder}, AXIS ${ophthalmologyDetails.refractionOS.axis}, ADD ${ophthalmologyDetails.refractionOS.add}, PD ${ophthalmologyDetails.refractionOS.pd}` },
                { label: 'Examen', value: `Cornée: ${ophthalmologyDetails.cornea}; Iris: ${ophthalmologyDetails.iris}; Pupille: ${ophthalmologyDetails.pupil}; Cristallin: ${ophthalmologyDetails.lens}; Rétine: ${ophthalmologyDetails.retina}; Fond d'œil: ${ophthalmologyDetails.fundus}; IOP OD/OS: ${ophthalmologyDetails.intraocularPressureOD}/${ophthalmologyDetails.intraocularPressureOS}; Champ visuel: ${ophthalmologyDetails.visualField}` },
                { label: 'Traitement / collyres', value: `${ophthalmologyDetails.eyeDrops}\n${ophthalmologyDetails.treatmentPlan}` },
                { label: 'Antécédents et traitements', value: `Maladies chroniques: ${ophthalmologyDetails.chronicConditions || ''}; Famille: ${ophthalmologyDetails.familyEyeHistory || ''}; Médicaments: ${ophthalmologyDetails.currentMedications || ''}; Allergies: ${ophthalmologyDetails.allergies || ''}` },
                { label: 'Suivi', value: ophthalmologyDetails.followUp },
              ])}
              onPrintPrescription={() => printMedicalReport(`Prescription optique — ${currentPatient?.lastName || ''} ${currentPatient?.firstName || ''}`, [
                { label: 'Patient', value: currentPatient ? `${currentPatient.lastName} ${currentPatient.firstName}` : '' },
                { label: 'Médecin', value: settings.doctorName },
                { label: 'OD — Œil droit', value: `SPH ${ophthalmologyDetails.refractionOD.sphere} | CYL ${ophthalmologyDetails.refractionOD.cylinder} | AXIS ${ophthalmologyDetails.refractionOD.axis} | ADD ${ophthalmologyDetails.refractionOD.add} | PD ${ophthalmologyDetails.refractionOD.pd}` },
                { label: 'OS — Œil gauche', value: `SPH ${ophthalmologyDetails.refractionOS.sphere} | CYL ${ophthalmologyDetails.refractionOS.cylinder} | AXIS ${ophthalmologyDetails.refractionOS.axis} | ADD ${ophthalmologyDetails.refractionOS.add} | PD ${ophthalmologyDetails.refractionOS.pd}` },
                { label: 'Vision mesurée', value: `AV OD/OS : ${ophthalmologyDetails.visualAcuityOD} / ${ophthalmologyDetails.visualAcuityOS}; loin sans correction : ${ophthalmologyDetails.distanceWithoutCorrectionOD} / ${ophthalmologyDetails.distanceWithoutCorrectionOS}; près : ${ophthalmologyDetails.nearVisionOD} / ${ophthalmologyDetails.nearVisionOS}` },
              ])}
            />
          )}

          {/* Symptoms & Diagnostic */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Symptômes & Motif de Plainte</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                placeholder="Description des symptômes exprimés par le patient..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Diagnostic Médical *</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-emerald-500"
                placeholder="ex: Bronchite aiguë asthmatiforme / Poussée hypertensive"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Plan de Traitement / Conduite à tenir</label>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                placeholder="Avis médical, prescriptions prévues, bilan à réaliser..."
              />
            </div>

            <div className={`grid grid-cols-1 ${specialtyCategory === 'dental' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-3`}>
              {specialtyCategory !== 'dental' && (
                <div className="space-y-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Acte médical</label>
                    <select
                      value={selectedActId}
                      onChange={(e) => {
                        const actId = e.target.value;
                        setSelectedActId(actId);
                        const act = (settings.actTariffs || []).find((item) => item.id === actId);
                        if (act) setCost(act.price);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="">Choisir un acte</option>
                      {(settings.actTariffs || []).map((act) => (
                        <option key={act.id} value={act.id}>{act.name} — {act.price} {settings.currency}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Honoraires / tarif ({settings.currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => currentPatient && onOpenPrescriptionForConsultation(currentPatient.id)}
                  className="w-full py-2 bg-amber-600/20 text-amber-300 border border-amber-500/40 rounded-xl font-semibold flex items-center justify-center space-x-1.5 hover:border-amber-400 hover:brightness-105 transition-all duration-200 text-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ordonnance Médicale</span>
                </button>
              </div>
              <div className="flex items-end">
                {onOpenBioPrescriptionModal && (
                  <button
                    type="button"
                    onClick={() => currentPatient && onOpenBioPrescriptionModal(currentPatient)}
                    className="w-full py-2 bg-emerald-950 text-emerald-300 border border-emerald-700/80 rounded-xl font-semibold flex items-center justify-center space-x-1.5 hover:bg-emerald-900 transition-all duration-200 text-xs"
                  >
                    <TestTube2 className="w-4 h-4 text-emerald-400" />
                    <span>Bilan Biologique</span>
                  </button>
                )}
              </div>
              <div className="flex items-end">
                {onOpenUltrasoundForConsultation && (
                  <button
                    type="button"
                    onClick={() => currentPatient && onOpenUltrasoundForConsultation(currentPatient.id)}
                    className="w-full py-2 bg-cyan-950 text-cyan-300 border border-cyan-700/80 rounded-xl font-semibold flex items-center justify-center space-x-1.5 hover:bg-cyan-900 transition-all duration-200 text-xs"
                  >
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Échographie</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md border border-emerald-500/80 hover:brightness-105 hover:border-emerald-400 flex items-center space-x-2 transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{editingConsultationId ? 'Enregistrer les modifications' : 'Valider la Consultation & Générer Facture'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Patient Summary EHR sidebar (4 cols) */}
        {currentPatient && (
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Fiche Synthétique Patient</span>
              <h2 className="text-base font-bold text-white uppercase">{currentPatient.lastName} {currentPatient.firstName}</h2>
              <div className="text-slate-400 mt-1">{currentPatient.age} ans • {currentPatient.gender} • Groupe {currentPatient.bloodGroup}</div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-rose-400">Allergies connues :</span>
              <p className="text-slate-300">{currentPatient.medicalRecord.allergies.join(', ') || 'Aucune'}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400">Maladies & Traitements :</span>
              <p className="text-slate-300">{currentPatient.medicalRecord.diseases.join(', ') || 'Aucune'}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400">Notes Privées :</span>
              <p className="text-slate-400 italic">{currentPatient.medicalRecord.privateNotes || 'Aucune'}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
