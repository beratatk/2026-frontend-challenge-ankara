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

// Unique locations across records, sorted by frequency then alphabetically.
export function uniqueLocations(
  records: InvestigationRecord[],
): { name: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of records) {
    if (r.location) m.set(r.location, (m.get(r.location) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));
}
