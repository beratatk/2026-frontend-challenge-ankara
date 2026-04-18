import type { Coords, InvestigationRecord, RecordSource } from '@/types/records';

// Subject of the case. All suspicion signals are computed relative to this person.
export const SUBJECT_KEY = 'podo';

// Tunable thresholds — keep explicit so anyone can tweak during the hackathon.
export const EVENT_WINDOW_MIN = 30;          // records within N minutes + same location cluster together
export const ALIAS_MAX_EDIT_DISTANCE = 1;    // potential typo threshold (display only, never auto-merged)
export const ALIAS_MIN_NAME_LENGTH = 4;      // avoid pairing short names like "Can" <-> "Cem"

export const SIGNAL_WEIGHTS = {
  tipHigh: 30,
  tipMedium: 20,
  tipLow: 10,
  coOccurrence: 15,
  coOccurrenceCap: 45,
  mentionInNote: 8,
  mentionInNoteCap: 24,
  lastKnownWith: 25,
  locationOverlap: 10,
  nighttimeContact: 10,
};

export const NIGHTTIME_HOUR_START = 22; // 22:00 – 05:00 counted as "late"

export type Person = {
  key: string;
  displayName: string;
  recordCount: number;
  recordsBySource: Record<RecordSource, number>;
  firstSeen: Date | null;
  lastSeen: Date | null;
  locations: { name: string; count: number }[];
  coOccurrences: { key: string; displayName: string; count: number }[];
  possibleAliases: { key: string; displayName: string; distance: number }[];
};

export type InvestigationEvent = {
  id: string;
  startAt: Date;
  endAt: Date;
  location: string;
  coordinates: Coords | null;
  participantKeys: string[];
  participantsDisplay: string[];
  recordIds: string[];
  records: InvestigationRecord[];
};

export type SignalType =
  | 'named-in-tip'
  | 'co-occurrence-with-subject'
  | 'mentioned-in-note-with-subject'
  | 'last-known-with-subject'
  | 'location-overlap-with-subject'
  | 'nighttime-contact-with-subject';

export type SuspicionSignal = {
  type: SignalType;
  weight: number;
  label: string;
  detail: string;
  evidenceIds: string[];
};

export type PersonInvestigationProfile = {
  person: Person;
  signals: SuspicionSignal[];
  signalScore: number;
  linkedEvidenceCount: number;
  lastSeenWithSubject: InvestigationEvent | null;
  lastKnownLocation: { name: string; at: Date } | null;
};

// ----------------------------------- helpers -----------------------------------

function locationKey(s: string | null): string | null {
  return s?.trim().toLowerCase() || null;
}

function byTime(a: InvestigationRecord, b: InvestigationRecord): number {
  const ta = a.timestamp?.getTime() ?? a.createdAt.getTime();
  const tb = b.timestamp?.getTime() ?? b.createdAt.getTime();
  return ta - tb;
}

function addSourceCount(
  acc: Record<RecordSource, number>,
  s: RecordSource,
): Record<RecordSource, number> {
  acc[s] = (acc[s] ?? 0) + 1;
  return acc;
}

function emptyRecordsBySource(): Record<RecordSource, number> {
  return { checkin: 0, message: 0, sighting: 0, note: 0, tip: 0 };
}

// Cheap Levenshtein (dp table). Good enough for a few dozen names.
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > ALIAS_MAX_EDIT_DISTANCE) return ALIAS_MAX_EDIT_DISTANCE + 1;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

// --------------------------------- people index ---------------------------------

