import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  FileDown,
  Settings2,
  X,
  Check,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Type,
  Eye,
  Sparkles,
  Save,
  CheckCircle2,
  MoveHorizontal,
} from 'lucide-react';
import { Logo } from './Logo';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';
import {
  CabinetSettings,
  Prescription,
  MedicalCertificate,
  AnalysisRequest,
  Invoice,
  Appointment,
  Patient,
  UltrasoundReport,
  PrescriptionPrintSettings,
} from '../types';
import { DEFAULT_PRESCRIPTION_PRINT_SETTINGS } from '../utils/storage';
import { t } from '../utils/translations';
import { getStatusConfig } from '../utils/statusConfig';
import { translateToArabic } from '../utils/arabicTranslator';

export type PrintableDocType =
  | 'prescription'
  | 'certificate'
  | 'analysis'
  | 'ultrasound'
  | 'invoice'
  | 'schedule'
  | 'report'
  | 'patient_record';

export type PaperSize = 'A4' | 'A5';
export type PrintOutputMode = 'printer' | 'pdf';

interface PrintableDocumentProps {
  type: PrintableDocType;
  settings: CabinetSettings;
  data: {
    prescription?: Prescription;
    certificate?: MedicalCertificate;
    analysis?: AnalysisRequest;
    ultrasound?: UltrasoundReport;
    invoice?: Invoice;
    schedule?: { date: string; appointments: Appointment[] };
    report?: { title: string; summary: string; items: { label: string; value: string }[] };
    patientRecord?: Patient;
  };
  onClose: () => void;
  onPrint?: () => void;
  onUpdateSettings?: (newSettings: CabinetSettings) => void;
}

