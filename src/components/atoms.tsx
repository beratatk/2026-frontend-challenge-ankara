import type { RecordSource } from '@/types/records';

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
}: {
  name: string;
  active?: boolean;
  onClick?: () => void;
  role?: string;
}) {
  const cls = active
    ? 'bg-amber-400 text-slate-900 ring-amber-400'
    : 'bg-slate-800/70 text-slate-100 ring-slate-700 hover:bg-slate-700/80 hover:ring-slate-600';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 ring-inset transition-colors ${cls}`}
    >
      <span className="font-medium">{name}</span>
      {role && <span className="text-[10px] opacity-70">· {role}</span>}
    </button>
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
