export type RecordSource = 'checkin' | 'message' | 'sighting' | 'note' | 'tip';

export type Coords = { lat: number; lng: number };

export type PersonRole =
  | 'checkin-subject'
  | 'sender'
  | 'recipient'
  | 'sighted'
  | 'seen-with'
  | 'note-author'
  | 'note-mentioned'
  | 'tip-suspect';

export type RawAnswer = {
  name?: string;
  text?: string;
  type?: string;
  answer?: unknown;
};

export type RawSubmission = {
  id: string;
  form_id: string;
  created_at: string;
  answers: Record<string, RawAnswer>;
};

// Unified record shape used across the app.
export type InvestigationRecord = {
  id: string;
  source: RecordSource;
  timestamp: Date | null;
  timestampRaw: string | null;
  personRefs: string[];       // normalized keys, unique, preserves order of appearance
  personsDisplay: string[];   // display names, same order as personRefs
  location: string | null;
  coordinates: Coords | null;
  content: string;            // free-text for search
  roleByPerson: Record<string, PersonRole>;
  extra: Record<string, string>;
  raw: RawSubmission;
  createdAt: Date;
};
