import React, { useState } from 'react';
import { Receipt, Search, Plus, Printer, CheckCircle, Clock, XCircle, DollarSign, Trash2, AlertTriangle, Check } from 'lucide-react';
import { Invoice, Patient, CabinetSettings } from '../../types';
import { addAuditLog } from '../../utils/storage';

interface BillingViewProps {
  invoices: Invoice[];
  patients: Patient[];
  settings: CabinetSettings;
  onSaveInvoices: (invs: Invoice[]) => void;
  onOpenPrintableInvoice: (inv: Invoice) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  invoices,
  patients,
  settings,
  onSaveInvoices,
  onOpenPrintableInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete & Toast state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const todayRevenue = invoices
    .filter((i) => (i.status === 'paid' || i.status === 'partially_paid') && i.date.startsWith(todayStr))
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const monthRevenue = invoices
    .filter((i) => (i.status === 'paid' || i.status === 'partially_paid') && i.date.startsWith(currentMonthStr))
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const cashBalance = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const totalCollected = cashBalance;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setDeleteModalOpen(true);
    setErrorMessage(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedInvoice) {
      setErrorMessage("Enregistrement introuvable.");
      setDeleteModalOpen(false);
      return;
    }

    const exists = invoices.some((i) => i.id === selectedInvoice.id);
    if (!exists) {
      setErrorMessage("Enregistrement introuvable.");
      setDeleteModalOpen(false);
      return;
    }

    const updated = invoices.filter((i) => i.id !== selectedInvoice.id);
    onSaveInvoices(updated);

    // Save deletion in audit log
    addAuditLog(
      'DELETE',
      `Suppression de l'enregistrement ${selectedInvoice.number} (${selectedInvoice.patientName}) - Module: Facturation & Caisse`
    );

    setDeleteModalOpen(false);
    setSelectedInvoice(null);
    setSuccessMessage("La suppression a été effectuée avec succès.");
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Success / Error Banners */}
      {successMessage && (
        <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl flex items-center space-x-3 shadow-lg text-xs font-bold">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950 border border-rose-800 text-rose-300 px-4 py-3 rounded-xl flex items-center space-x-3 shadow-lg text-xs font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Facturation & Caisse du Cabinet</h1>
            <p className="text-xs text-slate-400">Paiements, reçus, remboursements et suivi des règlements</p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-medium">Revenus du Jour</span>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {todayRevenue.toFixed(2)} {settings.currency}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-medium">Revenus du Mois</span>
          <div className="text-xl font-black text-blue-400 font-mono">
            {monthRevenue.toFixed(2)} {settings.currency}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-medium">Solde de Caisse Total</span>
          <div className="text-xl font-black text-purple-400 font-mono">
            {cashBalance.toFixed(2)} {settings.currency}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="relative flex-1 sm:w-80">
          <input
            type="text"
            placeholder="Rechercher par N° facture ou patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Statut :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="all">Tous les règlements</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="refunded">Remboursé</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3">N° Facture / Reçu</th>
              <th className="p-3">Date</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Statut</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-950/80 transition">
                <td className="p-3 font-mono font-bold text-emerald-400">{inv.number}</td>
                <td className="p-3 text-slate-400">{inv.date}</td>
                <td className="p-3 font-bold text-white uppercase">{inv.patientName}</td>
                <td className="p-3 uppercase text-[10px] font-semibold text-slate-400">{inv.paymentMethod}</td>
                <td className="p-3 font-mono font-bold text-white">
                  {inv.total.toFixed(2)} {settings.currency}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inv.status === 'paid'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : inv.status === 'pending'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {inv.status === 'paid' ? 'Payé' : inv.status === 'pending' ? 'En attente' : 'Remboursé'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => onOpenPrintableInvoice(inv)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reçu</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(inv)}
                    className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Supprimer</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                  Aucun enregistrement de facturation trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 text-slate-100">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Confirmation de Suppression</h3>
                <p className="text-xs text-slate-400">Module Facturation & Caisse</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-2 text-slate-300 font-medium">
              <p>Êtes-vous sûr de vouloir supprimer cet enregistrement ?</p>
              <p className="text-rose-400 font-bold">Cette action est irréversible.</p>
              {selectedInvoice && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>Règlement : </span><strong className="text-white">{selectedInvoice.number}</strong><br />
                  <span>Patient : </span><strong className="text-white uppercase">{selectedInvoice.patientName}</strong><br />
                  <span>Montant : </span><strong className="text-emerald-400 font-mono">{selectedInvoice.total.toFixed(2)} {settings.currency}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg text-xs transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