const splitBilingual = (
  text: string,
  type: 'name' | 'speciality' | 'address' | 'cabinet'
): { fr: string; ar: string } => {
  if (!text) return { fr: '', ar: '' };

  const hasArabic = (str: string) => /[\u0600-\u06FF]/.test(str);
  const hasLatin = (str: string) => /[a-zA-Z]/.test(str);

  const separators = ['/', '|', ' — ', ' - ', ' – '];
  for (const sep of separators) {
    if (text.includes(sep)) {
      const parts = text.split(sep);
      const part0 = parts[0].trim();
      const part1 = parts[1].trim();

      if (hasArabic(part1) && hasLatin(part0)) {
        return { fr: part0, ar: part1 };
      }
      if (hasArabic(part0) && hasLatin(part1)) {
        return { fr: part1, ar: part0 };
      }
      if (hasArabic(part0)) {
        return { fr: part1, ar: part0 };
      }
      return { fr: part0, ar: part1 };
    }
  }

  if (hasArabic(text) && hasLatin(text)) {
    const latinMatch = text.match(/[a-zA-Z0-9\s\.,\-\(\)\'\’\@\+\:]+/g);
    const arabicMatch = text.match(/[\u0600-\u06FF0-9\s\.,\-\(\)\'\’\@\+\:]+/g);

    const fr = latinMatch ? latinMatch.join(' ').replace(/\s+/g, ' ').trim() : '';
    const ar = arabicMatch ? arabicMatch.join(' ').replace(/\s+/g, ' ').trim() : '';

    return { fr: fr || text, ar: ar || text };
  }

  if (hasArabic(text)) {
    return { fr: text, ar: text };
  }

  return { fr: text, ar: translateToArabic(text, type) };
};

const DirectEditContext = React.createContext<boolean>(true);

// Editable text helper component with seamless print styling (defined outside to prevent re-mounting on keystroke)
const EditableField: React.FC<{
  value: string | number | undefined;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  dir?: 'ltr' | 'rtl';
  style?: React.CSSProperties;
}> = ({
  value,
  onChange,
  className = '',
  placeholder = '',
  multiline = false,
  rows = 2,
  dir,
  style,
}) => {
  const isDirectEditMode = React.useContext(DirectEditContext);

  if (!isDirectEditMode) {
    return (
      <span className={className} dir={dir} style={{ color: '#0f172a', ...style }}>
        {value || placeholder}
      </span>
    );
  }

  if (multiline) {
    return (
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        rows={rows}
        style={{ backgroundColor: 'transparent', color: '#0f172a', ...style }}
        className={`${className} bg-transparent text-slate-900 border border-dashed border-cyan-500/50 hover:border-cyan-600 focus:border-cyan-700 focus:bg-cyan-50/30 rounded px-1 py-0.5 outline-none transition-colors w-full resize-y print:border-none print:bg-transparent print:p-0`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      style={{ backgroundColor: 'transparent', color: '#0f172a', ...style }}
      className={`${className} bg-transparent text-slate-900 border border-dashed border-cyan-500/50 hover:border-cyan-600 focus:border-cyan-700 focus:bg-cyan-50/30 rounded px-1 py-0.5 outline-none transition-colors max-w-full print:border-none print:bg-transparent print:p-0`}
    />
  );
};

export const PrintableDocument: React.FC<PrintableDocumentProps> = ({
  type,
  settings,
  data,
  onClose,
  onUpdateSettings,
}) => {
  const [paperSize, setPaperSize] = useState<PaperSize>(() => {
    return (
      (settings.prescriptionPrintSettings?.paperSize as PaperSize) ||
      (safeGetItem('medicab_print_format') as PaperSize) ||
      'A4'
    );
  });
  const [outputMode, setOutputMode] = useState<PrintOutputMode>(() => {
    return (safeGetItem('medicab_print_output') as PrintOutputMode) || 'printer';
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);
  const [isDirectEditMode, setIsDirectEditMode] = useState(true);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print & Layout Customizer Settings
  const [printOpt, setPrintOpt] = useState<PrescriptionPrintSettings>(() => ({
    ...DEFAULT_PRESCRIPTION_PRINT_SETTINGS,
    ...(settings.prescriptionPrintSettings || {}),
  }));

  // Visual Theme & Font Size
  const [themeColor, setThemeColor] = useState<'emerald' | 'cyan' | 'indigo' | 'slate' | 'mono'>('emerald');
  const [fontSizeScale, setFontSizeScale] = useState<'compact' | 'normal' | 'large'>('normal');

  // Custom Logo state
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(settings.logoUrl);
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('center');

  // Bilingual Header Texts (Editable live)
  const initialCab = splitBilingual(settings.name, 'cabinet');
  const initialDoc = splitBilingual(settings.doctorName, 'name');
  const initialSpec = splitBilingual(settings.speciality, 'speciality');
  const initialAddr = splitBilingual(settings.address, 'address');
  const initialPhone = splitBilingual(settings.phone, 'address');
  const initialEmail = splitBilingual(settings.email, 'address');

  const [headerTexts, setHeaderTexts] = useState({
    cabFr: initialCab.fr,
    cabAr: initialCab.ar,
    docFr: initialDoc.fr,
    docAr: initialDoc.ar,
    specFr: initialSpec.fr,
    specAr: initialSpec.ar,
    addrFr: initialAddr.fr,
    phoneFr: initialPhone.fr,
    emailFr: initialEmail.fr,
  });

  const [footerDate, setFooterDate] = useState<string>(() => new Date().toLocaleDateString('fr-FR'));

  // Cloned Editable Document Content
  const [editablePrescription, setEditablePrescription] = useState<Prescription | undefined>(() => {
    if (!data.prescription) return undefined;
    const cloned = JSON.parse(JSON.stringify(data.prescription));
    if (cloned.date && !cloned.date.includes('/')) {
      try {
        const d = new Date(cloned.date);
        if (!isNaN(d.getTime())) {
          cloned.date = d.toLocaleDateString('fr-FR');
        }
      } catch {
        // keep as is
      }
    }
    return cloned;
  });
  const [editableCertificate, setEditableCertificate] = useState<MedicalCertificate | undefined>(() =>
    data.certificate ? JSON.parse(JSON.stringify(data.certificate)) : undefined
  );
  const [editableAnalysis, setEditableAnalysis] = useState<AnalysisRequest | undefined>(() => {
    if (!data.analysis) return undefined;
    const cloned = JSON.parse(JSON.stringify(data.analysis));
    if (cloned.date && !cloned.date.includes('/')) {
      try {
        const d = new Date(cloned.date);
        if (!isNaN(d.getTime())) {
          cloned.date = d.toLocaleDateString('fr-FR');
        }
      } catch {
        // keep as is
      }
    }
    return cloned;
  });
  const [editableUltrasound, setEditableUltrasound] = useState<UltrasoundReport | undefined>(() => {
    if (!data.ultrasound) return undefined;
    const cloned = JSON.parse(JSON.stringify(data.ultrasound));
    if (cloned.date && !cloned.date.includes('/')) {
      try {
        const d = new Date(cloned.date);
        if (!isNaN(d.getTime())) {
          cloned.date = d.toLocaleDateString('fr-FR');
        }
      } catch {
        // keep as is
      }
    }
    return cloned;
  });
  const [editableInvoice, setEditableInvoice] = useState<Invoice | undefined>(() =>
    data.invoice ? JSON.parse(JSON.stringify(data.invoice)) : undefined
  );

  // Custom Document Title
  const getDefaultDocTitle = (): string => {
    if (type === 'prescription') return 'ORDONNANCE MÉDICALE';
    if (type === 'certificate') {
      if (editableCertificate?.type === 'sick_leave') return 'CERTIFICAT D’ARRÊT DE TRAVAIL';
      if (editableCertificate?.type === 'fitness') return 'CERTIFICAT D’APTITUDE PHYSIQUE';
      if (editableCertificate?.type === 'work_resume') return 'CERTIFICAT DE REPRISE DE TRAVAIL';
      return 'CERTIFICAT MÉDICAL';
    }
    if (type === 'analysis') return 'PRESCRIPTION DE BILAN BIOLOGIQUE';
    if (type === 'ultrasound') return "COMPTE RENDU D'ÉCHOGRAPHIE";
    if (type === 'invoice') return `FACTURE N° ${editableInvoice?.number || ''}`;
    if (type === 'schedule') return `PLANNING DU CABINET — ${data.schedule?.date || ''}`;
    if (type === 'patient_record') return `DOSSIER MÉDICAL`;
    return 'DOCUMENT MÉDICAL';
  };

  const [customDocTitle, setCustomDocTitle] = useState(getDefaultDocTitle());
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const lang = settings.language || 'fr';

  useEffect(() => {
    safeSetItem('medicab_print_format', paperSize);
    setPrintOpt((prev) => ({ ...prev, paperSize }));
  }, [paperSize]);

  useEffect(() => {
    safeSetItem('medicab_print_output', outputMode);
  }, [outputMode]);

  useEffect(() => {
    document.body.classList.remove('print-a4', 'print-a5');
    document.body.classList.add(paperSize === 'A4' ? 'print-a4' : 'print-a5');

    return () => {
      document.body.classList.remove('print-a4', 'print-a5');
    };
  }, [paperSize]);

  const handleToggleOpt = (key: keyof PrescriptionPrintSettings) => {
    setPrintOpt((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleHeaderSpaceChange = (val: number) => {
    setPrintOpt((prev) => ({
      ...prev,
      customHeaderSpaceMm: Math.max(10, Math.min(120, val)),
    }));
  };

  // Reset all manual modifications to original
  const handleResetDocument = () => {
    setShowResetConfirmModal(true);
  };

  const confirmResetDocument = () => {
    setEditablePrescription(data.prescription ? JSON.parse(JSON.stringify(data.prescription)) : undefined);
    setEditableCertificate(data.certificate ? JSON.parse(JSON.stringify(data.certificate)) : undefined);
    setEditableAnalysis(data.analysis ? JSON.parse(JSON.stringify(data.analysis)) : undefined);
    setEditableUltrasound(data.ultrasound ? JSON.parse(JSON.stringify(data.ultrasound)) : undefined);
    setEditableInvoice(data.invoice ? JSON.parse(JSON.stringify(data.invoice)) : undefined);
    setCustomDocTitle(getDefaultDocTitle());
    setCustomLogoUrl(settings.logoUrl);
    setHeaderTexts({
      cabFr: initialCab.fr,
      cabAr: initialCab.ar,
      docFr: initialDoc.fr,
      docAr: initialDoc.ar,
      specFr: initialSpec.fr,
      specAr: initialSpec.ar,
      addrFr: initialAddr.fr,
      phoneFr: initialPhone.fr,
      emailFr: initialEmail.fr,
    });
    setShowResetConfirmModal(false);
    showNotice('Document réinitialisé aux données d’origine');
  };

  const showNotice = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 3500);
  };

  // Handle Logo Upload from local file
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setCustomLogoUrl(result);
        setPrintOpt((prev) => ({ ...prev, showLogo: true }));
        showNotice('Nouveau logo chargé sur le document avec succès !');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Logo permanently to Cabinet Settings
  const handleSaveLogoToCabinet = () => {
    if (!customLogoUrl) return;
    const updated = {
      ...settings,
      logoUrl: customLogoUrl,
      prescriptionPrintSettings: printOpt,
    };
    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
    showNotice('Logo et options enregistrés comme paramètres par défaut du cabinet !');
  };

  // Prescription Item Manipulation
  const handleAddPrescriptionItem = () => {
    if (!editablePrescription) return;
    const newItem = {
      medicineName: 'Nouveau Médicament',
      dosage: '1 comprimé 3 fois par jour',
      duration: '7 jours',
      instructions: 'À prendre après les repas',
    };
    setEditablePrescription({
      ...editablePrescription,
      items: [...editablePrescription.items, newItem],
    });
    showNotice('Nouveau médicament ajouté à l’ordonnance');
  };

  const handleDeletePrescriptionItem = (index: number) => {
    if (!editablePrescription) return;
    const items = [...editablePrescription.items];
    items.splice(index, 1);
    setEditablePrescription({
      ...editablePrescription,
      items,
    });
  };

  const handleUpdatePrescriptionItem = (index: number, field: string, value: string) => {
    if (!editablePrescription) return;
    const items = [...editablePrescription.items];
    items[index] = {
      ...items[index],
      [field]: value,
    };
    setEditablePrescription({
      ...editablePrescription,
      items,
    });
  };

  // Analysis Test Manipulation
  const handleAddAnalysisTest = () => {
    if (!editableAnalysis) return;
    const newTest = 'Nouvelle Analyse / Bilan';
    setEditableAnalysis({
      ...editableAnalysis,
      testsRequested: [...(editableAnalysis.testsRequested || []), newTest],
    });
    showNotice('Nouvelle analyse ajoutée');
  };

  const handleDeleteAnalysisTest = (index: number) => {
    if (!editableAnalysis) return;
    const tests = [...(editableAnalysis.testsRequested || [])];
    tests.splice(index, 1);
    setEditableAnalysis({
      ...editableAnalysis,
      testsRequested: tests,
    });
  };

  const handleUpdateAnalysisTest = (index: number, value: string) => {
    if (!editableAnalysis) return;
    const tests = [...(editableAnalysis.testsRequested || [])];
    tests[index] = value;
    setEditableAnalysis({
      ...editableAnalysis,
      testsRequested: tests,
    });
  };

  // Invoice Item Manipulation
  const handleAddInvoiceItem = () => {
    if (!editableInvoice) return;
    const newItem = { description: 'Consultation & Soins', amount: 300 };
    const items = [...editableInvoice.items, newItem];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = (subtotal * (settings.taxRate || 0)) / 100;
    const total = subtotal + taxAmount;

    setEditableInvoice({
      ...editableInvoice,
      items,
      subtotal,
      taxAmount,
      total,
    });
  };

  const handleDeleteInvoiceItem = (index: number) => {
    if (!editableInvoice) return;
    const items = [...editableInvoice.items];
    items.splice(index, 1);
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = (subtotal * (settings.taxRate || 0)) / 100;
    const total = subtotal + taxAmount;

    setEditableInvoice({
      ...editableInvoice,
      items,
      subtotal,
      taxAmount,
      total,
    });
  };

  const handleUpdateInvoiceItem = (index: number, field: 'description' | 'amount', value: any) => {
    if (!editableInvoice) return;
    const items = [...editableInvoice.items];
    items[index] = {
      ...items[index],
      [field]: field === 'amount' ? Number(value) || 0 : value,
    };
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = (subtotal * (settings.taxRate || 0)) / 100;
    const total = subtotal + taxAmount;

    setEditableInvoice({
      ...editableInvoice,
      items,
      subtotal,
      taxAmount,
      total,
    });
  };

  const getDocFileTitle = (): string => {
    if (type === 'prescription') return `Ordonnance_${editablePrescription?.patientName || 'Patient'}`;
    if (type === 'certificate') return `Certificat_${editableCertificate?.patientName || 'Patient'}`;
    if (type === 'analysis') return `Analyse_${editableAnalysis?.patientName || 'Patient'}`;
    if (type === 'ultrasound') return `Echographie_${editableUltrasound?.patientName || 'Patient'}`;
    if (type === 'invoice') return `Facture_${editableInvoice?.number || 'Doc'}`;
    if (type === 'schedule') return `Planning_RDV_${data.schedule?.date || ''}`;
    if (type === 'patient_record') return `Dossier_${data.patientRecord?.lastName || 'Patient'}`;
    return 'Document_Medical';
  };

  const handleDirectPrint = async () => {
    const title = getDocFileTitle();
    const originalTitle = document.title;

    const electronApi = (window as any).electron;
    if (electronApi) {
      try {
        const res = await (electronApi.printDocument
          ? electronApi.printDocument({ pageSize: paperSize })
          : electronApi.ipcRenderer.invoke('print-document', { pageSize: paperSize }));
        if (res && res.success) {
          return;
        }
      } catch (e) {
        console.error('Electron print IPC error, falling back to browser print:', e);
      }
    }

    document.title = title;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  const handleDirectPDFDownload = async () => {
    setIsGeneratingPDF(true);
    const title = getDocFileTitle();
    const element = document.getElementById('printable-area');

    if (element) {
      try {
        const opt: any = {
          margin: paperSize === 'A5' ? 3 : 6,
          filename: `${title}_${paperSize}.pdf`,
          image: { type: 'jpeg', quality: 0.99 },
          html2canvas: {
            scale: 2.2,
            useCORS: true,
            logging: false,
            onclone: (clonedDoc: Document) => {
              // Sanitize modern CSS color functions (oklch, oklab, color-mix) that crash html2canvas
              const styleTags = clonedDoc.querySelectorAll('style');
              styleTags.forEach((styleTag) => {
                if (styleTag.textContent) {
                  styleTag.textContent = styleTag.textContent
                    .replace(/oklch\([^)]+\)/gi, '#0f172a')
                    .replace(/oklab\([^)]+\)/gi, '#0f172a')
                    .replace(/color-mix\([^)]+\)/gi, '#0f172a')
                    .replace(/color\([^)]+\)/gi, '#0f172a');
                }
              });

              // Check and sanitize inline styles on all elements
              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                if (htmlEl.style) {
                  for (let i = 0; i < htmlEl.style.length; i++) {
                    const prop = htmlEl.style[i];
                    const val = htmlEl.style.getPropertyValue(prop);
                    if (
                      val &&
                      (val.includes('oklch') ||
                        val.includes('oklab') ||
                        val.includes('color-mix') ||
                        val.includes('color('))
                    ) {
                      htmlEl.style.setProperty(prop, '#0f172a');
                    }
                  }
                }
              });
            },
          },
          jsPDF: { unit: 'mm', format: paperSize.toLowerCase(), orientation: 'portrait' },
        };

        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = (html2pdfModule as any).default || html2pdfModule;
        await html2pdf().set(opt).from(element).save();
        setIsGeneratingPDF(false);
        return;
      } catch (err) {
        console.error('Failed to generate PDF with html2pdf, falling back to standard print-to-pdf:', err);
      }
    }

    setIsGeneratingPDF(false);
    const originalTitle = document.title;
    document.title = `${title}.pdf`;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  // Color theme classes
  const themeClasses = {
    emerald: {
      borderAccent: 'border-emerald-600',
      textAccent: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      highlightDot: 'text-emerald-600',
      underline: 'decoration-emerald-500',
    },
    cyan: {
      borderAccent: 'border-cyan-600',
      textAccent: 'text-cyan-700',
      badgeBg: 'bg-cyan-50 text-cyan-900 border-cyan-300',
      highlightDot: 'text-cyan-600',
      underline: 'decoration-cyan-500',
    },
    indigo: {
      borderAccent: 'border-indigo-600',
      textAccent: 'text-indigo-700',
      badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-300',
      highlightDot: 'text-indigo-600',
      underline: 'decoration-indigo-500',
    },
    slate: {
      borderAccent: 'border-slate-700',
      textAccent: 'text-slate-800',
      badgeBg: 'bg-slate-100 text-slate-900 border-slate-300',
      highlightDot: 'text-slate-700',
      underline: 'decoration-slate-400',
    },
    mono: {
      borderAccent: 'border-black',
      textAccent: 'text-black font-bold',
      badgeBg: 'bg-slate-50 text-black border-black',
      highlightDot: 'text-black',
      underline: 'decoration-black',
    },
  }[themeColor];

  // Font size classes
  const fontClasses = {
    compact: {
      base: 'text-[11px]',
      title: 'text-sm font-black',
      sub: 'text-[10px]',
      lineHeight: 'leading-tight',
    },
    normal: {
      base: 'text-xs',
      title: 'text-base font-black',
      sub: 'text-[11px]',
      lineHeight: 'leading-normal',
    },
    large: {
      base: 'text-[13px]',
      title: 'text-lg font-black',
      sub: 'text-xs',
      lineHeight: 'leading-relaxed',
    },
  }[fontSizeScale];

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col print:bg-white print:block overflow-hidden">
      {/* Hidden File Input for Logo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Dynamic Generating Loader Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center space-y-4">
          <div className="bg-slate-900 border border-slate-700/80 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center space-y-4 animate-scale-in">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <div>
              <h4 className="font-bold text-white text-sm">Génération du PDF en cours</h4>
              <p className="text-xs text-slate-400 mt-1">جاري توليد ملف الـ PDF الطبي وتحميله مباشرة...</p>
              <p className="text-[10px] text-slate-500 mt-1">Veuillez ne pas fermer cette fenêtre</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {saveSuccessNotice && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[90] bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-2xl border border-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Sticky Top Bar for Controls (Hidden in Print) */}
      <div className="print:hidden bg-slate-900 border-b border-slate-800 text-slate-100 p-3 shadow-xl shrink-0">
        <div className="max-w-6xl mx-auto space-y-2.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Title / Interactive Edit Mode Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{t('print_title', lang)}</span>
                    <span className="text-[11px] font-normal text-slate-400 font-mono">({paperSize})</span>
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    Impression Haute Précision • Éléments 100% Modifiables
                  </p>
                </div>
              </div>

              {/* Mode Édition Directe Toggle */}
              <button
                type="button"
                onClick={() => setIsDirectEditMode(!isDirectEditMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                  isDirectEditMode
                    ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 shadow-cyan-500/20 ring-1 ring-cyan-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Activez pour cliquer et modifier n'importe quel mot, nom, médicament ou texte directement sur la feuille"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Mode Édition Directe : {isDirectEditMode ? 'ACTIVÉ' : 'Désactivé'}</span>
                {isDirectEditMode && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
              </button>
            </div>

            {/* Quick Action Triggers & Modifiers */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Paper Size selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  className={`py-1 px-2.5 rounded-lg font-bold transition flex items-center space-x-1 ${
                    paperSize === 'A4'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {paperSize === 'A4' && <Check className="w-3 h-3" />}
                  <span>A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('A5')}
                  className={`py-1 px-2.5 rounded-lg font-bold transition flex items-center space-x-1 ${
                    paperSize === 'A5'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {paperSize === 'A5' && <Check className="w-3 h-3" />}
                  <span>A5</span>
                </button>
              </div>

              {/* Logo Quick Tool */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-3 rounded-xl font-bold bg-slate-950 text-amber-300 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 transition flex items-center gap-1.5"
                title="Changer le logo sur ce document (PNG, JPG, SVG)"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Changer Logo</span>
              </button>

              {/* Document Customizer Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowOptionsDrawer(!showOptionsDrawer)}
                className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center space-x-1.5 border ${
                  showOptionsDrawer
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Options & Personnalisation</span>
                {showOptionsDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Reset to Original Button */}
              <button
                type="button"
                onClick={handleResetDocument}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 transition"
                title="Réinitialiser toutes les modifications manuelles"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-md text-xs flex items-center space-x-1 border border-slate-700 transition"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Fermer</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg text-xs flex items-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4 text-teal-100" />
                <span>Imprimer (طباعة)</span>
              </button>

              {/* Direct PDF Download Button */}
              <button
                type="button"
                onClick={handleDirectPDFDownload}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg text-xs flex items-center space-x-1.5 transition"
              >
                <FileDown className="w-4 h-4 text-indigo-100" />
                <span>PDF Direct</span>
              </button>
            </div>
          </div>

          {/* Quick Options Drawer (Full Customization for ANY Document) */}
          {showOptionsDrawer && (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-[11px] animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-indigo-400" />
                  <span>Personnalisation complète du document : Activez / Désactivez n'importe quelle section</span>
                </span>
                <span className="text-slate-400 text-[10px]">
                  Toutes les modifications sont appliquées instantanément en direct
                </span>
              </div>

              {/* Section Checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showHeader}
                    onChange={() => handleToggleOpt('showHeader')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                  />
                  <span className="text-slate-200 font-medium">En-tête Cabinet</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showLogo}
                    disabled={!printOpt.showHeader}
                    onChange={() => handleToggleOpt('showLogo')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded disabled:opacity-40"
                  />
                  <span className="text-slate-200 font-medium">Logo du Cabinet</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showPatientName}
                    onChange={() => handleToggleOpt('showPatientName')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                  />
                  <span className="text-slate-200 font-medium">Nom du Patient</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showAge}
                    onChange={() => handleToggleOpt('showAge')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                  />
                  <span className="text-emerald-300 font-semibold">Âge du Patient</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showDate}
                    onChange={() => handleToggleOpt('showDate')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                  />
                  <span className="text-slate-200 font-medium">Date du Document</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showFooter}
                    onChange={() => handleToggleOpt('showFooter')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                  />
                  <span className="text-slate-200 font-medium">Signature & Cachet</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showCabinetCoords}
                    onChange={() => handleToggleOpt('showCabinetCoords')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                  />
                  <span className="text-slate-200 font-medium">Coordonnées Pied</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showPhone}
                    disabled={!printOpt.showCabinetCoords}
                    onChange={() => handleToggleOpt('showPhone')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded disabled:opacity-40"
                  />
                  <span className="text-slate-200 font-medium">Téléphone</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showAddress}
                    disabled={!printOpt.showCabinetCoords}
                    onChange={() => handleToggleOpt('showAddress')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded disabled:opacity-40"
                  />
                  <span className="text-slate-200 font-medium">Adresse</span>
                </label>

                <label className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={printOpt.showEmail}
                    disabled={!printOpt.showCabinetCoords}
                    onChange={() => handleToggleOpt('showEmail')}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded disabled:opacity-40"
                  />
                  <span className="text-slate-200 font-medium">Email</span>
                </label>
              </div>

              {/* Visual Style, Font Size & Logo Position Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                {/* Logo Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Taille Logo :</span>
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setLogoSize('small')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${logoSize === 'small' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                    >
                      Petite
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSize('medium')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${logoSize === 'medium' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                    >
                      Moyenne
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSize('large')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${logoSize === 'large' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                    >
                      Grande
                    </button>
                  </div>

                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={handleSaveLogoToCabinet}
                      className="px-2 py-1 bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600 hover:text-white rounded-lg transition flex items-center gap-1"
                      title="Enregistrer ce logo pour tous les futurs documents du cabinet"
                    >
                      <Save className="w-3 h-3" />
                      <span>Enregistrer logo au cabinet</span>
                    </button>
                  )}
                </div>

                {/* Font Size Scaling */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Taille Police :</span>
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFontSizeScale('compact')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${fontSizeScale === 'compact' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Compacte
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSizeScale('normal')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${fontSizeScale === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Normale
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSizeScale('large')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${fontSizeScale === 'large' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Grande
                    </button>
                  </div>
                </div>

                {/* Theme Accent Color */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Style Couleur :</span>
                  <div className="flex gap-1.5 items-center">
                    <button
                      type="button"
                      onClick={() => setThemeColor('emerald')}
                      className={`w-5 h-5 rounded-full bg-emerald-600 border-2 transition ${themeColor === 'emerald' ? 'border-white ring-2 ring-emerald-500 scale-110' : 'border-transparent opacity-70'}`}
                      title="Vert Émeraude Médical"
                    />
                    <button
                      type="button"
                      onClick={() => setThemeColor('cyan')}
                      className={`w-5 h-5 rounded-full bg-cyan-600 border-2 transition ${themeColor === 'cyan' ? 'border-white ring-2 ring-cyan-500 scale-110' : 'border-transparent opacity-70'}`}
                      title="Bleu Cyan Moderne"
                    />
                    <button
                      type="button"
                      onClick={() => setThemeColor('indigo')}
                      className={`w-5 h-5 rounded-full bg-indigo-600 border-2 transition ${themeColor === 'indigo' ? 'border-white ring-2 ring-indigo-500 scale-110' : 'border-transparent opacity-70'}`}
                      title="Indigo Professionnel"
                    />
                    <button
                      type="button"
                      onClick={() => setThemeColor('slate')}
                      className={`w-5 h-5 rounded-full bg-slate-700 border-2 transition ${themeColor === 'slate' ? 'border-white ring-2 ring-slate-500 scale-110' : 'border-transparent opacity-70'}`}
                      title="Gris Ardoise Neutre"
                    />
                    <button
                      type="button"
                      onClick={() => setThemeColor('mono')}
                      className={`w-5 h-5 rounded-full bg-black border-2 transition ${themeColor === 'mono' ? 'border-white ring-2 ring-black scale-110' : 'border-transparent opacity-70'}`}
                      title="Noir & Blanc Monochrome (Pour imprimante laser classique)"
                    />
                  </div>
                </div>

                {/* Pre-printed paper blank margin slider */}
                {!printOpt.showHeader && (
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 w-full sm:w-auto">
                    <span className="text-[10px] text-amber-300 font-medium whitespace-nowrap">
                      Marge supérieure pour papier à en-tête pré-imprimé :
                    </span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={printOpt.customHeaderSpaceMm}
                      onChange={(e) => handleHeaderSpaceChange(Number(e.target.value))}
                      className="w-32 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-amber-300 font-mono font-bold">{printOpt.customHeaderSpaceMm}mm</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Direct Edit Helper Bar */}
      {isDirectEditMode && (
        <div className="print:hidden bg-cyan-950/90 border-b border-cyan-800/80 px-4 py-1.5 text-center text-xs text-cyan-200 flex items-center justify-center gap-2 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0 animate-bounce" />
          <span>
            <strong>Mode Édition Directe Activé :</strong> Vous pouvez cliquer directement sur n'importe quel texte (Nom, DCI, Posologie, Titre, En-tête, Pied de page) pour le modifier à votre guise avant d'imprimer !
          </span>
        </div>
      )}

      {/* Scrollable Document Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:overflow-visible print:p-0 print:block">
        <div
          className={`bg-white text-slate-900 rounded-2xl shadow-2xl w-full p-6 print:p-0 print:shadow-none print:max-w-none print:rounded-none relative transition-all my-auto ${
            paperSize === 'A5' ? 'max-w-lg' : 'max-w-2xl'
          }`}
        >
          {/* Printable Area Page Layout */}
          <DirectEditContext.Provider value={isDirectEditMode}>
          <div
            id="printable-area"
            className={`flex flex-col justify-between border border-slate-200 print:border-none bg-white ${
              paperSize === 'A5'
                ? `p-4 print:p-1 min-h-[520px] ${fontClasses.base} space-y-3`
                : `p-6 print:p-2 min-h-[750px] ${fontClasses.base} space-y-4`
            }`}
          >
            {/* Top Section : Header + Body Content */}
            <div>
              {/* Header with Cabinet Info & Logo */}
              {!printOpt.showHeader ? (
                /* Blank spacing for pre-printed letterhead paper */
                <div
                  style={{ height: `${printOpt.customHeaderSpaceMm || 45}mm` }}
                  className="w-full border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400 italic mb-3 select-none print:border-none print:text-transparent"
                >
                  <span>[ Espace réservé à l'en-tête pré-imprimé : {printOpt.customHeaderSpaceMm || 45}mm ]</span>
                </div>
              ) : (
                <div className={`border-b-2 ${themeClasses.borderAccent} pb-3 mb-4`}>
                  {/* Bilingual 3-Column Layout Row: Left (French), Center (Logo), Right (Arabic) */}
                  <div className="grid grid-cols-5 gap-2 items-center">
                    {/* Left Column: French Info (LTR) - Width 40% (2/5) */}
                    <div className="col-span-2 text-left space-y-0.5" style={{ direction: 'ltr' }}>
                      <EditableField
                        value={headerTexts.cabFr}
                        onChange={(val) => setHeaderTexts((prev) => ({ ...prev, cabFr: val }))}
                        className={`${paperSize === 'A5' ? 'text-xs' : 'text-sm'} font-black text-slate-900 uppercase tracking-wide leading-tight block`}
                        placeholder="Nom du Cabinet"
                      />
                      <EditableField
                        value={headerTexts.docFr}
                        onChange={(val) => setHeaderTexts((prev) => ({ ...prev, docFr: val }))}
                        className="text-[11px] font-bold text-slate-800 leading-tight block"
                        placeholder="Dr. Nom & Prénom"
                      />
                      <EditableField
                        value={headerTexts.specFr}
                        onChange={(val) => setHeaderTexts((prev) => ({ ...prev, specFr: val }))}
                        className={`text-[10px] font-semibold ${themeClasses.textAccent} leading-tight block`}
                        placeholder="Spécialité médicale"
                      />
                    </div>

                    {/* Center Column: Logo - Width 20% (1/5) */}
                    <div className="col-span-1 flex items-center justify-center">
                      {printOpt.showLogo && (
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          title="Cliquez pour changer le logo"
                        >
                          {customLogoUrl ? (
                            <img
                              src={customLogoUrl}
                              alt="Logo Cabinet"
                              className={`${
                                logoSize === 'small'
                                  ? paperSize === 'A5' ? 'h-10 max-h-12' : 'h-14 max-h-16'
                                  : logoSize === 'large'
                                  ? paperSize === 'A5' ? 'h-20 max-h-24' : 'h-28 max-h-32'
                                  : paperSize === 'A5' ? 'h-14 max-h-18' : 'h-20 max-h-24'
                              } w-auto object-contain transition-all`}
                            />
                          ) : (
                            <Logo
                              variant="icon"
                              size={
                                logoSize === 'small'
                                  ? paperSize === 'A5' ? 36 : 48
                                  : logoSize === 'large'
                                  ? paperSize === 'A5' ? 64 : 80
                                  : paperSize === 'A5' ? 48 : 64
                              }
                              themeMode="light"
                            />
                          )}
                          <div className="print:hidden absolute -bottom-1 -right-1 bg-cyan-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow">
                            <Upload className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Arabic Info (RTL) - Width 40% (2/5) */}
                    <div className="col-span-2 text-right space-y-0.5" style={{ direction: 'rtl' }}>
                      <EditableField
                        value={headerTexts.cabAr}
                        onChange={(val) => setHeaderTexts((prev) => ({ ...prev, cabAr: val }))}
                        className={`${paperSize === 'A5' ? 'text-xs' : 'text-sm'} font-black text-slate-900 tracking-wide leading-tight block`}
                        placeholder="اسم العيادة"
                        dir="rtl"
                      />
                      <EditableField
                        value={headerTexts.docAr}
                        onChange={(val) => setHeaderTexts((prev) => ({ ...prev, docAr: val }))}
                        className="text-[11px] font-bold text-slate-800 leading-tight block"
                        placeholder="الدكتور..."
                        dir="rtl"
                      />
                      <EditableField
                        value={headerTexts.specAr}
                        onChange={(val) => setHeaderTexts((prev) => ({ ...prev, specAr: val }))}
                        className={`text-[10px] font-semibold ${themeClasses.textAccent} leading-tight block`}
                        placeholder="التخصص الطبي"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 1. DOCUMENT TYPE: PRESCRIPTION (ORDONNANCE) */}
              {/* ========================================================================= */}
              {type === 'prescription' && editablePrescription && (
                <div className="space-y-3.5">
                  {/* Patient & Date Bar */}
                  <div className={`flex items-center justify-between ${themeClasses.badgeBg} p-2 rounded-lg border text-xs`}>
                    {printOpt.showPatientName && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600 font-medium">Patient : </span>
                        <EditableField
                          value={editablePrescription.patientName}
                          onChange={(val) => setEditablePrescription({ ...editablePrescription, patientName: val })}
                          className="font-bold text-slate-950 uppercase"
                          placeholder="Nom du patient"
                        />
                      </div>
                    )}
                    {printOpt.showAge && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600 font-medium">Âge : </span>
                        <EditableField
                          value={editablePrescription.patientAge}
                          onChange={(val) => setEditablePrescription({ ...editablePrescription, patientAge: Number(val) || 0 })}
                          className="font-bold text-slate-950 font-mono w-12"
                          placeholder="Âge"
                        />
                        <span>ans</span>
                      </div>
                    )}
                    {printOpt.showDate && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600 font-medium">Date : </span>
                        <EditableField
                          value={editablePrescription.date || ''}
                          onChange={(val) => setEditablePrescription({ ...editablePrescription, date: val })}
                          className="font-bold text-slate-950"
                          placeholder="JJ/MM/AAAA"
                        />
                      </div>
                    )}
                  </div>

                  {/* Document Title (Editable) */}
                  <div className="text-center py-1 border-b border-slate-200">
                    <EditableField
                      value={customDocTitle}
                      onChange={(val) => setCustomDocTitle(val)}
                      className={`${fontClasses.title} uppercase tracking-widest text-slate-900 underline ${themeClasses.underline} underline-offset-4 text-center block w-full`}
                      placeholder="ORDONNANCE MÉDICALE"
                    />
                  </div>

                  {/* Medications List (Add / Remove / Edit anything) */}
                  <div className="space-y-3 py-2 min-h-[180px]">
                    {editablePrescription.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="space-y-0.5 text-xs group relative p-1 rounded-lg hover:bg-slate-50 transition print:p-0 print:hover:bg-transparent"
                      >
                        {/* Drug Name & Delete button */}
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <span className={`${themeClasses.highlightDot} font-mono font-bold text-xs`}>{idx + 1}.</span>
                            <EditableField
                              value={item.medicineName}
                              onChange={(val) => handleUpdatePrescriptionItem(idx, 'medicineName', val)}
                              className="font-bold text-xs text-slate-900 flex-1"
                              placeholder="Nom du médicament & dosage (ex: Doliprane 1000mg)"
                            />
                          </div>

                          {/* Delete Item Button (Hidden in Print) */}
                          <button
                            type="button"
                            onClick={() => handleDeletePrescriptionItem(idx)}
                            className="print:hidden opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition"
                            title="Supprimer ce médicament de l'impression"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Dosage & Duration */}
                        <div className="pl-5 text-slate-700 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-600">• Posologie :</span>
                          <EditableField
                            value={item.dosage}
                            onChange={(val) => handleUpdatePrescriptionItem(idx, 'dosage', val)}
                            className="font-medium text-slate-800"
                            placeholder="Posologie (ex: 1 cp 3x/j)"
                          />
                          <span className="text-slate-400">— pendant</span>
                          <EditableField
                            value={item.duration}
                            onChange={(val) => handleUpdatePrescriptionItem(idx, 'duration', val)}
                            className="font-medium text-slate-800"
                            placeholder="Durée (ex: 7 jours)"
                          />
                        </div>

                        {/* Instructions / Conseils */}
                        <div className="pl-5 text-slate-500 italic text-[11px] flex items-center gap-1.5">
                          <span className="not-italic text-slate-400">Conseil :</span>
                          <EditableField
                            value={item.instructions}
                            onChange={(val) => handleUpdatePrescriptionItem(idx, 'instructions', val)}
                            className="italic text-slate-600 flex-1"
                            placeholder="Consignes particulières (ex: après les repas)..."
                          />
                        </div>
                      </div>
                    ))}

                    {/* Button to Add a New Medication On The Fly (Hidden in Print) */}
                    <div className="print:hidden pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddPrescriptionItem}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold text-xs shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-cyan-600" />
                        <span>+ Ajouter un médicament sur l'ordonnance</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes / Recommendations Block */}
                  <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-amber-900">
                      Recommandations / Conseils diététiques :
                    </strong>
                    <EditableField
                      value={editablePrescription.notes}
                      onChange={(val) => setEditablePrescription({ ...editablePrescription, notes: val })}
                      className="text-amber-950 font-medium w-full"
                      placeholder="Ajouter des recommandations, repos, conseils d'hygiène de vie..."
                      multiline
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 2. DOCUMENT TYPE: CERTIFICAT MÉDICAL */}
              {/* ========================================================================= */}
              {type === 'certificate' && editableCertificate && (
                <div className="space-y-4 py-2">
                  <div className="text-center py-2 border-b border-slate-200">
                    <EditableField
                      value={customDocTitle}
                      onChange={(val) => setCustomDocTitle(val)}
                      className={`${fontClasses.title} uppercase tracking-widest text-slate-900 underline ${themeClasses.underline} underline-offset-4 text-center block w-full`}
                      placeholder="CERTIFICAT MÉDICAL"
                    />
                  </div>

                  <div className="text-xs text-slate-800 leading-relaxed space-y-3 pt-2">
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <span>Je soussigné,</span>
                      <EditableField
                        value={headerTexts.docFr}
                        onChange={(val) => setHeaderTexts((prev) => ({ ...prev, docFr: val }))}
                        className="font-bold text-slate-900"
                      />
                      <span>, docteur en médecine, certifie avoir examiné ce jour :</span>
                    </p>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-bold text-xs uppercase flex items-center gap-2">
                      <span className="text-slate-600">M. / Mme / Mlle :</span>
                      <EditableField
                        value={editableCertificate.patientName}
                        onChange={(val) => setEditableCertificate({ ...editableCertificate, patientName: val })}
                        className="font-bold text-slate-900 uppercase flex-1"
                        placeholder="Nom & Prénom du patient"
                      />
                    </div>

                    {editableCertificate.type === 'sick_leave' ? (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <p className="flex items-center gap-1.5 flex-wrap">
                          <span>Et atteste que son état de santé nécessite un arrêt de travail d'une durée de</span>
                          <EditableField
                            value={editableCertificate.durationDays}
                            onChange={(val) => setEditableCertificate({ ...editableCertificate, durationDays: Number(val) || 0 })}
                            className="font-bold text-emerald-700 font-mono w-14"
                          />
                          <span className="font-bold">jour(s),</span>
                        </p>
                        <p className="flex items-center gap-1.5 flex-wrap">
                          <span>du</span>
                          <EditableField
                            value={editableCertificate.startDate}
                            onChange={(val) => setEditableCertificate({ ...editableCertificate, startDate: val })}
                            className="font-bold text-slate-900"
                            placeholder="JJ/MM/AAAA"
                          />
                          <span>au</span>
                          <EditableField
                            value={editableCertificate.endDate}
                            onChange={(val) => setEditableCertificate({ ...editableCertificate, endDate: val })}
                            className="font-bold text-slate-900"
                            placeholder="JJ/MM/AAAA"
                          />
                          <span>, sauf complication.</span>
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <EditableField
                          value={editableCertificate.reasonOrObservation}
                          onChange={(val) => setEditableCertificate({ ...editableCertificate, reasonOrObservation: val })}
                          className="w-full text-xs text-slate-900 leading-relaxed"
                          multiline
                          rows={4}
                          placeholder="Observations médicales ou motif du certificat..."
                        />
                      </div>
                    )}

                    <p className="text-slate-500 italic text-[11px] pt-1">
                      Certificat délivré à la demande de l'intéressé(e) pour faire valoir ce que de droit.
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 3. DOCUMENT TYPE: BILAN BIOLOGIQUE & ANALYSES */}
              {/* ========================================================================= */}
              {type === 'analysis' && editableAnalysis && (
                <div className="space-y-4 py-2">
                  <div className={`flex items-center justify-between ${themeClasses.badgeBg} p-2 rounded-lg border text-xs`}>
                    <div>
                      <span className="text-slate-600 font-medium">Patient : </span>
                      <EditableField
                        value={editableAnalysis.patientName}
                        onChange={(val) => setEditableAnalysis({ ...editableAnalysis, patientName: val })}
                        className="font-bold text-slate-950 uppercase"
                      />
                      {editableAnalysis.patientAge && (
                        <span className="text-slate-600 ml-1">({editableAnalysis.patientAge} ans)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Date : </span>
                      <EditableField
                        value={editableAnalysis.date || ''}
                        onChange={(val) => setEditableAnalysis({ ...editableAnalysis, date: val })}
                        className="font-bold text-slate-950"
                        placeholder="JJ/MM/AAAA"
                      />
                    </div>
                  </div>

                  <div className="text-center py-1 border-b border-slate-200">
                    <EditableField
                      value={customDocTitle}
                      onChange={(val) => setCustomDocTitle(val)}
                      className={`${fontClasses.title} uppercase tracking-widest text-slate-900 underline ${themeClasses.underline} underline-offset-4 text-center block w-full`}
                      placeholder="PRESCRIPTION DE BILAN BIOLOGIQUE"
                    />
                    <p className="text-[10px] text-slate-500 italic mt-0.5">Demande d'Analyses Médicales & Examens Biologiques</p>
                  </div>

                  {/* Indication */}
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center gap-1.5">
                    <strong className="text-slate-800 whitespace-nowrap">Indication / Motif : </strong>
                    <EditableField
                      value={editableAnalysis.indication}
                      onChange={(val) => setEditableAnalysis({ ...editableAnalysis, indication: val })}
                      className="italic text-slate-800 flex-1"
                      placeholder="Motif de prescription du bilan..."
                    />
                  </div>

                  {/* Tests requested list */}
                  <div className="space-y-2 pt-1 min-h-[180px]">
                    <div className="font-bold text-xs text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>Analyses & Bilans demandés :</span>
                      {editableAnalysis.groupPresetName && (
                        <span className="text-[11px] font-normal text-slate-500 italic">
                          [{editableAnalysis.groupPresetName}]
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
                      {editableAnalysis.testsRequested?.map((test, i) => (
                        <div key={i} className="flex items-center justify-between text-xs group p-0.5 rounded hover:bg-slate-50 print:p-0">
                          <div className="flex items-center space-x-2 flex-1">
                            <span className={`${themeClasses.highlightDot} font-bold`}>•</span>
                            <EditableField
                              value={test}
                              onChange={(val) => handleUpdateAnalysisTest(i, val)}
                              className="font-semibold text-slate-900 flex-1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnalysisTest(i)}
                            className="print:hidden opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded transition"
                            title="Supprimer cette analyse"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add analysis test button */}
                    <div className="print:hidden pt-2">
                      <button
                        type="button"
                        onClick={handleAddAnalysisTest}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold text-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Ajouter une analyse / examen</span>
                      </button>
                    </div>

                    {/* Custom additional tests */}
                    <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
                      <div className="font-bold text-xs text-slate-800">Autres Examens Spéciaux :</div>
                      <EditableField
                        value={editableAnalysis.customTests}
                        onChange={(val) => setEditableAnalysis({ ...editableAnalysis, customTests: val })}
                        className="text-xs text-slate-800 whitespace-pre-line pl-2 italic border-l-2 border-cyan-500 py-1 w-full"
                        multiline
                        rows={2}
                        placeholder="Ajouter des examens complémentaires..."
                      />
                    </div>
                  </div>

                  {/* Notes for lab */}
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-amber-900">
                      Recommandations pour le laboratoire :
                    </strong>
                    <EditableField
                      value={editableAnalysis.notes}
                      onChange={(val) => setEditableAnalysis({ ...editableAnalysis, notes: val })}
                      className="text-amber-950 font-medium w-full"
                      placeholder="Ex: Prélèvement à jeun impératif..."
                      multiline
                      rows={1}
                    />
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 4. DOCUMENT TYPE: COMPTE RENDU D'ÉCHOGRAPHIE */}
              {/* ========================================================================= */}
              {type === 'ultrasound' && editableUltrasound && (
                <div className="space-y-3.5 py-1 text-slate-800">
                  <div className={`flex items-center justify-between ${themeClasses.badgeBg} p-2 rounded-lg border text-xs`}>
                    <div>
                      <span className="text-slate-600 font-medium">Patient(e) : </span>
                      <EditableField
                        value={editableUltrasound.patientName}
                        onChange={(val) => setEditableUltrasound({ ...editableUltrasound, patientName: val })}
                        className="font-bold text-slate-950 uppercase"
                      />
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Âge : </span>
                      <EditableField
                        value={editableUltrasound.patientAge}
                        onChange={(val) => setEditableUltrasound({ ...editableUltrasound, patientAge: Number(val) || 0 })}
                        className="font-bold text-slate-950 font-mono w-12"
                      />
                      <span>ans</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Date d'examen : </span>
                      <EditableField
                        value={editableUltrasound.date || ''}
                        onChange={(val) => setEditableUltrasound({ ...editableUltrasound, date: val })}
                        className="font-bold text-slate-950"
                        placeholder="JJ/MM/AAAA"
                      />
                    </div>
                  </div>

                  {/* Exam Title */}
                  <div className={`text-center py-1.5 border-b-2 ${themeClasses.borderAccent}`}>
                    <EditableField
                      value={customDocTitle}
                      onChange={(val) => setCustomDocTitle(val)}
                      className={`${fontClasses.title} uppercase tracking-wider text-slate-900 text-center block w-full`}
                    />
                    <EditableField
                      value={editableUltrasound.examTypeName}
                      onChange={(val) => setEditableUltrasound({ ...editableUltrasound, examTypeName: val })}
                      className={`text-xs font-bold ${themeClasses.textAccent} uppercase tracking-wide mt-0.5 text-center block w-full`}
                      placeholder="Type d'échographie..."
                    />
                  </div>

                  {/* Findings */}
                  <div className="space-y-1 pt-1">
                    <div className="font-bold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                      Résultats Détaillés :
                    </div>
                    <EditableField
                      value={editableUltrasound.findings}
                      onChange={(val) => setEditableUltrasound({ ...editableUltrasound, findings: val })}
                      className="text-xs text-slate-800 leading-relaxed font-serif w-full"
                      multiline
                      rows={5}
                      placeholder="Description détaillée de l'examen organe par organe..."
                    />
                  </div>

                  {/* Conclusion */}
                  <div className={`p-3 ${themeClasses.badgeBg} rounded-lg border-2 text-xs space-y-1 mt-2`}>
                    <div className="font-black uppercase tracking-wider">
                      <span>CONCLUSION :</span>
                    </div>
                    <EditableField
                      value={editableUltrasound.conclusion}
                      onChange={(val) => setEditableUltrasound({ ...editableUltrasound, conclusion: val })}
                      className="text-slate-900 font-bold leading-relaxed w-full"
                      multiline
                      rows={2}
                      placeholder="Conclusion diagnostique principale..."
                    />
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 5. DOCUMENT TYPE: FACTURE (INVOICE) */}
              {/* ========================================================================= */}
              {type === 'invoice' && editableInvoice && (
                <div className="space-y-4 py-2">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">Facture N° :</span>
                      <EditableField
                        value={editableInvoice.number}
                        onChange={(val) => setEditableInvoice({ ...editableInvoice, number: val })}
                        className="font-bold text-slate-900 font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600">Client / Patient :</span>
                      <EditableField
                        value={editableInvoice.patientName}
                        onChange={(val) => setEditableInvoice({ ...editableInvoice, patientName: val })}
                        className="font-bold text-slate-900 uppercase"
                      />
                    </div>
                  </div>

                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Prestation / Description</th>
                        <th className="p-2 text-right">Montant ({settings.currency})</th>
                        <th className="p-2 text-center print:hidden w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {editableInvoice.items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50">
                          <td className="p-2">
                            <EditableField
                              value={item.description}
                              onChange={(val) => handleUpdateInvoiceItem(idx, 'description', val)}
                              className="w-full font-medium text-slate-900"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <EditableField
                              value={item.amount}
                              onChange={(val) => handleUpdateInvoiceItem(idx, 'amount', val)}
                              className="font-bold text-slate-900 font-mono text-right w-24"
                            />
                          </td>
                          <td className="p-2 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoiceItem(idx)}
                              className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition"
                              title="Supprimer cette ligne"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="print:hidden">
                    <button
                      type="button"
                      onClick={handleAddInvoiceItem}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold text-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Ajouter une prestation</span>
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <div className="w-60 space-y-1 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Sous-total :</span>
                        <span className="font-mono">{editableInvoice.subtotal.toFixed(2)} {settings.currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>TVA ({settings.taxRate}%) :</span>
                        <span className="font-mono">{editableInvoice.taxAmount.toFixed(2)} {settings.currency}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs text-slate-900 border-t pt-1 border-slate-300">
                        <span>Total à payer :</span>
                        <span className={`${themeClasses.textAccent} font-mono font-bold`}>
                          {editableInvoice.total.toFixed(2)} {settings.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 6. OTHER DOCUMENT TYPES (SCHEDULE, PATIENT RECORD) */}
              {/* ========================================================================= */}
              {type === 'schedule' && data.schedule && (
                <div className="space-y-4 py-2">
                  <div className="text-center py-2 border-b border-slate-200">
                    <h2 className={`${fontClasses.title} uppercase tracking-widest text-slate-900 underline ${themeClasses.underline} underline-offset-4`}>
                      PLANNING DU CABINET — {data.schedule.date}
                    </h2>
                  </div>

                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Heure</th>
                        <th className="p-2">Patient</th>
                        <th className="p-2">Téléphone</th>
                        <th className="p-2">Motif</th>
                        <th className="p-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.schedule.appointments.map((apt) => (
                        <tr key={apt.id}>
                          <td className={`p-2 font-mono font-bold ${themeClasses.textAccent}`}>{apt.time}</td>
                          <td className="p-2 font-bold uppercase">{apt.patientName}</td>
                          <td className="p-2 text-slate-600 font-mono">{apt.phone}</td>
                          <td className="p-2">{apt.reason}</td>
                          <td className="p-2">
                            <span
                              style={{
                                backgroundColor: getStatusConfig(apt.status).hex,
                                color: getStatusConfig(apt.status).textColor,
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            >
                              {getStatusConfig(apt.status).label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {type === 'patient_record' && data.patientRecord && (
                <div className="space-y-3 py-2">
                  <div className="text-center py-1.5 border-b border-slate-200">
                    <h2 className={`${fontClasses.title} uppercase tracking-widest text-slate-900 underline ${themeClasses.underline} underline-offset-4`}>
                      DOSSIER MÉDICAL — {data.patientRecord.lastName.toUpperCase()} {data.patientRecord.firstName}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                    <div><strong>CIN :</strong> {data.patientRecord.cin || 'N/A'}</div>
                    <div><strong>Âge / Sexe :</strong> {data.patientRecord.age} ans ({data.patientRecord.gender})</div>
                    <div><strong>Téléphone :</strong> {data.patientRecord.phone}</div>
                    <div><strong>Groupe Sanguin :</strong> {data.patientRecord.bloodGroup}</div>
                    <div><strong>Profession :</strong> {data.patientRecord.profession}</div>
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <div><strong>Pathologies :</strong> {data.patientRecord.medicalRecord.diseases.join(', ') || 'Aucune'}</div>
                    <div><strong>Allergies :</strong> {data.patientRecord.medicalRecord.allergies.join(', ') || 'Aucune'}</div>
                    <div><strong>Traitements :</strong> {data.patientRecord.medicalRecord.treatments.join(', ') || 'Aucun'}</div>
                    <div><strong>Antécédents :</strong> {data.patientRecord.medicalRecord.antecedents || 'Rien à signaler'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section : Signature & Cachet + Footer Coordinates */}
            <div>
              {printOpt.showFooter && (
                <div className="pt-3 border-t border-slate-200 flex justify-between items-end mt-4 text-xs">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>Fait le</span>
                    <EditableField
                      value={footerDate}
                      onChange={(val) => setFooterDate(val)}
                      className="font-medium text-slate-700"
                      placeholder="JJ/MM/AAAA"
                    />
                  </div>

                  <div className="text-center w-40 space-y-1">
                    <span className="font-bold text-slate-800 text-[10px] block">
                      Signature & Cachet
                    </span>

                    <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-1 bg-slate-50">
                      {settings.signatureUrl ? (
                        <div className="flex items-center justify-center">
                          <img src={settings.signatureUrl} alt="Signature" className="h-12 w-auto object-contain" />
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">
                          [ Signature / Cachet ]
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Solid separator line and French contact details */}
              {printOpt.showCabinetCoords && (
                <div className="border-t-2 border-slate-300 mt-3 pt-2 text-center text-[10px] text-slate-600">
                  <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                    {printOpt.showAddress && (
                      <span className="flex items-center gap-1">
                        <MapPin className={`h-3 w-3 ${themeClasses.textAccent} shrink-0`} />
                        <EditableField
                          value={headerTexts.addrFr}
                          onChange={(val) => setHeaderTexts((prev) => ({ ...prev, addrFr: val }))}
                          placeholder="Adresse du cabinet"
                        />
                      </span>
                    )}
                    {printOpt.showPhone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className={`h-3 w-3 ${themeClasses.textAccent} shrink-0`} />
                        <span>Tél :</span>
                        <EditableField
                          value={headerTexts.phoneFr}
                          onChange={(val) => setHeaderTexts((prev) => ({ ...prev, phoneFr: val }))}
                          placeholder="05XX-XXXXXX"
                        />
                      </span>
                    )}
                    {printOpt.showEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className={`h-3 w-3 ${themeClasses.textAccent} shrink-0`} />
                        <EditableField
                          value={headerTexts.emailFr}
                          onChange={(val) => setHeaderTexts((prev) => ({ ...prev, emailFr: val }))}
                          placeholder="email@cabinet.com"
                        />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          </DirectEditContext.Provider>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Réinitialiser le document ?</h3>
              <p className="text-xs text-slate-300">
                Voulez-vous réinitialiser toutes les modifications manuelles et restaurer les données d'origine ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmResetDocument}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30 transition flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
