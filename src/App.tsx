import { useEffect, useMemo, useRef, useState } from 'react';
import { useInvestigation } from '@/hooks/useInvestigation';
import { applyFilters, emptyFilters, type Filters } from '@/lib/filter';
import { Header } from '@/components/Header';
import { HeroCard } from '@/components/HeroCard';
import { SummaryStrip } from '@/components/SummaryStrip';
import { LeftRail } from '@/components/LeftRail';
import { Feed } from '@/components/Feed';
import { Timeline } from '@/components/Timeline';
import { MapView } from '@/components/MapView';
import { ViewToggle, type ViewMode } from '@/components/ViewToggle';
import { DetailPane } from '@/components/DetailPane';
import { DetailDrawer } from '@/components/DetailDrawer';
import { MobileTabs, type MobileTab } from '@/components/MobileTabs';
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
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [mobileTab, setMobileTab] = useState<MobileTab>('records');
  const [panelOpen, setPanelOpen] = useState<boolean>(true);

  // Auto-collapse the insights panel whenever a data filter is applied from
  // anywhere below it (LeftRail source chips, location select, person click,
  // Feed chip removal, map filter sync, etc). Query typing does not collapse.
  const filterSignature = useMemo(() => {
    const sources = [...filters.sources].sort().join('|');
    return `${sources}::${filters.personKey ?? ''}::${filters.location ?? ''}`;
  }, [filters.sources, filters.personKey, filters.location]);
  // Compare against the initial signature (not a "first render" flag) so that
  // React StrictMode's double-invoked effect doesn't collapse on mount.
  const initialFilterSignature = useRef(filterSignature);
  useEffect(() => {
    if (filterSignature === initialFilterSignature.current) return;
    setPanelOpen(false);
  }, [filterSignature]);

  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);

  // Timeline view always centers on the subject — other filters still apply.
  const timelineRecords = useMemo(() => {
    if (!subject) return [];
    const base = records.filter((r) => r.personRefs.includes(subject.key));
    return applyFilters(base, { ...filters, personKey: null });
  }, [records, subject, filters]);

  // Map uses the same filtered set as Feed, restricted to geolocated records.
  const mapRecords = useMemo(
    () => filtered.filter((r) => r.coordinates),
    [filtered],
  );
  const mapPinCount = useMemo(() => {
    const s = new Set<string>();
    for (const r of mapRecords) if (r.location) s.add(r.location.toLowerCase());
    return s.size;
  }, [mapRecords]);

  const onSelectPerson = (key: string) => {
    setSelection({ kind: 'person', key });
    setFilters((f) => ({ ...f, personKey: key }));
    setMobileTab('detail');
  };
  const onSelectRecord = (id: string) => {
    setSelection({ kind: 'record', id });
    setMobileTab('detail');
  };
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

  const detailPaneProps = {
    selection,
    records,
    people,
    events,
    profiles,
    subject,
    podoTimeline,
    activeLocation: filters.location,
    onClear: onClearSelection,
    onSelectPerson,
    onSelectRecord,
    onSelectLocation,
  };

  return (
    <div className="h-screen flex flex-col overflow-x-hidden">
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
      <section className="relative mb-3 md:mb-4 border-b border-slate-800 bg-gradient-to-br from-rose-950/25 via-slate-900/60 to-slate-950">
        <HeroCard
          subject={subject}
          insights={insights}
          onSelectPerson={onSelectPerson}
          onSelectLocation={onSelectLocation}
          compact={!panelOpen}
        />
        <SummaryStrip
          insights={insights}
          onSelectPerson={onSelectPerson}
          onApplyFilters={onApplyFilters}
          open={panelOpen}
        />
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          aria-controls="insights-grid"
          aria-label={panelOpen ? 'Collapse subject panel' : 'Expand subject panel'}
          className="
            absolute left-1/2 -translate-x-1/2 translate-y-1/2 bottom-0 z-10
            inline-flex items-center justify-center w-7 h-7 rounded-full
            bg-slate-950 border border-slate-800 text-slate-400
            hover:text-amber-300 hover:border-slate-600
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60
            transition-colors
          "
        >
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className={`w-3 h-3 transition-transform ${panelOpen ? '' : 'rotate-180'}`}
            fill="none"
          >
            <path
              d="M3 7.5 6 4.5 9 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </section>
      <MobileTabs
        tab={mobileTab}
        onChange={setMobileTab}
        peopleCount={people.size}
        recordCount={filtered.length}
        hasSelection={selection !== null}
      />
      <main
        className="
          flex-1 min-h-0 min-w-0 flex flex-col
          md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-4 md:px-6 md:py-4
          lg:grid-cols-[260px_minmax(0,1fr)_440px]
        "
      >
        {/* LeftRail: sm tab, md+ always visible */}
        <div
          className={`min-h-0 min-w-0 px-4 pb-4 md:p-0 flex-col ${
            mobileTab === 'people' ? 'flex flex-1' : 'hidden md:flex'
          }`}
        >
          <LeftRail
            records={records}
            people={people}
            profiles={profiles}
            filters={filters}
            setFilters={setFilters}
            onSelectPerson={onSelectPerson}
            selectedPersonKey={activePersonKey}
          />
        </div>

        {/* Center column: sm tab, md+ always visible */}
        <div
          className={`min-h-0 min-w-0 px-4 pb-4 md:p-0 gap-3 flex-col ${
            mobileTab === 'records' ? 'flex flex-1' : 'hidden md:flex'
          }`}
        >
          <ViewToggle
            mode={viewMode}
            onChange={setViewMode}
            subjectName={subject?.displayName ?? null}
            feedCount={filtered.length}
            timelineCount={timelineRecords.length}
            mapCount={mapPinCount}
          />
          {viewMode === 'feed' && (
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
          )}
          {viewMode === 'timeline' && (
            <Timeline
              records={timelineRecords}
              events={events}
              subject={subject}
              selectedRecordId={selectedRecordId}
              activePersonKey={activePersonKey}
              activeLocation={filters.location}
              onSelectRecord={onSelectRecord}
              onSelectPerson={onSelectPerson}
              onSelectLocation={onSelectLocation}
            />
          )}
          {viewMode === 'map' && (
            <MapView
              records={mapRecords}
              subject={subject}
              selectedRecordId={selectedRecordId}
              onSelectRecord={onSelectRecord}
            />
          )}
        </div>

        {/* DetailPane: inline on lg+, hidden below */}
        <div className="hidden lg:flex flex-col min-h-0 min-w-0">
          <DetailPane {...detailPaneProps} />
        </div>

        {/* DetailPane: sm tab version (md:hidden — md uses the drawer) */}
        <div
          className={`min-h-0 min-w-0 px-4 pb-4 md:hidden flex-col ${
            mobileTab === 'detail' ? 'flex flex-1' : 'hidden'
          }`}
        >
          <DetailPane {...detailPaneProps} />
        </div>
      </main>

      {/* DetailPane: md slide-over drawer (lg inline, sm uses tab) */}
      <DetailDrawer open={selection !== null} onClose={onClearSelection}>
        <DetailPane {...detailPaneProps} />
      </DetailDrawer>
    </div>
  );
}
