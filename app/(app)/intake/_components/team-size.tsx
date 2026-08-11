'use client';

import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * How many people, as a dial rather than a spinner.
 *
 * The number input IS the display — there is no second element mirroring it,
 * so there is nothing to fall out of sync and `getByLabel(...).fill()` still
 * addresses the real control. The input stays uncontrolled; the buttons write
 * to it through a ref and fire the events React and the browser expect.
 *
 * Native `type="number"` is kept: it brings the numeric keypad on mobile, the
 * arrow keys, and the `min` constraint for free. The buttons exist because
 * tapping a 12px spinner arrow on a phone is not a real interaction.
 */
export function TeamSize({
  id,
  name,
  defaultValue,
  min = 0,
  ...aria
}: {
  id: string;
  name: string;
  defaultValue: number;
  min?: number;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function nudge(delta: number) {
    const el = ref.current;
    if (!el) return;
    const next = Math.max(min, (Number(el.value) || 0) + delta);
    // `set` through the prototype so React's synthetic onChange would fire too
    // if this control is ever made controlled.
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, String(next));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  }

  return (
    <div className="border-border-control bg-surface focus-within:border-brand focus-within:ring-brand/30 flex w-fit items-center gap-1 rounded-2xl border p-2 transition-colors duration-150 focus-within:ring-[3px]">
      <Nudge label="Fewer people" onClick={() => nudge(-1)} icon={Minus} />
      <input
        {...aria}
        ref={ref}
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        defaultValue={defaultValue}
        required
        data-numeric
        className="text-on-ink w-24 [appearance:textfield] border-0 bg-transparent text-center text-4xl font-semibold tracking-[-0.03em] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Nudge label="More people" onClick={() => nudge(1)} icon={Plus} />
    </div>
  );
}

function Nudge({
  label,
  onClick,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Plus;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="text-on-ink-muted hover:text-on-ink flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 hover:bg-white/8"
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={2} />
    </button>
  );
}
