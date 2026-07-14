import { useState } from 'react';
import { PenLine, Sparkles } from 'lucide-react';
import { Account } from '../../types';
import { CaptionGenerator } from './CaptionGenerator';
import { AITaskPlanner } from '../accounts/AITaskPlanner';

interface AIToolsPanelProps {
  accounts: Account[];
}

type Tool = 'caption' | 'planner';

// Groups the two Groq tools under one clearly-labeled panel with a segmented
// control, instead of two separate stacked cards.
export function AIToolsPanel({ accounts }: AIToolsPanelProps) {
  const [tool, setTool] = useState<Tool>('caption');

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Herramientas de IA</span>
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-full border border-white/10">
          <button
            onClick={() => setTool('caption')}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              tool === 'caption' ? 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenLine size={13} /> Captions
          </button>
          <button
            onClick={() => setTool('planner')}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              tool === 'planner' ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} /> Plan de contenido
          </button>
        </div>
      </div>

      {tool === 'caption' ? <CaptionGenerator accounts={accounts} /> : <AITaskPlanner accounts={accounts} />}
    </div>
  );
}