export function buildPeopleIndex(records: InvestigationRecord[]): Map<string, Person> {
  const people = new Map<string, Person>();
  const displayTally = new Map<string, Map<string, number>>();     // pick most common display form
  const locationTally = new Map<string, Map<string, number>>();
  const coOccurTally = new Map<string, Map<string, number>>();

  const ensure = (key: string): Person => {
    let p = people.get(key);
    if (!p) {
      p = {
        key,
        displayName: key,
        recordCount: 0,
        recordsBySource: emptyRecordsBySource(),
        firstSeen: null,
        lastSeen: null,
        locations: [],
        coOccurrences: [],
        possibleAliases: [],
      };
      people.set(key, p);
      displayTally.set(key, new Map());
      locationTally.set(key, new Map());
      coOccurTally.set(key, new Map());
    }
    return p;
  };

  for (const r of records) {
    for (let i = 0; i < r.personRefs.length; i++) {
      const key = r.personRefs[i];
      const display = r.personsDisplay[i] ?? key;
      const p = ensure(key);

      p.recordCount++;
      addSourceCount(p.recordsBySource, r.source);

      const when = r.timestamp ?? r.createdAt;
      if (!p.firstSeen || when < p.firstSeen) p.firstSeen = when;
      if (!p.lastSeen || when > p.lastSeen) p.lastSeen = when;

      const dt = displayTally.get(key)!;
      dt.set(display, (dt.get(display) ?? 0) + 1);

      if (r.location) {
        const lt = locationTally.get(key)!;
        lt.set(r.location, (lt.get(r.location) ?? 0) + 1);
      }

      for (const otherKey of r.personRefs) {
        if (otherKey === key) continue;
        const ct = coOccurTally.get(key)!;
        ct.set(otherKey, (ct.get(otherKey) ?? 0) + 1);
      }
    }
  }

  // Finalize: pick best display, sort locations/coOccurrences, detect possible aliases.
  for (const [key, p] of people) {
    const dt = displayTally.get(key)!;
    let bestDisplay = p.displayName;
    let bestCount = -1;
    for (const [d, c] of dt) {
      if (c > bestCount) { bestDisplay = d; bestCount = c; }
    }
    p.displayName = bestDisplay;

    const lt = locationTally.get(key)!;
    p.locations = [...lt.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const ct = coOccurTally.get(key)!;
    p.coOccurrences = [...ct.entries()]
      .map(([k, count]) => ({ key: k, displayName: people.get(k)?.displayName ?? k, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Alias hints (display-only; never auto-merged). O(n^2) is fine here.
  const entries = [...people.values()];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i], b = entries[j];
      if (a.key.length < ALIAS_MIN_NAME_LENGTH || b.key.length < ALIAS_MIN_NAME_LENGTH) continue;
      const d = editDistance(a.key, b.key);
      if (d <= ALIAS_MAX_EDIT_DISTANCE) {
        a.possibleAliases.push({ key: b.key, displayName: b.displayName, distance: d });
        b.possibleAliases.push({ key: a.key, displayName: a.displayName, distance: d });
      }
    }
  }

  return people;
}

// --------------------------------- event clustering ---------------------------------

// Cluster records into cross-source events by (location, ~30min window).
// Records without timestamp OR without location are excluded from events.
export function buildEvents(records: InvestigationRecord[]): InvestigationEvent[] {
  const withLocAndTime = records
    .filter((r) => r.timestamp && r.location)
    .slice()
    .sort(byTime);

  const windowMs = EVENT_WINDOW_MIN * 60 * 1000;
  const clustersByLoc = new Map<string, InvestigationEvent[]>();
  const all: InvestigationEvent[] = [];

  for (const r of withLocAndTime) {
    const lk = locationKey(r.location)!;
    const ts = r.timestamp!.getTime();
    const list = clustersByLoc.get(lk) ?? [];

    // find a cluster whose endAt is within window of this record
    const match = list.find((c) => Math.abs(c.endAt.getTime() - ts) <= windowMs);
    if (match) {
      match.records.push(r);
      match.recordIds.push(r.id);
      if (ts < match.startAt.getTime()) match.startAt = r.timestamp!;
      if (ts > match.endAt.getTime()) match.endAt = r.timestamp!;
      for (let i = 0; i < r.personRefs.length; i++) {
        if (!match.participantKeys.includes(r.personRefs[i])) {
          match.participantKeys.push(r.personRefs[i]);
          match.participantsDisplay.push(r.personsDisplay[i]);
        }
      }
      if (!match.coordinates && r.coordinates) match.coordinates = r.coordinates;
      continue;
    }

    const evt: InvestigationEvent = {
      id: `evt:${lk}:${ts}`,
      startAt: r.timestamp!,
      endAt: r.timestamp!,
      location: r.location!,
      coordinates: r.coordinates,
      participantKeys: [...r.personRefs],
      participantsDisplay: [...r.personsDisplay],
      recordIds: [r.id],
      records: [r],
    };
    list.push(evt);
    all.push(evt);
    clustersByLoc.set(lk, list);
  }

  return all.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

// --------------------------------- suspicion signals ---------------------------------

function isNighttime(d: Date): boolean {
  const h = d.getHours();
  return h >= NIGHTTIME_HOUR_START || h < 5;
}

function tipWeight(confidence: string | undefined): number {
  switch ((confidence ?? '').toLowerCase()) {
    case 'high': return SIGNAL_WEIGHTS.tipHigh;
    case 'medium': return SIGNAL_WEIGHTS.tipMedium;
    case 'low': return SIGNAL_WEIGHTS.tipLow;
    default: return SIGNAL_WEIGHTS.tipLow;
  }
}

export function buildProfiles(
  records: InvestigationRecord[],
  people: Map<string, Person>,
  events: InvestigationEvent[],
  subjectKey: string = SUBJECT_KEY,
): PersonInvestigationProfile[] {
  const subject = people.get(subjectKey);
  const subjectLocations = new Set((subject?.locations ?? []).map((l) => l.name.toLowerCase()));
  const subjectEvents = events.filter((e) => e.participantKeys.includes(subjectKey));
  const subjectEventsDesc = [...subjectEvents].sort((a, b) => b.startAt.getTime() - a.startAt.getTime());

  const profiles: PersonInvestigationProfile[] = [];

  for (const person of people.values()) {
    if (person.key === subjectKey) continue;

    const signals: SuspicionSignal[] = [];

    // (1) named in anonymous tips
    const tips = records.filter(
      (r) => r.source === 'tip' && r.personRefs.includes(person.key),
    );
    for (const t of tips) {
      const w = tipWeight(t.extra.confidence);
      signals.push({
        type: 'named-in-tip',
        weight: w,
        label: `Named in anonymous tip (${t.extra.confidence ?? 'low'} confidence)`,
        detail: t.content.slice(0, 160),
        evidenceIds: [t.id],
      });
    }

    // (2) co-occurrence with subject inside cross-source events
    const sharedEvents = subjectEvents.filter((e) => e.participantKeys.includes(person.key));
    if (sharedEvents.length > 0) {
      const rawWeight = sharedEvents.length * SIGNAL_WEIGHTS.coOccurrence;
      signals.push({
        type: 'co-occurrence-with-subject',
        weight: Math.min(rawWeight, SIGNAL_WEIGHTS.coOccurrenceCap),
        label: `Appears with ${subject?.displayName ?? 'subject'} in ${sharedEvents.length} event${sharedEvents.length > 1 ? 's' : ''}`,
        detail: sharedEvents
          .slice(0, 3)
          .map((e) => `${e.location} @ ${e.startAt.toLocaleString('tr-TR')}`)
          .join(' · '),
        evidenceIds: sharedEvents.flatMap((e) => e.recordIds),
      });
    }

    // (3) mentioned-in-notes alongside subject
    const notesWithBoth = records.filter(
      (r) =>
        r.source === 'note' &&
        r.personRefs.includes(person.key) &&
        r.personRefs.includes(subjectKey),
    );
    if (notesWithBoth.length > 0) {
      const rawWeight = notesWithBoth.length * SIGNAL_WEIGHTS.mentionInNote;
      signals.push({
        type: 'mentioned-in-note-with-subject',
        weight: Math.min(rawWeight, SIGNAL_WEIGHTS.mentionInNoteCap),
        label: `Mentioned with ${subject?.displayName ?? 'subject'} in ${notesWithBoth.length} note${notesWithBoth.length > 1 ? 's' : ''}`,
        detail: notesWithBoth[0].content.slice(0, 160),
        evidenceIds: notesWithBoth.map((r) => r.id),
      });
    }

    // (4) "last known with subject" — bonus if they appear in the final subject event
    const lastSubjectEvent = subjectEventsDesc[0];
    const lastSeenWith = sharedEvents.length > 0
      ? [...sharedEvents].sort((a, b) => b.startAt.getTime() - a.startAt.getTime())[0]
      : null;
    if (lastSubjectEvent && lastSeenWith && lastSeenWith.id === lastSubjectEvent.id) {
      signals.push({
        type: 'last-known-with-subject',
        weight: SIGNAL_WEIGHTS.lastKnownWith,
        label: `Present at ${subject?.displayName ?? 'subject'}'s last known event`,
        detail: `${lastSubjectEvent.location} @ ${lastSubjectEvent.startAt.toLocaleString('tr-TR')}`,
        evidenceIds: lastSubjectEvent.recordIds,
      });
    }

    // (5) location overlap
    const overlap = person.locations.filter((l) => subjectLocations.has(l.name.toLowerCase()));
    if (overlap.length >= 2) {
      signals.push({
        type: 'location-overlap-with-subject',
        weight: SIGNAL_WEIGHTS.locationOverlap,
        label: `Shares ${overlap.length} locations with ${subject?.displayName ?? 'subject'}`,
        detail: overlap.slice(0, 3).map((l) => l.name).join(' · '),
        evidenceIds: [],
      });
    }

    // (6) nighttime contact with subject
    const nightContacts = sharedEvents.filter((e) => isNighttime(e.startAt));
    if (nightContacts.length > 0) {
      signals.push({
        type: 'nighttime-contact-with-subject',
        weight: SIGNAL_WEIGHTS.nighttimeContact,
        label: `Late-hour contact with ${subject?.displayName ?? 'subject'}`,
        detail: nightContacts
          .slice(0, 3)
          .map((e) => `${e.location} @ ${e.startAt.toLocaleString('tr-TR')}`)
          .join(' · '),
        evidenceIds: nightContacts.flatMap((e) => e.recordIds),
      });
    }

    const signalScore = signals.reduce((s, x) => s + x.weight, 0);
    const linkedEvidenceCount = new Set(signals.flatMap((s) => s.evidenceIds)).size;

    const lastKnownLocation =
      person.locations.length > 0 && person.lastSeen
        ? { name: person.locations[0].name, at: person.lastSeen }
        : null;

    profiles.push({
      person,
      signals,
      signalScore,
      linkedEvidenceCount,
      lastSeenWithSubject: lastSeenWith,
      lastKnownLocation,
    });
  }

  profiles.sort((a, b) => b.signalScore - a.signalScore);
  return profiles;
}

// ------------------------- quick-access derivations for the UI -------------------------

export function lastKnownEventFor(
  events: InvestigationEvent[],
  personKey: string,
): InvestigationEvent | null {
  let latest: InvestigationEvent | null = null;
  for (const e of events) {
    if (!e.participantKeys.includes(personKey)) continue;
    if (!latest || e.startAt > latest.startAt) latest = e;
  }
  return latest;
}

export function subjectTimeline(
  events: InvestigationEvent[],
  subjectKey: string = SUBJECT_KEY,
): InvestigationEvent[] {
  return events
    .filter((e) => e.participantKeys.includes(subjectKey))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function findEventForRecord(
  events: InvestigationEvent[],
  recordId: string,
): InvestigationEvent | null {
  for (const e of events) if (e.recordIds.includes(recordId)) return e;
  return null;
}
