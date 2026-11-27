import React, { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface EverydayObject {
  id: string;
  name: string;
  category: string;
  description: string;
  renderIllustration: () => React.ReactNode;
}

const OBJECTS_CATALOG: EverydayObject[] = [
  {
    id: 'camera',
    name: 'Camera',
    category: 'Photography & Optics',
    description:
      'A compact mirrorless optical camera engineered with a precision multi-coated glass lens to capture crisp stills and motion in varying light.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="camGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <rect x="30" y="54" width="160" height="96" rx="16" fill="#0E1726" stroke="url(#camGrad)" strokeWidth="2.5" />
        <path d="M72 54 L84 36 H136 L148 54" fill="#131E33" stroke="#00F0FF" strokeWidth="2" />
        <rect x="46" y="42" width="18" height="10" rx="3" fill="#9B5CFF" />
        <circle cx="110" cy="102" r="34" fill="#070B12" stroke="url(#camGrad)" strokeWidth="3" />
        <circle cx="110" cy="102" r="23" fill="#111C2E" stroke="#00F0FF" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="110" cy="102" r="12" fill="#00F0FF" fillOpacity="0.22" />
        <circle cx="103" cy="95" r="4" fill="#FFFFFF" fillOpacity="0.7" />
        <circle cx="164" cy="72" r="5" fill="#10B981" />
      </svg>
    ),
  },
  {
    id: 'book',
    name: 'Book',
    category: 'Literature & Study',
    description:
      'A stitched hardcover reference volume filled with crisp acid-free pages for structured reading, technical notes, and quiet study.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <path d="M35 44 C70 36, 98 44, 110 54 C122 44, 150 36, 185 44 V142 C150 134, 122 142, 110 150 C98 142, 70 134, 35 142 Z" fill="#0E1726" stroke="url(#bookGrad)" strokeWidth="2.5" />
        <line x1="110" y1="54" x2="110" y2="150" stroke="#00F0FF" strokeWidth="2" />
        <path d="M50 66 Q78 60 98 68 M50 84 Q78 78 98 86 M50 102 Q78 96 98 104 M50 120 Q78 114 98 122" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M122 68 Q142 60 170 66 M122 86 Q142 78 170 84 M122 104 Q142 96 170 102 M122 122 Q142 114 170 120" stroke="#9B5CFF" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M152 40 V74 L160 66 L168 74 V41" fill="#00F0FF" fillOpacity="0.8" />
      </svg>
    ),
  },
  {
    id: 'headphones',
    name: 'Headphones',
    category: 'Audio & Tech',
    description:
      'Over-ear acoustic wireless headphones featuring memory-foam cushions and active noise isolation for focused listening.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="hpGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <path d="M52 102 C52 54, 168 54, 168 102" fill="none" stroke="url(#hpGrad)" strokeWidth="7" strokeLinecap="round" />
        <path d="M62 96 C62 62, 158 62, 158 96" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
        <rect x="38" y="92" width="26" height="52" rx="12" fill="#0E1726" stroke="#00F0FF" strokeWidth="2.5" />
        <rect x="64" y="98" width="8" height="40" rx="4" fill="#9B5CFF" />
        <rect x="156" y="92" width="26" height="52" rx="12" fill="#0E1726" stroke="#9B5CFF" strokeWidth="2.5" />
        <rect x="148" y="98" width="8" height="40" rx="4" fill="#00F0FF" />
        <path d="M96 118 Q110 106 124 118 M102 128 Q110 120 118 128" fill="none" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'laptop',
    name: 'Laptop',
    category: 'Computing',
    description:
      'An aluminum ultraportable workstation built with a high-contrast display, backlit keys, and all-day battery endurance.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="lapGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <rect x="44" y="34" width="132" height="84" rx="8" fill="#0E1726" stroke="url(#lapGrad)" strokeWidth="2.5" />
        <rect x="52" y="42" width="116" height="68" rx="4" fill="#070B12" />
        <rect x="62" y="54" width="44" height="8" rx="2" fill="#00F0FF" fillOpacity="0.6" />
        <rect x="62" y="70" width="76" height="5" rx="2" fill="#9B5CFF" fillOpacity="0.6" />
        <rect x="62" y="82" width="58" height="5" rx="2" fill="#334155" />
        <path d="M26 122 H194 L204 142 H16 Z" fill="#131E33" stroke="#00F0FF" strokeWidth="2" />
        <rect x="92" y="130" width="36" height="6" rx="2" fill="#00F0FF" fillOpacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'water-bottle',
    name: 'Water Bottle',
    category: 'Hydration & Gear',
    description:
      'A double-wall vacuum-insulated stainless steel flask designed to keep beverages chilled or hot throughout daily commutes.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="wbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <rect x="92" y="24" width="36" height="16" rx="4" fill="#9B5CFF" />
        <path d="M98 40 H122 L134 60 V146 C134 152, 128 156, 122 156 H98 C92 156, 86 152, 86 146 V60 Z" fill="#0E1726" stroke="url(#wbGrad)" strokeWidth="2.5" />
        <rect x="94" y="88" width="32" height="44" rx="4" fill="#00F0FF" fillOpacity="0.16" stroke="#00F0FF" strokeWidth="1.2" />
        <path d="M110 98 C104 106, 102 114, 110 119 C118 114, 116 106, 110 98 Z" fill="#00F0FF" />
      </svg>
    ),
  },
  {
    id: 'backpack',
    name: 'Backpack',
    category: 'Carry & Travel',
    description:
      'A weather-resistant everyday commuter backpack with padded compartments for electronics, notebooks, and travel essentials.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="bpGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <path d="M92 40 C92 26, 128 26, 128 40" fill="none" stroke="#00F0FF" strokeWidth="3.5" />
        <rect x="64" y="40" width="92" height="114" rx="26" fill="#0E1726" stroke="url(#bpGrad)" strokeWidth="2.5" />
        <rect x="76" y="92" width="68" height="46" rx="12" fill="#131E33" stroke="#9B5CFF" strokeWidth="2" />
        <line x1="82" y1="108" x2="138" y2="108" stroke="#00F0FF" strokeWidth="2" />
        <rect x="104" y="104" width="12" height="8" rx="2" fill="#00F0FF" />
        <path d="M74 68 H146" stroke="#334155" strokeWidth="2" strokeDasharray="5 4" />
      </svg>
    ),
  },
  {
    id: 'watch',
    name: 'Watch',
    category: 'Timepiece & Accessories',
    description:
      'A precision analog-digital hybrid wristwatch housed in brushed titanium with sapphire glass and a luminous dial.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="wtGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <rect x="92" y="18" width="36" height="36" rx="5" fill="#131E33" stroke="#9B5CFF" strokeWidth="2" />
        <rect x="92" y="126" width="36" height="36" rx="5" fill="#131E33" stroke="#9B5CFF" strokeWidth="2" />
        <circle cx="110" cy="90" r="42" fill="#0E1726" stroke="url(#wtGrad)" strokeWidth="3" />
        <circle cx="110" cy="90" r="33" fill="#070B12" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="110" y1="90" x2="110" y2="66" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
        <line x1="110" y1="90" x2="130" y2="98" stroke="#9B5CFF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="110" cy="90" r="4" fill="#FFFFFF" />
        <rect x="152" y="84" width="6" height="12" rx="2" fill="#00F0FF" />
      </svg>
    ),
  },
  {
    id: 'umbrella',
    name: 'Umbrella',
    category: 'Weather & Utility',
    description:
      'A wind-vented folding canopy umbrella with reinforced fiberglass ribs and a water-repellent quick-dry fabric shell.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="umGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <path d="M40 88 C52 38, 168 38, 180 88 Q162 78, 145 88 Q128 78, 110 88 Q92 78, 75 88 Q58 78, 40 88 Z" fill="#0E1726" stroke="url(#umGrad)" strokeWidth="2.5" />
        <path d="M110 42 C96 58, 92 72, 92 84 M110 42 C124 58, 128 72, 128 84" fill="none" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="110" y1="30" x2="110" y2="136" stroke="#9B5CFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M110 136 C110 152, 130 152, 130 136" fill="none" stroke="#00F0FF" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    category: 'Peripherals',
    description:
      'A compact 75% mechanical keyboard with tactile hot-swappable switches, PBT keycaps, and customizable underglow.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="kbGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <rect x="24" y="56" width="172" height="72" rx="10" fill="#0E1726" stroke="url(#kbGrad)" strokeWidth="2.5" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
          <rect key={`r1-${c}`} x={34 + c * 19} y="66" width="15" height="13" rx="3" fill="#131E33" stroke="#334155" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
          <rect key={`r2-${c}`} x={34 + c * 19} y="84" width="15" height="13" rx="3" fill="#131E33" stroke="#00F0FF" strokeOpacity="0.45" />
        ))}
        <rect x="34" y="103" width="24" height="13" rx="3" fill="#9B5CFF" fillOpacity="0.4" />
        <rect x="64" y="103" width="84" height="13" rx="3" fill="#00F0FF" fillOpacity="0.3" stroke="#00F0FF" />
        <rect x="154" y="103" width="32" height="13" rx="3" fill="#131E33" stroke="#334155" />
      </svg>
    ),
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    category: 'Mobility & Transport',
    description:
      'A lightweight urban commuter bicycle crafted with a hydroformed alloy frame and puncture-resistant touring tires.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="bkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <circle cx="58" cy="116" r="28" fill="none" stroke="#00F0FF" strokeWidth="3" />
        <circle cx="58" cy="116" r="6" fill="#9B5CFF" />
        <circle cx="162" cy="116" r="28" fill="none" stroke="#9B5CFF" strokeWidth="3" />
        <circle cx="162" cy="116" r="6" fill="#00F0FF" />
        <path d="M58 116 L96 76 H140 L106 116 Z M140 76 L162 116 M96 76 L88 60 H76 M140 76 L146 60 H158" fill="none" stroke="url(#bkGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'coffee-mug',
    name: 'Coffee Mug',
    category: 'Kitchen & Desk',
    description:
      'A matte ceramic studio mug with a thick heat-retaining rim and ergonomic handle suited for morning espresso or tea.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="mgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <path d="M88 46 Q94 34 88 24 M110 44 Q116 32 110 20 M132 46 Q138 34 132 24" fill="none" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
        <path d="M68 62 H146 V126 C146 142, 134 150, 118 150 H96 C80 150, 68 142, 68 126 Z" fill="#0E1726" stroke="url(#mgGrad)" strokeWidth="2.5" />
        <path d="M146 76 H162 C172 76, 176 88, 176 98 C176 108, 172 120, 162 120 H146" fill="none" stroke="#9B5CFF" strokeWidth="3" />
        <ellipse cx="107" cy="62" rx="39" ry="7" fill="#131E33" stroke="#00F0FF" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'desk-lamp',
    name: 'Desk Lamp',
    category: 'Lighting & Workspace',
    description:
      'An articulated architectural LED task lamp offering flicker-free illumination and adjustable color temperature for reading desks.',
    renderIllustration: () => (
      <svg viewBox="0 0 220 180" className="h-44 w-56" aria-hidden="true">
        <defs>
          <linearGradient id="dlGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#9B5CFF" />
          </linearGradient>
        </defs>
        <ellipse cx="92" cy="146" rx="34" ry="8" fill="#131E33" stroke="#9B5CFF" strokeWidth="2.5" />
        <path d="M84 142 L66 94 L118 52" fill="none" stroke="url(#dlGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="66" cy="94" r="6" fill="#00F0FF" />
        <path d="M112 46 L154 66 L136 86 L104 60 Z" fill="#0E1726" stroke="#00F0FF" strokeWidth="2.5" />
        <path d="M138 84 L122 124 L172 124 L152 68" fill="#00F0FF" fillOpacity="0.14" />
      </svg>
    ),
  },
];

