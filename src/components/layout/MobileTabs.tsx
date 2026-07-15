import { ListTodo, TrendingUp, CalendarRange, LayoutGrid, Briefcase } from 'lucide-react';

interface MobileTabsProps {
  activeTab: string;
  setActiveTab: (tab: 'tasks' | 'progress' | 'schedule' | 'master' | 'accounts') => void;
}

const TABS = [
  { id: 'tasks' as const, label: 'Tareas', Icon: ListTodo },
  { id: 'progress' as const, label: 'Progreso', Icon: TrendingUp },
  { id: 'schedule' as const, label: 'Agenda', Icon: CalendarRange },
  { id: 'master' as const, label: 'Master', Icon: LayoutGrid },
  { id: 'accounts' as const, label: 'Cuentas', Icon: Briefcase },
];

// Bottom-anchored floating pill bar with heavy blur (Lumina Sync design).
export function MobileTabs({ activeTab, setActiveTab }: MobileTabsProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex gap-1 px-2 pt-1.5 bg-black/40 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}
    >
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full text-[9px] font-medium transition-all ${
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
