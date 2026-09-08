import React, { useState, useEffect } from 'react';
import { Printer, FileDown, Settings2, X, Check } from 'lucide-react';
import { PaperSize, PrintOutputMode } from './PrintableDocument';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paperSize: PaperSize, outputMode: PrintOutputMode) => void;
  documentTitle?: string;
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  documentTitle = 'Document Médical',
}) => {
  const [paperSize, setPaperSize] = useState<PaperSize>(() => {
    return (safeGetItem('medicab_print_format') as PaperSize) || 'A4';
  });
  const [outputMode, setOutputMode] = useState<PrintOutputMode>(() => {
    return (safeGetItem('medicab_print_output') as PrintOutputMode) || 'printer';
  });

  useEffect(() => {
    if (isOpen) {
      const savedFormat = safeGetItem('medicab_print_format') as PaperSize;
      const savedOutput = safeGetItem('medicab_print_output') as PrintOutputMode;
      if (savedFormat) setPaperSize(savedFormat);
      if (savedOutput) setOutputMode(savedOutput);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    safeSetItem('medicab_print_format', paperSize);
    safeSetItem('medicab_print_output', outputMode);
    onConfirm(paperSize, outputMode);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Print Options</h3>
              <p className="text-[11px] text-slate-400">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* Paper Size Selection */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-300">Paper Size / Format du papier</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`py-3 px-4 rounded-xl font-bold border transition flex items-center justify-center space-x-2 ${
                  paperSize === 'A4'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {paperSize === 'A4' && <Check className="w-4 h-4" />}
                <span>A4</span>
              </button>

              <button
                type="button"
                onClick={() => setPaperSize('A5')}
                className={`py-3 px-4 rounded-xl font-bold border transition flex items-center justify-center space-x-2 ${
                  paperSize === 'A5'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {paperSize === 'A5' && <Check className="w-4 h-4" />}
                <span>A5</span>
              </button>
            </div>
          </div>

          {/* Output Type Selection */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-300">Output / Type de sortie</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutputMode('printer')}
                className={`py-3 px-4 rounded-xl font-bold border transition flex items-center justify-center space-x-2 ${
                  outputMode === 'printer'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span className="text-center">Print directly to printer</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputMode('pdf')}
                className={`py-3 px-4 rounded-xl font-bold border transition flex items-center justify-center space-x-2 ${
                  outputMode === 'pdf'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <FileDown className="w-4 h-4" />
                <span className="text-center">Export as PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