export function RandomObjectView() {
  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    Math.floor(Math.random() * OBJECTS_CATALOG.length)
  );
  const [generationCount, setGenerationCount] = useState(1);

  const currentObject = OBJECTS_CATALOG[currentIndex];

  function handleGenerateAnother() {
    if (OBJECTS_CATALOG.length <= 1) return;
    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * OBJECTS_CATALOG.length);
    }
    setCurrentIndex(nextIndex);
    setGenerationCount((c) => c + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Random Object
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Explore everyday objects with custom vector illustrations and instant non-repeating selection.
          </p>
        </div>
        <div className="font-mono text-xs tabular-nums text-slate-400">
          Catalog Size: <span className="text-cyan-300">{OBJECTS_CATALOG.length}</span> · Rolls:{' '}
          <span className="text-purple-300">{generationCount}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="glass-panel overflow-hidden rounded-2xl border border-cyan-500/25 p-6 sm:p-8">
          {/* Illustration Stage */}
          <div className="relative mb-6 flex min-h-[220px] items-center justify-center rounded-xl border border-cyan-500/15 bg-[#070B12]/90 p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1),transparent_68%)]" />
            <div key={currentObject.id} className="relative z-10 flex items-center justify-center transition-transform duration-300">
              {currentObject.renderIllustration()}
            </div>
          </div>

          {/* Object Details */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  {currentObject.category}
                </span>
              </div>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                #{String(currentIndex + 1).padStart(2, '0')} / {OBJECTS_CATALOG.length}
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {currentObject.name}
            </h3>

            <p className="text-sm leading-relaxed text-slate-300">
              {currentObject.description}
            </p>
          </div>

          {/* Action Footer */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-5">
            <span className="text-xs text-slate-400">
              Guaranteed non-repeating selection on every click
            </span>
            <button
              type="button"
              onClick={handleGenerateAnother}
              className="btn-neon inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Generate Another</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
