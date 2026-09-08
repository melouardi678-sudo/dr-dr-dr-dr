/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar, NavTab } from './components/Sidebar';
import { ActivationModal } from './components/ActivationModal';
import { KeyGeneratorModal } from './components/KeyGeneratorModal';
import { LoginModal } from './components/LoginModal';
import { AboutModal } from './components/AboutModal';
import { PrintableDocument, PrintableDocType } from './components/PrintableDocument';
import { PrintOptionsModal } from './components/PrintOptionsModal';
import { BioPrescriptionModal } from './components/BioPrescriptionModal';
import { NetworkConnectionBanner } from './components/NetworkConnectionBanner';
import { NetworkModal } from './components/NetworkModal';
import { syncClient } from './utils/syncClient';

import { DashboardView } from './components/views/DashboardView';
import { AgendaView } from './components/views/AgendaView';
import { PatientsView } from './components/views/PatientsView';
import { ConsultationView } from './components/views/ConsultationView';
import { PrescriptionsView } from './components/views/PrescriptionsView';
import { UltrasoundView } from './components/views/UltrasoundView';
import { MedicationsView } from './components/views/MedicationsView';
import { CertificatesView } from './components/views/CertificatesView';
import { BillingView } from './components/views/BillingView';
import { AccountingView } from './components/views/AccountingView';
import { StockView } from './components/views/StockView';
import { MessagingView } from './components/views/MessagingView';
import { SecurityLogsView } from './components/views/SecurityLogsView';
import { BackupView } from './components/views/BackupView';
import { SettingsView } from './components/views/SettingsView';

import {
  LicenseInfo,
  AppUser,
  CabinetSettings,
  Patient,
  Appointment,
  ConsultationItem,
  Prescription,
  UltrasoundReport,
  Medication,
  MedicalCertificate,
  AnalysisRequest,
  Invoice,
  Expense,
  StockItem,
} from './types';

import {
  loadLicenseInfo,
  getLicenseStatus,
  LicenseStatus,
} from './utils/license';


import {
  getSettings,
  saveSettings,
  getCurrentUser,
  setCurrentUser,
  updateUser,
  getUsers,
  getPatients,
  savePatients,
  getAppointments,
  saveAppointments,
  getConsultations,
  saveConsultations,
  getPrescriptions,
  savePrescriptions,
  getUltrasoundReports,
  saveUltrasoundReports,
  getMedications,
  saveMedications,
  getCertificates,
  saveCertificates,
  getAnalysisRequests,
  saveAnalysisRequests,
  getInvoices,
  saveInvoices,
  getExpenses,
  saveExpenses,
  getStock,
  saveStock,
  addAuditLog,
} from './utils/storage';

