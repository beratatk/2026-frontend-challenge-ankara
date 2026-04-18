import { useMemo } from 'react';
import type { InvestigationRecord, PersonRole } from '@/types/records';
import type { InvestigationEvent, Person, PersonInvestigationProfile } from '@/lib/linking';
import { SUBJECT_KEY, findEventForRecord } from '@/lib/linking';
import {
  Card,
  ConfidenceBadge,
  PersonChip,
  SectionTitle,
  SignalPill,
  SourceBadge,
  UrgencyBadge,
} from '@/components/atoms';
import { fmtDateTime, fmtRange, recordTitle, roleLabel } from '@/lib/format';
import podoAvatar from '@/assets/podo.png';

type Selection =
  | { kind: 'person'; key: string }
  | { kind: 'record'; id: string }
  | null;

type Props = {
  selection: Selection;
  records: InvestigationRecord[];
  people: Map<string, Person>;
  events: InvestigationEvent[];
  profiles: PersonInvestigationProfile[];
  subject: Person | null;
  podoTimeline: InvestigationEvent[];
  activeLocation: string | null;
  onClear: () => void;
  onSelectPerson: (key: string) => void;
  onSelectRecord: (id: string) => void;
  onSelectLocation: (loc: string) => void;
};

export function DetailPane(props: Props) {
  const { selection } = props;

  if (!selection) return <DefaultView {...props} />;
  if (selection.kind === 'person') return <PersonView personKey={selection.key} {...props} />;
  return <RecordView recordId={selection.id} {...props} />;
}

// --------------------------------- default view ---------------------------------

