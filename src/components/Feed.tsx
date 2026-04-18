import { useMemo } from 'react';
import type { InvestigationRecord, RecordSource } from '@/types/records';
import type { Person } from '@/lib/linking';
import type { Filters } from '@/lib/filter';
import { activeFilterCount, emptyFilters, toggleSource } from '@/lib/filter';
import { RecordCard } from '@/components/RecordCard';
import { SOURCE_LABEL } from '@/components/atoms';

type Props = {
  records: InvestigationRecord[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  people: Map<string, Person>;
  selectedRecordId: string | null;
  activePersonKey: string | null;
  onSelectRecord: (id: string) => void;
  onSelectPerson: (key: string) => void;
  onSelectLocation: (loc: string) => void;
};

export function Feed({
  records,
  filters,
  setFilters,
  people,
  selectedRecordId,
  activePersonKey,
  onSelectRecord,
  onSelectPerson,
  onSelectLocation,
}: Props) {
  // Newest first for investigation flow
  const sorted = useMemo(
    () =>
      [...records].sort((a, b) => {
        const ta = a.timestamp?.getTime() ?? a.createdAt.getTime();
        const tb = b.timestamp?.getTime() ?? b.createdAt.getTime();
        return tb - ta;
      }),
    [records],
  );

  const activeCount = activeFilterCount(filters);
  const activePersonName = filters.personKey ? people.get(filters.personKey)?.displayName : null;

  return (
    <section className="flex-1 min-h-0 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">
          <span className="tabular-nums">{sorted.length}</span>{' '}
          <span className="text-slate-400 font-normal">
            record{sorted.length === 1 ? '' : 's'}
          </span>
        </h2>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => setFilters(emptyFilters())}
            className="ml-auto text-xs text-slate-400 hover:text-amber-300 underline-offset-2 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {filters.query && (
            <Chip onRemove={() => setFilters({ ...filters, query: '' })}>
              search: <span className="font-medium">"{filters.query}"</span>
            </Chip>
          )}
          {[...filters.sources].map((s) => (
            <Chip key={s} onRemove={() => setFilters(toggleSource(filters, s))}>
              source: {SOURCE_LABEL[s as RecordSource]}
            </Chip>
          ))}
          {activePersonName && (
            <Chip onRemove={() => setFilters({ ...filters, personKey: null })}>
              person: <span className="font-medium">{activePersonName}</span>
            </Chip>
          )}
          {filters.location && (
            <Chip onRemove={() => setFilters({ ...filters, location: null })}>
              location: <span className="font-medium">{filters.location}</span>
            </Chip>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
        {sorted.length === 0 ? (
          <EmptyState hasFilters={activeCount > 0} onClear={() => setFilters(emptyFilters())} />
        ) : (
          sorted.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              selected={selectedRecordId === r.id}
              activePersonKey={activePersonKey}
              activeLocation={filters.location}
              onSelect={onSelectRecord}
              onSelectPerson={onSelectPerson}
              onSelectLocation={onSelectLocation}
            />
          ))
        )}
      </div>
    </section>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700 px-2 py-0.5 text-slate-200">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-slate-400 hover:text-rose-300"
        aria-label="Remove filter"
      >
        ×
      </button>
    </span>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center">
      <p className="text-sm text-slate-300">
        {hasFilters ? 'No records match the current filters.' : 'No records in the data set.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 text-xs text-amber-300 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
