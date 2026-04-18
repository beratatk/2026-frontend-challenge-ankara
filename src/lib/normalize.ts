import type {
  Coords,
  InvestigationRecord,
  PersonRole,
  RawAnswer,
  RawSubmission,
  RecordSource,
} from '@/types/records';

// "Aslı" -> "asli", "Kağan" -> "kagan". Primary key for person linking.
export function normalizeName(raw: string): string {
  return raw
    .trim()
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "18-04-2026 19:05" (DD-MM-YYYY HH:MM) -> Date. Returns null if unparseable.
export function parseTrDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function parseCoords(raw: string | null | undefined): Coords | null {
  if (!raw) return null;
  const parts = raw.split(',').map((p) => parseFloat(p.trim()));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  return { lat: parts[0], lng: parts[1] };
}

// Flatten Jotform's answers object: { "2": { name: "personName", answer: "Podo" }, ... }
// into { personName: "Podo", ... }. Ignores fields without a name.
function flattenAnswers(raw: RawSubmission): Record<string, string> {
  const out: Record<string, string> = {};
  for (const ans of Object.values(raw.answers) as RawAnswer[]) {
    if (!ans.name || ans.answer == null) continue;
    if (typeof ans.answer === 'string') out[ans.name] = ans.answer;
    else out[ans.name] = String(ans.answer);
  }
  return out;
}

// Add a person to the record while keeping personRefs unique, aligned with personsDisplay & roles.
function addPerson(
  acc: { refs: string[]; display: string[]; roles: Record<string, PersonRole> },
  display: string | undefined,
  role: PersonRole,
): void {
  if (!display) return;
  const key = normalizeName(display);
  if (!key) return;
  if (!acc.refs.includes(key)) {
    acc.refs.push(key);
    acc.display.push(display.trim());
  }
  // first role wins (keeps clearer semantics when a person appears twice in same record)
  if (!acc.roles[key]) acc.roles[key] = role;
}

function splitList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,;/]/g).map((s) => s.trim()).filter(Boolean);
}

function baseRecord(
  raw: RawSubmission,
  source: RecordSource,
  a: Record<string, string>,
): Pick<
  InvestigationRecord,
  'id' | 'source' | 'timestamp' | 'timestampRaw' | 'location' | 'coordinates' | 'createdAt'
> {
  return {
    id: `${source}:${raw.id}`,
    source,
    timestamp: parseTrDate(a.timestamp),
    timestampRaw: a.timestamp ?? null,
    location: a.location?.trim() || null,
    coordinates: parseCoords(a.coordinates),
    createdAt: new Date(raw.created_at),
  };
}

function mapCheckin(raw: RawSubmission): InvestigationRecord {
  const a = flattenAnswers(raw);
  const acc = { refs: [] as string[], display: [] as string[], roles: {} as Record<string, PersonRole> };
  addPerson(acc, a.personName, 'checkin-subject');
  return {
    ...baseRecord(raw, 'checkin', a),
    personRefs: acc.refs,
    personsDisplay: acc.display,
    roleByPerson: acc.roles,
    content: a.note ?? '',
    extra: {},
    raw,
  };
}

function mapMessage(raw: RawSubmission): InvestigationRecord {
  const a = flattenAnswers(raw);
  const acc = { refs: [] as string[], display: [] as string[], roles: {} as Record<string, PersonRole> };
  addPerson(acc, a.senderName, 'sender');
  addPerson(acc, a.recipientName, 'recipient');
  return {
    ...baseRecord(raw, 'message', a),
    personRefs: acc.refs,
    personsDisplay: acc.display,
    roleByPerson: acc.roles,
    content: a.text ?? '',
    extra: a.urgency ? { urgency: a.urgency } : {},
    raw,
  };
}

function mapSighting(raw: RawSubmission): InvestigationRecord {
  const a = flattenAnswers(raw);
  const acc = { refs: [] as string[], display: [] as string[], roles: {} as Record<string, PersonRole> };
  addPerson(acc, a.personName, 'sighted');
  addPerson(acc, a.seenWith, 'seen-with');
  return {
    ...baseRecord(raw, 'sighting', a),
    personRefs: acc.refs,
    personsDisplay: acc.display,
    roleByPerson: acc.roles,
    content: a.note ?? '',
    extra: {},
    raw,
  };
}

function mapNote(raw: RawSubmission): InvestigationRecord {
  const a = flattenAnswers(raw);
  const acc = { refs: [] as string[], display: [] as string[], roles: {} as Record<string, PersonRole> };
  addPerson(acc, a.authorName, 'note-author');
  for (const m of splitList(a.mentionedPeople)) addPerson(acc, m, 'note-mentioned');
  return {
    ...baseRecord(raw, 'note', a),
    personRefs: acc.refs,
    personsDisplay: acc.display,
    roleByPerson: acc.roles,
    content: a.note ?? '',
    extra: {},
    raw,
  };
}

function mapTip(raw: RawSubmission): InvestigationRecord {
  const a = flattenAnswers(raw);
  const acc = { refs: [] as string[], display: [] as string[], roles: {} as Record<string, PersonRole> };
  addPerson(acc, a.suspectName, 'tip-suspect');
  return {
    ...baseRecord(raw, 'tip', a),
    personRefs: acc.refs,
    personsDisplay: acc.display,
    roleByPerson: acc.roles,
    content: a.tip ?? '',
    extra: a.confidence ? { confidence: a.confidence } : {},
    raw,
  };
}

const MAPPERS: Record<RecordSource, (raw: RawSubmission) => InvestigationRecord> = {
  checkin: mapCheckin,
  message: mapMessage,
  sighting: mapSighting,
  note: mapNote,
  tip: mapTip,
};

export function normalizeSource(
  source: RecordSource,
  rows: RawSubmission[],
): InvestigationRecord[] {
  return rows.map(MAPPERS[source]);
}
