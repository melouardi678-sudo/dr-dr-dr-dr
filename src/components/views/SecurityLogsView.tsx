import React from 'react';
import { ShieldCheck, Activity, UserCheck, Lock } from 'lucide-react';
import { AuditLog, ConnectionLog } from '../../types';
import { getAuditLogs, getConnectionLogs } from '../../utils/storage';

export const SecurityLogsView: React.FC = () => {
  const auditLogs = getAuditLogs();
  const connLogs = getConnectionLogs();

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Sécurité & Journal d'Audit du Cabinet</h1>
          <p className="text-xs text-slate-400">Journal de toutes les connexions et historique des modifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Audit Log Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Journal Historique des Actions (Audit Trail)</h2>
          <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Horodatage</th>
                  <th className="p-2.5">Utilisateur</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-2.5 font-mono text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                    <td className="p-2.5 font-bold text-emerald-400">{log.userName}</td>
                    <td className="p-2.5 uppercase font-bold text-[10px] text-amber-400">{log.action}</td>
                    <td className="p-2.5 text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connection Log & Permissions Matrix (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Dernières Connexions</h2>
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {connLogs.map((conn) => (
                <div key={conn.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{conn.userName} ({conn.role})</div>
                    <div className="text-[10px] text-slate-500">{new Date(conn.timestamp).toLocaleTimeString('fr-FR')}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${conn.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                    {conn.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl text-slate-300">
            <h2 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Matrice des Permissions</h2>
            <ul className="space-y-2 text-[11px]">
              <li className="flex justify-between">
                <span>Accès Financier / Comptabilité</span>
                <strong className="text-emerald-400">Médecin Uniquement</strong>
              </li>
              <li className="flex justify-between">
                <span>Création Ordonnance / Certificat</span>
                <strong className="text-emerald-400">Médecin Uniquement</strong>
              </li>
              <li className="flex justify-between">
                <span>Prise de RDV & Agenda</span>
                <strong className="text-blue-400">Médecin & Secrétaire</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
