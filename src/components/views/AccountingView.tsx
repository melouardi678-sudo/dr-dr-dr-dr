import React, { useState } from 'react';
import { TrendingUp, DollarSign, Plus, FileSpreadsheet, Printer, X, MinusCircle, Trash2 } from 'lucide-react';
import { Invoice, Expense, CabinetSettings } from '../../types';

interface AccountingViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  settings: CabinetSettings;
  onSaveExpenses: (exps: Expense[]) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  invoices,
  expenses,
  settings,
  onSaveExpenses,
}) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [category, setCategory] = useState<'rent' | 'supplies' | 'equipment' | 'utilities' | 'salary' | 'other'>('supplies');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenseAmount;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      description,
      category,
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Espèces',
    };

    onSaveExpenses([newExp, ...expenses]);
    setIsExpenseModalOpen(false);
    setDescription('');
    setAmount(100);
  };

  const confirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    onSaveExpenses(expenses.filter((e) => e.id !== expenseToDelete.id));
    setExpenseToDelete(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Comptabilité & Bilan Financier</h1>
            <p className="text-xs text-slate-400">Recettes, dépenses, calcul des bénéfices nets et rapports</p>
          </div>
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center space-x-1.5 transition"
        >
          <MinusCircle className="w-4 h-4" />
          <span>+ Enregistrer une Dépense</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-1">
          <span className="text-slate-400 font-medium">Recettes Totales (Brut)</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {totalRevenue.toFixed(2)} {settings.currency}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-1">
          <span className="text-slate-400 font-medium">Dépenses & Charges</span>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {totalExpenseAmount.toFixed(2)} {settings.currency}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-1">
          <span className="text-slate-400 font-medium">Bénéfice Net Total</span>
          <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit.toFixed(2)} {settings.currency}
          </div>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h2 className="font-bold text-sm text-white">Journal des Dépenses du Cabinet</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Description</th>
              <th className="p-3">Montant ({settings.currency})</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-950/40 transition">
                <td className="p-3 font-mono text-slate-400">{exp.date}</td>
                <td className="p-3 uppercase font-bold text-[10px] text-amber-400">{exp.category}</td>
                <td className="p-3 text-white font-medium">{exp.description}</td>
                <td className="p-3 font-mono font-bold text-rose-400">{exp.amount.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setExpenseToDelete(exp)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                    title="Supprimer la dépense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full text-slate-100 overflow-hidden">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Enregistrer une Dépense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Montant ({settings.currency}) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="supplies">Consommables Médicaux</option>
                  <option value="rent">Loyer & Charges Cabinet</option>
                  <option value="equipment">Équipements & Matériel</option>
                  <option value="utilities">Électricité / Eau / Télécom</option>
                  <option value="salary">Salaires & Honoraires</option>
                  <option value="other">Autre Dépense</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer cette dépense ?</h3>
              <p className="text-xs text-slate-300">
                Êtes-vous sûr de vouloir supprimer la dépense « <strong className="text-white">{expenseToDelete.description}</strong> » de {expenseToDelete.amount} {settings.currency} ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteExpense}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition flex items-center justify-center space-x-1.5"
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
