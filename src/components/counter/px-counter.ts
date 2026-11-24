import { LitElement, css, html, nothing, type PropertyValues } from 'lit';

/**
 * A number that rolls up to its new value: gold after a battle, a score
 * tally, XP earned.
 *
 * Set `value` and it counts from wherever it was, easing out so the last few
 * digits settle rather than stopping dead. Under `prefers-reduced-motion`, or
 * with `duration="0"`, it simply shows the number.
 *
 * The rolling digits are hidden from assistive technology — announcing sixty
 * intermediate numbers would be unusable — and the figure it lands on is
 * reported once, the same trick `<px-dialogue-box>` uses for its typing.
 *
 * @element px-counter
 *
 * @attr {number} value - The number to count to.
 * @attr {number} duration - How long the roll takes, in ms. Default 600.
 * @attr {number} pad - Pad with zeros to this many digits. 0 is none.
 * @attr {string} separator - Put between thousands, e.g. ",". Default none.
 * @attr {string} prefix - Drawn before the number, e.g. "×" or "$".
 * @attr {string} label - What the number is, for a screen reader: "Gold".
 *
 * @fires px-counter-end - The roll finished. `detail: { value }`.
 *
 * @csspart base - The number.
 */
export class PxCounter extends LitElement {
  static override properties = {
    value: { type: Number },
    duration: { type: Number },
    pad: { type: Number },
    separator: { type: String },
    prefix: { type: String },
    label: { type: String },
    _shown: { state: true },
    _rolling: { state: true },
  };

  declare value: number;
  declare duration: number;
  declare pad: number;
  declare separator: string;
  declare prefix: string;
  declare label: string;

  /** The number on screen right now, part-way through a roll. */
  declare private _shown: number;
  declare private _rolling: boolean;

  private _frame: number | undefined;
  private _from = 0;
  /** Undefined until the first frame: 0 is a timestamp a frame can have. */
  private _startedAt: number | undefined;

  constructor() {
    super();
    this.value = 0;
    this.duration = 600;
    this.pad = 0;
    this.separator = '';
    this.prefix = '';
    this.label = '';
    this._shown = 0;
    this._rolling = false;
  }

  /** The number on screen, which lags `value` while it is rolling. */
  get displayValue(): number {
    return this._shown;
  }

  /** True while the digits are still moving. */
  get rolling(): boolean {
    return this._rolling;
  }

  /** Stop rolling and show the real number now. */
  snap(): void {
    const wasRolling = this.rolling;
    this._stop();
    this._shown = this.safeValue;
    if (wasRolling) this._emitEnd();
  }

  /** `value`, or 0 when it is handed something that isn't a number. */
  get safeValue(): number {
    return Number.isFinite(this.value) ? Math.round(this.value) : 0;
  }

  /** The number as it is drawn, padded and separated. */
  get formatted(): string {
    return this._format(this._shown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stop();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!changed.has('value')) return;

    // The first value is where the counter starts, not something to roll to.
    if (!this.hasUpdated) {
      this._shown = this.safeValue;
      return;
    }

    this._start();
  }

  private _start(): void {
    this._stop();

    const target = this.safeValue;
    if (this._shown === target) return;

    if (this.duration <= 0 || this._prefersReducedMotion() || !this._canAnimate()) {
      this._shown = target;
      this._emitEnd();
      return;
    }

    this._from = this._shown;
    this._startedAt = undefined;
    this._frame = requestAnimationFrame(this._tick);
    this._rolling = true;
  }

  private readonly _tick = (now: number): void => {
    this._startedAt ??= now;

    const target = this.safeValue;
    const elapsed = now - this._startedAt;
    const progress = Math.min(elapsed / this.duration, 1);

    // Eased out, so the last digits settle instead of stopping dead.
    const eased = 1 - (1 - progress) ** 3;
    this._shown = Math.round(this._from + (target - this._from) * eased);

    if (progress >= 1) {
      this._shown = target;
      this._stop();
      this._emitEnd();
      return;
    }

    this._frame = requestAnimationFrame(this._tick);
    this._rolling = true;
  };

  private _stop(): void {
    if (this._frame !== undefined) {
      cancelAnimationFrame(this._frame);
      this._frame = undefined;
    }
    // Reactive, and set even when no frame was pending: easing can land on
    // the target a frame early, and then the last `_shown` assignment
    // changes nothing and schedules no render — so the announcement at the
    // end would never be drawn.
    this._rolling = false;
  }

  private _emitEnd(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: number }>('px-counter-end', {
        detail: { value: this.safeValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _canAnimate(): boolean {
    return typeof requestAnimationFrame === 'function';
  }

  private _prefersReducedMotion(): boolean {
    // Read every time rather than cached, so a change of setting is picked up.
    return typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }

  private _format(value: number): string {
    const digits = Math.abs(value).toString();
    const padded = this.pad > 0 ? digits.padStart(this.pad, '0') : digits;
    const grouped = this.separator
      ? padded.replace(/\B(?=(\d{3})+(?!\d))/g, this.separator)
      : padded;
    return `${value < 0 ? '-' : ''}${this.prefix}${grouped}`;
  }

  protected override render() {
    return html`
      <span part="base" class="base" aria-hidden="true">${this.formatted}</span>
      ${
        // Announced once it lands, rather than sixty times on the way.
        this.label
          ? html`<span class="sr-only" aria-live="polite">
              ${this.rolling ? '' : `${this.label}: ${this._format(this.safeValue)}`}
            </span>`
          : nothing
      }
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);

      position: relative;
      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-md, 12px);
      color: var(--px-color-text, #f4f4f4);
      /* Digits are the same width in this family, but say so: a proportional
         fallback would make the number jitter as it rolls. */
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    :host([hidden]) {
      display: none;
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

if (!customElements.get('px-counter')) {
  customElements.define('px-counter', PxCounter);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-counter': PxCounter;
  }
  interface HTMLElementEventMap {
    'px-counter-end': CustomEvent<{ value: number }>;
  }
}
