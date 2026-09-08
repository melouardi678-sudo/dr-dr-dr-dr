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
} from 'lucide-react';
import { ConsultationItem, Patient, Invoice, Vitals, CabinetSettings } from '../../types';

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

  // Vitals
  const [weightKg, setWeightKg] = useState<number | undefined>(70);
  const [heightCm, setHeightCm] = useState<number | undefined>(175);
  const [temperatureC, setTemperatureC] = useState<number | undefined>(37.0);
  const [systolic, setSystolic] = useState<number | undefined>(120);
  const [diastolic, setDiastolic] = useState<number | undefined>(80);
  const [heartRate, setHeartRate] = useState<number | undefined>(72);
  const [oxygenSat, setOxygenSat] = useState<number | undefined>(98);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

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
      id: `csl_${Date.now()}`,
      patientId: currentPatient.id,
      patientName: `${currentPatient.lastName} ${currentPatient.firstName}`,
      date: new Date().toISOString().split('T')[0],
      symptoms,
      diagnosis,
      vitals,
      observations,
      treatmentPlan,
      cost,
      createdAt: new Date().toISOString(),
    };

    // Auto-generate invoice
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      number: `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: currentPatient.id,
      patientName: `${currentPatient.lastName} ${currentPatient.firstName}`,
      date: new Date().toISOString().split('T')[0],
      items: [{ description: `Consultation : ${diagnosis}`, amount: cost }],
      subtotal: cost,
      taxAmount: (cost * settings.taxRate) / 100,
      total: cost + (cost * settings.taxRate) / 100,
      amountPaid: cost,
      status: 'paid',
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
    };

    onSaveConsultation(newConsultation, newInvoice);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
            <p className="text-xs text-slate-400">Examen clinique, constantes vitales et diagnostic</p>
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

          {/* Vitals Input Grid */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-emerald-400 text-xs flex items-center space-x-1.5">
              <Activity className="w-4 h-4" />
              <span>Constantes Vitales du Patient</span>
            </h3>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Honoraires ({settings.currency})</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none"
                />
              </div>
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
              <span>Valider la Consultation & Générer Facture</span>
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
