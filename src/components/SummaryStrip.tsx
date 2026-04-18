import type { InsightBundle } from '@/lib/insights';
import type { Filters } from '@/lib/filter';
import type { RecordSource } from '@/types/records';
import { SUBJECT_KEY } from '@/lib/linking';
import { SignalPill } from '@/components/atoms';
import { FactBlock } from '@/components/HeroCard';

type Props = {
  insights: InsightBundle;
  onSelectPerson: (key: string) => void;
  onApplyFilters: (partial: Partial<Filters>) => void;
  open: boolean;
};

export function SummaryStrip({
  insights,
  onSelectPerson,
  onApplyFilters,
  open,
}: Props) {
  const { mostLinked, topLead, podoSightings, corroboratedTips } = insights;

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
      <div
        id="insights-grid"
        className="
          pt-3 border-t border-slate-800/60
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
          gap-3 sm:gap-5
        "
      >
      <FactBlock label="Most linked contact">
        {mostLinked ? (
          <>
            <p className="text-sm font-medium truncate">{mostLinked.displayName}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              appears with Podo{' '}
              <span className="text-slate-300 tabular-nums font-semibold">
                {mostLinked.count}
              </span>
              × across records
            </p>
            <InlineLink onClick={() => onSelectPerson(mostLinked.key)}>
              open profile →
            </InlineLink>
          </>
        ) : (
          <EmptyNote>No co-occurrences yet.</EmptyNote>
        )}
      </FactBlock>

      <FactBlock label="Highest investigation score">
        {topLead ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-medium truncate">
                {topLead.profile.person.displayName}
              </p>
              <SignalPill weight={topLead.profile.signalScore} />
            </div>
            {topLead.profile.signals[0] && (
              <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
                {topLead.profile.signals[0].label}
              </p>
            )}
            <InlineLink onClick={() => onSelectPerson(topLead.profile.person.key)}>
              open profile →
            </InlineLink>
          </>
        ) : (
          <EmptyNote>No suspicion signals raised.</EmptyNote>
        )}
      </FactBlock>

      <FactBlock label="Sightings of Podo">
        <p className="text-sm tabular-nums">
          <span className="text-slate-100 font-semibold">{podoSightings.count}</span>{' '}
          <span className="text-slate-400">
            sighting{podoSightings.count === 1 ? '' : 's'}
          </span>
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500 tabular-nums">
          {podoSightings.locations} location{podoSightings.locations === 1 ? '' : 's'} ·{' '}
          {podoSightings.witnesses} witness{podoSightings.witnesses === 1 ? '' : 'es'}
        </p>
        {podoSightings.count > 0 && (
          <InlineLink
            onClick={() =>
              onApplyFilters({
                sources: new Set<RecordSource>(['sighting']),
                personKey: SUBJECT_KEY,
              })
            }
          >
            filter sightings →
          </InlineLink>
        )}
      </FactBlock>

      <FactBlock label="Corroborated tips">
        <p className="text-sm tabular-nums">
          <span className="text-slate-100 font-semibold">
            {corroboratedTips.corroborated}
          </span>
          <span className="text-slate-500"> / {corroboratedTips.total}</span>
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">
          tips whose suspect shares an event with Podo
        </p>
        {corroboratedTips.total === 0 ? (
          <p className="mt-1 text-[10px] text-slate-500">No tips submitted yet.</p>
        ) : (
          <InlineLink
            onClick={() => onApplyFilters({ sources: new Set<RecordSource>(['tip']) })}
          >
            filter tips →
          </InlineLink>
        )}
      </FactBlock>
      </div>
        </div>
      </div>
    </div>
  );
}

function InlineLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 text-[11px] text-amber-300 hover:underline"
    >
      {children}
    </button>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-slate-500">{children}</p>;
}
