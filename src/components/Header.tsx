type Props = {
  recordCount: number;
  peopleCount: number;
  eventCount: number;
  isFetching: boolean;
};

export function Header({ recordCount, peopleCount, eventCount, isFetching }: Props) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">
          Missing Podo — Ankara Case
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-5 text-xs text-slate-400 flex-shrink-0">
        <Stat shortLabel="rec" label="records" value={recordCount} />
        <Stat shortLabel="ppl" label="people" value={peopleCount} />
        <Stat shortLabel="evt" label="events" value={eventCount} className="hidden sm:flex" />
        {isFetching && (
          <span className="inline-flex items-center gap-1 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
            <span className="hidden sm:inline">refreshing</span>
          </span>
        )}
      </div>
    </header>
  );
}

function Stat({
  label,
  shortLabel,
  value,
  className = '',
}: {
  label: string;
  shortLabel: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className="text-slate-100 font-semibold text-sm tabular-nums">{value}</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </div>
  );
}
