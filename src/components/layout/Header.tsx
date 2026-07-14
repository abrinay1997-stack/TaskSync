import { Briefcase, LogOut, Menu, X, LayoutGrid } from 'lucide-react';
import { User } from '../../types';
import { ExportMenu } from './ExportMenu';

interface HeaderProps {
  user: User | null;
  isAuthenticated: boolean;
  activeTab: string;
  setActiveTab: (tab: 'tasks' | 'progress' | 'schedule' | 'master' | 'accounts') => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleLogin: () => void;
  onExportPDF: () => void;
  onCopyReport: () => void;
  onExportProject: () => void;
  onImportProject: () => void;
}

export function Header({
  user,
  isAuthenticated,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout,
  handleLogin,
  onExportPDF,
  onCopyReport,
  onExportProject,
  onImportProject
}: HeaderProps) {
  return (
    <header className="flex justify-between items-end pb-4 mb-4 border-b border-white/5 relative z-50">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">TaskSync</h1>
        <p className="text-slate-400 text-sm mt-1 font-mono text-xs tracking-wide">Panel de Productividad • {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
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
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Cronograma
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'master'
                ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid size={14} /> Master
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
            onExportProject={onExportProject}
            onImportProject={onImportProject}
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
            <button
              onClick={handleLogin}
              className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md transition-all"
              title="Conectar Google Calendar"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span className="text-xs font-semibold text-slate-200">Conectar Google</span>
            </button>
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
