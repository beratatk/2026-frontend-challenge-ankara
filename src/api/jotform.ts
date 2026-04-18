import type { RawSubmission } from '@/types/records';

const API_BASE = 'https://api.jotform.com';
const PAGE_SIZE = 1000;

const keys: string[] = String(import.meta.env.VITE_JOTFORM_API_KEYS ?? '')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

if (keys.length === 0) {
  throw new Error('VITE_JOTFORM_API_KEYS is empty — set it in .env.local');
}

let cursor = 0;
const nextKey = () => keys[cursor++ % keys.length];

type JotformResponse<T> = {
  responseCode: number;
  message?: string;
  content: T;
  resultSet?: { offset: number; limit: number; count: number };
};

async function fetchPage(formId: string, offset: number): Promise<RawSubmission[]> {
  // Rotate keys; on 429 (rate limit), try remaining keys before failing.
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = nextKey();
    const url = `${API_BASE}/form/${formId}/submissions?apiKey=${key}&limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url);
    const json = (await res.json()) as JotformResponse<RawSubmission[]>;
    if (json.responseCode === 200) return json.content;
    if (json.responseCode === 429) continue;
    throw new Error(`Jotform ${formId}: ${json.responseCode} ${json.message ?? ''}`);
  }
  throw new Error(`Jotform ${formId}: all API keys rate-limited`);
}

export async function fetchAllSubmissions(formId: string): Promise<RawSubmission[]> {
  const out: RawSubmission[] = [];
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await fetchPage(formId, offset);
    out.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return out;
}

export const FORM_IDS = {
  checkin: import.meta.env.VITE_FORM_CHECKINS,
  message: import.meta.env.VITE_FORM_MESSAGES,
  sighting: import.meta.env.VITE_FORM_SIGHTINGS,
  note: import.meta.env.VITE_FORM_NOTES,
  tip: import.meta.env.VITE_FORM_TIPS,
} as const;
