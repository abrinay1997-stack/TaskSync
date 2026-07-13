import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Copy, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
  onExportPDF: () => void;
  onCopyReport: () => void;
}

export function ExportMenu({ onExportPDF, onCopyReport }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/10"
        title="Exportar Reporte"
      >
        <Download size={16} /> 
        <span className="hidden lg:inline">Exportar</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => {
                onExportPDF();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <FileText size={16} className="text-purple-400" /> Exportar PDF
            </button>
            <button
              onClick={() => {
                onCopyReport();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <Copy size={16} className="text-cyan-400" /> Copiar Informe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
