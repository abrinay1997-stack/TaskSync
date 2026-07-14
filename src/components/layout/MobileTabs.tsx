import { ListTodo, TrendingUp, Briefcase } from 'lucide-react';

interface MobileTabsProps {
  activeTab: string;
  setActiveTab: (tab: 'tasks' | 'progress' | 'accounts') => void;
}

const TABS = [
  { id: 'tasks' as const, label: 'Tareas', Icon: ListTodo },
  { id: 'progress' as const, label: 'Progreso', Icon: TrendingUp },
  { id: 'accounts' as const, label: 'Cuentas', Icon: Briefcase },
];

// Bottom-anchored floating pill bar with heavy blur (Lumina Sync design).
export function MobileTabs({ activeTab, setActiveTab }: MobileTabsProps) {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex gap-1 p-1.5 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full text-[11px] font-medium transition-all ${
            activeTab === id
              ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white shadow-[0_0_12px_rgba(147,51,234,0.35)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icon size={18} strokeWidth={2} />
          {label}
        </button>
      ))}
    </nav>
  );
}
