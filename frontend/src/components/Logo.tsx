import { Car } from 'lucide-react';

interface LogoProps {
  compact?: boolean;
}

/**
 * Brand mark plus wordmark. The mark is a rounded gradient tile with a car
 * icon; the wordmark uses the display font.
 */
export default function Logo({ compact = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-accent text-canvas shadow-glow"
        aria-hidden="true"
      >
        <Car className="h-5 w-5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          Showroom
        </span>
      )}
    </span>
  );
}
