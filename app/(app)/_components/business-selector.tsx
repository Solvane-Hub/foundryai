'use client';

import { useRef } from 'react';
import type { BusinessSummary } from '@/types/business';
import { selectBusinessAction } from '../actions';

/**
 * Switches the active business.
 *
 * A form submit rather than client-side state: the selection lives in a cookie
 * read by Server Components, so the server must be told. Progressive
 * enhancement means it still works without JavaScript.
 */
export function BusinessSelector({
  businesses,
  currentId,
}: {
  businesses: BusinessSummary[];
  currentId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  if (businesses.length <= 1) return null;

  return (
    <form ref={formRef} action={selectBusinessAction}>
      <label htmlFor="business-selector" className="sr-only">
        Current business
      </label>
      <select
        id="business-selector"
        name="businessId"
        defaultValue={currentId}
        onChange={() => formRef.current?.requestSubmit()}
        className="border-border bg-surface text-foreground h-9 max-w-[16rem] rounded-md border px-2 text-sm"
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="ml-2 text-sm underline">
          Switch
        </button>
      </noscript>
    </form>
  );
}
