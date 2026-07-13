interface MobileTabsProps {
  activeTab: string;
  setActiveTab: (tab: 'tasks' | 'progress' | 'accounts') => void;
}

export function MobileTabs({ activeTab, setActiveTab }: MobileTabsProps) {
  return (
    <div className="md:hidden flex border-b border-white/10 mb-6 relative z-10 overflow-x-auto">
      <button
        onClick={() => setActiveTab('tasks')}
        className={`py-3 px-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
          activeTab === 'tasks' 
            ? 'border-purple-500 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
            : 'border-transparent text-slate-500 hover:text-slate-300'
        }`}
      >
        Mis Tareas
      </button>
      <button
        onClick={() => setActiveTab('progress')}
        className={`py-3 px-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
          activeTab === 'progress' 
            ? 'border-purple-500 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
            : 'border-transparent text-slate-500 hover:text-slate-300'
        }`}
      >
        Progreso
      </button>
      <button
        onClick={() => setActiveTab('accounts')}
        className={`py-3 px-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
          activeTab === 'accounts' 
            ? 'border-purple-500 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
            : 'border-transparent text-slate-500 hover:text-slate-300'
        }`}
      >
        Cuentas
      </button>
    </div>
  );
}
