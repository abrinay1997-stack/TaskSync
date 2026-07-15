import { LogOut, FileText, Copy, FileJson, Upload, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Login } from '../Login';

interface MobileMenuProps {
  isAuthenticated: boolean;
  activeTab: string;
  setActiveTab: (tab: 'tasks' | 'progress' | 'schedule' | 'master' | 'accounts') => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
  onSyncCalendar: () => Promise<void> | void;
  onExportPDF: () => void;
  onCopyReport: () => void;
  onExportProject: () => void;
  onImportProject: () => void;
}

export function MobileMenu({
  isAuthenticated,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout,
  onSyncCalendar,
  onExportPDF,
  onCopyReport,
  onExportProject,
  onImportProject
}: MobileMenuProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncCalendar();
    } finally {
      setSyncing(false);
      setMobileMenuOpen(false);
    }
  };

  if (!mobileMenuOpen) return null;

  return (
    <div className="md:hidden bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl px-4 pt-2 pb-4 space-y-1 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] mb-4 relative z-20">
      {!isAuthenticated && <div className="py-2"><Login onSuccess={() => {}} /></div>}

      {isAuthenticated && (
        <div className="py-2 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 px-1">
            <CheckCircle2 size={14} /> Conectado a Google Calendar
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.35)] disabled:opacity-50"
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {syncing ? 'Sincronizando…' : 'Sincronizar con Calendar'}
          </button>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full block text-center bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium py-2.5 rounded-xl transition-all text-sm"
          >
            Ver agenda
          </a>
          <div className="h-px w-full bg-white/10 my-1"></div>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <button 
          onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
          className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-white/10' : 'text-slate-300 hover:bg-white/5'}`}
        >
          Mis Tareas
        </button>
        <button
          onClick={() => { setActiveTab('progress'); setMobileMenuOpen(false); }}
          className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'progress' ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-white/10' : 'text-slate-300 hover:bg-white/5'}`}
        >
          Progreso
        </button>
        <button
          onClick={() => { setActiveTab('schedule'); setMobileMenuOpen(false); }}
          className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'schedule' ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-white/10' : 'text-slate-300 hover:bg-white/5'}`}
        >
          Cronograma
        </button>
        <button
          onClick={() => { setActiveTab('master'); setMobileMenuOpen(false); }}
          className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'master' ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-white/10' : 'text-slate-300 hover:bg-white/5'}`}
        >
          Master
        </button>
        <button
          onClick={() => { setActiveTab('accounts'); setMobileMenuOpen(false); }}
          className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'accounts' ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-white/10' : 'text-slate-300 hover:bg-white/5'}`}
        >
          Cuentas
        </button>
        
        <div className="h-px w-full bg-white/10 my-1"></div>

        <button 
          onClick={() => { onExportPDF(); setMobileMenuOpen(false); }}
          className="text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 flex items-center gap-2"
        >
          <FileText size={16} className="text-purple-400" /> Exportar PDF
        </button>
        
        <button
          onClick={() => { onCopyReport(); setMobileMenuOpen(false); }}
          className="text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 flex items-center gap-2"
        >
          <Copy size={16} className="text-cyan-400" /> Copiar Informe
        </button>

        <button
          onClick={() => { onExportProject(); setMobileMenuOpen(false); }}
          className="text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 flex items-center gap-2"
        >
          <FileJson size={16} className="text-emerald-400" /> Exportar proyecto (JSON)
        </button>

        <button
          onClick={() => { onImportProject(); setMobileMenuOpen(false); }}
          className="text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 flex items-center gap-2"
        >
          <Upload size={16} className="text-amber-400" /> Importar proyecto (JSON)
        </button>

        {isAuthenticated && (
          <button 
            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
            className="text-left px-4 py-3 rounded-xl text-sm font-medium text-pink-400 hover:bg-white/5 flex items-center gap-2"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}
