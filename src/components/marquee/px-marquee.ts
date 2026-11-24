import { LitElement, css, html } from 'lit';

export type MarqueeDirection = 'left' | 'right';

/**
 * Text that scrolls past: end credits, a news crawl, an item name too long
 * for the slot it is in.
 *
 * The loop is seamless because the content is there twice — the second copy
 * is a clone of the first, hidden from assistive technology so the words
 * aren't read out twice — and the track slides by exactly one copy's width
 * before starting over. The speed is in pixels a second rather than a
 * duration, so a long line and a short one crawl at the same pace instead of
 * one of them tearing past.
 *
 * It pauses while the pointer is on it, because the one thing a reader wants
 * from a moving line is for it to stop. Under `prefers-reduced-motion` it
 * doesn't move at all, and the clone is dropped rather than left sitting
 * there saying everything twice.
 *
 * @element px-marquee
 *
 * @attr {number} speed - Pixels a second. Default 30.
 * @attr {'left'|'right'} direction - Which way it travels. Default "left".
 * @attr {number} gap - Pixels between the end of one copy and the start of the next. Default 40.
 * @attr {boolean} paused - Hold it where it is.
 * @attr {boolean} no-pause - Keep going even while the pointer is on it.
 *
 * @slot - What scrolls.
 *
 * @csspart base - The window the text travels through.
 * @csspart track - The moving strip.
 *
 * @cssprop --px-marquee-gap - Overrides `gap`.
 */
export class PxMarquee extends LitElement {
  static override properties = {
    speed: { type: Number },
    direction: { type: String, reflect: true },
    gap: { type: Number },
    paused: { type: Boolean, reflect: true },
    noPause: { type: Boolean, attribute: 'no-pause', reflect: true },
    _width: { state: true },
  };

  declare speed: number;
  declare direction: MarqueeDirection;
  declare gap: number;
  declare paused: boolean;
  declare noPause: boolean;

  /** One copy's width, measured rather than guessed. */
  declare private _width: number;

  private _observer: ResizeObserver | undefined;

  constructor() {
    super();
    this.speed = 30;
    this.direction = 'left';
    this.gap = 40;
    this.paused = false;
    this.noPause = false;
    this._width = 0;
  }

  /** How far the track travels before it repeats, in pixels. */
  get distance(): number {
    return this._width + this.safeGap;
  }

  /** How long one lap takes, in milliseconds. */
  get duration(): number {
    const speed = Number.isFinite(this.speed) && this.speed > 0 ? this.speed : 30;
    return (this.distance / speed) * 1000;
  }

  private get safeGap(): number {
    return Number.isFinite(this.gap) && this.gap >= 0 ? this.gap : 0;
  }

  /** Start moving again. */
  play(): void {
    this.paused = false;
  }

  /** Hold the line where it is. */
  pause(): void {
    this.paused = true;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._observer = undefined;
  }

  protected override firstUpdated(): void {
    this._mirror();

    // The line can change width without anything else happening — a font
    // arriving, a name being swapped out. Where there is no ResizeObserver,
    // slotchange still keeps the loop honest.
    if (typeof ResizeObserver !== 'function') return;
    const original = this.renderRoot.querySelector('.original');
    if (!original) return;

    this._observer = new ResizeObserver(() => this.measure());
    this._observer.observe(original);
  }

  private readonly _onSlotChange = (): void => {
    this._mirror();
  };

  /** Copy the content into the trailing half, so the loop has no seam. */
  private _mirror(): void {
    const slot = this.renderRoot.querySelector('slot');
    const copy = this.renderRoot.querySelector('.copy');
    if (!slot || !copy) return;

    const nodes = slot.assignedNodes({ flatten: true }).map((node) => node.cloneNode(true));
    copy.replaceChildren(...nodes);
    this.measure();
  }

  /**
   * Re-read how wide one copy is. Resizing and slotchange do this for you;
   * call it after changing the contents some other way.
   */
  measure(): void {
    const original = this.renderRoot.querySelector('.original');
    if (original instanceof HTMLElement) this._width = original.offsetWidth;
  }

  protected override render() {
    const style = `--_distance: ${this.distance}px; --_gap: ${this.safeGap}px; animation-duration: ${this.duration}ms`;

    return html`
      <div part="base" class="base">
        <div part="track" class="track" style=${style}>
          <span class="piece original"><slot @slotchange=${this._onSlotChange}></slot></span>
          <span class="piece copy" aria-hidden="true"></span>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      overflow: hidden;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
      line-height: 1.8;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      overflow: hidden;
    }

    .track {
      display: flex;
      align-items: center;
      gap: var(--px-marquee-gap, var(--_gap, 40px));
      width: max-content;
      animation-name: scroll;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }

    :host([direction='right']) .track {
      animation-direction: reverse;
    }

    .piece {
      flex: none;
      white-space: nowrap;
    }

    /* Stopped while anyone is reading it, which is the one thing a moving
       line is always asked for. */
    :host([paused]) .track,
    :host(:hover:not([no-pause])) .track {
      animation-play-state: paused;
    }

    @keyframes scroll {
      to {
        transform: translateX(calc(var(--_distance, 0px) * -1));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .track {
        animation: none;
      }

      /* Not moving, so the second copy would just be the line said twice. */
      .copy {
        display: none;
      }
    }
  `;
}

if (!customElements.get('px-marquee')) {
  customElements.define('px-marquee', PxMarquee);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-marquee': PxMarquee;
  }
}
