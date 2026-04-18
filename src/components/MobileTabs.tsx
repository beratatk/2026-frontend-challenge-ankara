export type MobileTab = 'people' | 'records' | 'detail';

type Props = {
  tab: MobileTab;
  onChange: (t: MobileTab) => void;
  peopleCount: number;
  recordCount: number;
  hasSelection: boolean;
};

/**
 * Three-tab switcher for sub-md viewports. Hidden at md+.
 */
export function MobileTabs({
  tab,
  onChange,
  peopleCount,
  recordCount,
  hasSelection,
}: Props) {
  return (
    <nav
      role="tablist"
      aria-label="Mobile navigation"
      className="md:hidden grid grid-cols-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur"
    >
      <TabButton active={tab === 'people'} onClick={() => onChange('people')}>
        <span>People</span>
        <Counter n={peopleCount} />
      </TabButton>
      <TabButton active={tab === 'records'} onClick={() => onChange('records')}>
        <span>Records</span>
        <Counter n={recordCount} />
      </TabButton>
      <TabButton active={tab === 'detail'} onClick={() => onChange('detail')}>
        <span>Detail</span>
        {hasSelection && (
          <span
            aria-label="selection active"
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
          />
        )}
      </TabButton>
    </nav>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-3 py-2.5 text-xs inline-flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
        active
          ? 'text-amber-300 border-amber-400'
          : 'text-slate-400 border-transparent hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function Counter({ n }: { n: number }) {
  return (
    <span className="text-[10px] text-slate-500 tabular-nums">{n}</span>
  );
}
