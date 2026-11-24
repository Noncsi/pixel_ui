import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

/**
 * A framed box that scrolls: a quest log, an item description, the credits.
 *
 * It scrolls natively — the wheel, a touch drag, the scrollbar, Page Up and
 * Down, Home and End all work because nothing here reimplements them. What it
 * adds is the frame, a scrollbar that matches the rest of the kit, and an
 * arrow at whichever end has more to read, which is the part people actually
 * miss when a box of text is cut off mid-sentence.
 *
 * A region that scrolls has to be reachable by keyboard, so the box is a tab
 * stop. With a `label` it is a named region a screen reader can be sent to.
 *
 * @element px-scrollbox
 *
 * @attr {string} label - The region's accessible name.
 * @attr {boolean} flat - Drop the frame, keeping the scrolling.
 * @attr {boolean} more-above - Reflected, read-only: there is more to see upwards.
 * @attr {boolean} more-below - Reflected, read-only: there is more to see downwards.
 *
 * @slot - The content to scroll.
 *
 * @csspart base - The box.
 * @csspart frame - The pixel frame behind it.
 * @csspart content - The scrolling area.
 * @csspart hint - An arrow marking more content. Two of them: use `:first-of-type`.
 *
 * @cssprop --px-scrollbox-height - How tall before it scrolls. Default 160px.
 */
export class PxScrollbox extends LitElement {
  static override properties = {
    label: { type: String },
    flat: { type: Boolean, reflect: true },
    _moreAbove: { state: true },
    _moreBelow: { state: true },
  };

  declare label: string;
  declare flat: boolean;

  declare private _moreAbove: boolean;
  declare private _moreBelow: boolean;

  private _observer: ResizeObserver | undefined;

  constructor() {
    super();
    this.label = '';
    this.flat = false;
    this._moreAbove = false;
    this._moreBelow = false;
  }

  /** True when nothing is scrolled past above. */
  get atTop(): boolean {
    return !this._moreAbove;
  }

  /** True when there is nothing further down. */
  get atBottom(): boolean {
    return !this._moreBelow;
  }

  /** Jump back to the first line. */
  scrollToTop(): void {
    const scroller = this._scroller;
    if (scroller) scroller.scrollTop = 0;
    this.measure();
  }

  /** Jump to the end, for a log that grows. */
  scrollToBottom(): void {
    const scroller = this._scroller;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    this.measure();
  }

  /**
   * Work out which arrows to show. Scrolling and resizing do this for you;
   * call it after changing the contents some other way.
   */
  measure(): void {
    const scroller = this._scroller;
    if (!scroller) return;

    const furthest = scroller.scrollHeight - scroller.clientHeight;
    // A pixel of slack: sub-pixel layout means scrollTop rarely lands exactly
    // on either end, and an arrow that never goes away is worse than none.
    this._moreAbove = scroller.scrollTop > 1;
    this._moreBelow = furthest > 1 && scroller.scrollTop < furthest - 1;
  }

  private get _scroller(): HTMLElement | null {
    return this.renderRoot.querySelector('[part="content"]');
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Scrollable, so it has to be reachable by keyboard; named, so a screen
    // reader has somewhere to be sent.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._observer = undefined;
  }

  protected override firstUpdated(): void {
    this.measure();

    // The content can change height without anything scrolling — a log that
    // grows, an image that loads. Where there is no ResizeObserver, scrolling
    // and slotchange still keep the arrows honest.
    if (typeof ResizeObserver !== 'function') return;
    const scroller = this._scroller;
    if (!scroller) return;

    this._observer = new ResizeObserver(() => this.measure());
    this._observer.observe(scroller);
    for (const child of scroller.children) this._observer.observe(child);
  }

  protected override updated(): void {
    if (this.label) {
      this.setAttribute('role', 'region');
      this.setAttribute('aria-label', this.label);
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    }

    this.toggleAttribute('more-above', this._moreAbove);
    this.toggleAttribute('more-below', this._moreBelow);
  }

  private readonly _onScroll = (): void => {
    this.measure();
  };

  private readonly _onSlotChange = (): void => {
    this.measure();
  };

  protected override render() {
    return html`
      <div part="base" class="base">
        ${this.flat ? nothing : html`<span part="frame" class="frame"></span>`}
        <div part="content" class="content" @scroll=${this._onScroll}>
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
        ${
          this._moreAbove
            ? html`<span part="hint" class="hint top" aria-hidden="true">▲</span>`
            : nothing
        }
        ${
          this._moreBelow
            ? html`<span part="hint" class="hint bottom" aria-hidden="true">▼</span>`
            : nothing
        }
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-bg, #1a1c2c);
      --_border: var(--px-color-border, #0b0c14);
      --_thumb: var(--px-color-text-muted, #94b0c2);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
      outline: none;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      position: relative;
      padding: var(--_unit);
    }

    :host([flat]) .base {
      padding: 0;
    }

    .frame {
      position: absolute;
      inset: 0;
      background: var(--_border);
      ${pixelFrame}
    }

    /* Sunk: a box you read into, not a block standing on the page. */
    .frame::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--_fill);
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
    }

    :host(:focus-visible) .base {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .content {
      position: relative;
      max-height: var(--px-scrollbox-height, 160px);
      padding: calc(var(--_unit) * 2);
      overflow-y: auto;
      line-height: 1.8;
      /* Firefox and modern Chrome; the ::-webkit rules below cover the rest. */
      scrollbar-width: thin;
      scrollbar-color: var(--_thumb) var(--_fill);
    }

    /* Square and chunky, like everything else here. */
    .content::-webkit-scrollbar {
      width: calc(var(--_unit) * 3);
    }

    .content::-webkit-scrollbar-track {
      background: var(--_fill);
    }

    .content::-webkit-scrollbar-thumb {
      background: var(--_thumb);
      border: var(--_unit) solid var(--_fill);
    }

    .hint {
      position: absolute;
      right: calc(var(--_unit) * 4);
      color: var(--px-color-highlight, #ffcd75);
      line-height: 1;
      pointer-events: none;
      animation: blink var(--px-duration-slow, 600ms) steps(2, jump-none) infinite;
    }

    .hint.top {
      top: calc(var(--_unit) * 2);
    }

    .hint.bottom {
      bottom: calc(var(--_unit) * 2);
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hint {
        animation: none;
      }
    }
  `;
}

if (!customElements.get('px-scrollbox')) {
  customElements.define('px-scrollbox', PxScrollbox);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-scrollbox': PxScrollbox;
  }
}
