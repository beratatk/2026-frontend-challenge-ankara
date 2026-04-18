import type { Coords, InvestigationRecord, RecordSource } from '@/types/records';
import type {
  InvestigationEvent,
  Person,
  PersonInvestigationProfile,
} from '@/lib/linking';
import { SUBJECT_KEY } from '@/lib/linking';

export type LastKnownLocationInsight = {
  name: string;
  at: Date;
  source: RecordSource;
  recordId: string;
  coords: Coords | null;
} | null;

export type LastSeenWithInsight = {
  event: InvestigationEvent;
  others: { key: string; displayName: string }[];
} | null;

export type MostLinkedInsight = {
  key: string;
  displayName: string;
  count: number;
} | null;

export type TopLeadInsight = {
  profile: PersonInvestigationProfile;
  totalWithSignals: number;
} | null;

export type PodoSightingsInsight = {
  count: number;
  locations: number;
  witnesses: number;
};

export type CorroboratedTipsInsight = {
  corroborated: number;
  total: number;
  corroboratedRecordIds: string[];
};

export type InsightBundle = {
  lastKnownLocation: LastKnownLocationInsight;
  lastSeenWith: LastSeenWithInsight;
  mostLinked: MostLinkedInsight;
  topLead: TopLeadInsight;
  podoSightings: PodoSightingsInsight;
  corroboratedTips: CorroboratedTipsInsight;
};

// Pure derivation over already-linked data. Easy to reason about and reactive.
export function computeInsights(
  records: InvestigationRecord[],
  events: InvestigationEvent[],
  people: Map<string, Person>,
  profiles: PersonInvestigationProfile[],
  subjectKey: string = SUBJECT_KEY,
): InsightBundle {
  const subject = people.get(subjectKey) ?? null;

  // Subject's events, newest first — reused by several insights.
  const subjectEventsDesc = events
    .filter((e) => e.participantKeys.includes(subjectKey))
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
  const lastSubjectEvent = subjectEventsDesc[0] ?? null;

  // 1. Last known location — latest record mentioning Podo that carries a location.
  const withLoc = records
    .filter((r) => r.personRefs.includes(subjectKey) && r.location && r.timestamp)
    .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  const latest = withLoc[0] ?? null;
  const lastKnownLocation: LastKnownLocationInsight = latest
    ? {
        name: latest.location!,
        at: latest.timestamp!,
        source: latest.source,
        recordId: latest.id,
        coords: latest.coordinates,
      }
    : null;

  // 2. Last seen with — everyone else who appears in Podo's last event cluster.
  const lastSeenWith: LastSeenWithInsight = lastSubjectEvent
    ? {
        event: lastSubjectEvent,
        others: lastSubjectEvent.participantKeys
          .map((k, i) => ({
            key: k,
            displayName: lastSubjectEvent.participantsDisplay[i],
          }))
          .filter((p) => p.key !== subjectKey),
      }
    : null;

  // 3. Most linked contact — subject's top co-occurrence edge.
  const topCo = subject?.coOccurrences[0] ?? null;
  const mostLinked: MostLinkedInsight = topCo
    ? { key: topCo.key, displayName: topCo.displayName, count: topCo.count }
    : null;

  // 4. Top lead — highest-scoring profile that actually has signals.
  const leadsWithSignals = profiles.filter((p) => p.signalScore > 0);
  const topLead: TopLeadInsight = leadsWithSignals[0]
    ? { profile: leadsWithSignals[0], totalWithSignals: leadsWithSignals.length }
    : null;

  // 5. Sightings of Podo — unique locations and unique witnesses.
  const sightings = records.filter(
    (r) => r.source === 'sighting' && r.personRefs.includes(subjectKey),
  );
  const sightingLocs = new Set<string>();
  const witnessKeys = new Set<string>();
  for (const s of sightings) {
    if (s.location) sightingLocs.add(s.location);
    for (const k of s.personRefs) if (k !== subjectKey) witnessKeys.add(k);
  }
  const podoSightings: PodoSightingsInsight = {
    count: sightings.length,
    locations: sightingLocs.size,
    witnesses: witnessKeys.size,
  };

  // 6. Corroborated tips — tip is corroborated when its named suspect
  //    shares a clustered event (location + 30min window) with Podo.
  const tips = records.filter((r) => r.source === 'tip');
  const corroboratedRecordIds: string[] = [];
  for (const tip of tips) {
    const suspectKey = tip.personRefs[0];
    if (!suspectKey) continue;
    const overlaps = subjectEventsDesc.some((e) => e.participantKeys.includes(suspectKey));
    if (overlaps) corroboratedRecordIds.push(tip.id);
  }
  const corroboratedTips: CorroboratedTipsInsight = {
    corroborated: corroboratedRecordIds.length,
    total: tips.length,
    corroboratedRecordIds,
  };

  return {
    lastKnownLocation,
    lastSeenWith,
    mostLinked,
    topLead,
    podoSightings,
    corroboratedTips,
  };
}
