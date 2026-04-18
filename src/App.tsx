import { useInvestigation } from '@/hooks/useInvestigation';

export default function App() {
  const { records, people, events, profiles, subject, podoTimeline, isLoading, error } =
    useInvestigation();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-400">
        Loading investigation data…
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center text-rose-400 p-8">
        <div>
          <p className="font-semibold">Failed to load data</p>
          <p className="text-sm opacity-80">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-8 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Missing Podo — Ankara Case</h1>
        <p className="mt-1 text-slate-400 text-sm">
          Investigation aid · {records.length} records · {people.size} people · {events.length} events
        </p>
      </header>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Subject</h2>
        <div className="rounded border border-slate-800 bg-slate-900/50 p-4">
          {subject ? (
            <>
              <p className="text-lg font-medium">{subject.displayName}</p>
              <p className="text-sm text-slate-400">
                {subject.recordCount} records ·{' '}
                first seen {subject.firstSeen?.toLocaleString('tr-TR') ?? '—'} ·{' '}
                last seen {subject.lastSeen?.toLocaleString('tr-TR') ?? '—'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Top locations: {subject.locations.slice(0, 4).map((l) => `${l.name} (${l.count})`).join(' · ') || '—'}
              </p>
            </>
          ) : (
            <p className="text-slate-400">Subject "Podo" not found in records.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
          Investigation indicators (ranked — not a verdict)
        </h2>
        <ul className="space-y-3">
          {profiles.slice(0, 8).map((p) => (
            <li key={p.person.key} className="rounded border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-medium">{p.person.displayName}</p>
                <p className="text-xs text-slate-400">
                  signal score {p.signalScore} · {p.linkedEvidenceCount} linked records
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {p.person.recordCount} records · last seen{' '}
                {p.person.lastSeen?.toLocaleString('tr-TR') ?? '—'}
              </p>
              {p.signals.length === 0 ? (
                <p className="text-xs text-slate-500 mt-2">No signals matched.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {p.signals.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="inline-block text-xs font-mono text-amber-300 shrink-0 w-10">
                        +{s.weight}
                      </span>
                      <span>
                        <span className="text-slate-100">{s.label}</span>
                        {s.detail && (
                          <span className="text-slate-400"> — {s.detail}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
          Podo timeline ({podoTimeline.length} events)
        </h2>
        <ol className="space-y-2">
          {podoTimeline.map((e) => (
            <li key={e.id} className="rounded border border-slate-800 bg-slate-900/50 p-3 text-sm">
              <p className="font-mono text-xs text-slate-400">
                {e.startAt.toLocaleString('tr-TR')}
                {e.endAt.getTime() !== e.startAt.getTime() && ` – ${e.endAt.toLocaleTimeString('tr-TR')}`}
              </p>
              <p>
                <span className="font-medium">{e.location}</span>
                <span className="text-slate-400">
                  {' '}· with {e.participantsDisplay.filter((n) => n !== subject?.displayName).join(', ') || '—'}
                </span>
              </p>
              <p className="text-xs text-slate-500">{e.records.length} records · sources: {[...new Set(e.records.map((r) => r.source))].join(', ')}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
