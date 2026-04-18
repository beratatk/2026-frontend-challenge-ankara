import { useEffect, useMemo, useRef } from 'react';
import type { Person, PersonInvestigationProfile } from '@/lib/linking';
import { SUBJECT_KEY } from '@/lib/linking';
import type { InvestigationRecord, RecordSource } from '@/types/records';
import type { Filters } from '@/lib/filter';
import { toggleSource, uniqueLocations } from '@/lib/filter';
import { SOURCE_LABEL, SignalPill, SourceBadge } from '@/components/atoms';

const SOURCES: RecordSource[] = ['checkin', 'message', 'sighting', 'note', 'tip'];

type Props = {
  records: InvestigationRecord[];
  people: Map<string, Person>;
  profiles: PersonInvestigationProfile[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  onSelectPerson: (key: string) => void;
  selectedPersonKey: string | null;
};

export function LeftRail({
  records,
  people,
  profiles,
  filters,
  setFilters,
  onSelectPerson,
  selectedPersonKey,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search with "/" from anywhere outside an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const locationOptions = useMemo(() => uniqueLocations(records), [records]);

  const scoreByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of profiles) m.set(p.person.key, p.signalScore);
    return m;
  }, [profiles]);

  const ranked = useMemo(() => {
    const arr = [...people.values()];
    arr.sort((a, b) => {
      if (a.key === SUBJECT_KEY) return -1;
      if (b.key === SUBJECT_KEY) return 1;
      const sa = scoreByKey.get(a.key) ?? 0;
      const sb = scoreByKey.get(b.key) ?? 0;
      if (sb !== sa) return sb - sa;
      return b.recordCount - a.recordCount;
    });
    return arr;
  }, [people, scoreByKey]);

  // Narrow people list by search query (subject always visible).
  const visible = useMemo(() => {
    const q = filters.query.toLowerCase().trim();
    if (!q) return ranked;
    return ranked.filter(
      (p) =>
        p.key === SUBJECT_KEY ||
        p.displayName.toLowerCase().includes(q) ||
        p.key.includes(q),
    );
  }, [ranked, filters.query]);

  return (
    <aside className="flex flex-col gap-3 min-h-0">
      {/* Search */}
      <div className="relative">
        <input
          ref={inputRef}
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search people, locations, content…"
          className="w-full bg-slate-900/70 border border-slate-800 rounded-md px-3 py-2 pr-14 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => setFilters({ ...filters, query: '' })}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 flex items-center justify-center text-xs"
          >
            ×
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-700 rounded">
            /
          </kbd>
        )}
      </div>

      {/* Sources */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">
          Sources
        </p>
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

      {/* Location */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">
          Location
        </p>
        <select
          value={filters.location ?? ''}
          onChange={(e) =>
            setFilters({ ...filters, location: e.target.value || null })
          }
          className="w-full bg-slate-900/70 border border-slate-800 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-amber-400/60"
        >
          <option value="">All locations ({locationOptions.length})</option>
          {locationOptions.map((l) => (
            <option key={l.name} value={l.name}>
              {l.name} ({l.count})
            </option>
          ))}
        </select>
      </div>

      {/* People */}
      <div className="flex-1 min-h-0 flex flex-col">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">
          People{' '}
          <span className="text-slate-500 normal-case tabular-nums">
            ({visible.length}/{people.size})
          </span>
        </p>
        <ul className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
          {visible.length === 0 && (
            <li className="text-xs text-slate-500 italic px-2 py-2">
              No one matches "{filters.query}".
            </li>
          )}
          {visible.map((p) => {
            const isSubject = p.key === SUBJECT_KEY;
            const isSelected = selectedPersonKey === p.key;
            const score = scoreByKey.get(p.key) ?? 0;
            return (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => onSelectPerson(p.key)}
                  className={`w-full min-w-0 text-left rounded-md px-2 py-1.5 border transition-colors ${
                    isSelected
                      ? 'border-amber-400/60 bg-amber-400/10'
                      : 'border-transparent hover:bg-slate-900/70 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-medium truncate ${isSubject ? 'text-amber-300' : ''}`}
                      >
                        {p.displayName}
                      </span>
                      {isSubject && (
                        <span className="text-[9px] uppercase tracking-wider text-amber-300/80 flex-shrink-0">
                          subject
                        </span>
                      )}
                    </span>
                    {score > 0 && <SignalPill weight={score} />}
                  </div>
                  <div className="mt-0.5 flex items-center flex-wrap gap-x-1 gap-y-0.5 text-[10px] text-slate-500 min-w-0">
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
