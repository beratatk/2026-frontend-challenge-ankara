import { useMemo, useState } from 'react';
import { useInvestigation } from '@/hooks/useInvestigation';
import { applyFilters, emptyFilters, type Filters } from '@/lib/filter';
import { Header } from '@/components/Header';
import { SummaryStrip } from '@/components/SummaryStrip';
import { LeftRail } from '@/components/LeftRail';
import { Feed } from '@/components/Feed';
import { DetailPane } from '@/components/DetailPane';

type Selection =
  | { kind: 'person'; key: string }
  | { kind: 'record'; id: string }
  | null;

export default function App() {
  const {
    records,
    people,
    events,
    profiles,
    subject,
    podoTimeline,
    isLoading,
    isFetching,
    error,
  } = useInvestigation();

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selection, setSelection] = useState<Selection>(null);

  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);

  const onSelectPerson = (key: string) => {
    setSelection({ kind: 'person', key });
    setFilters((f) => ({ ...f, personKey: key }));
  };
  const onSelectRecord = (id: string) => setSelection({ kind: 'record', id });
  const onClearSelection = () => setSelection(null);

  const selectedRecordId = selection?.kind === 'record' ? selection.id : null;
  const selectedPersonKey = selection?.kind === 'person' ? selection.key : null;
  const activePersonKey = filters.personKey ?? selectedPersonKey;

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Loading investigation data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <div className="max-w-md rounded-lg border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200">
          <p className="font-semibold">Failed to load data</p>
          <p className="text-sm mt-1 text-rose-300/80">{error.message}</p>
          <p className="text-xs mt-3 text-rose-200/60">
            Check your <code>.env.local</code> API keys and form IDs, then refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        recordCount={records.length}
        peopleCount={people.size}
        eventCount={events.length}
        isFetching={isFetching}
      />
      <SummaryStrip
        subject={subject}
        podoTimeline={podoTimeline}
        profiles={profiles}
        onSelectPerson={onSelectPerson}
      />
      <main className="flex-1 min-h-0 grid grid-cols-[260px_minmax(0,1fr)_440px] gap-4 px-6 py-4">
        <LeftRail
          people={people}
          profiles={profiles}
          filters={filters}
          setFilters={setFilters}
          onSelectPerson={onSelectPerson}
          selectedPersonKey={activePersonKey}
        />
        <Feed
          records={filtered}
          filters={filters}
          setFilters={setFilters}
          people={people}
          selectedRecordId={selectedRecordId}
          activePersonKey={activePersonKey}
          onSelectRecord={onSelectRecord}
          onSelectPerson={onSelectPerson}
        />
        <DetailPane
          selection={selection}
          records={records}
          people={people}
          events={events}
          profiles={profiles}
          subject={subject}
          podoTimeline={podoTimeline}
          onClear={onClearSelection}
          onSelectPerson={onSelectPerson}
          onSelectRecord={onSelectRecord}
        />
      </main>
    </div>
  );
}
