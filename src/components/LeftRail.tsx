import { useMemo } from 'react';
import type { Person, PersonInvestigationProfile } from '@/lib/linking';
import { SUBJECT_KEY } from '@/lib/linking';
import type { RecordSource } from '@/types/records';
import type { Filters } from '@/lib/filter';
import { toggleSource } from '@/lib/filter';
import { SOURCE_LABEL, SignalPill, SourceBadge } from '@/components/atoms';

const SOURCES: RecordSource[] = ['checkin', 'message', 'sighting', 'note', 'tip'];

type Props = {
  people: Map<string, Person>;
  profiles: PersonInvestigationProfile[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  onSelectPerson: (key: string) => void;
  selectedPersonKey: string | null;
};

export function LeftRail({
  people,
  profiles,
  filters,
  setFilters,
  onSelectPerson,
  selectedPersonKey,
}: Props) {
  const scoreByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of profiles) m.set(p.person.key, p.signalScore);
    return m;
  }, [profiles]);

  const ranked = useMemo(() => {
    const arr = [...people.values()];
    arr.sort((a, b) => {
      // subject pinned first
      if (a.key === SUBJECT_KEY) return -1;
      if (b.key === SUBJECT_KEY) return 1;
      const sa = scoreByKey.get(a.key) ?? 0;
      const sb = scoreByKey.get(b.key) ?? 0;
      if (sb !== sa) return sb - sa;
      return b.recordCount - a.recordCount;
    });
    return arr;
  }, [people, scoreByKey]);

  return (
    <aside className="flex flex-col gap-3 min-h-0">
      {/* Search */}
      <div className="relative">
        <input
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search people, locations, content…"
          className="w-full bg-slate-900/70 border border-slate-800 rounded-md px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
        />
      </div>

      {/* Source chips */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">Sources</p>
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map((s) => {
            const active = filters.sources.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilters(toggleSource(filters, s))}
                className={`rounded px-1.5 py-0.5 text-[10px] ring-1 ring-inset uppercase tracking-wide ${
                  active
                    ? 'bg-slate-200 text-slate-900 ring-slate-200'
                    : 'bg-slate-900/60 text-slate-300 ring-slate-700 hover:bg-slate-800'
                }`}
              >
                {SOURCE_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* People list */}
      <div className="flex-1 min-h-0 flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">
          People <span className="text-slate-500 normal-case">({people.size})</span>
        </p>
        <ul className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
          {ranked.map((p) => {
            const isSubject = p.key === SUBJECT_KEY;
            const isSelected = selectedPersonKey === p.key;
            const score = scoreByKey.get(p.key) ?? 0;
            return (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => onSelectPerson(p.key)}
                  className={`w-full text-left rounded-md px-2 py-1.5 border transition-colors ${
                    isSelected
                      ? 'border-amber-400/60 bg-amber-400/10'
                      : 'border-transparent hover:bg-slate-900/70 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`font-medium truncate ${isSubject ? 'text-amber-300' : ''}`}>
                        {p.displayName}
                      </span>
                      {isSubject && (
                        <span className="text-[9px] uppercase tracking-wider text-amber-300/80">
                          subject
                        </span>
                      )}
                    </span>
                    {score > 0 && <SignalPill weight={score} />}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="tabular-nums">{p.recordCount} records</span>
                    {Object.entries(p.recordsBySource)
                      .filter(([, n]) => n > 0)
                      .slice(0, 3)
                      .map(([src, n]) => (
                        <span key={src} className="flex items-center gap-0.5">
                          · <SourceBadge source={src as RecordSource} />
                          <span className="tabular-nums">{n}</span>
                        </span>
                      ))}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
