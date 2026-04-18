import type { InvestigationRecord } from '@/types/records';
import { ConfidenceBadge, PersonChip, SourceBadge, UrgencyBadge } from '@/components/atoms';
import { fmtDateTime, recordTitle } from '@/lib/format';

type Props = {
  record: InvestigationRecord;
  selected?: boolean;
  activePersonKey?: string | null;
  activeLocation?: string | null;
  onSelect: (id: string) => void;
  onSelectPerson: (key: string) => void;
  onSelectLocation: (loc: string) => void;
};

export function RecordCard({
  record: r,
  selected,
  activePersonKey,
  activeLocation,
  onSelect,
  onSelectPerson,
  onSelectLocation,
}: Props) {
  return (
    <article
      onClick={() => onSelect(r.id)}
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
        selected
          ? 'border-amber-400/60 bg-amber-400/5'
          : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <SourceBadge source={r.source} />
        <span className="text-slate-400 font-mono">{fmtDateTime(r.timestamp)}</span>
        {r.location && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectLocation(r.location!);
            }}
            className={`underline-offset-2 hover:underline hover:text-amber-300 ${
              activeLocation?.toLowerCase() === r.location.toLowerCase()
                ? 'text-amber-300'
                : 'text-slate-400'
            }`}
          >
            · {r.location}
          </button>
        )}
        {r.extra.urgency && <UrgencyBadge value={r.extra.urgency} />}
        {r.extra.confidence && <ConfidenceBadge value={r.extra.confidence} />}
      </div>

      <p className="mt-1.5 text-sm font-medium text-slate-100">{recordTitle(r)}</p>

      {r.personsDisplay.length > 0 && (
        <div
          className="mt-1.5 flex flex-wrap gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {r.personsDisplay.map((name, i) => {
            const key = r.personRefs[i];
            return (
              <PersonChip
                key={key}
                name={name}
                seed={key}
                active={activePersonKey === key}
                onClick={() => onSelectPerson(key)}
              />
            );
          })}
        </div>
      )}

      {r.content && (
        <p className="mt-2 text-sm text-slate-300 line-clamp-2">{r.content}</p>
      )}
    </article>
  );
}
