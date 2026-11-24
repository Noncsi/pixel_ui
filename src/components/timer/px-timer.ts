import { LitElement, css, html, nothing, type PropertyValues } from 'lit';

export type TimerDirection = 'down' | 'up';

export interface TimerEventDetail {
  /** Seconds on the clock, whole. */
  value: number;
}

/** How often the clock is re-read. Finer than a second, so a late tick can't drift. */
const POLL = 200;

/**
 * A clock: a countdown on a timed level, a speedrun split, a boss timer.
 *
 * It keeps time by remembering when it started and reading the real clock,
 * rather than counting ticks — a tab that goes to the background throttles
 * timers, and a counted clock would quietly fall behind. It polls faster than
 * a second so a late tick never shows a skipped number.
 *
 * A timer that reads itself out every second is unusable, so the digits are
 * not a live region. Instead it says one thing when it crosses `warn-at` and
 * one thing when it runs out, which is what someone would actually want told.
 *
 * @element px-timer
 *
 * @attr {number} value - Seconds on the clock.
 * @attr {boolean} running - Reflected: whether it is counting. Settable.
 * @attr {'down'|'up'} direction - Which way it counts. Default "down".
 * @attr {number} warn-at - Seconds at which it turns urgent. Default 10. 0 is never.
 * @attr {string} label - What the clock is for, e.g. "Time left".
 * @attr {boolean} warning - Reflected, read-only: at or past the warning mark.
 *
 * @fires px-timer-tick - A whole second went by. `detail: { value }`.
 * @fires px-timer-warn - It crossed the warning mark. `detail: { value }`.
 * @fires px-timer-end - A countdown reached zero. `detail: { value }`.
 *
 * @csspart base - The digits.
 *
 * @cssprop --px-timer-color - The digits' colour.
 */
export class PxTimer extends LitElement {
  static override properties = {
    value: { type: Number },
    running: { type: Boolean, reflect: true },
    direction: { type: String, reflect: true },
    warnAt: { type: Number, attribute: 'warn-at' },
    label: { type: String },
  };

  declare value: number;
  declare running: boolean;
  declare direction: TimerDirection;
  declare warnAt: number;
  declare label: string;

  private _poll: ReturnType<typeof setInterval> | undefined;
  /** When the current run began, and what was on the clock then. */
  private _startedAt = 0;
  private _startedFrom = 0;
  private _warned = false;
  private _ended = false;

  constructor() {
    super();
    this.value = 60;
    this.running = false;
    this.direction = 'down';
    this.warnAt = 10;
    this.label = '';
  }

  /** The seconds on the clock, never negative. */
  get seconds(): number {
    return Number.isFinite(this.value) ? Math.max(0, Math.floor(this.value)) : 0;
  }

  /** The clock as it is drawn: M:SS, or H:MM:SS once it is that long. */
  get formatted(): string {
    const total = this.seconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
  }

  /** True once a countdown is at or under the warning mark. */
  get warning(): boolean {
    return this.direction === 'down' && this.warnAt > 0 && this.seconds <= this.warnAt;
  }

  /** Start counting from wherever the clock is now. */
  start(): void {
    if (this.running) return;
    this.running = true;
  }

  /** Stop counting, leaving the clock where it is. */
  pause(): void {
    if (!this.running) return;
    this.running = false;
  }

  /** Put the clock back, optionally to a new number of seconds. */
  reset(seconds?: number): void {
    this.pause();
    if (seconds !== undefined) this.value = seconds;
    this._warned = false;
    this._ended = false;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stop();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'timer');
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (this.label) this.setAttribute('aria-label', this.label);
    this.toggleAttribute('warning', this.warning);

    if (changed.has('running')) {
      if (this.running) this._run();
      else this._stop();
    }
  }

  private _run(): void {
    this._stop();
    this._startedAt = Date.now();
    this._startedFrom = this.seconds;
    this._poll = setInterval(() => this._read(), POLL);
  }

  private _stop(): void {
    if (this._poll === undefined) return;
    clearInterval(this._poll);
    this._poll = undefined;
  }

  /** Work out the clock from the wall clock, not from how often we ticked. */
  private _read(): void {
    const elapsed = Math.floor((Date.now() - this._startedAt) / 1000);
    const next =
      this.direction === 'down'
        ? Math.max(0, this._startedFrom - elapsed)
        : this._startedFrom + elapsed;

    if (next === this.seconds) return;
    this.value = next;
    this._emit('px-timer-tick');

    if (this.warning && !this._warned) {
      this._warned = true;
      this._emit('px-timer-warn');
    }

    if (this.direction === 'down' && next === 0 && !this._ended) {
      this._ended = true;
      this.running = false;
      this._emit('px-timer-end');
    }
  }

  private _emit(type: 'px-timer-tick' | 'px-timer-warn' | 'px-timer-end'): void {
    this.dispatchEvent(
      new CustomEvent<TimerEventDetail>(type, {
        detail: { value: this.seconds },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override render() {
    const name = this.label ? `${this.label}: ` : '';

    return html`
      <span part="base" class="base" aria-hidden="true">${this.formatted}</span>
      <span class="sr-only" aria-live="polite">
        ${
          // Only the moments worth interrupting for: the warning, and zero.
          this._ended ? `${name}time up` : this.warning ? `${name}${this.formatted} left` : nothing
        }
      </span>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);

      position: relative;
      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-md, 12px);
      color: var(--px-timer-color, var(--px-color-text, #f4f4f4));
      /* Digits of one width, or the clock jitters as the numbers change. */
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    :host([hidden]) {
      display: none;
    }

    :host([warning]) {
      color: var(--px-timer-color, var(--px-color-danger, #b13e53));
      animation: pulse var(--px-duration-slow, 600ms) steps(2, jump-none) infinite;
    }

    @keyframes pulse {
      50% {
        opacity: 0.45;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host([warning]) {
        animation: none;
      }
    }

    /* Read by assistive technology, invisible to everyone else. */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;
}

if (!customElements.get('px-timer')) {
  customElements.define('px-timer', PxTimer);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-timer': PxTimer;
  }
  interface HTMLElementEventMap {
    'px-timer-tick': CustomEvent<TimerEventDetail>;
    'px-timer-warn': CustomEvent<TimerEventDetail>;
    'px-timer-end': CustomEvent<TimerEventDetail>;
  }
}
