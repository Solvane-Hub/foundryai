'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Chip } from '@/components/ui/choice';
import { SurfaceLabel } from '@/components/ui/workspace-surface';
import { NovaAnswerPanel } from '@/components/ui/nova-answer';
import { NovaActivity, useNovaActivity } from '@/components/nova/nova-activity';
import { NovaComposer } from '@/components/nova/nova-composer';
import { NovaLanding } from '@/components/nova/nova-landing';
import { NovaStateProvider } from '@/components/nova/nova-state';
import { NovaThread } from '@/components/nova/nova-thread';
import { AnswerFeedback } from '@/components/nova/answer-feedback';
import { appendInvestigation, priorEntries, type NovaThread as Thread } from '@/lib/nova/thread';
import type { Result } from '@/lib/errors';
import type { NovaAnswerView } from '@/types/nova';
import { askNovaAction } from '../actions';

/**
 * The Nova workspace.
 *
 * ## An investigation, not a conversation
 *
 * There is no transcript. A running conversation would imply Nova carries
 * memory across turns, and it does not — each answer is an independent
 * retrieval run against the published sources (ADR-0017: "Conversation is
 * never evidence"). A chat history would be a UI promise the service does not
 * keep, and the first step toward someone deciding it should.
 *
 * What replaces it is the **investigation thread**: the questions asked in this
 * tab stay visible as a record of work, each collapsed to its question and its
 * counts, each re-runnable. Re-running performs a complete fresh search. See
 * `lib/nova/thread.ts` for the full account of why a log of independent
 * investigations is a different object from a conversation, and how the code
 * keeps them from converging.
 *
 * ## The mental model
 *
 *     ASK  →  INVESTIGATE  →  UNDERSTAND  →  FOLLOW THE NEXT THREAD
 *
 * not
 *
 *     MESSAGE  →  RESPONSE  →  MESSAGE
 *
 * The composer says "Investigate", the activity states describe searching
 * rather than replying, the result is laid out as a research finding with its
 * evidence attached, and Nova closes by naming a document this answer cites and
 * asking whether to trace it — an investigator following a lead, not a chatbot
 * waiting for a turn.
 *
 * Client Component because it owns form state, composer state and the activity
 * sequence. It makes no data-access call of its own; everything arrives as a
 * plain value from the server action.
 */

/**
 * Starting points.
 *
 * Secondary to the composer, always. The founder can ask anything, and these
 * exist to show what kinds of question the corpus supports rather than to
 * funnel anyone into a template.
 *
 * ⚠ Each is answerable by the published corpus for a jurisdiction that has
 *   one. Offering a question the sources cannot answer would be the "implied
 *   capability" failure AI-14 §6 exists to prevent — a suggestion reads as a
 *   promise.
 */
const STARTING_POINTS = [
  { topic: 'Licences', question: 'What licence do I need to sell prepared food?' },
  { topic: 'Registration', question: 'When do I have to register my business?' },
  { topic: 'Reporting', question: 'When must I submit an annual return?' },
  { topic: 'Records', question: 'What records am I required to keep?' },
] as const;

/**
 * A question the sources deliberately do NOT answer.
 *
 * Kept separate and labelled, because the two are different offers: the
 * starting points say "we can answer this", and this one says "watch what
 * happens when we cannot". Refusal is a designed output (A5, AI-14 §8), and a
 * system that only ever demonstrates its successes has not demonstrated the
 * property that matters most.
 */
const BOUNDARY_EXAMPLE = 'What is the VAT rate in The Bahamas?';

