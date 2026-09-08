import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  Check,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Patient } from '../types';

interface ExcelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSavePatients: (patients: Patient[]) => void;
  initialMode?: 'import' | 'export';
}

interface ParsedPatientRow {
  rowNumber: number;
  lastName: string;
  firstName: string;
  cin: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  profession: string;
  bloodGroup: string;
  insuranceType: string;
  insuranceNumber: string;
  notes: string;
  errors: string[];
  isDuplicate: boolean;
  duplicateMatchId?: string;
  duplicateReason?: string;
  action: 'import' | 'update' | 'skip';
}

export const ExcelImportExportModal: React.FC<ExcelImportExportModalProps> = ({
  isOpen,
  onClose,
  patients,
  onSavePatients,
  initialMode = 'export',
}) => {
  const [mode, setMode] = useState<'import' | 'export'>(initialMode);
  
  // Export State
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  
  // Import State
  const [step, setStep] = useState<'upload' | 'preview' | 'report'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedPatientRow[]>([]);
  const [importStats, setImportStats] = useState({
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- TEMPLATE DOWNLOAD ---
  const handleDownloadTemplate = async () => {
    const templateData = [
      {
        "Nom": "Alami",
        "Prénom": "Mohammed",
        "CIN": "AB123456",
        "Sexe": "M",
        "Date de naissance": "1985-06-15",
        "Téléphone": "0661234567",
        "Email": "mohammed.alami@example.com",
        "Adresse": "123 Avenue Mohammed V, Casablanca",
        "Profession": "Ingénieur",
        "Groupe sanguin": "O+",
        "Mutuelle / Assurance": "AMO",
        "Numéro d'assurance": "987654321",
        "Notes": "Allergique à la pénicilline"
      },
      {
        "Nom": "Benjelloun",
        "Prénom": "Fatima",
        "CIN": "CD987654",
        "Sexe": "F",
        "Date de naissance": "1992-11-20",
        "Téléphone": "0669876543",
        "Email": "fatima.ben@example.com",
        "Adresse": "45 Rue Hassan II, Rabat",
        "Profession": "Médecin",
        "Groupe sanguin": "A+",
        "Mutuelle / Assurance": "CNOPS",
        "Numéro d'assurance": "123456789",
        "Notes": "Suivi hypertension"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    const wscols = [
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 18 },
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
      { wch: 20 }, { wch: 18 }, { wch: 25 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modele_Patients");

    const electronApi = (window as any).electron;
    if (electronApi) {
      try {
        const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const res = await electronApi.ipcRenderer.invoke('excel-save-dialog', {
          defaultFilename: 'Modele_Import_Patients_MediCab.xlsx',
          base64Data
        });
        if (res && res.success) {
          return;
        } else if (res && res.canceled) {
          return;
        }
      } catch (err) {
        console.error('Electron template save error:', err);
      }
    }

    XLSX.writeFile(workbook, "Modele_Import_Patients_MediCab.xlsx");
  };

  // --- EXPORT PATIENTS ---
  const handleExportExcel = async () => {
    const exportData = patients.map((p, idx) => ({
      "N°": idx + 1,
      "Nom": p.lastName,
      "Prénom": p.firstName,
      "CIN": p.cin || '',
      "Sexe": p.gender,
      "Âge": p.age,
      "Date de naissance": p.birthDate,
      "Téléphone": p.phone,
      "Email": p.email || '',
      "Adresse": p.address || '',
      "Profession": p.profession || '',
      "Groupe sanguin": p.bloodGroup || '',
      "Mutuelle / Assurance": p.insuranceType || 'Aucune',
      "Numéro d'assurance": p.insuranceNumber || '',
      "Antécédents / Notes": p.medicalRecord?.privateNotes || p.medicalRecord?.antecedents || '',
      "Date de création": p.createdAt ? p.createdAt.split('T')[0] : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      { wch: 6 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 8 },
      { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
      { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 25 }, { wch: 15 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients_MediCab");

    const defaultFilename = `Patients_Cabinet_${new Date().toISOString().split('T')[0]}.xlsx`;
    const electronApi = (window as any).electron;
    if (electronApi) {
      try {
        const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const res = await electronApi.ipcRenderer.invoke('excel-save-dialog', {
          defaultFilename,
          base64Data
        });
        if (res && res.success) {
          return;
        } else if (res && res.canceled) {
          return;
        }
      } catch (err) {
        console.error('Electron export save error:', err);
      }
    }

    XLSX.writeFile(workbook, defaultFilename);
  };

  // --- PARSE WORKBOOK DATA ---
  const processWorkbookData = (workbook: XLSX.WorkBook) => {
    try {
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const parsed: ParsedPatientRow[] = data.map((row, index) => {
        const rowNumber = index + 2; // header is row 1
        const lastName = String(row['Nom'] || row['nom'] || row['LASTNAME'] || '').trim();
        const firstName = String(row['Prénom'] || row['prenom'] || row['FIRSTNAME'] || '').trim();
        const cin = String(row['CIN'] || row['cin'] || '').trim().toUpperCase();
        const genderRaw = String(row['Sexe'] || row['sexe'] || row['GENDER'] || 'M').trim().toUpperCase();
        const gender: 'M' | 'F' = genderRaw.startsWith('F') ? 'F' : 'M';
        const birthDate = String(row['Date de naissance'] || row['date_naissance'] || row['BIRTHDATE'] || '1990-01-01').trim();
        const phone = String(row['Téléphone'] || row['telephone'] || row['PHONE'] || '').trim();
        const email = String(row['Email'] || row['email'] || '').trim();
        const address = String(row['Adresse'] || row['adresse'] || '').trim();
        const profession = String(row['Profession'] || row['profession'] || '').trim();
        const bloodGroup = String(row['Groupe sanguin'] || row['groupe_sanguin'] || 'O+').trim();
        const insuranceType = String(row['Mutuelle / Assurance'] || row['Mutuelle'] || row['assurance'] || 'Aucune').trim();
        const insuranceNumber = String(row["Numéro d'assurance"] || row['numero_assurance'] || '').trim();
        const notes = String(row['Notes'] || row['antecedents'] || '').trim();

        const errors: string[] = [];
        if (!lastName) errors.push("Nom manquant");
        if (!firstName) errors.push("Prénom manquant");
        if (!phone) errors.push("Téléphone manquant");
        
        if (email && !email.includes('@')) {
          errors.push("Email invalide");
        }

        let isDuplicate = false;
        let duplicateMatchId: string | undefined = undefined;
        let duplicateReason = '';

        const matchByCin = patients.find(p => cin && p.cin && p.cin.toUpperCase() === cin);
        const matchByPhone = patients.find(p => phone && p.phone === phone);

        if (matchByCin) {
          isDuplicate = true;
          duplicateMatchId = matchByCin.id;
          duplicateReason = `CIN identique (${cin})`;
        } else if (matchByPhone) {
          isDuplicate = true;
          duplicateMatchId = matchByPhone.id;
          duplicateReason = `Téléphone identique (${phone})`;
        }

        return {
          rowNumber,
          lastName,
          firstName,
          cin,
          gender,
          birthDate: birthDate.includes('T') ? birthDate.split('T')[0] : birthDate,
          phone,
          email,
          address,
          profession,
          bloodGroup,
          insuranceType,
          insuranceNumber,
          notes,
          errors,
          isDuplicate,
          duplicateMatchId,
          duplicateReason,
          action: errors.length > 0 ? 'skip' : (isDuplicate ? 'update' : 'import'),
        };
      });

      setParsedRows(parsed);
      setStep('preview');
    } catch (err) {
      console.error('Error parsing workbook:', err);
      alert("Erreur lors de la lecture du fichier Excel. Veuillez utiliser le modèle officiel.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- IMPORT FILE HANDLING ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        processWorkbookData(workbook);
      } catch (err) {
        setIsProcessing(false);
        console.error('Error reading file:', err);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleNativeOpenExcel = async () => {
    const electronApi = (window as any).electron;
    if (electronApi) {
      setIsProcessing(true);
      try {
        const res = await electronApi.ipcRenderer.invoke('excel-open-dialog');
        if (res && res.success && res.data) {
          const workbook = XLSX.read(res.data, { type: 'base64' });
          processWorkbookData(workbook);
          return;
        }
      } catch (err) {
        console.error('Electron open dialog error:', err);
      } finally {
        setIsProcessing(false);
      }
    }
    // Fallback to hidden file input
    fileInputRef.current?.click();
  };

  const handleRowActionChange = (index: number, newAction: 'import' | 'update' | 'skip') => {
    const updated = [...parsedRows];
    updated[index].action = newAction;
    setParsedRows(updated);
  };

  const handleConfirmImport = () => {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    let currentPatientsList = [...patients];

    const calcAge = (bDate: string) => {
      const diff = Date.now() - new Date(bDate).getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) || 30;
    };

    parsedRows.forEach((row) => {
      if (row.errors.length > 0 || row.action === 'skip') {
        skippedCount++;
        return;
      }

      const newPatientObj: Patient = {
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        lastName: row.lastName,
        firstName: row.firstName,
        birthDate: row.birthDate,
        age: calcAge(row.birthDate),
        gender: row.gender,
        cin: row.cin,
        insuranceNumber: row.insuranceNumber,
        insuranceType: row.insuranceType || 'Aucune',
        address: row.address,
        phone: row.phone,
        email: row.email,
        profession: row.profession,
        bloodGroup: row.bloodGroup || 'O+',
        emergencyContact: {
          name: '',
          phone: '',
          relation: '',
        },
        medicalRecord: {
          diseases: [],
          allergies: [],
          treatments: [],
          vaccines: [],
          antecedents: row.notes,
          bloodGroup: row.bloodGroup || 'O+',
          privateNotes: row.notes,
        },
        documents: [],
        createdAt: new Date().toISOString(),
      };

      if (row.action === 'update' && row.duplicateMatchId) {
        currentPatientsList = currentPatientsList.map((p) => {
          if (p.id === row.duplicateMatchId) {
            updatedCount++;
            return {
              ...p,
              lastName: row.lastName || p.lastName,
              firstName: row.firstName || p.firstName,
              cin: row.cin || p.cin,
              gender: row.gender || p.gender,
              birthDate: row.birthDate || p.birthDate,
              age: row.birthDate ? calcAge(row.birthDate) : p.age,
              phone: row.phone || p.phone,
              email: row.email || p.email,
              address: row.address || p.address,
              profession: row.profession || p.profession,
              bloodGroup: row.bloodGroup || p.bloodGroup,
              insuranceType: row.insuranceType || p.insuranceType,
              insuranceNumber: row.insuranceNumber || p.insuranceNumber,
              medicalRecord: {
                ...p.medicalRecord,
                privateNotes: row.notes ? `${p.medicalRecord.privateNotes}\n${row.notes}` : p.medicalRecord.privateNotes,
              }
            };
          }
          return p;
        });
      } else {
        currentPatientsList.unshift(newPatientObj);
        importedCount++;
      }
    });

    onSavePatients(currentPatientsList);
    setImportStats({
      total: parsedRows.length,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
    });
    setStep('report');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-6 text-slate-100 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gestionnaire Excel & Migration Patients</h3>
              <p className="text-xs text-slate-400">Importez ou exportez vos dossiers patients au format Microsoft Excel (.xlsx)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'upload' && (
          <div className="flex space-x-2 border-b border-slate-800 pb-3 shrink-0">
            <button
              onClick={() => setMode('export')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                mode === 'export'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Exporter / Télécharger Modèle</span>
            </button>
            <button
              onClick={() => setMode('import')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                mode === 'import'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Importer un fichier Excel</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
          
          {mode === 'export' && step === 'upload' && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-white">Exporter tous les patients</h4>
                    <p className="text-xs text-slate-400">
                      Téléchargez l'intégralité de la base de données patients ({patients.length} dossiers) au format Microsoft Excel (.xlsx).
                    </p>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter Excel (.xlsx)</span>
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-white">Télécharger le Modèle Vierge</h4>
                    <p className="text-xs text-slate-400">
                      Obtenez le modèle Excel officiel formaté avec les en-têtes requis et des exemples pour préparer vos données.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Télécharger Modèle Excel</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {mode === 'import' && step === 'upload' && (
            <div className="space-y-6 py-4 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />

              <div 
                onClick={handleNativeOpenExcel}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 rounded-2xl p-10 cursor-pointer transition flex flex-col items-center justify-center space-y-4 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">Cliquez pour sélectionner un fichier Excel (.xlsx ou .xls)</h4>
                  <p className="text-xs text-slate-400">Le fichier sera analysé et validé instantanément avant l'importation</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNativeOpenExcel();
                  }}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
                >
                  {isProcessing ? 'Analyse en cours...' : 'Parcourir les fichiers'}
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs text-slate-400">
                <span className="font-bold text-slate-300">Conseils d'importation :</span>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Assurez-vous que les colonnes obligatoires (<strong className="text-white">Nom</strong>, <strong className="text-white">Prénom</strong>, <strong className="text-white">Téléphone</strong>) sont remplies.</li>
                  <li>Le système détecte automatiquement les doublons par CIN ou téléphone et vous propose de les mettre à jour.</li>
                  <li>Utilisez le modèle Excel officiel pour éviter toute erreur de format.</li>
                </ul>
              </div>
            </div>
          )}

          {mode === 'import' && step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Aperçu et Validation avant Importation</h4>
                  <p className="text-xs text-slate-400">{parsedRows.length} lignes détectées dans le fichier Excel.</p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Choisir un autre fichier
                </button>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto max-h-[350px] custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-semibold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Ligne</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">CIN</th>
                        <th className="p-3">Téléphone</th>
                        <th className="p-3">Statut / Doublon</th>
                        <th className="p-3">Action à effectuer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className={row.errors.length > 0 ? 'bg-rose-950/20' : row.isDuplicate ? 'bg-amber-950/20' : 'hover:bg-slate-900/50'}>
                          <td className="p-3 font-bold text-slate-400">#{row.rowNumber}</td>
                          <td className="p-3 font-bold text-white uppercase">
                            {row.lastName} {row.firstName}
                          </td>
                          <td className="p-3 text-slate-300 font-mono">{row.cin || '—'}</td>
                          <td className="p-3 text-slate-300">{row.phone || '—'}</td>
                          <td className="p-3">
                            {row.errors.length > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold flex items-center space-x-1 w-fit">
                                <AlertCircle className="w-3 h-3" />
                                <span>{row.errors.join(', ')}</span>
                              </span>
                            ) : row.isDuplicate ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center space-x-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Doublon: {row.duplicateReason}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center space-x-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Valide</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {row.errors.length > 0 ? (
                              <span className="text-slate-500 font-semibold italic">Ignoré (Erreurs)</span>
                            ) : (
                              <select
                                value={row.action}
                                onChange={(e) => handleRowActionChange(idx, e.target.value as any)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                              >
                                {row.isDuplicate && <option value="update">Mettre à jour l'existant</option>}
                                <option value="import">Importer comme nouveau</option>
                                <option value="skip">Ignorer cette ligne</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs transition flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmer et Importer les Données</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'import' && step === 'report' && (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">Importation Terminée avec Succès</h4>
                <p className="text-xs text-slate-400">Le rapport complet de la migration des patients est affiché ci-dessous.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                  <span className="text-2xl font-black text-white">{importStats.total}</span>
                  <p className="text-[11px] text-slate-400">Lignes lues</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl text-center space-y-1">
                  <span className="text-2xl font-black text-emerald-400">{importStats.imported}</span>
                  <p className="text-[11px] text-emerald-300">Nouveaux patients</p>
                </div>
                <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-xl text-center space-y-1">
                  <span className="text-2xl font-black text-blue-400">{importStats.updated}</span>
                  <p className="text-[11px] text-blue-300">Mis à jour</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                  <span className="text-2xl font-black text-slate-400">{importStats.skipped}</span>
                  <p className="text-[11px] text-slate-400">Ignorés / Erreurs</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs transition"
                >
                  Fermer et Retourner aux Patients
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
