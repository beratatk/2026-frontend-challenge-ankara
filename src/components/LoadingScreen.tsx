import type { SourceLoadState } from '@/hooks/useInvestigation';
import { SOURCE_LABEL } from '@/components/atoms';

export function LoadingScreen({ sourceStatus }: { sourceStatus: SourceLoadState[] }) {
  const settled = sourceStatus.filter((s) => s.status !== 'loading').length;
  const total = sourceStatus.length;
  const pct = total === 0 ? 0 : Math.round((settled / total) * 100);

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="max-w-sm w-full rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80 font-semibold">
          Preparing investigation
        </p>
        <h1 className="text-lg font-semibold tracking-tight mt-1">
          Loading data sources…
        </h1>

        <ul className="mt-4 space-y-2">
          {sourceStatus.map((s) => (
            <li key={s.source} className="flex items-center gap-2.5 text-sm">
              <StatusDot status={s.status} />
              <span className={s.status === 'loading' ? 'text-slate-400' : 'text-slate-100'}>
                {SOURCE_LABEL[s.source]}
              </span>
              <span className="ml-auto text-xs text-slate-500 tabular-nums">
                {s.status === 'success'
                  ? `${s.count} records`
                  : s.status === 'error'
                  ? 'failed'
                  : ''}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 h-1 rounded bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-slate-500 tabular-nums">
          {settled} of {total} sources ready
        </p>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: SourceLoadState['status'] }) {
  if (status === 'loading') {
    return (
      <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin" />
    );
  }
  if (status === 'error') {
    return (
      <span className="w-3.5 h-3.5 rounded-full bg-rose-500/80 grid place-items-center text-[9px] text-slate-950 font-bold">
        ×
      </span>
    );
  }
  return (
    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 grid place-items-center text-[9px] text-slate-950 font-bold">
      ✓
    </span>
  );
}
