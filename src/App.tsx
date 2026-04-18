import { useMemo, useState } from 'react';
import { useInvestigation } from '@/hooks/useInvestigation';
import { applyFilters, emptyFilters, type Filters } from '@/lib/filter';
import { Header } from '@/components/Header';
import { SummaryStrip } from '@/components/SummaryStrip';
import { LeftRail } from '@/components/LeftRail';
import { Feed } from '@/components/Feed';
import { DetailPane } from '@/components/DetailPane';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { PartialFailureBanner } from '@/components/PartialFailureBanner';

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
    insights,
    sourceStatus,
    failedSources,
    isInitialLoading,
    isFetching,
    isRetrying,
    allFailed,
    retryFailed,
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
  const onApplyFilters = (partial: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...partial }));
  const onSelectLocation = (loc: string) =>
    setFilters((f) => ({ ...f, location: f.location === loc ? null : loc }));

  const selectedRecordId = selection?.kind === 'record' ? selection.id : null;
  const selectedPersonKey = selection?.kind === 'person' ? selection.key : null;
  const activePersonKey = filters.personKey ?? selectedPersonKey;

  if (isInitialLoading) {
    return <LoadingScreen sourceStatus={sourceStatus} />;
  }

  if (allFailed) {
    return (
      <ErrorScreen
        failedSources={failedSources}
        isRetrying={isRetrying}
        onRetry={retryFailed}
      />
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
      <PartialFailureBanner
        failedSources={failedSources}
        isRetrying={isRetrying}
        onRetry={retryFailed}
      />
      <SummaryStrip
        insights={insights}
        onSelectPerson={onSelectPerson}
        onSelectRecord={onSelectRecord}
        onSelectLocation={onSelectLocation}
        onApplyFilters={onApplyFilters}
      />
      <main className="flex-1 min-h-0 grid grid-cols-[260px_minmax(0,1fr)_440px] gap-4 px-6 py-4">
        <LeftRail
          records={records}
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
          onSelectLocation={onSelectLocation}
        />
        <DetailPane
          selection={selection}
          records={records}
          people={people}
          events={events}
          profiles={profiles}
          subject={subject}
          podoTimeline={podoTimeline}
          activeLocation={filters.location}
          onClear={onClearSelection}
          onSelectPerson={onSelectPerson}
          onSelectRecord={onSelectRecord}
          onSelectLocation={onSelectLocation}
        />
      </main>
    </div>
  );
}
