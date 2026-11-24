import { LitElement, css, html } from 'lit';

export type RatingShape = 'star' | 'heart' | 'diamond';

export interface RatingChangeEventDetail {
  value: number;
  max: number;
}

/** Filled and hollow glyph for each shape. */
const SHAPES: Record<RatingShape, readonly [filled: string, empty: string]> = {
  star: ['★', '☆'],
  heart: ['♥', '♡'],
  diamond: ['◆', '◇'],
};

/**
 * A row of stars: a weapon's rarity, a level's difficulty, how much the
 * innkeeper's daughter likes you.
 *
 * Two jobs in one element, and which one it is doing matters more than it
 * looks. `readonly` makes it a picture — three of five, stated once, with no
 * focus stop and nothing to press. Without it the row is a control, and then
 * it is a slider rather than five buttons: one tab stop, arrow keys to change
 * the value, Home and End for the ends. Five separate focus stops to say one
 * number is the usual mistake here.
 *
 * Both shapes of every glyph are drawn, never one shape at two opacities. A
 * faded star says "maybe"; a hollow one says "not this one", which is the
 * actual meaning, and it survives a high-contrast mode that flattens opacity.
 *
 * Whole numbers only. Half stars need a half glyph the pixel grid has no room
 * for at this size, and a rating nobody can set by keyboard is not worth the
 * arithmetic.
 *
 * @element px-rating
 *
 * @attr {number} value - How many are filled. Default 0.
 * @attr {number} max - How many there are. Default 5.
 * @attr {'star'|'heart'|'diamond'} shape - Which glyph. Default "star".
 * @attr {string} glyph - A filled glyph of your own, overriding `shape`.
 * @attr {string} empty-glyph - The hollow glyph to match it.
 * @attr {boolean} readonly - Show it without letting anyone change it.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {string} label - What is being rated. Its accessible name.
 * @attr {string} unit - The word for one of them, for screen readers. Default from `shape`.
 * @attr {string} unit-plural - The word for more than one. Default `unit` with an "s".
 * @attr {boolean} allow-zero - Let the row be cleared back to none.
 * @attr {string} name - Form field name.
 *
 * @fires px-rating-change - The value changed. `detail: { value, max }`.
 *
 * @csspart base - The row.
 * @csspart item - One glyph. All of them: use `:nth-child()`.
 *
 * @cssprop --px-rating-color - The filled glyphs' colour.
 * @cssprop --px-rating-empty-color - The hollow glyphs' colour.
 * @cssprop --px-rating-size - The glyph size. Default 16px.
 */
export class PxRating extends LitElement {
  static formAssociated = true;

  static override properties = {
    value: { type: Number },
    max: { type: Number },
    shape: { type: String, reflect: true },
    glyph: { type: String },
    emptyGlyph: { type: String, attribute: 'empty-glyph' },
    readonly: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
    unit: { type: String },
    unitPlural: { type: String, attribute: 'unit-plural' },
    allowZero: { type: Boolean, attribute: 'allow-zero' },
    name: { type: String },
    _hovered: { state: true },
  };

  declare value: number;
  declare max: number;
  declare shape: RatingShape;
  declare glyph: string;
  declare emptyGlyph: string;
  declare readonly: boolean;
  declare disabled: boolean;
  declare label: string;
  declare unit: string;
  declare unitPlural: string;
  declare allowZero: boolean;
  declare name: string;

  /** What the pointer is over, or -1. Shown but never announced. */
  declare private _hovered: number;

  private _internals: ElementInternals | null = null;

