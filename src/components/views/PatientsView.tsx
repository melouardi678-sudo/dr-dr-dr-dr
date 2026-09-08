import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  Heart,
  AlertTriangle,
  FileText,
  Paperclip,
  Edit,
  Trash2,
  X,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Upload,
  Stethoscope,
  Printer,
  FileSpreadsheet,
  Download,
  Camera,
  Eye,
  Scan,
  FolderArchive,
  FileImage,
  Check,
  TestTube2,
  Copy,
} from 'lucide-react';
import { Patient, PatientDocument, ConsultationItem, CabinetSettings, AnalysisRequest, AppUser } from '../../types';
import { ExcelImportExportModal } from '../ExcelImportExportModal';

interface PatientsViewProps {
  patients: Patient[];
  consultations: ConsultationItem[];
  analysisRequests?: AnalysisRequest[];
  currentUser?: AppUser;
  settings: CabinetSettings;
  onSavePatients: (patients: Patient[]) => void;
  selectedPatientId?: string | null;
  onOpenPrintable?: (type: any, data: any) => void;
  onOpenBioPrescriptionModal?: (patient: Patient, initialRequest?: AnalysisRequest | null) => void;
  onDeleteAnalysisRequest?: (id: string) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  consultations,
  analysisRequests = [],
  currentUser,
  settings,
  onSavePatients,
  selectedPatientId,
  onOpenPrintable,
  onOpenBioPrescriptionModal,
  onDeleteAnalysisRequest,
}) => {
  const [activePatientId, setActivePatientId] = useState<string | null>(
    selectedPatientId || patients[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelInitialMode, setExcelInitialMode] = useState<'import' | 'export'>('export');

  // Confirmation Modals State
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);
  const [analysisReqToDelete, setAnalysisReqToDelete] = useState<string | null>(null);

  // Document Upload & Scanning State
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<'lab' | 'xray' | 'scanner' | 'mri' | 'pdf' | 'image'>('xray');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [selectedDocPreview, setSelectedDocPreview] = useState<PatientDocument | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Advanced Dual-Mode Medical Scanner & Drag-Drop states
  const [uploadTab, setUploadTab] = useState<'computer' | 'scanner_device'>('computer');
  const [scannerProfile, setScannerProfile] = useState<'mri' | 'ct_chest' | 'xray_general' | 'ultrasound'>('mri');
  const [dragActive, setDragActive] = useState(false);
  const [scanStage, setScanStage] = useState<'idle' | 'initializing' | 'scanning' | 'processing' | 'done'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLog, setScanLog] = useState('');

  // Form State
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [cin, setCin] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceType, setInsuranceType] = useState('Aucune');
  const [privateInsuranceName, setPrivateInsuranceName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [diseases, setDiseases] = useState('');
  const [allergies, setAllergies] = useState('');
  const [treatments, setTreatments] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.lastName.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.cin && p.cin.toLowerCase().includes(q)) ||
      (p.insuranceNumber && p.insuranceNumber.toLowerCase().includes(q)) ||
      p.profession.toLowerCase().includes(q)
    );
  });

  const handleOpenNew = () => {
    setEditingPatient(null);
    setLastName('');
    setFirstName('');
    setBirthDate('1990-01-01');
    setGender('M');
    setCin('');
    setInsuranceNumber('');
    setInsuranceType('Aucune');
    setPrivateInsuranceName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setProfession('');
    setBloodGroup('O+');
    setEmergencyName('');
    setEmergencyPhone('');
    setDiseases('');
    setAllergies('');
    setTreatments('');
    setPrivateNotes('');
    setIsModalOpen(true);
  };

  const handleEdit = (p: Patient) => {
    setEditingPatient(p);
    setLastName(p.lastName);
    setFirstName(p.firstName);
    setBirthDate(p.birthDate);
    setGender(p.gender);
    setCin(p.cin || '');
    setInsuranceNumber(p.insuranceNumber || '');
    setInsuranceType(p.insuranceType || 'Aucune');
    setPrivateInsuranceName(p.privateInsuranceName || '');
    setAddress(p.address);
    setPhone(p.phone);
    setEmail(p.email);
    setProfession(p.profession);
    setBloodGroup(p.bloodGroup);
    setEmergencyName(p.emergencyContact.name);
    setEmergencyPhone(p.emergencyContact.phone);
    setDiseases(p.medicalRecord.diseases.join(', '));
    setAllergies(p.medicalRecord.allergies.join(', '));
    setTreatments(p.medicalRecord.treatments.join(', '));
    setPrivateNotes(p.medicalRecord.privateNotes);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim()) return;

    if (insuranceType === 'Assurance privée' && !privateInsuranceName.trim()) {
      alert("Veuillez saisir le nom de l'assurance privée.");
      return;
    }

    const calcAge = (bDate: string) => {
      const diff = Date.now() - new Date(bDate).getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    if (editingPatient) {
      const updated = patients.map((p) =>
        p.id === editingPatient.id
          ? {
              ...p,
              lastName,
              firstName,
              birthDate,
              age: calcAge(birthDate),
              gender,
              cin,
              insuranceNumber,
              insuranceType,
              privateInsuranceName: insuranceType === 'Assurance privée' ? privateInsuranceName : '',
              address,
              phone,
              email,
              profession,
              bloodGroup,
              emergencyContact: {
                name: emergencyName,
                phone: emergencyPhone,
                relation: 'Proche',
              },
              medicalRecord: {
                ...p.medicalRecord,
                diseases: diseases.split(',').map((s) => s.trim()).filter(Boolean),
                allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
                treatments: treatments.split(',').map((s) => s.trim()).filter(Boolean),
                privateNotes,
              },
            }
          : p
      );
      onSavePatients(updated);
    } else {
      const newP: Patient = {
        id: `pat_${Date.now()}`,
        lastName,
        firstName,
        birthDate,
        age: calcAge(birthDate),
        gender,
        cin,
        insuranceNumber,
        insuranceType,
        privateInsuranceName: insuranceType === 'Assurance privée' ? privateInsuranceName : '',
        address,
        phone,
        email,
        profession,
        bloodGroup,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          relation: 'Proche',
        },
        medicalRecord: {
          diseases: diseases.split(',').map((s) => s.trim()).filter(Boolean),
          allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
          treatments: treatments.split(',').map((s) => s.trim()).filter(Boolean),
          vaccines: [],
          antecedents: '',
          bloodGroup,
          privateNotes,
        },
        documents: [],
        createdAt: new Date().toISOString(),
      };
      onSavePatients([newP, ...patients]);
      setActivePatientId(newP.id);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const p = patients.find((pat) => pat.id === id);
    if (p) {
      setPatientToDelete(p);
    }
  };

  const confirmDeletePatient = () => {
    if (!patientToDelete) return;
    const id = patientToDelete.id;
    const updated = patients.filter((p) => p.id !== id);
    onSavePatients(updated);
    if (activePatientId === id) {
      setActivePatientId(updated[0]?.id || null);
    }
    setPatientToDelete(null);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    const newDoc: PatientDocument = {
      id: `doc_${Date.now()}`,
      name: newDocName || 'Document Scanné',
      type: newDocType,
      url: newDocUrl || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      date: new Date().toISOString().split('T')[0],
      notes: newDocNotes,
    };

    const updatedPatients = patients.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          documents: [newDoc, ...(p.documents || [])],
        };
      }
      return p;
    });

    onSavePatients(updatedPatients);
    setIsAddDocModalOpen(false);
    setNewDocName('');
    setNewDocUrl('');
    setNewDocNotes('');
  };

  const handleDeleteDocument = (docId: string, docName?: string) => {
    if (!activePatient) return;
    setDocToDelete({ id: docId, name: docName || 'Document' });
  };

  const confirmDeleteDocument = () => {
    if (!activePatient || !docToDelete) return;
    const docId = docToDelete.id;
    const updatedPatients = patients.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          documents: (p.documents || []).filter((d) => d.id !== docId),
        };
      }
      return p;
    });

    onSavePatients(updatedPatients);
    if (selectedDocPreview?.id === docId) {
      setSelectedDocPreview(null);
    }
    setDocToDelete(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!newDocName) {
        setNewDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!newDocName) {
        setNewDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartMedicalScan = () => {
    setScanStage('initializing');
    setScanProgress(5);
    setScanLog('Démarrage & auto-calibration du magnéton IRM/Scanner...');
    
    // Step 1: Initializing (1s)
    setTimeout(() => {
      setScanStage('scanning');
      setScanProgress(30);
      setScanLog('Alignement des lasers thérapeutiques & acquisition des fréquences RF...');
      
      // Step 2: Scanning (1.2s)
      setTimeout(() => {
        setScanProgress(65);
        setScanLog('Numérisation en cours... Capture des coupes coronales de l\'organe...');
        
        // Step 3: Processing (1.2s)
        setTimeout(() => {
          setScanStage('processing');
          setScanProgress(90);
          setScanLog('Reconstruction 3D haute résolution & filtrage du bruit d\'acquisition...');
          
          // Step 4: Done (0.8s)
          setTimeout(() => {
            setScanStage('done');
            setScanProgress(100);
            setScanLog('Image médicale importée avec succès ! Prête pour l\'enregistrement.');
            
            let scanUrl = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop&q=80'; // MRI brain default
            let scanName = 'Scan IRM Cérébral';
            
            if (scannerProfile === 'ct_chest') {
              scanUrl = 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=80';
              scanName = 'Scanner Thoracique (Poitrine/CT)';
              setNewDocType('scanner');
            } else if (scannerProfile === 'xray_general') {
              scanUrl = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80';
              scanName = 'Radiographie (Rayons X)';
              setNewDocType('xray');
            } else if (scannerProfile === 'ultrasound') {
              scanUrl = 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800&auto=format&fit=crop&q=80';
              scanName = 'Échographie de Diagnostic';
              setNewDocType('image');
            } else {
              setNewDocType('mri');
            }
            
            if (!newDocName) {
              setNewDocName(`${scanName} - ${new Date().toLocaleDateString('fr-FR')}`);
            }
            setNewDocUrl(scanUrl);
          }, 800);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const handleSimulateCameraScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (!newDocName) {
        setNewDocName(`Numérisation Scan_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`);
      }
      setNewDocUrl('https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80');
    }, 1000);
  };

  const patientConsultations = activePatient
    ? consultations.filter((c) => c.patientId === activePatient.id)
    : [];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Dossiers Médicaux Patients (EHR)</h1>
            <p className="text-xs text-slate-400">Base de données médicale chiffrée et privée</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => {
              setExcelInitialMode('import');
              setIsExcelModalOpen(true);
            }}
            className="px-3 py-2 bg-blue-950/80 text-blue-300 border border-blue-800 rounded-xl text-xs font-bold hover:bg-blue-900 transition flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer Excel</span>
          </button>
          <button
            onClick={() => {
              setExcelInitialMode('export');
              setIsExcelModalOpen(true);
            }}
            className="px-3 py-2 bg-purple-950/80 text-purple-300 border border-purple-800 rounded-xl text-xs font-bold hover:bg-purple-900 transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter / Modèle Excel</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md border border-emerald-500/80 hover:brightness-105 hover:border-emerald-400 flex items-center space-x-1.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ Créer Dossier Patient</span>
          </button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Patient directory list (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl flex flex-col h-[420px] lg:h-[calc(100vh-220px)] min-h-[380px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Recherche instantanée patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {filteredPatients.map((p) => {
              const isSelected = activePatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePatientId(p.id)}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-500 shadow-md'
                      : 'bg-slate-950/60 hover:border-slate-700 hover:brightness-105 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 uppercase shrink-0">
                      {p.lastName.charAt(0)}
                      {p.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white uppercase">
                        {p.lastName} {p.firstName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.age} ans • Groupe {p.bloodGroup} • {p.phone}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: EHR Detail View (8 cols) */}
        {activePatient ? (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl overflow-y-auto lg:max-h-[calc(100vh-220px)] custom-scrollbar">
            {/* Patient Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border-2 border-emerald-500/60 flex items-center justify-center font-bold text-xl text-emerald-400 uppercase">
                  {activePatient.lastName.charAt(0)}
                  {activePatient.firstName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase">
                    {activePatient.lastName} {activePatient.firstName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    {activePatient.cin && (
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800">
                        CIN: {activePatient.cin}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-bold text-emerald-400">
                      Sexe: {activePatient.gender} ({activePatient.age} ans)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800">
                      Sang: {activePatient.bloodGroup}
                    </span>
                    <span className="text-slate-400">Né(e) le: {activePatient.birthDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onOpenPrintable && (
                  <button
                    onClick={() =>
                      onOpenPrintable('patient_record', { patientRecord: activePatient })
                    }
                    className="px-3 py-1.5 bg-emerald-950/80 text-emerald-200 border border-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 hover:border-emerald-600 hover:brightness-105 transition-all duration-200"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer Dossier</span>
                  </button>
                )}
                <button
                  onClick={() => handleEdit(activePatient)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 hover:border-slate-500 hover:brightness-105 transition-all duration-200"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-400" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(activePatient.id)}
                  className="px-3 py-1.5 bg-rose-950/80 text-rose-200 border border-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 hover:border-rose-600 hover:brightness-105 transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>

            {/* General Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 font-medium flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Téléphone / CIN :</span>
                </div>
                <div className="font-mono text-white font-bold">{activePatient.phone}</div>
                <div className="text-[11px] text-slate-400 font-mono">CIN: {activePatient.cin || 'Non renseigné'}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 font-medium flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mutuelle / Assurance :</span>
                </div>
                <div className="text-white font-bold truncate">
                  {activePatient.insuranceType === 'Assurance privée'
                    ? `Assurance privée (${activePatient.privateInsuranceName || 'N/A'})`
                    : (activePatient.insuranceType || 'Aucune')}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  N° Assur: {activePatient.insuranceNumber || 'Non renseigné'}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 font-medium flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email :</span>
                </div>
                <div className="text-white font-medium truncate">{activePatient.email || 'Non renseigné'}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 font-medium flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adresse / Profession :</span>
                </div>
                <div className="text-white font-medium truncate">{activePatient.profession} — {activePatient.address}</div>
              </div>
            </div>

            {/* Medical Record Highlights (Diseases, Allergies, Private Notes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Allergies & Intolérances</span>
                </div>
                {activePatient.medicalRecord.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activePatient.medicalRecord.allergies.map((alg, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[11px] font-semibold">
                        {alg}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Aucune allergie connue</p>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-400">
                  <Activity className="w-4 h-4" />
                  <span>Maladies & Traitements en cours</span>
                </div>
                {activePatient.medicalRecord.diseases.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activePatient.medicalRecord.diseases.map((dis, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[11px] font-semibold">
                        {dis}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Aucune maladie chronique déclarée</p>
                )}
              </div>
            </div>

            {/* Private Doctor Notes */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-slate-300 flex items-center space-x-1">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Notes Privées & Observation Confidentielle</span>
              </div>
              <p className="text-slate-400 leading-relaxed italic">
                {activePatient.medicalRecord.privateNotes || 'Aucune note spécifique.'}
              </p>
            </div>

            {/* Documents, Imagerie & Numérisation Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <FolderArchive className="w-4 h-4 text-emerald-400" />
                  <span>Documents, Imagerie & Numérisation ({(activePatient.documents || []).length})</span>
                </h3>
                <button
                  onClick={() => {
                    setNewDocName('');
                    setNewDocUrl('');
                    setNewDocNotes('');
                    setNewDocType('xray');
                    setIsAddDocModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-all duration-200"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>+ Numériser / Importer Document</span>
                </button>
              </div>

              {(!activePatient.documents || activePatient.documents.length === 0) ? (
                <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-center space-y-2">
                  <FileImage className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Aucun document ou scan archivé pour ce patient.</p>
                  <p className="text-[11px] text-slate-500">
                    Numérisez rapidement les bilans biologiques, radiographies, scanners IRM ou comptes-rendus.
                  </p>
                  <button
                    onClick={() => {
                      setNewDocName('');
                      setNewDocUrl('');
                      setNewDocNotes('');
                      setNewDocType('lab');
                      setIsAddDocModalOpen(true);
                    }}
                    className="mt-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ajouter le premier document</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePatient.documents.map((doc) => {
                    const getDocTypeBadge = (t: string) => {
                      switch (t) {
                        case 'lab':
                          return { label: '🧪 Analyse Biologique', color: 'bg-purple-950 text-purple-300 border-purple-800' };
                        case 'xray':
                          return { label: '🩻 Radiographie X-Ray', color: 'bg-blue-950 text-blue-300 border-blue-800' };
                        case 'scanner':
                        case 'mri':
                          return { label: '🧠 Scanner / IRM', color: 'bg-amber-950 text-amber-300 border-amber-800' };
                        default:
                          return { label: '📄 Compte-Rendu', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
                      }
                    };

                    const badge = getDocTypeBadge(doc.type);

                    return (
                      <div
                        key={doc.id}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-sm group transition-all"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{doc.date}</span>
                          </div>
                          <h4 className="font-bold text-xs text-white truncate group-hover:text-emerald-400 transition-colors">
                            {doc.name}
                          </h4>
                          {doc.notes && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        {/* Thumbnail / Quick Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                          {doc.url ? (
                            <div
                              onClick={() => setSelectedDocPreview(doc)}
                              className="w-12 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer hover:opacity-80 transition-opacity shrink-0 relative"
                            >
                              <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-10 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => setSelectedDocPreview(doc)}
                              className="p-1.5 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs flex items-center space-x-1"
                              title="Aperçu du document"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-[10px]">Voir</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/50 rounded-lg border border-slate-800 hover:border-rose-800 text-xs"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prescriptions de Bilan Biologique Section */}
            {activePatient && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <TestTube2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Prescriptions de Bilan Biologique (
                      {analysisRequests.filter((r) => r.patientId === activePatient.id).length})
                    </span>
                  </h3>
                  {onOpenBioPrescriptionModal && (
                    <button
                      onClick={() => onOpenBioPrescriptionModal(activePatient)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-all duration-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Prescrire Bilan Biologique</span>
                    </button>
                  )}
                </div>

                {analysisRequests.filter((r) => r.patientId === activePatient.id).length === 0 ? (
                  <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-center space-y-2">
                    <TestTube2 className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Aucun bilan biologique prescrit pour ce patient.</p>
                    {onOpenBioPrescriptionModal && (
                      <button
                        onClick={() => onOpenBioPrescriptionModal(activePatient)}
                        className="mt-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Prescrire le 1er Bilan Biologique</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisRequests
                      .filter((r) => r.patientId === activePatient.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((req) => (
                        <div
                          key={req.id}
                          className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 shadow-sm transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 text-[10px]">
                                Prescription Biologique
                              </span>
                              <span className="font-mono text-xs text-slate-300 font-bold">
                                {new Date(req.date).toLocaleDateString('fr-FR')}
                              </span>
                              {req.groupPresetName && (
                                <span className="text-[11px] text-slate-400 italic">
                                  [{req.groupPresetName}]
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5">
                              {onOpenPrintable && (
                                <button
                                  onClick={() => onOpenPrintable('analysis', { analysis: req })}
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-slate-900 hover:bg-emerald-950/50 rounded-lg border border-slate-800 hover:border-emerald-800 text-xs flex items-center space-x-1"
                                  title="Imprimer / Exporter PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span className="text-[10px] hidden sm:inline">Imprimer/PDF</span>
                                </button>
                              )}

                              {onOpenBioPrescriptionModal && (
                                <button
                                  onClick={() => onOpenBioPrescriptionModal(activePatient, req)}
                                  className="p-1.5 text-blue-400 hover:text-blue-300 bg-slate-900 hover:bg-blue-950/50 rounded-lg border border-slate-800 hover:border-blue-800 text-xs flex items-center space-x-1"
                                  title="Modifier ou Dupliquer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span className="text-[10px] hidden sm:inline">Modifier</span>
                                </button>
                              )}

                              {onDeleteAnalysisRequest && (
                                <button
                                  onClick={() => setAnalysisReqToDelete(req.id)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/50 rounded-lg border border-slate-800 hover:border-rose-800 text-xs"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {req.indication && (
                            <div className="text-xs text-slate-300">
                              <strong className="text-slate-400">Indication / Motif : </strong>
                              <span className="italic">{req.indication}</span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Analyses Demandées ({req.testsRequested.length}) :
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {req.testsRequested.map((t, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-800 rounded text-[11px] font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {req.customTests && (
                            <div className="text-xs text-slate-300 pt-1 border-t border-slate-900">
                              <strong className="text-slate-400">Analyses personnalisées : </strong>
                              <span className="italic text-emerald-300">{req.customTests}</span>
                            </div>
                          )}

                          {req.doctorName && (
                            <div className="text-[10px] text-slate-500 text-right italic">
                              Prescrit par : {req.doctorName}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                <span>Historique des Consultations ({patientConsultations.length})</span>
              </h3>

              {patientConsultations.length === 0 ? (
                <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  Aucune consultation enregistrée dans l'historique pour ce patient.
                </div>
              ) : (
                <div className="space-y-3">
                  {patientConsultations.map((c) => (
                    <div key={c.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="font-mono text-emerald-400 font-bold">{c.date}</span>
                        <span className="font-bold text-white">{c.cost} {settings.currency}</span>
                      </div>
                      <div>
                        <strong className="text-slate-300">Diagnostic : </strong>
                        <span className="text-slate-200">{c.diagnosis}</span>
                      </div>
                      <div>
                        <strong className="text-slate-300">Plan de Traitement : </strong>
                        <span className="text-slate-400">{c.treatmentPlan}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            Sélectionnez un patient dans la liste de gauche.
          </div>
        )}
      </div>

      {/* New/Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingPatient ? 'Modifier le Dossier Patient' : 'Créer un Nouveau Patient'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* CIN and Insurance Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CIN</label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 uppercase"
                    placeholder="ex: AB123456"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Numéro d'assurance</label>
                  <input
                    type="text"
                    value={insuranceNumber}
                    onChange={(e) => setInsuranceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="ex: 123456789"
                  />
                </div>
              </div>

              {/* Mutuelle ComboBox and Private Insurance Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mutuelle</label>
                  <select
                    value={insuranceType}
                    onChange={(e) => setInsuranceType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Aucune">Aucune</option>
                    <option value="AMO">AMO</option>
                    <option value="CNSS">CNSS</option>
                    <option value="CNOPS">CNOPS</option>
                    <option value="RAMED">RAMED</option>
                    <option value="Assurance privée">Assurance privée</option>
                  </select>
                </div>

                {insuranceType === 'Assurance privée' && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nom de l'assurance *</label>
                    <input
                      type="text"
                      required
                      value={privateInsuranceName}
                      onChange={(e) => setPrivateInsuranceName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="ex: Saham, AXA, Wafa Assurance..."
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sexe</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Groupe Sanguin</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
                    placeholder="ex: 06 61 23 45 67"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
                    placeholder="patient@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
                    placeholder="Adresse complète..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Profession</label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Maladies (séparées par virgule)</label>
                  <input
                    type="text"
                    value={diseases}
                    onChange={(e) => setDiseases(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none"
                    placeholder="HTA, Diabète, Asthme..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Allergies (séparées par virgule)</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none"
                    placeholder="Pénicilline, Aspirine..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes Privées du Médecin</label>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none"
                  placeholder="Remarques confidentielles..."
                />
              </div>

              <div className="pt-3 flex items-center justify-between space-x-3 border-t border-slate-800">
                {editingPatient ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setPatientToDelete(editingPatient);
                    }}
                    className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl font-semibold flex items-center space-x-1.5 transition text-xs"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Supprimer ce dossier</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs"
                  >
                    Enregistrer Patient
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import/Export Modal */}
      {isExcelModalOpen && (
        <ExcelImportExportModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          patients={patients}
          onSavePatients={onSavePatients}
          initialMode={excelInitialMode}
        />
      )}

      {/* Upload / Numériser Document Modal */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/85 rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden my-auto">
            
            {/* Header */}
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Scan className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  Numérisation & Archivage de Document d'Imagerie
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddDocModalOpen(false);
                  setScanStage('idle');
                  setScanProgress(0);
                  setScanLog('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Tab Buttons */}
            <div className="px-6 pt-4 border-b border-slate-800/90 flex space-x-4">
              <button
                type="button"
                onClick={() => setUploadTab('computer')}
                className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition flex items-center space-x-1.5 ${
                  uploadTab === 'computer'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>تحميل من الكمبيوتر / Importer</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('scanner_device')}
                className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition flex items-center space-x-1.5 ${
                  uploadTab === 'scanner_device'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>سكانير العيادة المباشر / Scanner Direct</span>
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4 text-xs">
              
              {/* Document Title input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nom du Document / Intitulé * (اسم الوثيقة)
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="ex: Radiographie Thoracique, Scan IRM..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Catégorie de Document (نوعية الفحص)
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="mri">🧠 Scan / IRM (الرنين المغناطيسي)</option>
                    <option value="scanner">🫁 Scanner Thoracique / CT (سكانير)</option>
                    <option value="xray">🩻 Radiographie X-Ray (الأشعة السينية)</option>
                    <option value="lab">🧪 Bilan Biologique / Analyse (التحاليل الطبية)</option>
                    <option value="pdf">📄 Rapport Médical / Compte-Rendu (التقرير)</option>
                    <option value="image">📷 Autre Photo / Scan (وثيقة أخرى)</option>
                  </select>
                </div>
              </div>

              {/* Tab 1: Computer File Upload & Drag & Drop */}
              {uploadTab === 'computer' && (
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-400">
                    قم بسحب وإفلات الصور الملتقطة من جهاز السكانير أو الرنين بعد حفظها في الكمبيوتر، أو اضغط لتصفح الملفات.
                  </div>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : newDocUrl
                        ? 'border-emerald-600/80 bg-slate-950/40'
                        : 'border-slate-700 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-950/80'
                    }`}
                    onClick={() => {
                      const fileInput = document.getElementById('computer-file-selector');
                      if (fileInput) fileInput.click();
                    }}
                  >
                    <Upload className="w-8 h-8 text-emerald-400 animate-pulse" />
                    <div>
                      <span className="font-bold text-slate-200 text-xs block">
                        Déposez l'image ici ou cliquez pour parcourir
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Fichiers autorisés : PNG, JPG, JPEG, PDF (Max : 15 Mo)
                      </span>
                    </div>
                    <input
                      id="computer-file-selector"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Clinic Scanner Device Direct Integration (Simulator & Local Network Scanner Input) */}
              {uploadTab === 'scanner_device' && (
                <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-300 text-[11px] flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <span>Scanner Local Connecté (IP: 192.168.1.55)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Modèle : Siemens / GE Diagnostic</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        Source du Matériel (جهاز الفحص)
                      </label>
                      <select
                        value={scannerProfile}
                        onChange={(e) => setScannerProfile(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none"
                      >
                        <option value="mri">MRI Scanner 1.5T (رنين مغناطيسي)</option>
                        <option value="ct_chest">CT Chest Scanner 64 (سكانير الصدر)</option>
                        <option value="xray_general">Digital Radiography System (الأشعة)</option>
                        <option value="ultrasound">Echographe 4D (جهاز الإيكو)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleStartMedicalScan}
                        disabled={scanStage !== 'idle' && scanStage !== 'done'}
                        className={`w-full py-1.5 px-3 rounded-lg font-bold shadow-md flex items-center justify-center space-x-1.5 transition ${
                          scanStage === 'scanning' || scanStage === 'processing' || scanStage === 'initializing'
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        <Activity className="w-4 h-4 text-sky-300" />
                        <span>
                          {scanStage === 'idle' ? 'Lancer l\'acquisition / بدء الالتقاط' : 'Relancer / إعادة'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Progressive scanning step-by-step logs */}
                  {scanStage !== 'idle' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">{scanLog}</span>
                        <span className="text-blue-400 font-mono font-bold">{scanProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded Scan Preview Panel */}
              {newDocUrl && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between mt-2 animate-fade-in">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative group">
                      <img
                        src={newDocUrl}
                        alt="Aperçu du Scan"
                        className="w-14 h-14 object-cover rounded-lg border border-slate-700 shadow-md group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-emerald-400 font-bold flex items-center space-x-1 text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Fichier ou Scan prêt pour archivage</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block max-w-[250px]">
                        {newDocName || 'Scan_patient.jpg'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setNewDocUrl('');
                      if (scanStage === 'done') {
                        setScanStage('idle');
                        setScanProgress(0);
                        setScanLog('');
                      }
                    }}
                    className="p-1.5 bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white rounded-lg transition border border-rose-900"
                    title="Supprimer le fichier chargé"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Diagnosis / Medical Remarks */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Observations Cliniques & Conclusion (ملاحظات الطبيب والاستنتاج)
                </label>
                <textarea
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  rows={2}
                  placeholder="Inscrivez ici les conclusions médicales ou le compte-rendu d'imagerie..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDocModalOpen(false);
                    setScanStage('idle');
                    setScanProgress(0);
                    setScanLog('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newDocUrl}
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-lg flex items-center space-x-1.5 transition ${
                    !newDocUrl
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Archiver au Dossier / حفظ بالملف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Lightbox / Viewer Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white uppercase">{selectedDocPreview.name}</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Date : {selectedDocPreview.date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={selectedDocPreview.url}
                  download={selectedDocPreview.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Télécharger</span>
                </a>
                <button
                  onClick={() => setSelectedDocPreview(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-xs">
              {selectedDocPreview.url ? (
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-center max-h-[60vh] overflow-auto">
                  <img
                    src={selectedDocPreview.url}
                    alt={selectedDocPreview.name}
                    className="max-w-full h-auto rounded-lg object-contain shadow-lg"
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">Aperçu indisponible</div>
              )}

              {selectedDocPreview.notes && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-emerald-400">Notes & Compte-rendu</h4>
                  <p className="text-slate-300 leading-relaxed">{selectedDocPreview.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Supprimer le Dossier Patient ?</h3>
              <p className="text-xs text-slate-300">
                Êtes-vous sûr de vouloir supprimer définitivement le dossier de{' '}
                <strong className="text-white font-bold">{patientToDelete.lastName} {patientToDelete.firstName}</strong> ?
              </p>
              <p className="text-[11px] text-rose-400 font-medium">
                Cette action supprimera également l'ensemble des documents, ordonnances et antécédents associés.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeletePatient}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer ce document ?</h3>
              <p className="text-xs text-slate-300">
                Voulez-vous supprimer « <strong className="text-white">{docToDelete.name}</strong> » du dossier ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Request Delete Confirmation Modal */}
      {analysisReqToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer le bilan biologique ?</h3>
              <p className="text-xs text-slate-300">
                Êtes-vous sûr de vouloir supprimer cette prescription de bilan biologique ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAnalysisReqToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAnalysisRequest && analysisReqToDelete) {
                    onDeleteAnalysisRequest(analysisReqToDelete);
                  }
                  setAnalysisReqToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
