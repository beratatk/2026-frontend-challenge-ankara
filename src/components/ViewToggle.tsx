export type ViewMode = 'feed' | 'timeline' | 'map';

type Props = {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  subjectName: string | null;
  feedCount: number;
  timelineCount: number;
  mapCount: number;
};

export function ViewToggle({
  mode,
  onChange,
  subjectName,
  feedCount,
  timelineCount,
  mapCount,
}: Props) {
  return (
    <div className="inline-flex self-center rounded-md border border-slate-800 bg-slate-900/70 p-0.5">
      <Tab active={mode === 'feed'} onClick={() => onChange('feed')}>
        All records
        <Counter n={feedCount} />
      </Tab>
      <Tab
        active={mode === 'timeline'}
        onClick={() => onChange('timeline')}
        disabled={!subjectName}
        title={subjectName ? undefined : 'Subject not found in data'}
      >
        {subjectName ? `${subjectName} timeline` : 'Timeline'}
        <Counter n={timelineCount} />
      </Tab>
      <Tab
        active={mode === 'map'}
        onClick={() => onChange('map')}
        disabled={mapCount === 0}
        title={mapCount === 0 ? 'No geolocated records' : undefined}
      >
        Map
        <Counter n={mapCount} />
      </Tab>
    </div>
  );
}

function Tab({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1 text-xs rounded transition-colors inline-flex items-center gap-1.5 ${
        active
          ? 'bg-slate-800 text-slate-100'
          : 'text-slate-400 hover:text-slate-200'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Counter({ n }: { n: number }) {
  return (
    <span className="tabular-nums text-[10px] opacity-60">{n}</span>
  );
}