  constructor() {
    super();
    this.value = 0;
    this.max = 5;
    this.shape = 'star';
    this.glyph = '';
    this.emptyGlyph = '';
    this.readonly = false;
    this.disabled = false;
    this.label = '';
    this.unit = '';
    this.unitPlural = '';
    this.allowZero = false;
    this.name = '';
    this._hovered = -1;

    if (typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /** The form this row belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this._internals?.form ?? this.closest('form');
  }

  /** The lowest value the row can take: 0 with `allow-zero`, otherwise 1. */
  get min(): number {
    return this.allowZero ? 0 : 1;
  }

  /** Whether anyone can change it. */
  get interactive(): boolean {
    return !this.readonly && !this.disabled;
  }

  /** What a screen reader is told, e.g. "3 of 5 stars". */
  get valueText(): string {
    const one = this.unit || this.shape;
    // An "s" is right for the three shapes the kit draws and wrong for
    // plenty of words a game might pass, so the plural can be given.
    const many = this.unitPlural || `${one}s`;
    // The noun agrees with the row, not with the value: it is "one of five
    // stars", never "one of five star".
    return `${this.value} of ${this.max} ${this.max === 1 ? one : many}`;
  }

  /** Set the value, clamped to the row and rounded to a whole glyph. */
  rate(next: number): void {
    if (!this.interactive) return;
    const clamped = Math.min(this.max, Math.max(this.min, Math.round(next)));
    if (clamped === this.value) return;
    this.value = clamped;
    this.dispatchEvent(
      new CustomEvent<RatingChangeEventDetail>('px-rating-change', {
        detail: { value: this.value, max: this.max },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Move the value along the row. */
  nudge(delta: number): void {
    this.rate(this.value + delta);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeyDown);
  }

  protected override willUpdate(): void {
    // Zero is allowed here whatever `allow-zero` says: that attribute is
    // about whether a person can clear the row, not about whether a game may
    // show nought out of five.
    const max = Math.max(0, Math.round(this.max) || 0);
    const value = Math.min(max, Math.max(0, Math.round(this.value) || 0));
    if (max !== this.max) this.max = max;
    if (value !== this.value) this.value = value;
  }

  protected override updated(): void {
    this._internals?.setFormValue(String(this.value));

    // A picture is a picture: no focus stop, nothing to press. A control is a
    // slider with exactly one, however many glyphs are drawn.
    if (this.interactive) {
      this.setAttribute('role', 'slider');
      this.setAttribute('tabindex', '0');
      this.setAttribute('aria-valuemin', String(this.min));
      this.setAttribute('aria-valuemax', String(this.max));
      this.setAttribute('aria-valuenow', String(this.value));
      this.setAttribute('aria-valuetext', this.valueText);
    } else {
      this.setAttribute('role', 'img');
      this.removeAttribute('tabindex');
      for (const attr of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext']) {
        this.removeAttribute(attr);
      }
    }

    // The name has to carry the reading as well, because an image's name is
    // all there is: there are no values to fall back on.
    const name = this.interactive
      ? this.label || this.valueText
      : [this.label, this.valueText].filter(Boolean).join(': ');
    this.setAttribute('aria-label', name);
  }

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    if (!this.interactive) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        this.nudge(1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        this.nudge(-1);
        break;
      case 'Home':
        this.rate(this.min);
        break;
      case 'End':
        this.rate(this.max);
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  private readonly _onLeave = (): void => {
    this._hovered = -1;
  };

  private _onEnter(index: number): void {
    if (!this.interactive) return;
    this._hovered = index;
  }

  private _onPick(index: number): void {
    if (!this.interactive) return;
    // Clicking the glyph that is already the last filled one clears the row,
    // which is the only way back to none with a pointer.
    if (this.allowZero && index === this.value) this.rate(0);
    else this.rate(index);
  }

  protected override render() {
    const [filled, empty] = SHAPES[this.shape] ?? SHAPES.star;
    const on = this.glyph || filled;
    // A custom `glyph` with no `empty-glyph` keeps the shape's hollow one
    // rather than repeating itself: two identical glyphs would make a row
    // that is half full look full.
    const off = this.emptyGlyph || empty;
    const shown = this._hovered > 0 ? this._hovered : this.value;
    const items = Array.from({ length: Math.max(0, Math.round(this.max)) }, (_, i) => i + 1);

    return html`
      <div part="base" class="base" aria-hidden="true" @pointerleave=${this._onLeave}>
        ${items.map(
          (index) => html`
            <span
              part="item"
              class="item ${index <= shown ? 'on' : 'off'}"
              @pointerenter=${() => this._onEnter(index)}
              @click=${() => this._onPick(index)}
              >${index <= shown ? on : off}</span
            >
          `,
        )}
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      /* --px-color-highlight rather than --px-color-xp: gold reads on the
         dark theme and all but vanishes on the light one, and a star nobody
         can see is not a rating. */
      --_on: var(--px-rating-color, var(--px-color-highlight, #ffcd75));
      --_off: var(--px-rating-empty-color, var(--px-color-text-muted, #94b0c2));

      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-rating-size, 16px);
      line-height: 1;
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    :host(:focus) {
      outline: none;
    }

    :host(:focus-visible) {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .base {
      display: flex;
      gap: calc(var(--_unit) / 2);
    }

    .item {
      display: block;
      color: var(--_off);
    }

    .item.on {
      color: var(--_on);
    }

    :host(:not([readonly]):not([disabled])) .item {
      cursor: pointer;
    }
  `;
}

if (!customElements.get('px-rating')) {
  customElements.define('px-rating', PxRating);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-rating': PxRating;
  }
  interface HTMLElementEventMap {
    'px-rating-change': CustomEvent<RatingChangeEventDetail>;
  }
}
