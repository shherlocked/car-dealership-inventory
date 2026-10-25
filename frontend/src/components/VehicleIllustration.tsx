import type { JSX } from 'react';

interface VehicleIllustrationProps {
  category: string;
  /** Make initials shown subtly behind the illustration. */
  initials: string;
}

/**
 * Inline-SVG vehicle illustration chosen by category. A generic car is used
 * for unknown categories, and the make initials are rendered behind the
 * silhouette as a subtle watermark.
 */
export default function VehicleIllustration({ category, initials }: VehicleIllustrationProps) {
  const normalized = category.trim().toLowerCase();
  const Body = pickBody(normalized);

  return (
    <svg
      viewBox="0 0 240 120"
      className="h-full w-full"
      role="img"
      aria-label={`${category} illustration`}
    >
      <text
        x="120"
        y="72"
        textAnchor="middle"
        className="fill-white/15 font-display"
        fontSize="44"
        fontWeight="700"
      >
        {initials}
      </text>
      <g transform="translate(20 24)">
        <Body />
      </g>
    </svg>
  );
}

type BodyProps = Record<string, never>;

function pickBody(category: string): (props: BodyProps) => JSX.Element {
  if (category.includes('suv')) return SuvBody;
  if (category.includes('hatch')) return HatchbackBody;
  if (category.includes('truck')) return TruckBody;
  if (category.includes('coupe')) return CoupeBody;
  if (category.includes('electric') || category.includes('ev')) return ElectricBody;
  if (category.includes('sedan')) return SedanBody;
  return GenericBody;
}

/** Shared gradient for the silhouette fill. */
function Gradient() {
  return (
    <linearGradient id="vehicle-body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
    </linearGradient>
  );
}

function Wheels() {
  return (
    <g fill="#0B1020" opacity="0.9">
      <circle cx="54" cy="76" r="15" />
      <circle cx="146" cy="76" r="15" />
    </g>
  );
}

function SedanBody() {
  return (
    <g>
      <Gradient />
      <path
        d="M20 78c0-4 2-7 5-9l18-8 16-6 18-3 26 1 20 5 16 8 10 9 4 6a9 9 0 0 1 0 7l-1 3a8 8 0 0 1-8 6H28a8 8 0 0 1-8-8v-11z"
        fill="url(#vehicle-body)"
      />
      <Wheels />
    </g>
  );
}

function SuvBody() {
  return (
    <g>
      <Gradient />
      <path
        d="M16 80c0-3 1-6 3-8l14-9 20-7 22-3 20 1 18 5 16 9 10 10 3 6a8 8 0 0 1 0 6l-2 5a8 8 0 0 1-8 6H24a8 8 0 0 1-8-8v-13z"
        fill="url(#vehicle-body)"
      />
      <rect x="70" y="26" width="60" height="30" rx="4" fill="#0B1020" opacity="0.45" />
      <Wheels />
    </g>
  );
}

function HatchbackBody() {
  return (
    <g>
      <Gradient />
      <path
        d="M18 80c0-4 1-7 4-9l16-8 20-5 20-1 22 2 18 6 15 9 7 8 1 4a9 9 0 0 1-1 6l-2 4a8 8 0 0 1-8 6H26a8 8 0 0 1-8-8v-14z"
        fill="url(#vehicle-body)"
      />
      <path d="M110 62l24 14" stroke="#0B1020" strokeOpacity="0.4" strokeWidth="3" />
      <Wheels />
    </g>
  );
}

function TruckBody() {
  return (
    <g>
      <Gradient />
      <path d="M14 80c0-3 1-6 3-8l14-8 20-6 22-2 20 2 16 6 14 9 6 8v10a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8v-11z" fill="url(#vehicle-body)" />
      <rect x="126" y="30" width="52" height="38" rx="3" fill="url(#vehicle-body)" opacity="0.8" />
      <Wheels />
    </g>
  );
}

function CoupeBody() {
  return (
    <g>
      <Gradient />
      <path
        d="M22 80c0-4 1-7 4-9l20-8 22-4 24 1 20 6 16 9 8 9 1 5a8 8 0 0 1-2 6l-3 4a8 8 0 0 1-8 6H30a8 8 0 0 1-8-8v-17z"
        fill="url(#vehicle-body)"
      />
      <path d="M96 40c10-8 22-10 34-6" stroke="#0B1020" strokeOpacity="0.4" strokeWidth="3" />
      <Wheels />
    </g>
  );
}

function ElectricBody() {
  return (
    <g>
      <Gradient />
      <path
        d="M20 78c0-4 2-7 5-9l18-8 16-6 18-3 26 1 20 5 16 8 10 9 4 6a9 9 0 0 1 0 7l-1 3a8 8 0 0 1-8 6H28a8 8 0 0 1-8-8v-11z"
        fill="url(#vehicle-body)"
      />
      <path d="M120 44l-8 14h10l-8 14" fill="none" stroke="#0B1020" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <Wheels />
    </g>
  );
}

function GenericBody() {
  return (
    <g>
      <Gradient />
      <path
        d="M20 80c0-4 2-7 5-9l17-8 18-5 20-2 22 2 18 6 15 9 8 9 3 6a9 9 0 0 1 0 7l-2 4a8 8 0 0 1-8 6H28a8 8 0 0 1-8-8v-17z"
        fill="url(#vehicle-body)"
      />
      <Wheels />
    </g>
  );
}