export function NovaConsole({
  businessName,
  knowledgeLine,
}: {
  businessName: string;
  knowledgeLine: string | null;
}) {
  const [state, formAction, pending] = useActionState<Result<NovaAnswerView> | null, FormData>(
    askNovaAction,
    null,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState('');
  /**
   * Completed investigations, oldest first.
   *
   * ⚠ React state only. Never persisted, never sent anywhere, never read back
   *   into a query. See `lib/nova/thread.ts`.
   */
  const [thread, setThread] = useState<Thread>([]);
  /** The last question added to `thread`, so it is added exactly once. */
  const [lastRecorded, setLastRecorded] = useState<string | null>(null);

  const answer = state?.ok ? state.data : null;
  const activity = useNovaActivity({ pending, answer, composing: draft.trim().length > 0 });

  // Move focus to the result once it lands. Without this a keyboard or screen
  // reader user stays parked on the composer while the answer renders below
  // them, and `aria-live` alone announces it without letting them reach it.
  useEffect(() => {
    if (state && !pending) resultRef.current?.focus();
  }, [state, pending]);

  /**
   * Record the question AFTER it resolves, so a rejected or rate-limited
   * attempt never enters the list as though it were research.
   *
   * Adjusted during render rather than in an effect — the pattern React
   * documents for deriving state from a changing input. An effect would
   * commit a render, then immediately schedule another, and the founder would
   * briefly see an answer whose question is not yet listed beneath it.
   */
  if (answer?.question && answer.question !== lastRecorded) {
    setLastRecorded(answer.question);
    setThread((current) => appendInvestigation(current, answer));
  }

  /**
   * Put a question in the composer and submit it.
   *
   * It lands in the field visibly first, so the founder can read exactly what
   * is being asked, and then goes through the identical path a typed question
   * takes: validation, rate limiting, retrieval, extraction, citation
   * grounding, execution recording. Nothing is carried over from a previous
   * answer except the words now in the box.
   */
  const investigate = (question: string) => {
    if (!inputRef.current || !formRef.current) return;
    inputRef.current.value = question;
    setDraft(question);
    formRef.current.requestSubmit();
  };

  const fieldError = state && !state.ok ? state.fieldErrors?.question?.[0] : undefined;
  const started = Boolean(state) || pending;

  /*
    A reading measure for the parts that are prose.

    The page now spans the full shell so the answer and its evidence can sit
    side by side. The composer and the landing are still writing and reading,
    and a text field stretched across 72rem is unusable — so they keep a
    measure of their own, aligned to the left edge where the focus column
    starts.
  */
  const composer = (
    <form ref={formRef} action={formAction} className="flex max-w-3xl flex-col gap-4">
      <NovaComposer
        inputRef={inputRef}
        disabled={pending}
        {...(fieldError ? { error: fieldError } : {})}
        onChangeText={setDraft}
      />

      {!started ? (
        <div className="flex flex-col gap-3 px-1">
          <SurfaceLabel as="p" className="text-on-glass-subtle">
            Or start here
          </SurfaceLabel>

          <ul className="flex flex-wrap gap-2">
            {STARTING_POINTS.map((point) => (
              <li key={point.question}>
                <Chip onClick={() => investigate(point.question)} title={point.question}>
                  {point.topic}
                </Chip>
              </li>
            ))}
            <li>
              {/*
                Dashed, so it reads as deliberately different before it is read
                at all. This one demonstrates the boundary.
              */}
              <Chip
                tone="outline"
                onClick={() => investigate(BOUNDARY_EXAMPLE)}
                title={BOUNDARY_EXAMPLE}
              >
                Something we don&rsquo;t cover
              </Chip>
            </li>
          </ul>
        </div>
      ) : null}
    </form>
  );

  return (
    <NovaStateProvider state={activity.state}>
      <div className="flex flex-col gap-6 sm:gap-8">
        {!started ? (
          <NovaLanding businessName={businessName} knowledgeLine={knowledgeLine}>
            {composer}
          </NovaLanding>
        ) : (
          <>
            {/*
              Once a question has been asked, the mark moves to the top of the
              surface and becomes the activity anchor — scattered while
              searching, converged when the answer lands. That transition is the
              fragmentation story, told by the interface rather than by a
              diagram.
            */}
            <NovaActivity
              state={activity.state}
              status={activity.status}
              className="max-w-3xl px-1"
            />
            {composer}
          </>
        )}

        <div
          ref={resultRef}
          // Focusable but not in the tab order: focus is moved here
          // programmatically when a result arrives, and Tab continues past it.
          tabIndex={-1}
          className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {!pending && state && !state.ok ? (
            <Alert tone="error" title="Nova could not answer that">
              {state.message}
            </Alert>
          ) : null}

          {!pending && answer ? (
            <div className="flex flex-col gap-5">
              {/*
                The answer owns its own continuation now. Nova names the next
                document in prose and asks whether to trace it, and the rest of
                the threads sit in the contextual rail — rather than a row of
                buttons bolted underneath, which reads as a menu the product
                chose rather than a lead the evidence produced.
              */}
              <NovaAnswerPanel answer={answer} onContinue={investigate} />

              <AnswerFeedback />
            </div>
          ) : null}
        </div>

        {/*
          The record of work. Collapsed, labelled as independent
          investigations, and re-runnable — never a transcript.
        */}
        <NovaThread
          entries={priorEntries(thread)}
          onRerun={investigate}
          disabled={pending}
          className="max-w-3xl"
        />
      </div>
    </NovaStateProvider>
  );
}
