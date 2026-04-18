import type { SourceLoadState } from '@/hooks/useInvestigation';
import { SOURCE_LABEL } from '@/components/atoms';

type Props = {
  failedSources: SourceLoadState[];
  isRetrying: boolean;
  onRetry: () => void;
};

export function ErrorScreen({ failedSources, isRetrying, onRetry }: Props) {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="max-w-md w-full rounded-lg border border-rose-500/40 bg-rose-500/5 p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-rose-300 font-semibold">
          All sources failed
        </p>
        <h1 className="text-lg font-semibold tracking-tight mt-1 text-rose-200">
          Couldn't load investigation data
        </h1>

        <ul className="mt-4 space-y-1.5 text-sm">
          {failedSources.map((s) => (
            <li key={s.source} className="flex items-start gap-2">
              <span className="text-rose-300 leading-6">•</span>
              <div className="min-w-0">
                <span className="text-slate-100 font-medium">
                  {SOURCE_LABEL[s.source]}
                </span>{' '}
                <span className="text-slate-400">
                  — {s.error?.message ?? 'unknown error'}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="rounded-md px-3 py-1.5 text-sm font-medium bg-rose-500/90 text-slate-50 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-wait"
          >
            {isRetrying ? 'Retrying…' : 'Retry all sources'}
          </button>
          <p className="text-xs text-slate-400">
            Check API keys in <code className="text-slate-200">.env.local</code> if this persists.
          </p>
        </div>
      </div>
    </div>
  );
}