export default function App() {
  // Splash Screen State
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplashScreen(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  // License State
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(() => loadLicenseInfo());
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(() => getLicenseStatus(licenseInfo));

  // User & Settings
  const [currentUser, setAppCurrentUser] = useState<AppUser>(() => getCurrentUser() || { id: 'usr_default', username: '', fullName: '', role: 'admin', email: '', passwordHash: '', passwordSalt: '' });
  const [settings, setCabinetSettings] = useState<CabinetSettings>(() => getSettings());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getCurrentUser());

  // Sync theme class to documentElement and body for system-wide light/dark mode
  useEffect(() => {
    const isLight = settings.theme === 'light';
    const root = document.documentElement;
    const body = document.body;
    if (isLight) {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark', 'dark');
      body.classList.add('theme-light');
      body.classList.remove('theme-dark', 'dark');
    } else {
      root.classList.add('theme-dark', 'dark');
      root.classList.remove('theme-light');
      body.classList.add('theme-dark', 'dark');
      body.classList.remove('theme-light');
    }
  }, [settings.theme]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Application Data States
  const [patients, setPatients] = useState<Patient[]>(() => getPatients());
  const [appointments, setAppointments] = useState<Appointment[]>(() => getAppointments());
  const [consultations, setConsultations] = useState<ConsultationItem[]>(() => getConsultations());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => getPrescriptions());
  const [ultrasoundReports, setUltrasoundReports] = useState<UltrasoundReport[]>(() => getUltrasoundReports());
  const [medications, setMedications] = useState<Medication[]>(() => getMedications());
  const [certificates, setCertificates] = useState<MedicalCertificate[]>(() => getCertificates());
  const [analysisRequests, setAnalysisRequests] = useState<AnalysisRequest[]>(() => getAnalysisRequests());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [stock, setStock] = useState<StockItem[]>(() => getStock());

  // Modal States
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [isKeyGenOpen, setIsKeyGenOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  // Sync client initialization & real-time WebSocket event listeners
  useEffect(() => {
    syncClient.setUser(currentUser);
    syncClient.connect();

    const unsubMutations = syncClient.onMutation((event) => {
      // Re-hydrate state when changes occur on server or peer clients
      if (event.type === 'sync:full') {
        setPatients(getPatients());
        setAppointments(getAppointments());
        setConsultations(getConsultations());
        setPrescriptions(getPrescriptions());
        setMedications(getMedications());
        setCertificates(getCertificates());
        setInvoices(getInvoices());
        setStock(getStock());
        setCabinetSettings(getSettings());
      } else if (event.entity === 'patients') {
        setPatients(getPatients());
      } else if (event.entity === 'appointments') {
        setAppointments(getAppointments());
      } else if (event.entity === 'consultations') {
        setConsultations(getConsultations());
      } else if (event.entity === 'prescriptions') {
        setPrescriptions(getPrescriptions());
      } else if (event.entity === 'medications') {
        setMedications(getMedications());
      } else if (event.entity === 'certificates') {
        setCertificates(getCertificates());
      } else if (event.entity === 'invoices') {
        setInvoices(getInvoices());
      } else if (event.entity === 'stock') {
        setStock(getStock());
      } else if (event.entity === 'settings') {
        setCabinetSettings(getSettings());
      }
    });

    return () => {
      unsubMutations();
    };
  }, [currentUser]);

  // Selected Patient Shortcut
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Bilan Biologique Modal State
  const [bioModalState, setBioModalState] = useState<{
    isOpen: boolean;
    patient: Patient | null;
    initialRequest: AnalysisRequest | null;
  }>({
    isOpen: false,
    patient: null,
    initialRequest: null,
  });

  const handleOpenBioPrescriptionModal = (
    patient: Patient,
    initialRequest: AnalysisRequest | null = null
  ) => {
    setBioModalState({
      isOpen: true,
      patient,
      initialRequest,
    });
  };

  // Printable Document Overlay State
  const [printableState, setPrintableState] = useState<{
    isOpen: boolean;
    type: PrintableDocType;
    data: {
      prescription?: Prescription;
      ultrasound?: UltrasoundReport;
      certificate?: MedicalCertificate;
      analysis?: AnalysisRequest;
      invoice?: Invoice;
      schedule?: { date: string; appointments: Appointment[] };
      patientRecord?: Patient;
    };
  }>({
    isOpen: false,
    type: 'prescription',
    data: {},
  });

  // Print Options Modal State (Interception before printing)
  const [printOptionsState, setPrintOptionsState] = useState<{
    isOpen: boolean;
    type: PrintableDocType;
    data: any;
    title: string;
  }>({
    isOpen: false,
    type: 'prescription',
    data: {},
    title: 'Document Médical',
  });

  const handleRequestPrint = (type: PrintableDocType, data: any, title: string = 'Document Médical') => {
    setPrintOptionsState({
      isOpen: true,
      type,
      data,
      title,
    });
  };

  const handleConfirmPrintOptions = (paperSize: any, outputMode: any) => {
    setPrintOptionsState((prev) => ({ ...prev, isOpen: false }));
    setPrintableState({
      isOpen: true,
      type: printOptionsState.type,
      data: printOptionsState.data,
    });
  };

  // Re-calculate license status periodically or on update
  useEffect(() => {
    const status = getLicenseStatus(licenseInfo);
    setLicenseStatus(status);
  }, [licenseInfo]);

  // Persist handlers
  const handleSavePatients = (updated: Patient[]) => {
    setPatients(updated);
    savePatients(updated);
  };

  const handleSaveAppointments = (updated: Appointment[]) => {
    setAppointments(updated);
    saveAppointments(updated);
  };

  const handleSaveConsultations = (updated: ConsultationItem[], newInvoice?: Invoice) => {
    const newConsults = [updated[0], ...consultations];
    setConsultations(newConsults);
    saveConsultations(newConsults);

    if (newInvoice) {
      const newInvs = [newInvoice, ...invoices];
      setInvoices(newInvs);
      saveInvoices(newInvs);
    }
    addAuditLog('CREATE_CONSULTATION', `Consultation enregistrée pour ${updated[0].patientName}`);
  };

  const handleSavePrescriptions = (updated: Prescription[]) => {
    setPrescriptions(updated);
    savePrescriptions(updated);
    addAuditLog('CREATE_PRESCRIPTION', `Ordonnance créée pour ${updated[0].patientName}`);
  };

  const handleSaveUltrasoundReports = (updated: UltrasoundReport[]) => {
    setUltrasoundReports(updated);
    saveUltrasoundReports(updated);
    addAuditLog('CREATE_ULTRASOUND_REPORT', `Compte rendu d'échographie enregistré pour ${updated[0]?.patientName || 'patient'}`);
  };

  const handleSaveMedications = (updated: Medication[]) => {
    setMedications(updated);
    saveMedications(updated);
  };

  const handleSaveCertificates = (updated: MedicalCertificate) => {
    const list = [updated, ...certificates];
    setCertificates(list);
    saveCertificates(list);
  };

  const handleSaveAnalysisRequest = (req: AnalysisRequest) => {
    let list: AnalysisRequest[];
    const exists = analysisRequests.some((r) => r.id === req.id);
    if (exists) {
      list = analysisRequests.map((r) => (r.id === req.id ? req : r));
    } else {
      list = [req, ...analysisRequests];
    }
    setAnalysisRequests(list);
    saveAnalysisRequests(list);
    addAuditLog('CREATE_BIO_PRESCRIPTION', `Prescription de bilan biologique pour ${req.patientName}`);
  };

  const handleDeleteAnalysisRequest = (id: string) => {
    const list = analysisRequests.filter((r) => r.id !== id);
    setAnalysisRequests(list);
    saveAnalysisRequests(list);
    addAuditLog('DELETE_BIO_PRESCRIPTION', `Prescription biologique supprimée`);
  };

  const handleSaveInvoices = (updated: Invoice[]) => {
    setInvoices(updated);
    saveInvoices(updated);
  };

  const handleSaveExpenses = (updated: Expense[]) => {
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleSaveStock = (updated: StockItem[]) => {
    setStock(updated);
    saveStock(updated);
  };

  const handleSaveSettings = (updated: CabinetSettings) => {
    setCabinetSettings(updated);
    saveSettings(updated);

    if (currentUser.role === 'admin') {
      const updatedUser: AppUser = {
        ...currentUser,
        fullName: updated.doctorName || currentUser.fullName,
        avatar: updated.doctorAvatar || currentUser.avatar,
      };
      setAppCurrentUser(updatedUser);
      setCurrentUser(updatedUser);
      updateUser(updatedUser);
    }
  };

  const handleSelectUser = (user: AppUser) => {
    setAppCurrentUser(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsLoginOpen(true);
    addAuditLog('LOGOUT', `Déconnexion de l'utilisateur : ${currentUser.fullName}`);
  };

  const handleDataRestored = () => {
    setPatients(getPatients());
    setAppointments(getAppointments());
    setConsultations(getConsultations());
    setPrescriptions(getPrescriptions());
    setUltrasoundReports(getUltrasoundReports());
    setMedications(getMedications());
    setCertificates(getCertificates());
    setAnalysisRequests(getAnalysisRequests());
    setInvoices(getInvoices());
    setExpenses(getExpenses());
    setStock(getStock());
    setCabinetSettings(getSettings());
  };

  // Badge counters
  const today = new Date().toISOString().split('T')[0];
  const waitingPatientsCount = appointments.filter((a) => a.date === today && a.status === 'waiting').length;
  const lowStockCount = stock.filter((s) => s.quantity <= s.minAlertThreshold).length;

  // Reset scroll position to top when navigating between tabs
  useEffect(() => {
    const mainEl = document.getElementById('main-content-scroll');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  // Full-screen Login screen when not authenticated
  if (!isAuthenticated) {
    return (
      <LoginModal
        isOpen={true}
        isFullScreen={true}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />
    );
  }

  return (
    <div
      id="app-root-container"
      dir={settings.direction}
      className={`h-screen h-[100dvh] max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden ${
        settings.theme === 'light' ? 'theme-light' : 'theme-dark'
      }`}
    >
      {/* Top Windows EXE Title & Control Bar */}
      <HeaderBar
        licenseInfo={licenseInfo}
        licenseStatus={licenseStatus}
        currentUser={currentUser}
        settings={settings}
        onOpenActivation={() => setIsActivationOpen(true)}
        onOpenKeyGen={() => setIsKeyGenOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenNetwork={() => setIsNetworkModalOpen(true)}
        onLogout={handleLogout}
        theme={settings.theme}
        onToggleTheme={() =>
          handleSaveSettings({
            ...settings,
            theme: settings.theme === 'light' ? 'dark' : 'light',
          })
        }
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Network Connection Warning Banner (Active when client is disconnected) */}
      <NetworkConnectionBanner onOpenNetworkSettings={() => setIsNetworkModalOpen(true)} />

      {/* Main Layout Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          userRole={currentUser.role}
          waitingPatientsCount={waitingPatientsCount}
          lowStockCount={lowStockCount}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main View Area */}
        <main
          id="main-content-scroll"
          tabIndex={-1}
          className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden bg-slate-950 custom-scrollbar overscroll-contain focus:outline-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              patients={patients}
              appointments={appointments}
              consultations={consultations}
              invoices={invoices}
              settings={settings}
              onNavigate={(t) => setActiveTab(t)}
              onOpenNewAppointment={() => setActiveTab('agenda')}
              onOpenNewPatient={() => setActiveTab('patients')}
              onOpenNewConsultation={() => setActiveTab('consultations')}
              onOpenNewPrescription={() => setActiveTab('prescriptions')}
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaView
              appointments={appointments}
              patients={patients}
              settings={settings}
              onSaveAppointments={handleSaveAppointments}
              onOpenPatientDetail={(pId) => {
                setSelectedPatientId(pId);
                setActiveTab('patients');
              }}
              onOpenPrintable={(type, data) =>
                handleRequestPrint(type, data, 'Planning des Rendez-vous')
              }
            />
          )}

          {activeTab === 'patients' && (
            <PatientsView
              patients={patients}
              consultations={consultations}
              analysisRequests={analysisRequests}
              currentUser={currentUser}
              settings={settings}
              onSavePatients={handleSavePatients}
              selectedPatientId={selectedPatientId}
              onOpenPrintable={(type, data) =>
                handleRequestPrint(type, data, type === 'analysis' ? 'Prescription Bilan Biologique' : 'Dossier Patient')
              }
              onOpenBioPrescriptionModal={handleOpenBioPrescriptionModal}
              onDeleteAnalysisRequest={handleDeleteAnalysisRequest}
            />
          )}

          {activeTab === 'consultations' && (
            <ConsultationView
              patients={patients}
              consultations={consultations}
              invoices={invoices}
              settings={settings}
              onSaveConsultation={(csl, inv) => handleSaveConsultations([csl], inv)}
              onOpenPrescriptionForConsultation={(pId) => {
                setSelectedPatientId(pId);
                setActiveTab('prescriptions');
              }}
              onOpenBioPrescriptionModal={handleOpenBioPrescriptionModal}
              onOpenUltrasoundForConsultation={(pId) => {
                setSelectedPatientId(pId);
                setActiveTab('ultrasound');
              }}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsView
              prescriptions={prescriptions}
              patients={patients}
              medications={medications}
              settings={settings}
              onSavePrescriptions={handleSavePrescriptions}
              onSaveMedications={handleSaveMedications}
              onOpenPrintable={(type, data) =>
                handleRequestPrint(type, data, 'Ordonnance Médicale')
              }
              initialPatientId={selectedPatientId || undefined}
            />
          )}

          {activeTab === 'ultrasound' && (
            <UltrasoundView
              reports={ultrasoundReports}
              patients={patients}
              settings={settings}
              currentUser={currentUser}
              onSaveReports={handleSaveUltrasoundReports}
              onOpenPrintable={(type, data) =>
                handleRequestPrint(type, data, "Compte Rendu d'Échographie")
              }
              initialPatientId={selectedPatientId || undefined}
            />
          )}

          {activeTab === 'medications' && (
            <MedicationsView
              medications={medications}
              prescriptions={prescriptions}
              currentUser={currentUser}
              onSaveMedications={handleSaveMedications}
            />
          )}

          {activeTab === 'certificates' && (
            <CertificatesView
              certificates={certificates}
              analysisRequests={analysisRequests}
              patients={patients}
              settings={settings}
              onSaveCertificate={handleSaveCertificates}
              onSaveAnalysisRequest={handleSaveAnalysisRequest}
              onOpenPrintable={(type, data) =>
                handleRequestPrint(type, data, type === 'certificate' ? 'Certificat Médical' : 'Bilan / Demande d’Analyses')
              }
            />
          )}

          {activeTab === 'billing' && (
            <BillingView
              invoices={invoices}
              patients={patients}
              settings={settings}
              onSaveInvoices={handleSaveInvoices}
              onOpenPrintableInvoice={(inv) =>
                handleRequestPrint('invoice', { invoice: inv }, `Facture N° ${inv.number}`)
              }
            />
          )}

          {activeTab === 'accounting' && currentUser.role === 'admin' && (
            <AccountingView
              invoices={invoices}
              expenses={expenses}
              settings={settings}
              onSaveExpenses={handleSaveExpenses}
            />
          )}

          {activeTab === 'stock' && (
            <StockView stock={stock} onSaveStock={handleSaveStock} />
          )}

          {activeTab === 'messaging' && (
            <MessagingView
              appointments={appointments}
              patients={patients}
              settings={settings}
            />
          )}

          {activeTab === 'security' && currentUser.role === 'admin' && (
            <SecurityLogsView />
          )}

          {activeTab === 'backup' && (
            <BackupView onDataRestored={handleDataRestored} />
          )}

          {activeTab === 'settings' && currentUser && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              theme={settings.theme}
              onToggleTheme={() =>
                handleSaveSettings({
                  ...settings,
                  theme: settings.theme === 'light' ? 'dark' : 'light',
                })
              }
              currentUser={currentUser}
              onUpdateUser={(updated) => {
                setAppCurrentUser(updated);
                setCurrentUser(updated);
                updateUser(updated);
              }}
            />
          )}
        </main>
      </div>

      {/* Bilan Biologique Modal */}
      {bioModalState.isOpen && bioModalState.patient && (
        <BioPrescriptionModal
          isOpen={bioModalState.isOpen}
          onClose={() => setBioModalState({ isOpen: false, patient: null, initialRequest: null })}
          patient={bioModalState.patient}
          settings={settings}
          currentUser={currentUser}
          existingAnalysisRequests={analysisRequests}
          initialRequest={bioModalState.initialRequest}
          onSaveBioPrescription={handleSaveAnalysisRequest}
          onOpenPrintable={(type, data) =>
            handleRequestPrint(type, data, 'Prescription Bilan Biologique')
          }
        />
      )}

      {/* Manual License Activation Modal */}
      {isActivationOpen && (
        <ActivationModal
          isOpen={isActivationOpen}
          onClose={() => setIsActivationOpen(false)}
          licenseInfo={licenseInfo}
          licenseStatus={licenseStatus}
          onLicenseUpdated={(updated) => setLicenseInfo(updated)}
          isMandatoryBlock={false}
        />
      )}

      {/* Vendor License Key Generator Modal */}
      {isKeyGenOpen && (
        <KeyGeneratorModal
          isOpen={isKeyGenOpen}
          onClose={() => setIsKeyGenOpen(false)}
          currentClientId={licenseInfo.clientId}
          currentMachineId={licenseInfo.machineId}
        />
      )}

      {/* Login & User Switch Modal */}
      {isLoginOpen && (
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
        />
      )}

      {/* About Application Modal */}
      {isAboutOpen && (
        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
          licenseInfo={licenseInfo}
          licenseStatus={licenseStatus}
        />
      )}

      {/* Local LAN Network & Multi-PC Setup Modal */}
      <NetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      />

      {/* Print Options Modal */}
      {printOptionsState.isOpen && (
        <PrintOptionsModal
          isOpen={printOptionsState.isOpen}
          onClose={() => setPrintOptionsState((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmPrintOptions}
          documentTitle={printOptionsState.title}
        />
      )}

      {/* Printable Document Overlay */}
      {printableState.isOpen && (
        <PrintableDocument
          type={printableState.type}
          settings={settings}
          data={printableState.data}
          onClose={() => setPrintableState({ ...printableState, isOpen: false })}
          onPrint={() => window.print()}
          onUpdateSettings={(newSettings) => {
            saveSettings(newSettings);
            setCabinetSettings(newSettings);
          }}
        />
      )}
      {/* E-ACCESS WEB Professional Splash Screen */}
      {showSplashScreen && (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-6 text-white animate-fade-in transition-opacity duration-500">
          <div className="flex flex-col items-center space-y-6 text-center max-w-md">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative p-2 bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl">
                <img
                  src="/icon.png"
                  alt="MediCab Logo"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-inner"
                  onError={(e) => {
                    // Fallback to inline SVG if local image blocked
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
              <Logo variant="full" size="lg" themeMode="dark" />
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400 pt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span>Chargement du système médical...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