function DefaultView({
  subject,
  podoTimeline,
  onSelectPerson,
  onSelectRecord,
  onSelectLocation,
}: Props) {
  const recent = podoTimeline.slice(-4).reverse();
  return (
    <div className="h-full min-h-0 overflow-y-auto pr-1 space-y-4">
      <PaneHeader
        kind="Case subject"
        title={subject?.displayName ?? 'Podo'}
        avatarSrc={podoAvatar}
      />
      {subject ? (
        <>
          <Card className="p-4 space-y-1">
            <SectionTitle>Timeline window</SectionTitle>
            <p className="text-sm">
              {fmtDateTime(subject.firstSeen)} → {fmtDateTime(subject.lastSeen)}
            </p>
            <p className="text-xs text-slate-400">
              {subject.recordCount} records across{' '}
              {Object.values(subject.recordsBySource).filter((n) => n > 0).length} source types
            </p>
          </Card>

          <section className="space-y-2">
            <SectionTitle>Chain of last sightings</SectionTitle>
            {recent.length === 0 && (
              <p className="text-sm text-slate-500">No sightings yet.</p>
            )}
            <ol className="space-y-2">
              {recent.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  subjectKey={SUBJECT_KEY}
                  onSelectPerson={onSelectPerson}
                  onSelectRecord={onSelectRecord}
                  onSelectLocation={onSelectLocation}
                />
              ))}
            </ol>
          </section>

          <section>
            <SectionTitle>Known contacts</SectionTitle>
            <div className="mt-2 flex flex-wrap gap-1">
              {subject.coOccurrences.slice(0, 10).map((co) => (
                <PersonChip
                  key={co.key}
                  name={`${co.displayName} · ${co.count}`}
                  seed={co.key}
                  onClick={() => onSelectPerson(co.key)}
                />
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-slate-400">Subject data not available.</p>
      )}

      <p className="text-[11px] text-slate-500 italic pt-2">
        Select a person or a record to inspect linked evidence.
      </p>
    </div>
  );
}

// --------------------------------- person view ---------------------------------

function PersonView({
  personKey,
  records,
  people,
  events,
  profiles,
  subject,
  onClear,
  onSelectPerson,
  onSelectRecord,
  onSelectLocation,
}: Props & { personKey: string }) {
  const person = people.get(personKey);
  const profile = useMemo(
    () => profiles.find((p) => p.person.key === personKey) ?? null,
    [profiles, personKey],
  );

  const linkedRecords = useMemo(
    () =>
      records
        .filter((r) => r.personRefs.includes(personKey))
        .sort((a, b) => {
          const ta = a.timestamp?.getTime() ?? a.createdAt.getTime();
          const tb = b.timestamp?.getTime() ?? b.createdAt.getTime();
          return tb - ta;
        }),
    [records, personKey],
  );

  const sharedEvents = useMemo(
    () =>
      subject
        ? events
            .filter(
              (e) =>
                e.participantKeys.includes(personKey) &&
                e.participantKeys.includes(subject.key),
            )
            .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())
        : [],
    [events, personKey, subject],
  );

  if (!person) {
    return (
      <div className="space-y-2">
        <PaneHeader kind="Person" title={personKey} onClose={onClear} />
        <p className="text-sm text-slate-400">Person not found.</p>
      </div>
    );
  }

  const isSubject = person.key === SUBJECT_KEY;

  return (
    <div className="h-full min-h-0 overflow-y-auto pr-1 space-y-4">
      <PaneHeader
        kind={isSubject ? 'Case subject' : 'Person'}
        title={person.displayName}
        onClose={onClear}
        avatarSrc={isSubject ? podoAvatar : undefined}
      />

      <Card className="p-4 space-y-1">
        <p className="text-xs text-slate-400">
          <span className="text-slate-200 font-semibold tabular-nums">
            {person.recordCount}
          </span>{' '}
          records · first {fmtDateTime(person.firstSeen)} · last {fmtDateTime(person.lastSeen)}
        </p>
        {person.locations.length > 0 && (
          <p className="text-xs text-slate-400">
            Top locations:{' '}
            {person.locations
              .slice(0, 4)
              .map((l) => `${l.name} (${l.count})`)
              .join(' · ')}
          </p>
        )}
      </Card>

      {profile && profile.signals.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <SectionTitle>Investigation indicators</SectionTitle>
            <span className="text-[10px] text-slate-500">
              score {profile.signalScore} · {profile.linkedEvidenceCount} linked records
            </span>
          </div>
          <ul className="space-y-1.5">
            {profile.signals.map((s, i) => (
              <li key={i} className="rounded-md border border-slate-800 bg-slate-900/40 p-2">
                <div className="flex items-start gap-2">
                  <SignalPill weight={s.weight} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-100">{s.label}</p>
                    {s.detail && (
                      <p className="text-xs text-slate-400 mt-0.5">{s.detail}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[10px] italic text-slate-500">
            Signals are investigation aids — corroborate before acting.
          </p>
        </section>
      )}

      {sharedEvents.length > 0 && (
        <section className="space-y-2">
          <SectionTitle>Events with {subject?.displayName}</SectionTitle>
          <ol className="space-y-2">
            {sharedEvents.slice(0, 5).map((e) => (
              <EventRow
                key={e.id}
                event={e}
                subjectKey={SUBJECT_KEY}
                onSelectPerson={onSelectPerson}
                onSelectRecord={onSelectRecord}
                onSelectLocation={onSelectLocation}
              />
            ))}
          </ol>
        </section>
      )}

      {person.coOccurrences.length > 0 && (
        <section className="space-y-1.5">
          <SectionTitle>Often with</SectionTitle>
          <div className="flex flex-wrap gap-1">
            {person.coOccurrences.slice(0, 10).map((co) => (
              <PersonChip
                key={co.key}
                name={`${co.displayName} · ${co.count}`}
                seed={co.key}
                onClick={() => onSelectPerson(co.key)}
              />
            ))}
          </div>
        </section>
      )}

      {person.possibleAliases.length > 0 && (
        <section className="space-y-1.5">
          <SectionTitle>Possible alias hints</SectionTitle>
          <p className="text-[11px] text-slate-500">
            Similar names detected (not auto-merged).
          </p>
          <div className="flex flex-wrap gap-1">
            {person.possibleAliases.map((a) => (
              <PersonChip
                key={a.key}
                name={`${a.displayName} · edit dist ${a.distance}`}
                seed={a.key}
                onClick={() => onSelectPerson(a.key)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <SectionTitle>Linked records ({linkedRecords.length})</SectionTitle>
        <ul className="space-y-2">
          {linkedRecords.map((r) => (
            <MiniRecordRow
              key={r.id}
              record={r}
              highlightPersonKey={personKey}
              onSelectRecord={onSelectRecord}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

// --------------------------------- record view ---------------------------------

function RecordView({
  recordId,
  records,
  events,
  onClear,
  onSelectPerson,
  onSelectRecord,
  onSelectLocation,
}: Props & { recordId: string }) {
  const record = useMemo(() => records.find((r) => r.id === recordId) ?? null, [records, recordId]);
  const event = useMemo(
    () => (record ? findEventForRecord(events, record.id) : null),
    [events, record],
  );

  if (!record) {
    return (
      <div className="space-y-2">
        <PaneHeader kind="Record" title="Not found" onClose={onClear} />
        <p className="text-sm text-slate-400">Record not found.</p>
      </div>
    );
  }

  const related = event ? event.records.filter((r) => r.id !== record.id) : [];

  return (
    <div className="h-full min-h-0 overflow-y-auto pr-1 space-y-4">
      <PaneHeader kind="Record" title={recordTitle(record)} onClose={onClear} />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <SourceBadge source={record.source} />
        <span className="text-slate-400 font-mono">{fmtDateTime(record.timestamp)}</span>
        {record.extra.urgency && <UrgencyBadge value={record.extra.urgency} />}
        {record.extra.confidence && <ConfidenceBadge value={record.extra.confidence} />}
      </div>

      {record.location && (
        <section>
          <SectionTitle>Location</SectionTitle>
          <button
            type="button"
            onClick={() => onSelectLocation(record.location!)}
            className="text-sm mt-1 text-left hover:text-amber-300 underline-offset-2 hover:underline"
          >
            {record.location}
          </button>
          {record.coordinates && (
            <p className="text-[11px] text-slate-500 font-mono">
              {record.coordinates.lat.toFixed(5)}, {record.coordinates.lng.toFixed(5)}
            </p>
          )}
        </section>
      )}

      {record.personsDisplay.length > 0 && (
        <section>
          <SectionTitle>People</SectionTitle>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {record.personsDisplay.map((name, i) => {
              const key = record.personRefs[i];
              const role = record.roleByPerson[key] as PersonRole | undefined;
              return (
                <PersonChip
                  key={key}
                  name={name}
                  seed={key}
                  role={roleLabel(role)}
                  onClick={() => onSelectPerson(key)}
                />
              );
            })}
          </div>
        </section>
      )}

      {record.content && (
        <section>
          <SectionTitle>Content</SectionTitle>
          <p className="mt-1.5 text-sm text-slate-200 whitespace-pre-wrap">{record.content}</p>
        </section>
      )}

      {event && (
        <section>
          <SectionTitle>
            Same event · {event.location} · {fmtRange(event.startAt, event.endAt)}
          </SectionTitle>
          {related.length === 0 ? (
            <p className="mt-1.5 text-xs text-slate-500">No other records in this event.</p>
          ) : (
            <ul className="mt-1.5 space-y-2">
              {related.map((r) => (
                <MiniRecordRow key={r.id} record={r} onSelectRecord={onSelectRecord} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

// --------------------------------- shared bits ---------------------------------

function PaneHeader({
  kind,
  title,
  onClose,
  avatarSrc,
}: {
  kind: string;
  title: string;
  onClose?: () => void;
  avatarSrc?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {avatarSrc && (
          <img
            src={avatarSrc}
            alt={title}
            className="w-12 h-12 rounded-full object-cover border border-slate-700 flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{kind}</p>
          <h2 className="text-xl font-semibold truncate">{title}</h2>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-rose-300 text-sm"
          aria-label="Close detail"
        >
          close ×
        </button>
      )}
    </div>
  );
}

function EventRow({
  event,
  subjectKey,
  onSelectPerson,
  onSelectRecord,
  onSelectLocation,
}: {
  event: InvestigationEvent;
  subjectKey: string;
  onSelectPerson: (key: string) => void;
  onSelectRecord: (id: string) => void;
  onSelectLocation: (loc: string) => void;
}) {
  const others = event.participantKeys
    .map((k, i) => ({ key: k, name: event.participantsDisplay[i] }))
    .filter((p) => p.key !== subjectKey);
  return (
    <li className="rounded-md border border-slate-800 bg-slate-900/40 p-2.5">
      <p className="text-xs text-slate-400 font-mono">{fmtRange(event.startAt, event.endAt)}</p>
      <button
        type="button"
        onClick={() => onSelectLocation(event.location)}
        className="text-sm font-medium text-left hover:text-amber-300"
      >
        {event.location}
      </button>
      {others.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {others.map((p) => (
            <PersonChip key={p.key} name={p.name} seed={p.key} onClick={() => onSelectPerson(p.key)} />
          ))}
        </div>
      )}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {event.records.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelectRecord(r.id)}
            className="text-[10px] text-slate-400 hover:text-amber-300 underline-offset-2 hover:underline inline-flex items-center gap-1"
          >
            <SourceBadge source={r.source} /> open
          </button>
        ))}
      </div>
    </li>
  );
}

function MiniRecordRow({
  record: r,
  highlightPersonKey,
  onSelectRecord,
}: {
  record: InvestigationRecord;
  highlightPersonKey?: string;
  onSelectRecord: (id: string) => void;
}) {
  const role = highlightPersonKey ? r.roleByPerson[highlightPersonKey] : undefined;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelectRecord(r.id)}
        className="w-full text-left rounded-md border border-slate-800 bg-slate-900/40 p-2 hover:bg-slate-900/80 hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <SourceBadge source={r.source} />
          <span className="text-slate-400 font-mono">{fmtDateTime(r.timestamp)}</span>
          {role && <span className="text-[10px] text-slate-500">· {roleLabel(role)}</span>}
        </div>
        <p className="mt-1 text-sm text-slate-100 line-clamp-1">{recordTitle(r)}</p>
        {r.content && (
          <p className="text-xs text-slate-400 line-clamp-1">{r.content}</p>
        )}
      </button>
    </li>
  );
}
