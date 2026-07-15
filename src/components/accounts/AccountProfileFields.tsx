import { Platform, PLATFORMS } from '../../types';

export interface AccountProfileDraft {
  niche: string;
  description: string;
  socialLinks: Partial<Record<Platform, string>>;
}

interface AccountProfileFieldsProps {
  draft: AccountProfileDraft;
  onChange: (patch: Partial<AccountProfileDraft>) => void;
}

const INPUT =
  'w-full bg-black border border-white/10 text-white placeholder-slate-500 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 focus:shadow-[0_0_14px_rgba(6,182,212,0.25)] text-sm transition-all';

/**
 * Business-profile fields (niche, description, social links) shared between
 * account creation forms and the edit mode. The AI content tools read this
 * profile so niche/notes/links don't need to be retyped on every generation.
 */
export function AccountProfileFields({ draft, onChange }: AccountProfileFieldsProps) {
  const setSocialLink = (platform: Platform, value: string) => {
    onChange({ socialLinks: { ...draft.socialLinks, [platform]: value } });
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={draft.niche}
        onChange={(e) => onChange({ niche: e.target.value })}
        placeholder="Nicho / industria (ej: restaurante de comida rápida)"
        className={`${INPUT} h-[38px]`}
      />
      <textarea
        value={draft.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Descripción del negocio: qué vende, público objetivo, diferenciadores, tono de marca…"
        rows={3}
        className={`${INPUT} resize-none`}
      />
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((p) => (
          <input
            key={p}
            type="text"
            value={draft.socialLinks[p] || ''}
            onChange={(e) => setSocialLink(p, e.target.value)}
            placeholder={`Link de ${p}`}
            className={`${INPUT} h-[36px] text-xs`}
          />
        ))}
      </div>
    </div>
  );
}
