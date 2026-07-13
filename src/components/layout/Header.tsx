import { Briefcase, LogOut, Menu, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { ExportMenu } from './ExportMenu';

interface HeaderProps {
  user: User | null;
  isAuthenticated: boolean;
  activeTab: string;
  setActiveTab: (tab: 'tasks' | 'progress' | 'accounts') => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
  onExportPDF: () => void;
  onCopyReport: () => void;
}

export function Header({
  user,
  isAuthenticated,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout,
  onExportPDF,
  onCopyReport
}: HeaderProps) {
  return (
    <header className="flex justify-between items-end pb-4 mb-4 border-b border-white/5 relative z-50">
      <div>
        <h1 className="text-3xl font-bold text-white">Hola, {user ? user.displayName?.split(' ')[0] : 'Brian'}</h1>
        <p className="text-slate-400 text-sm mt-1">Panel de Productividad • {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <div className="flex gap-4 items-center">
        <nav className="hidden md:flex gap-1 p-1 bg-white/[0.03] rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              (activeTab === 'tasks' || activeTab === 'progress')
                ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase size={14} /> Cuentas
          </button>
        </nav>

        <div className="flex gap-3 items-center border-l border-white/10 pl-4">
          <ExportMenu 
            onExportPDF={onExportPDF}
            onCopyReport={onCopyReport}
          />
          
          {isAuthenticated ? (
            <>
              <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Sincronizado</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors hidden md:block backdrop-blur-md border border-white/5"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
              {user?.photoURL && <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-slate-700 hidden sm:block" />}
            </>
          ) : (
            <div className="hidden lg:flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Modo Offline Activo</span>
            </div>
          )}
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-md"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
