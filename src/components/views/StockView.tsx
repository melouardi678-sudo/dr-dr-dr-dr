import React, { useState } from 'react';
import { Package, AlertTriangle, Plus, Minus, Search, Edit, Trash2, X } from 'lucide-react';
import { StockItem } from '../../types';

interface StockViewProps {
  stock: StockItem[];
  onSaveStock: (stock: StockItem[]) => void;
}

export const StockView: React.FC<StockViewProps> = ({ stock, onSaveStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'medicine' | 'consumable' | 'equipment' | 'other'>('consumable');
  const [quantity, setQuantity] = useState(10);
  const [minAlertThreshold, setMinAlertThreshold] = useState(5);
  const [unitPrice, setUnitPrice] = useState(50);
  const [location, setLocation] = useState('Armoire A');
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  const filteredStock = stock.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleUpdateQty = (id: string, delta: number) => {
    const updated = stock.map((s) =>
      s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s
    );
    onSaveStock(updated);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    onSaveStock(stock.filter((s) => s.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: StockItem = {
      id: `stk_${Date.now()}`,
      name,
      category,
      quantity,
      minAlertThreshold,
      unitPrice,
      location,
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    onSaveStock([newItem, ...stock]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Gestion des Stocks & Consommables</h1>
            <p className="text-xs text-slate-400">Suivi des fournitures médicales, alertes de réapprovisionnement</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Ajouter au Stock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredStock.map((item) => {
          const isLow = item.quantity <= item.minAlertThreshold;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition shadow-md flex flex-col justify-between ${
                isLow
                  ? 'bg-amber-950/40 border-amber-800/80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{item.category}</span>
                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                    <p className="text-[11px] text-slate-400">Emplacement : {item.location || 'Cabinet'}</p>
                  </div>
                  {isLow && (
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[10px] flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Stock Faible</span>
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Quantité Disponible :</span>
                  <strong className={`font-mono text-base ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {item.quantity} unités
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 text-[10px]">Alerte si &le; {item.minAlertThreshold}</span>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded transition"
                    title="Supprimer cet article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleUpdateQty(item.id, -1)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                    title="Diminuer stock (-1)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleUpdateQty(item.id, 1)}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                    title="Augmenter stock (+1)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full text-slate-100 overflow-hidden">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Ajouter un Article au Stock</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStock} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nom de l'Article *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Quantité Initiale</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Seuil Alerte Stock</label>
                  <input
                    type="number"
                    value={minAlertThreshold}
                    onChange={(e) => setMinAlertThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Emplacement</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Item Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Supprimer cet article du stock ?</h3>
              <p className="text-xs text-slate-300">
                Êtes-vous sûr de vouloir supprimer <strong className="text-white">{itemToDelete.name}</strong> ?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
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
