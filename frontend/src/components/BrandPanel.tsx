import Logo from './Logo';

/**
 * Left-hand brand panel for the auth split layout. Hidden on small screens,
 * it presents a headline, value proposition and a decorative gradient with a
 * car silhouette.
 */
export default function BrandPanel() {
  return (
    <section
      className="relative hidden overflow-hidden border-r border-line bg-canvas-50 lg:flex lg:flex-col lg:justify-between lg:p-12"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-accent-700/20 blur-3xl" />

      <div className="relative">
        <Logo />
      </div>

      <div className="relative max-w-md">
        <h2 className="font-display text-3xl font-semibold leading-tight text-white">
          Your inventory, under the lights.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-300">
          Browse, filter and manage every vehicle in one polished showroom — real-time stock,
          clear pricing and controls that stay out of the way.
        </p>
      </div>

      <div className="relative mt-10">
        <div className="rounded-xl2 border border-line bg-gradient-to-br from-surface to-canvas p-8 shadow-card">
          <CarSilhouette />
        </div>
      </div>
    </section>
  );
}

/** Inline-SVG sports car silhouette with an amber gradient. */
function CarSilhouette() {
  return (
    <svg viewBox="0 0 320 120" className="h-auto w-full" role="presentation">
      <defs>
        <linearGradient id="brand-car-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <g fill="url(#brand-car-grad)">
        <path d="M28 82c0-4 2-7 5-9l14-8 22-10 20-6 18-3 16 2 15 6 13 9 12 12 6 9a9 9 0 0 1 1 3v8a10 10 0 0 1-10 10H37a10 10 0 0 1-9-7l-4-10a8 8 0 0 1 0-3z" />
        <path
          d="M46 88h228a6 6 0 0 1 6 6v2a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6v-2a6 6 0 0 1 6-6z"
          opacity="0.55"
        />
      </g>
      <g fill="#0B1020">
        <circle cx="84" cy="86" r="17" />
        <circle cx="238" cy="86" r="17" />
      </g>
      <g fill="url(#brand-car-grad)">
        <circle cx="84" cy="86" r="7" />
        <circle cx="238" cy="86" r="7" />
      </g>
    </svg>
  );
}
