import React, { useState } from 'react';
import { Award, FileSpreadsheet, Plus, Printer, X } from 'lucide-react';
import { MedicalCertificate, AnalysisRequest, Patient, CertificateType, CabinetSettings } from '../../types';

interface CertificatesViewProps {
  certificates: MedicalCertificate[];
  analysisRequests: AnalysisRequest[];
  patients: Patient[];
  settings: CabinetSettings;
  onSaveCertificate: (cert: MedicalCertificate) => void;
  onSaveAnalysisRequest: (req: AnalysisRequest) => void;
  onOpenPrintable: (
    type: 'certificate' | 'analysis',
    data: { certificate?: MedicalCertificate; analysis?: AnalysisRequest }
  ) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  analysisRequests,
  patients,
  settings,
  onSaveCertificate,
  onSaveAnalysisRequest,
  onOpenPrintable,
}) => {
  const [activeTab, setActiveTab] = useState<'certs' | 'analyses'>('certs');

  // Cert Form
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [certType, setCertType] = useState<CertificateType>('sick_leave');
  const [durationDays, setDurationDays] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Nécessite un repos à domicile.');

  // Analysis Form
  const [analysisPatientId, setAnalysisPatientId] = useState(patients[0]?.id || '');
  const [testsInput, setTestsInput] = useState('NFS, Glycémie à jeun, Bilan rénal');

  const handleCreateCert = (e: React.FormEvent) => {
    e.preventDefault();
    const p = patients.find((pat) => pat.id === selectedPatientId);
    if (!p) return;

    const sDate = new Date(startDate);
    const eDate = new Date(sDate);
    eDate.setDate(eDate.getDate() + durationDays - 1);

    const newCert: MedicalCertificate = {
      id: `crt_${Date.now()}`,
      patientId: p.id,
      patientName: `${p.lastName} ${p.firstName}`,
      type: certType,
      date: new Date().toISOString().split('T')[0],
      durationDays,
      startDate,
      endDate: eDate.toISOString().split('T')[0],
      reasonOrObservation: reason,
      createdAt: new Date().toISOString(),
    };

    onSaveCertificate(newCert);
    onOpenPrintable('certificate', { certificate: newCert });
  };

  const handleCreateAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    const p = patients.find((pat) => pat.id === analysisPatientId);
    if (!p) return;

    const newReq: AnalysisRequest = {
      id: `anl_${Date.now()}`,
      patientId: p.id,
      patientName: `${p.lastName} ${p.firstName}`,
      date: new Date().toISOString().split('T')[0],
      categories: ['biology'],
      testsRequested: testsInput.split(',').map((s) => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    onSaveAnalysisRequest(newReq);
    onOpenPrintable('analysis', { analysis: newReq });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Certificats Médicaux & Demandes d'Analyses</h1>
            <p className="text-xs text-slate-400">Arrêts de travail, certificats d'aptitude, bilan biologique et imagerie</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('certs')}
            className={`px-4 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'certs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Certificats Médicaux
          </button>
          <button
            onClick={() => setActiveTab('analyses')}
            className={`px-4 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'analyses' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Demandes d'Analyses & Imagerie
          </button>
        </div>
      </div>

      {activeTab === 'certs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateCert} className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Créer un Certificat Médical</h2>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Sélectionner Patient *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.lastName} {p.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Type de Certificat</label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as CertificateType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
              >
                <option value="sick_leave">Arrêt de Travail / Repos Médical</option>
                <option value="fitness">Certificat d'Aptitude Physique</option>
                <option value="work_resume">Certificat de Reprise de Travail</option>
                <option value="medical_standard">Certificat Médical Général</option>
              </select>
            </div>

            {certType === 'sick_leave' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Durée (jours)</label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date Début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Observation / Motif</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Générer & Imprimer A4</span>
            </button>
          </form>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Historique des Certificats</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {certificates.map((c) => (
                <div key={c.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white uppercase">{c.patientName}</div>
                    <div className="text-[10px] text-slate-400">{c.date} • {c.type}</div>
                  </div>
                  <button
                    onClick={() => onOpenPrintable('certificate', { certificate: c })}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateAnalysis} className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Créer une Demande d'Analyses / Imagerie</h2>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Sélectionner Patient *</label>
              <select
                value={analysisPatientId}
                onChange={(e) => setAnalysisPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.lastName} {p.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Examens demandés (séparés par virgule)</label>
              <textarea
                value={testsInput}
                onChange={(e) => setTestsInput(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                placeholder="NFS, Glycémie, Bilan lipidique, Radiographie pulmonaire..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Bilan / Demande A4</span>
            </button>
          </form>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-xs">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Historique des Demandes</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {analysisRequests.map((a) => (
                <div key={a.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white uppercase">{a.patientName}</div>
                    <div className="text-[10px] text-slate-400">{a.date} • {a.testsRequested.length} examens</div>
                  </div>
                  <button
                    onClick={() => onOpenPrintable('analysis', { analysis: a })}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
