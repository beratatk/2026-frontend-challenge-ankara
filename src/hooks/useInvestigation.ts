import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { FORM_IDS, fetchAllSubmissions } from '@/api/jotform';
import { normalizeSource } from '@/lib/normalize';
import {
  SUBJECT_KEY,
  buildEvents,
  buildPeopleIndex,
  buildProfiles,
  subjectTimeline,
} from '@/lib/linking';
import { computeInsights } from '@/lib/insights';
import type { InvestigationRecord, RecordSource } from '@/types/records';

const SOURCES: RecordSource[] = ['checkin', 'message', 'sighting', 'note', 'tip'];

export type SourceLoadState = {
  source: RecordSource;
  status: 'loading' | 'success' | 'error';
  isFetching: boolean;
  error: Error | null;
  count: number;
  refetch: () => void;
};

export function useInvestigation() {
  const results = useQueries({
    queries: SOURCES.map((source) => ({
      queryKey: ['records', source],
      queryFn: async (): Promise<InvestigationRecord[]> => {
        const raw = await fetchAllSubmissions(FORM_IDS[source]);
        return normalizeSource(source, raw);
      },
    })),
  });

  const sourceStatus: SourceLoadState[] = SOURCES.map((source, i) => {
    const r = results[i];
    const status: 'loading' | 'success' | 'error' =
      r.status === 'pending' ? 'loading' : r.status === 'error' ? 'error' : 'success';
    return {
      source,
      status,
      isFetching: r.isFetching,
      error: (r.error as Error | null) ?? null,
      count: r.data?.length ?? 0,
      refetch: () => {
        void r.refetch();
      },
    };
  });

  const isInitialLoading = sourceStatus.some((s) => s.status === 'loading');
  const isFetching = sourceStatus.some((s) => s.isFetching);
  const failedSources = sourceStatus.filter((s) => s.status === 'error');
  const successCount = sourceStatus.filter((s) => s.status === 'success').length;
  const hasAnyData = successCount > 0;
  const allFailed = !isInitialLoading && successCount === 0;
  const isRetrying = failedSources.some((s) => s.isFetching);

  const retryFailed = () => {
    for (const s of sourceStatus) if (s.status === 'error') s.refetch();
  };

  // Derivations run over whatever succeeded — partial data still renders a usable app.
  const records = useMemo(
    () => results.flatMap((r) => r.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results.map((r) => r.dataUpdatedAt).join('|')],
  );
  const people = useMemo(() => buildPeopleIndex(records), [records]);
  const events = useMemo(() => buildEvents(records), [records]);
  const profiles = useMemo(
    () => buildProfiles(records, people, events, SUBJECT_KEY),
    [records, people, events],
  );
  const podoTimeline = useMemo(() => subjectTimeline(events, SUBJECT_KEY), [events]);
  const subject = useMemo(() => people.get(SUBJECT_KEY) ?? null, [people]);
  const insights = useMemo(
    () => computeInsights(records, events, people, profiles, SUBJECT_KEY),
    [records, events, people, profiles],
  );

  return {
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
    hasAnyData,
    allFailed,
    retryFailed,
  };
}
