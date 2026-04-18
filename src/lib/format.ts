import type { InvestigationRecord } from '@/types/records';

export function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtTime(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function fmtRange(start: Date, end: Date): string {
  if (start.getTime() === end.getTime()) return fmtDateTime(start);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  return sameDay ? `${fmtDateTime(start)} – ${fmtTime(end)}` : `${fmtDateTime(start)} – ${fmtDateTime(end)}`;
}

// Source-aware, human-readable title. Keeps the feed readable without JSON dumps.
export function recordTitle(r: InvestigationRecord): string {
  const [a, b] = r.personsDisplay;
  switch (r.source) {
    case 'checkin':
      return `${a ?? 'Unknown'} checked in${r.location ? ` at ${r.location}` : ''}`;
    case 'message':
      return `${a ?? 'Unknown'} → ${b ?? 'Unknown'}`;
    case 'sighting':
      return b ? `${a ?? 'Unknown'} seen with ${b}` : `${a ?? 'Unknown'} sighted`;
    case 'note':
      return `Note by ${a ?? 'Unknown'}`;
    case 'tip':
      return `Anonymous tip about ${a ?? 'Unknown'}`;
  }
}

export function roleLabel(role: string | undefined): string {
  switch (role) {
    case 'checkin-subject': return 'checked in';
    case 'sender': return 'sender';
    case 'recipient': return 'recipient';
    case 'sighted': return 'sighted';
    case 'seen-with': return 'seen with';
    case 'note-author': return 'author';
    case 'note-mentioned': return 'mentioned';
    case 'tip-suspect': return 'suspect';
    default: return '';
  }
}
