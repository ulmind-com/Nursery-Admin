import { useEffect, useRef, useState } from "react";
import { playBonk, playDing, playGulp, playThunk } from "../sfx";

/* "The bin eats the label."
 *
 * Press it and the lid flips open, the letters of the label peel off one at a
 * time and drop into the bin, the pill shrinks to a disc behind them, the lid
 * shuts, and a ring runs while the request is in flight. The ring is the real
 * wait — it starts when the letters have landed and only completes when the
 * server answers, so the animation never pretends the work is done.
 *
 * On failure the bin spits the label back out and the row stays put.
 *
 * `onDelete` should do nothing but the destructive request. Refreshing the
 * list belongs in `onDone`, which fires once the animation has played out —
 * reload inside `onDelete` and the row is pulled out from under the button
 * while the bin is still chewing.
 */

type State = "idle" | "eating" | "pending" | "done" | "error";

const LETTER_STEP = 62; // ms between one letter leaving and the next
const LETTER_FLIGHT = 420; // ms a single letter spends in the air
const SEAL = 180; // ms for the lid to drop once the last letter is in
/* A flash of a spinner is worse than no spinner, so the ring always gets a
   full turn even when the server answers immediately. */
const MIN_RING = 620;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function DeleteButton({
  label = "Delete",
  onDelete,
  onDone,
  confirm: confirmMessage,
  className = "",
  title,
}: {
  label?: string;
  /** The destructive request, and nothing else. Reject to bounce back to idle. */
  onDelete: () => Promise<unknown> | unknown;
  /** Fired after the success animation — refresh the list from here. */
  onDone?: () => void;
  /** Shown in a confirm() before anything animates. Omit to delete straight away. */
  confirm?: string;
  className?: string;
  title?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const alive = useRef(true);

  /* React runs effects twice in development, so the cleanup from the throwaway
     first mount would otherwise leave this false for good and every run would
     bail out halfway. Claim it again on each mount. */
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const chars = [...label];
  const reduced =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const run = async () => {
    if (state !== "idle") return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const node = buttonRef.current;

    /* Freeze the pill's real width before it starts shrinking — `width: auto`
       has nothing to animate from. */
    if (node) node.style.setProperty("--gulp-w", `${node.offsetWidth}px`);

    setState("eating");

    // The request leaves with the press; the chewing is not a fake delay.
    const request = Promise.resolve().then(onDelete);
    // Swallow the rejection here so a slow chew can't trip an unhandled
    // rejection before the catch below is reached.
    request.catch(() => undefined);

    if (!reduced) {
      for (let i = 0; i < chars.length; i += 1) {
        playGulp(i, chars.length);
        node?.style.setProperty("--gulp-p", String((i + 1) / chars.length));
        await sleep(LETTER_STEP);
      }
      await sleep(LETTER_FLIGHT - LETTER_STEP);
      playThunk();
      await sleep(SEAL);
    } else {
      node?.style.setProperty("--gulp-p", "1");
    }

    if (!alive.current) return;
    setState("pending");
    const ringStart = Date.now();

    try {
      await request;
      const spent = Date.now() - ringStart;
      if (spent < MIN_RING) await sleep(MIN_RING - spent);
      if (!alive.current) return;
      playDing();
      setState("done");
      await sleep(620);
      if (!alive.current) return;
      onDone?.();
      /* The parent normally unmounts this row now. If it doesn't — a soft
         delete, say — fall back to the pill so the button stays usable. */
      await sleep(240);
      if (!alive.current) return;
      node?.style.setProperty("--gulp-p", "0");
      setState("idle");
    } catch {
      if (!alive.current) return;
      playBonk();
      setState("error");
      await sleep(520);
      if (!alive.current) return;
      node?.style.setProperty("--gulp-p", "0");
      setState("idle");
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`gulp ${className}`}
      data-state={state}
      disabled={state !== "idle"}
      onClick={run}
      aria-label={label}
      aria-busy={state === "eating" || state === "pending"}
      {...(title ? { title } : {})}
    >
      <svg className="gulp__can" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          {/* The interior is a clip, so the rubbish level is seen *inside* the
              bin rather than drawn over its outline. */}
          <clipPath id="gulp-inside">
            <path d="M6.4 7.6 h11.2 l-1 12.4 a1.4 1.4 0 0 1 -1.4 1.3 h-6.4 a1.4 1.4 0 0 1 -1.4 -1.3 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#gulp-inside)">
          <rect className="gulp__fill" x="5" y="7" width="14" height="15" />
        </g>

        <path
          className="gulp__body"
          d="M6.4 7.6 l1 12.4 a1.4 1.4 0 0 0 1.4 1.3 h6.4 a1.4 1.4 0 0 0 1.4 -1.3 l1 -12.4"
        />
        <g className="gulp__lid">
          <path d="M4 7.2 h16" />
          <path d="M9.6 4.4 h4.8" />
        </g>
      </svg>

      <span className="gulp__label" aria-hidden="true">
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="gulp__ch"
            style={{ ["--i" as string]: i, ["--n" as string]: chars.length }}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>

      <svg className="gulp__ring" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="20" />
      </svg>
    </button>
  );
}
