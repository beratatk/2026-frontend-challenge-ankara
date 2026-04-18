import type { Person } from '@/lib/linking';
import type { InsightBundle } from '@/lib/insights';
import { SUBJECT_KEY } from '@/lib/linking';
import { SourceBadge } from '@/components/atoms';
import { fmtDateTime } from '@/lib/format';

type Props = {
  subject: Person | null;
  insights: InsightBundle;
  onSelectPerson: (key: string) => void;
  onSelectLocation: (loc: string) => void;
};

export function HeroCard({
  subject,
  insights,
  onSelectPerson,
  onSelectLocation,
}: Props) {
  if (!subject) return null;

  const { lastKnownLocation, lastSeenWith } = insights;
  const sourcesUsed = Object.values(subject.recordsBySource).filter(
    (n) => n > 0,
  ).length;
  const open = () => onSelectPerson(SUBJECT_KEY);
  const initial = (subject.displayName[0] ?? 'P').toUpperCase();

  return (
    <section className="border-b border-slate-800 bg-gradient-to-br from-rose-950/25 via-slate-900/60 to-slate-950 px-4 sm:px-6 py-4">
      <div className="flex flex-col gap-4">
        {/* Identity row */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={open}
            aria-label={`Open ${subject.displayName} full profile`}
            className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <SubjectAvatar initial={initial} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={open}
                className="text-xl sm:text-2xl font-bold tracking-tight truncate max-w-full hover:text-amber-300 transition-colors text-left"
              >
                {subject.displayName}
              </button>
              <MissingBadge />
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Case subject
              {subject.lastSeen && (
                <>
                  {' '}· last seen{' '}
                  <span className="text-slate-200 font-medium">
                    {relativeTime(subject.lastSeen)}
                  </span>
                  <span className="hidden sm:inline text-slate-500 font-mono">
                    {' '}
                    · {fmtDateTime(subject.lastSeen)}
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={open}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-colors"
          >
            <span className="hidden sm:inline">Open full profile</span>
            <span className="sm:hidden">Profile</span>
            <span aria-hidden>→</span>
          </button>
        </div>

        {/* Facts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 pt-3 border-t border-slate-800/60">
          <FactBlock label="Last location">
            {lastKnownLocation ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelectLocation(lastKnownLocation.name)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-left hover:text-amber-300 max-w-full"
                >
                  <PinIcon />
                  <span className="truncate">{lastKnownLocation.name}</span>
                </button>
                <p className="mt-0.5 text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span>{relativeTime(lastKnownLocation.at)}</span>
                  <SourceBadge source={lastKnownLocation.source} />
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </FactBlock>

          <FactBlock label="Last seen with">
            {lastSeenWith && lastSeenWith.others.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <AvatarStack
                    people={lastSeenWith.others.slice(0, 3)}
                    onSelect={onSelectPerson}
                  />
                  {lastSeenWith.others.length > 3 && (
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      +{lastSeenWith.others.length - 3}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 truncate">
                  {lastSeenWith.others.length} companion
                  {lastSeenWith.others.length === 1 ? '' : 's'} at{' '}
                  {lastSeenWith.event.location}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Alone at last event</p>
            )}
          </FactBlock>

          <FactBlock label="Evidence">
            <p className="text-sm tabular-nums">
              <span className="text-slate-100 font-semibold">
                {subject.recordCount}
              </span>{' '}
              <span className="text-slate-400">records</span>
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 tabular-nums">
              across {sourcesUsed} source{sourcesUsed === 1 ? '' : 's'}
            </p>
          </FactBlock>
        </div>
      </div>
    </section>
  );
}

// ------------------------------ subcomponents ------------------------------

function SubjectAvatar({ initial }: { initial: string }) {
  return (
    <div className="relative">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800 ring-2 ring-amber-400 flex items-center justify-center text-lg sm:text-xl font-bold text-amber-300 shadow-[0_0_0_4px_rgb(2_6_23)]">
        {initial}
      </div>
      <span
        aria-hidden
        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-pulse"
      />
    </div>
  );
}

function MissingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"
      />
      Missing
    </span>
  );
}

function FactBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
        {label}
      </p>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}

function AvatarStack({
  people,
  onSelect,
}: {
  people: { key: string; displayName: string }[];
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex -space-x-1.5">
      {people.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onSelect(p.key)}
          title={p.displayName}
          className="w-7 h-7 rounded-full bg-slate-700 ring-2 ring-slate-950 flex items-center justify-center text-[10px] font-semibold text-slate-100 hover:bg-slate-600 hover:ring-amber-400 hover:z-10 relative transition-colors"
        >
          {(p.displayName[0] ?? '?').toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      aria-hidden
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      className="shrink-0 text-slate-400"
    >
      <path
        d="M6 11s-3.5-3.5-3.5-6a3.5 3.5 0 1 1 7 0c0 2.5-3.5 6-3.5 6z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
