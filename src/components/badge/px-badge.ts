import { LitElement, css, html, nothing, type PropertyValues } from 'lit';

export type BadgeVariant = 'neutral' | 'accent' | 'danger' | 'xp';

/**
 * A small chip for a count or a state: unread messages on a tab, how many of
 * an item is in a slot, NEW on a menu row.
 *
 * On its own it is a coloured block with something in it. What it adds is the
 * part that usually goes wrong: a bare "3" tells a screen reader nothing, so
 * a badge with a `label` hides the digits from the accessibility tree and
 * reads "3 unread" instead. That is done with text rather than `aria-label`,
 * which is unreliable on an element with no role of its own.
 *
 * `max` caps what is drawn — 143 becomes "99+" — while the label still says
 * what the real number is.
 *
 * @element px-badge
 *
 * @attr {'neutral'|'accent'|'danger'|'xp'} variant - Colour. Default "neutral".
 * @attr {string} label - What it means, e.g. "3 unread". Read instead of the digits.
 * @attr {number} max - Cap the drawn number, e.g. 99 draws "99+". 0 is no cap.
 * @attr {boolean} dot - Draw a dot with no number at all.
 *
 * @slot - The count or the word.
 *
 * @csspart base - The chip.
 *
 * @cssprop --px-badge-color - The chip's colour.
 */
export class PxBadge extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    label: { type: String },
    max: { type: Number },
    dot: { type: Boolean, reflect: true },
    _capped: { state: true },
  };

  declare variant: BadgeVariant;
  declare label: string;
  declare max: number;
  declare dot: boolean;

  /** What to draw in place of the slot when the count is over `max`. */
  declare private _capped: string;

  constructor() {
    super();
    this.variant = 'neutral';
    this.label = '';
    this.max = 0;
    this.dot = false;
    this._capped = '';
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // In willUpdate, not updated: setting state after an update has finished
    // costs a second render for every badge on the page.
    if (changed.has('max') || changed.has('dot')) this._recap();
  }

  protected override firstUpdated(): void {
    this._recap();
  }

  private readonly _onSlotChange = (): void => {
    this._recap();
  };

  /** Work out whether the count needs capping, e.g. 143 drawn as "99+". */
  private _recap(): void {
    if (this.max <= 0 || this.dot) {
      this._capped = '';
      return;
    }

    const text = (this.textContent ?? '').trim();
    const count = Number(text);
    this._capped = text !== '' && Number.isFinite(count) && count > this.max ? `${this.max}+` : '';
  }

  protected override render() {
    const named = this.label !== '';
    const capped = this._capped !== '';

    return html`
      <span
        part="base"
        class="base ${this.dot ? 'dot' : ''}"
        aria-hidden=${named ? 'true' : nothing}
      >
        ${
          this.dot
            ? nothing
            : html`<span class="count ${capped ? 'replaced' : ''}">
                  <slot @slotchange=${this._onSlotChange}></slot>
                </span>
                ${capped ? html`<span class="capped">${this._capped}</span>` : nothing}`
        }
      </span>
      ${named ? html`<span class="sr-only">${this.label}</span>` : nothing}
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_color: var(--px-badge-color, var(--px-color-text-muted, #94b0c2));
      --_text: var(--px-color-border, #0b0c14);

      position: relative;
      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      line-height: 1;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    :host([variant='accent']) {
      --_color: var(--px-badge-color, var(--px-color-accent, #38b764));
    }

    :host([variant='danger']) {
      --_color: var(--px-badge-color, var(--px-color-danger, #b13e53));
      --_text: var(--px-color-text-on-danger, #f4f4f4);
    }

    :host([variant='xp']) {
      --_color: var(--px-badge-color, var(--px-color-xp, #ffcd75));
    }

    .base {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-width: calc(var(--_unit) * 5);
      padding: calc(var(--_unit) * 0.75) calc(var(--_unit) * 1.25);
      background: var(--_color);
      color: var(--_text);
      text-transform: uppercase;
      /* A corner off each side, so it belongs with the kit's frames without
         needing a border of its own at this size. */
      clip-path: polygon(
        0 25%,
        25% 25%,
        25% 0,
        75% 0,
        75% 25%,
        100% 25%,
        100% 75%,
        75% 75%,
        75% 100%,
        25% 100%,
        25% 75%,
        0 75%
      );
    }

    /* A dot says "something changed" without saying how much. */
    .base.dot {
      min-width: 0;
      width: calc(var(--_unit) * 2);
      height: calc(var(--_unit) * 2);
      padding: 0;
      clip-path: none;
    }

    /* The real count stays in the DOM so the slot keeps working; the capped
       form is drawn in its place. */
    .count.replaced {
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

if (!customElements.get('px-badge')) {
  customElements.define('px-badge', PxBadge);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-badge': PxBadge;
  }
}
