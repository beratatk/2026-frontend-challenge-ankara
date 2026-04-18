import type { SourceLoadState } from '@/hooks/useInvestigation';
import { SOURCE_LABEL } from '@/components/atoms';

type Props = {
  failedSources: SourceLoadState[];
  isRetrying: boolean;
  onRetry: () => void;
};

export function PartialFailureBanner({ failedSources, isRetrying, onRetry }: Props) {
  if (failedSources.length === 0) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 flex items-center gap-3 text-sm">
      <span className="text-amber-300 text-base leading-none" aria-hidden>
        ⚠
      </span>
      <p className="text-amber-100">
        Showing partial data — {failedSources.length}{' '}
        source{failedSources.length === 1 ? '' : 's'} failed to load:{' '}
        <span className="text-amber-200 font-medium">
          {failedSources.map((s) => SOURCE_LABEL[s.source]).join(', ')}
        </span>
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="ml-auto text-xs text-amber-200 hover:text-amber-100 underline underline-offset-2 disabled:opacity-60 disabled:cursor-wait"
      >
        {isRetrying ? 'retrying…' : 'retry failed'}
      </button>
    </div>
  );
}
