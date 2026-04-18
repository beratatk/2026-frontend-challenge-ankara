import type { InvestigationEvent } from '@/lib/linking';
import type { Person, PersonInvestigationProfile } from '@/lib/linking';
import { Card, PersonChip, SectionTitle, SignalPill } from '@/components/atoms';
import { fmtDateTime } from '@/lib/format';

type Props = {
  subject: Person | null;
  podoTimeline: InvestigationEvent[];
  profiles: PersonInvestigationProfile[];
  onSelectPerson: (key: string) => void;
};

export function SummaryStrip({ subject, podoTimeline, profiles, onSelectPerson }: Props) {
  const lastEvent = podoTimeline[podoTimeline.length - 1] ?? null;
  const mostLinked = subject?.coOccurrences[0] ?? null;
  const topLeads = profiles.filter((p) => p.signalScore > 0).slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-6 py-4 border-b border-slate-800">
      <Card className="p-4">
        <SectionTitle>Last known sighting</SectionTitle>
        {lastEvent ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-base font-medium">{lastEvent.location}</p>
            <p className="text-xs text-slate-400 font-mono">{fmtDateTime(lastEvent.startAt)}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {lastEvent.participantKeys.map((k, i) => (
                <PersonChip
                  key={k}
                  name={lastEvent.participantsDisplay[i]}
                  onClick={() => onSelectPerson(k)}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No event with Podo found.</p>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle>Most linked contact</SectionTitle>
        {mostLinked ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-base font-medium">{mostLinked.displayName}</p>
            <p className="text-xs text-slate-400">
              appears with Podo in{' '}
              <span className="text-slate-200 font-semibold tabular-nums">{mostLinked.count}</span>{' '}
              records
            </p>
            <div className="pt-1">
              <PersonChip name={`Open ${mostLinked.displayName}`} onClick={() => onSelectPerson(mostLinked.key)} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No co-occurrences yet.</p>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle>Top investigation leads</SectionTitle>
        {topLeads.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No signals surfaced.</p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {topLeads.map((p) => (
              <li key={p.person.key} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPerson(p.person.key)}
                  className="flex items-center gap-2 text-left hover:text-amber-300"
                >
                  <span className="text-sm font-medium">{p.person.displayName}</span>
                  <span className="text-[10px] text-slate-500">
                    {p.signals.length} signal{p.signals.length === 1 ? '' : 's'} ·{' '}
                    {p.linkedEvidenceCount} linked
                  </span>
                </button>
                <SignalPill weight={p.signalScore} />
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 text-[10px] text-slate-500 italic">
          Investigation aid · not a verdict.
        </p>
      </Card>
    </div>
  );
}
