import type { RecordSource } from '@/types/records';
import { SUBJECT_KEY } from '@/lib/linking';
import podoAvatar from '@/assets/podo.png';

export const SOURCE_LABEL: Record<RecordSource, string> = {
  checkin: 'Checkin',
  message: 'Message',
  sighting: 'Sighting',
  note: 'Note',
  tip: 'Tip',
};

export const SOURCE_COLORS: Record<RecordSource, string> = {
  checkin: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  message: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  sighting: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  note: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  tip: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
};

export function SourceBadge({ source, className = '' }: { source: RecordSource; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ring-1 ring-inset ${SOURCE_COLORS[source]} ${className}`}
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function PersonChip({
  name,
  active,
  onClick,
  role,
  seed,
}: {
  name: string;
  active?: boolean;
  onClick?: () => void;
  role?: string;
  /** Stable hash input (usually the person key) so avatar color survives rename. Falls back to name. */
  seed?: string;
}) {
  const cls = active
    ? 'bg-amber-400 text-slate-900 ring-amber-400'
    : 'bg-slate-800/70 text-slate-100 ring-slate-700 hover:bg-slate-700/80 hover:ring-slate-600';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full text-xs ring-1 ring-inset transition-colors ${cls}`}
    >
      <Avatar name={name} seed={seed ?? name} size="xs" dimmed={active} />
      <span className="font-medium">{name}</span>
      {role && <span className="text-[10px] opacity-70">· {role}</span>}
    </button>
  );
}

// ------------------------------ Avatar ------------------------------

const AVATAR_PALETTE = [
  'bg-indigo-800/80 text-indigo-100',
  'bg-teal-800/80 text-teal-100',
  'bg-fuchsia-800/80 text-fuchsia-100',
  'bg-sky-800/80 text-sky-100',
  'bg-emerald-800/80 text-emerald-100',
  'bg-cyan-800/80 text-cyan-100',
  'bg-violet-800/80 text-violet-100',
  'bg-pink-800/80 text-pink-100',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function avatarColor(seed: string): string {
  return AVATAR_PALETTE[hashString(seed) % AVATAR_PALETTE.length];
}

export function avatarInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  // Keep only tokens starting with a letter so "Melis · 3" → "M" (not "M3").
  const parts = trimmed.split(/\s+/).filter((p) => /^[\p{L}]/u.test(p));
  if (parts.length === 0) return trimmed[0];
  if (parts.length >= 2) {
    return (parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '');
  }
  return parts[0][0];
}

type AvatarSize = 'xs' | 'sm' | 'md';

export function Avatar({
  name,
  seed,
  size = 'sm',
  dimmed = false,
  className = '',
}: {
  name: string;
  seed?: string;
  size?: AvatarSize;
  /** Use when the parent already signals "selected" loudly (e.g. amber PersonChip). Falls back to neutral tile. */
  dimmed?: boolean;
  className?: string;
}) {
  const dim =
    size === 'xs'
      ? 'w-4 h-4 text-[8px]'
      : size === 'sm'
      ? 'w-5 h-5 text-[9px]'
      : 'w-8 h-8 text-xs';
  if ((seed ?? name) === SUBJECT_KEY) {
    return (
      <img
        src={podoAvatar}
        alt=""
        aria-hidden
        className={`${dim} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }
  const palette = dimmed
    ? 'bg-slate-900/60 text-slate-900'
    : avatarColor(seed ?? name);
  const initials = avatarInitials(name).toUpperCase();
  return (
    <span
      aria-hidden
      className={`${dim} ${palette} rounded-full inline-flex items-center justify-center font-semibold uppercase shrink-0 ${className}`}
    >
      {initials}
    </span>
  );
}

export function SignalPill({ weight }: { weight: number }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30">
      +{weight}
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const cls =
    v === 'high'
      ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30'
      : v === 'medium'
      ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
      : 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ring-1 ring-inset ${cls}`}>
      {value} confidence
    </span>
  );
}

export function UrgencyBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const cls =
    v === 'high'
      ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30'
      : v === 'medium'
      ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
      : 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ring-1 ring-inset ${cls}`}>
      urgency {value}
    </span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">
      {children}
    </h3>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900/50 ${className}`}>
      {children}
    </div>
  );
}
