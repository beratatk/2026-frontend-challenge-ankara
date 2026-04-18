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
import type { InvestigationRecord, RecordSource } from '@/types/records';

const SOURCES: RecordSource[] = ['checkin', 'message', 'sighting', 'note', 'tip'];

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

  const isLoading = results.some((r) => r.isLoading);
  const isFetching = results.some((r) => r.isFetching);
  const error = (results.find((r) => r.error)?.error as Error | undefined) ?? null;

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

  return {
    records,
    people,
    events,
    profiles,
    subject,
    podoTimeline,
    isLoading,
    isFetching,
    error,
  };
}
