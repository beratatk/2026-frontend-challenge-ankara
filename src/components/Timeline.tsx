import { useMemo } from 'react';
import type { InvestigationRecord } from '@/types/records';
import type { InvestigationEvent, Person } from '@/lib/linking';
import {
  ConfidenceBadge,
  PersonChip,
  SourceBadge,
  UrgencyBadge,
} from '@/components/atoms';
import { fmtDateTime, fmtTime, recordTitle } from '@/lib/format';

type Props = {
  records: InvestigationRecord[];
  events: InvestigationEvent[];
  subject: Person | null;
  selectedRecordId: string | null;
  activePersonKey: string | null;
  activeLocation: string | null;
  onSelectRecord: (id: string) => void;
  onSelectPerson: (key: string) => void;
  onSelectLocation: (loc: string) => void;
};

export function Timeline({
  records,
  events,
  subject,
  selectedRecordId,
  activePersonKey,
  activeLocation,
  onSelectRecord,
  onSelectPerson,
  onSelectLocation,
}: Props) {
  const ordered = useMemo(
    () =>
      records
        .filter((r) => r.timestamp)
        .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime()),
    [records],
  );

  // record id -> event id; lets us mark rows belonging to the same cross-source cluster.
  const eventByRecord = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of events) for (const id of e.recordIds) map.set(id, e.id);
    return map;
  }, [events]);

  if (!subject) {
    return (
      <section className="flex items-center justify-center p-8 text-sm text-slate-400">
        No subject found in the data.
      </section>
    );
  }

  return (
    <section className="flex-1 min-h-0 flex flex-col gap-3">
      <TimelineHeader
        subject={subject}
        count={ordered.length}
        first={ordered[0]?.timestamp ?? null}
        last={ordered[ordered.length - 1]?.timestamp ?? null}
      />

      {ordered.length === 0 ? (
        <div className="flex-1 grid place-items-center rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-6">
          <p className="text-sm text-slate-400 text-center">
            No dated records involving {subject.displayName} match the current filters.
          </p>
        </div>
      ) : (
        <ol className="flex-1 min-h-0 overflow-y-auto pr-1">
          {ordered.map((r, i) => {
            const prev = ordered[i - 1];
            const dateBreak =
              !prev ||
              !sameDay(prev.timestamp!, r.timestamp!);
            const sameEventAsPrev =
              !!prev &&
              eventByRecord.get(r.id) !== undefined &&
              eventByRecord.get(r.id) === eventByRecord.get(prev.id);
            return (
              <li key={r.id}>
                {dateBreak && <DateSeparator date={r.timestamp!} />}
                <TimelineRow
                  record={r}
                  selected={selectedRecordId === r.id}
                  activePersonKey={activePersonKey}
                  activeLocation={activeLocation}
                  sameEventAsPrev={sameEventAsPrev}
                  onSelect={() => onSelectRecord(r.id)}
                  onSelectPerson={onSelectPerson}
                  onSelectLocation={onSelectLocation}
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// ------------------------------ helpers ------------------------------

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function TimelineHeader({
  subject,
  count,
  first,
  last,
}: {
  subject: Person;
  count: number;
  first: Date | null;
  last: Date | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 flex-wrap">
      <h2 className="text-sm font-semibold">
        Timeline of <span className="text-amber-300">{subject.displayName}</span>
      </h2>
      <p className="text-xs text-slate-400 tabular-nums">
        {count > 0 && first && last ? (
          <>
            {count} record{count === 1 ? '' : 's'} · {fmtDateTime(first)} → {fmtDateTime(last)}
          </>
        ) : (
          '0 records'
        )}
      </p>
    </div>
  );
}

function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {date.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

function TimelineRow({
  record: r,
  selected,
  activePersonKey,
  activeLocation,
  sameEventAsPrev,
  onSelect,
  onSelectPerson,
  onSelectLocation,
}: {
  record: InvestigationRecord;
  selected: boolean;
  activePersonKey: string | null;
  activeLocation: string | null;
  sameEventAsPrev: boolean;
  onSelect: () => void;
  onSelectPerson: (key: string) => void;
  onSelectLocation: (loc: string) => void;
}) {
  return (
    <article
      onClick={onSelect}
      className="group grid grid-cols-[56px_18px_minmax(0,1fr)] gap-2 cursor-pointer"
    >
      {/* time */}
      <div className="pt-2.5 text-right text-xs text-slate-400 font-mono tabular-nums">
        {fmtTime(r.timestamp)}
      </div>

      {/* dot + connector */}
      <div className="relative flex justify-center">
        <div className="absolute inset-y-0 w-px bg-slate-800" aria-hidden />
        <span
          className={`relative mt-3 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
            selected
              ? 'bg-amber-400'
              : sameEventAsPrev
              ? 'bg-slate-600'
              : 'bg-slate-300'
          }`}
          title={sameEventAsPrev ? 'same event as previous row' : undefined}
        />
      </div>

      {/* content card */}
      <div
        className={`rounded-lg border p-2.5 mb-2 transition-colors ${
          selected
            ? 'border-amber-400/60 bg-amber-400/5'
            : 'border-slate-800 bg-slate-900/40 group-hover:bg-slate-900/80 group-hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <SourceBadge source={r.source} />
          {r.location && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLocation(r.location!);
              }}
              className={`underline-offset-2 hover:underline hover:text-amber-300 ${
                activeLocation?.toLowerCase() === r.location.toLowerCase()
                  ? 'text-amber-300'
                  : 'text-slate-400'
              }`}
            >
              {r.location}
            </button>
          )}
          {r.extra.urgency && <UrgencyBadge value={r.extra.urgency} />}
          {r.extra.confidence && <ConfidenceBadge value={r.extra.confidence} />}
        </div>

        <p className="mt-1 text-sm font-medium text-slate-100 line-clamp-1">
          {recordTitle(r)}
        </p>

        {r.personsDisplay.length > 0 && (
          <div
            className="mt-1 flex flex-wrap gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {r.personsDisplay.map((name, i) => {
              const key = r.personRefs[i];
              return (
                <PersonChip
                  key={key}
                  name={name}
                  active={activePersonKey === key}
                  onClick={() => onSelectPerson(key)}
                />
              );
            })}
          </div>
        )}

        {r.content && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{r.content}</p>
        )}
      </div>
    </article>
  );
}
