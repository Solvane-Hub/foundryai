import { cn } from '@/lib/utils/cn';

/**
 * The light working panel, floating in the environment.
 *
 * Forms, settings and intake stay on the warm canvas — they are long-form
 * reading and typing, and a founder should not fill in five questions on
 * water. What changes is that the canvas is now a panel with the environment
 * visible around it, rather than a full-bleed background.
 *
 * The layout deliberately does NOT apply this. If it did, every route would
 * inherit a light surface and the dashboard could not compose on the
 * environment. Each route opts in, which also keeps the global tokens intact
 * inside it — `WorkspaceCanvas` is the absence of `.workspace-env`.
 */
export function WorkspaceCanvas({
  children,
  className,
  /** Wider than prose, for pages that lay out in columns. */
  width = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  width?: 'default' | 'wide';
}) {
  return (
    <div
      className={cn(
        'bg-canvas shadow-glass rounded-2xl border border-white/8 sm:rounded-3xl',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12',
          width === 'wide' ? 'max-w-5xl' : 'max-w-3xl',
        )}
      >
        {children}
      </div>
    </div>
  );
}
