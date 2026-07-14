import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Account, Task } from '../../types';
import { exportClientReport } from '../../lib/export';

interface ClientReportCardProps {
  accounts: Account[];
  allTasks: Task[];
}

const INPUT_CLASS =
  'w-full bg-black border border-white/10 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm h-[42px] transition-all [color-scheme:dark]';

// Stage 5 of the agency workflow: one-click production report per client.
export function ClientReportCard({ accounts, allTasks }: ClientReportCardProps) {
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const account = accounts.find((a) => a.id === accountId);

  const tasksInRange = account
    ? allTasks.filter((t) => {
        if (t.accountId !== account.id) return false;
        const due = new Date(t.dueDate);
        return due >= new Date(`${from}T00:00`) && due <= new Date(`${to}T23:59:59`);
      })
    : [];
  const completedCount = tasksInRange.filter((t) => t.completed).length;

  const handleExport = () => {
    if (!account) return;
    exportClientReport(allTasks, account, from, to);
  };

  return (
    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-6">
      <h2 className="text-xl font-semibold text-white drop-shadow-md flex items-center gap-2 mb-1">
        <FileText className="text-emerald-400" size={22} />
        Informe de Producción
      </h2>
      <p className="text-xs text-slate-400 mb-5">
        Genera un PDF con el trabajo realizado para un cliente en el período que elijas — listo para enviar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={`${INPUT_CLASS} appearance-none`}
        >
          <option value="" className="bg-slate-900">Selecciona la cuenta…</option>
          <optgroup label="Clientes (Externas)" className="bg-slate-900">
            {accounts.filter((a) => a.type === 'external').map((a) => (
              <option key={a.id} value={a.id} className="text-white">{a.name}</option>
            ))}
          </optgroup>
          <optgroup label="Cuentas Internas" className="bg-slate-900">
            {accounts.filter((a) => a.type === 'internal').map((a) => (
              <option key={a.id} value={a.id} className="text-white">{a.name}</option>
            ))}
          </optgroup>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={INPUT_CLASS} title="Desde" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={INPUT_CLASS} title="Hasta" />
      </div>

      {account && (
        <p className="text-xs text-slate-400 mb-4 font-mono">
          {tasksInRange.length} tarea{tasksInRange.length === 1 ? '' : 's'} en el período · {completedCount} completada{completedCount === 1 ? '' : 's'}
        </p>
      )}

      <button
        onClick={handleExport}
        disabled={!account || tasksInRange.length === 0}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium py-2.5 px-4 rounded-full transition-all text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Download size={16} /> Descargar informe PDF
      </button>
    </div>
  );
}
