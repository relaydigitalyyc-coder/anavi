import { useState } from 'react';
import { ArrowRight, CheckCircle2, Landmark } from 'lucide-react';
import { Link } from 'wouter';
import { PERSONA_CARDS, type DemoPersona } from '@/pages/demo/demoAdapter';
import { C, ICON_MAP } from './atoms';

export function PersonaSelector({
  onStart,
}: {
  onStart: (persona: DemoPersona, name: string) => void;
}) {
  const [selected, setSelected] = useState<DemoPersona | null>(null);
  const [userName, setUserName] = useState('');

  return (
    <div className="flex min-h-screen flex-col bg-geometric">
      {/* Top bar */}
      <div
        className="flex h-14 shrink-0 items-center px-6"
        style={{ backgroundColor: C.navy }}
      >
        <span className="text-lg font-bold tracking-wide text-white">
          ANAVI <span className="ml-2 text-xs font-normal text-white/50">Demo</span>
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="gradient-gold text-4xl font-bold tracking-tight">
              Experience ANAVI
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base" style={{ color: C.navyLight }}>
              Choose a persona to explore the platform with realistic private-market data.
              No account required.
            </p>
          </div>

          {/* Persona tiles */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PERSONA_CARDS.map((card, i) => {
              const Icon = ICON_MAP[card.icon] ?? Landmark;
              const isSelected = selected === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setSelected(card.id)}
                  className={`group relative rounded-xl border-2 p-6 text-left transition-all duration-200 animate-fade-in ${
                    i === 0 ? 'stagger-1' : i === 1 ? 'stagger-2' : i === 2 ? 'stagger-3' : 'stagger-4'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${C.blue}08` : C.white,
                    borderColor: isSelected ? C.blue : C.border,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {isSelected && (
                    <div
                      className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: C.blue }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${C.gold}15`, color: C.gold }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.navy }}>
                        {card.role}
                      </p>
                      <p className="text-xs" style={{ color: `${C.navyLight}99` }}>
                        {card.name} — {card.company}
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 text-sm leading-relaxed" style={{ color: C.navyLight }}>
                    {card.headline}
                  </p>
                  <p className="mb-4 text-xs font-medium" style={{ color: C.gold }}>
                    {card.id === 'originator' && 'See how originators protect relationships worth millions.'}
                    {card.id === 'investor' && 'See how investors discover qualified deal flow automatically.'}
                    {card.id === 'principal' && 'See how principals connect with ready capital.'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {card.stats.map((s) => (
                      <span
                        key={s}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${C.navy}0A`,
                          color: C.navy,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Name input + CTA */}
          {selected && (
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <input
                type="text"
                placeholder="What should we call you? (optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full max-w-xs rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563EB]"
                style={{ borderColor: C.border, color: C.navy }}
              />
              <button
                onClick={() => onStart(selected, userName)}
                className="btn-gold flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-bold text-white"
              >
                Start Demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
