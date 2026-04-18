import { useEffect, useState } from 'react';
import type { InsightBundle } from '@/lib/insights';
import type { Filters } from '@/lib/filter';
import type { RecordSource } from '@/types/records';
import { SUBJECT_KEY } from '@/lib/linking';
import { Card, SectionTitle, SignalPill } from '@/components/atoms';

type Props = {
  insights: InsightBundle;
  onSelectPerson: (key: string) => void;
  onApplyFilters: (partial: Partial<Filters>) => void;
};

const STORAGE_KEY = 'podo:insights-open';

export function SummaryStrip({
  insights,
  onSelectPerson,
  onApplyFilters,
}: Props) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored !== 'false';
      // Default: expanded on sm+ (enough vertical space), collapsed on mobile
      // so the Feed below stays visible. User's toggle is then persisted.
      return typeof window !== 'undefined'
        ? window.matchMedia('(min-width: 640px)').matches
        : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [open]);

  const { mostLinked, topLead, podoSightings, corroboratedTips } = insights;

  return (
    <section className="relative border-b border-slate-800">
      <InsightsHeader open={open} insights={insights} />
      {open && (
        <div
          id="insights-grid"
          className="
            grid auto-rows-fr gap-3
            px-4 sm:px-6 pb-3 sm:pb-4
            grid-flow-col auto-cols-[80%] overflow-x-auto snap-x snap-mandatory
            sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:snap-none
            lg:grid-cols-4
          "
        >
          {/* Most linked contact */}
          <InsightCard title="Most linked contact">
            {mostLinked ? (
              <>
                <p className="text-base font-semibold">{mostLinked.displayName}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  appears with Podo{' '}
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {mostLinked.count}
                  </span>
                  × across records
                </p>
                <CardLink onClick={() => onSelectPerson(mostLinked.key)}>
                  open profile →
                </CardLink>
              </>
            ) : (
              <EmptyNote>No co-occurrences yet.</EmptyNote>
            )}
          </InsightCard>

          {/* Highest investigation score */}
          <InsightCard title="Highest investigation score">
            {topLead ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold truncate">
                    {topLead.profile.person.displayName}
                  </p>
                  <SignalPill weight={topLead.profile.signalScore} />
                </div>
                {topLead.profile.signals[0] && (
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {topLead.profile.signals[0].label}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-1 tabular-nums">
                  {topLead.profile.linkedEvidenceCount} linked evidence ·{' '}
                  {topLead.totalWithSignals}{' '}
                  {topLead.totalWithSignals === 1 ? 'person has' : 'people have'} signals
                </p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <CardLink onClick={() => onSelectPerson(topLead.profile.person.key)}>
                    open profile →
                  </CardLink>
                  <span className="text-[9px] italic text-slate-500">aid, not verdict</span>
                </div>
              </>
            ) : (
              <EmptyNote>No suspicion signals raised.</EmptyNote>
            )}
          </InsightCard>

          {/* Sightings of Podo */}
          <InsightCard title="Sightings of Podo">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold tabular-nums">{podoSightings.count}</p>
              <p className="text-xs text-slate-400">
                sighting{podoSightings.count === 1 ? '' : 's'}
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {podoSightings.locations} location{podoSightings.locations === 1 ? '' : 's'} ·{' '}
              {podoSightings.witnesses} witness{podoSightings.witnesses === 1 ? '' : 'es'}
            </p>
            {podoSightings.count > 0 && (
              <CardLink
                onClick={() =>
                  onApplyFilters({
                    sources: new Set<RecordSource>(['sighting']),
                    personKey: SUBJECT_KEY,
                  })
                }
              >
                filter sightings →
              </CardLink>
            )}
          </InsightCard>

          {/* Corroborated tips */}
          <InsightCard title="Corroborated tips">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold tabular-nums">
                {corroboratedTips.corroborated}
                <span className="text-slate-500 text-base font-normal">
                  {' '}/ {corroboratedTips.total}
                </span>
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              tips whose suspect shares an event with Podo
            </p>
            {corroboratedTips.total === 0 ? (
              <p className="text-[10px] text-slate-500 mt-1">No tips submitted yet.</p>
            ) : (
              <CardLink
                onClick={() =>
                  onApplyFilters({ sources: new Set<RecordSource>(['tip']) })
                }
              >
                filter tips →
              </CardLink>
            )}
          </InsightCard>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="insights-grid"
        aria-label={open ? 'Collapse key insights' : 'Expand key insights'}
        className="
          absolute left-1/2 -translate-x-1/2 translate-y-1/2 bottom-0 z-10
          inline-flex items-center justify-center w-7 h-7 rounded-full
          bg-slate-950 border border-slate-800 text-slate-400
          hover:text-amber-300 hover:border-slate-600
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60
          transition-colors
        "
      >
        <Chevron open={open} />
      </button>
    </section>
  );
}

// --------------------------- tiny internal helpers ---------------------------

function InsightsHeader({
  open,
  insights,
}: {
  open: boolean;
  insights: InsightBundle;
}) {
  const summary = buildSummary(insights);
  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-2">
      <span className="text-[10px] uppercase tracking-[0.14em] text-amber-400/80 font-semibold shrink-0">
        Key insights
      </span>
      {!open && summary && (
        <span className="hidden sm:block text-[11px] text-slate-400 truncate min-w-0">
          · {summary}
        </span>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={`w-3 h-3 transition-transform ${open ? '' : 'rotate-180'}`}
      fill="none"
    >
      <path
        d="M3 7.5 6 4.5 9 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildSummary(insights: InsightBundle): string | null {
  const parts: string[] = [];
  if (insights.topLead) {
    parts.push(`Top lead ${insights.topLead.profile.person.displayName}`);
  }
  if (insights.podoSightings.count > 0) {
    parts.push(
      `${insights.podoSightings.count} sighting${insights.podoSightings.count === 1 ? '' : 's'}`,
    );
  }
  if (insights.mostLinked) {
    parts.push(`Most linked ${insights.mostLinked.displayName}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

function InsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-3.5 flex flex-col snap-start min-w-0">
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-2 flex flex-col flex-1 min-h-0">{children}</div>
    </Card>
  );
}

function CardLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-auto self-start pt-2 text-[11px] text-amber-300 hover:underline"
    >
      {children}
    </button>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}
