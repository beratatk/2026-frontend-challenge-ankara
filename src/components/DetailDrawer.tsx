import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Slide-over drawer for the DetailPane on md breakpoints (768–1023px).
 * Hidden on lg (DetailPane is inline there) and on sm (tab-switched there).
 */
export function DetailDrawer({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="hidden md:block lg:hidden">
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40"
      />
      <aside
        role="dialog"
        aria-label="Detail"
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col p-4 overflow-hidden"
      >
        {children}
      </aside>
    </div>
  );
}
