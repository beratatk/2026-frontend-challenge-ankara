import type { InvestigationRecord, RecordSource } from '@/types/records';

export type Filters = {
  query: string;
  sources: Set<RecordSource>;
  personKey: string | null;
  location: string | null;
};

export const emptyFilters = (): Filters => ({
  query: '',
  sources: new Set(),
  personKey: null,
  location: null,
});

export function applyFilters(
  records: InvestigationRecord[],
  f: Filters,
): InvestigationRecord[] {
  const q = f.query.trim().toLowerCase();
  return records.filter((r) => {
    if (f.sources.size > 0 && !f.sources.has(r.source)) return false;
    if (f.personKey && !r.personRefs.includes(f.personKey)) return false;
    if (f.location && (r.location?.toLowerCase() !== f.location.toLowerCase())) return false;
    if (q) {
      const hay = [
        r.content,
        r.location ?? '',
        ...r.personsDisplay,
        r.timestampRaw ?? '',
        r.source,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.query.trim()) n++;
  if (f.sources.size) n++;
  if (f.personKey) n++;
  if (f.location) n++;
  return n;
}

export function toggleSource(f: Filters, s: RecordSource): Filters {
  const next = new Set(f.sources);
  if (next.has(s)) next.delete(s);
  else next.add(s);
  return { ...f, sources: next };
}
