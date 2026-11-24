import { LitElement, css, html } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface CheckboxChangeEventDetail {
  checked: boolean;
  indeterminate: boolean;
}

/**
 * A box you tick.
 *
 * `<px-toggle>` is the other half of this pair, and they are not the same
 * control. A toggle is a setting that takes effect the moment it flips —
 * fullscreen on, music off — which is why it reads ON and OFF. A checkbox is
 * one answer among several that is submitted later: the three mods you want
 * enabled, "don't show this again", "I have read the terms". When a change
 * applies at once, reach for the toggle; when it is part of a form, this.
 *
 * It can also sit at `indeterminate`, which a toggle cannot, for the parent of
 * a part-ticked list. Unlike the native checkbox that state is a reflected
 * attribute, so CSS can see it. Clicking out of it ticks the box, as the
 * platform does.
 *
 * Inside a `<form>` it submits its `value` while ticked and nothing otherwise.
 *
 * @element px-checkbox
 *
 * @attr {boolean} checked - Whether it is ticked. Reflected.
 * @attr {boolean} indeterminate - Neither ticked nor clear. Reflected.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {boolean} required - Must be ticked for the form to be valid.
 * @attr {string} label - The text beside the box, and its accessible name.
 * @attr {boolean} hide-label - Keep the label for screen readers only.
 * @attr {string} name - Form field name.
 * @attr {string} value - Form value submitted while ticked. Default "on".
 *
 * @slot hint - A line of smaller text under the label.
 *
 * @fires px-checkbox-change - It was ticked or cleared. `detail: { checked, indeterminate }`.
 *
 * @csspart base - The button wrapping the whole row.
 * @csspart box - The square.
 * @csspart frame - The square's pixel frame.
 * @csspart mark - The tick, or the dash when indeterminate.
 * @csspart label - The label text.
 *
 * @cssprop --px-checkbox-color - The fill behind the tick.
 */
export class PxCheckbox extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    checked: { type: Boolean, reflect: true },
    indeterminate: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    name: { type: String },
    value: { type: String },
    _hasHint: { state: true },
  };

  declare private _hasHint: boolean;

  declare checked: boolean;
  declare indeterminate: boolean;
  declare disabled: boolean;
  declare required: boolean;
  declare label: string;
  declare hideLabel: boolean;
  declare name: string;
  declare value: string;

  private _internals: ElementInternals | null = null;

  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
    this.label = '';
    this.hideLabel = false;
    this.name = '';
    this.value = 'on';
    this._hasHint = false;

    if (typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /** The form this box belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this._internals?.form ?? this.closest('form');
  }

  /** What a screen reader is told: "true", "false" or "mixed". */
  get state(): 'true' | 'false' | 'mixed' {
    if (this.indeterminate) return 'mixed';
    return this.checked ? 'true' : 'false';
  }

  /** Tick it, clear it, or flip it. */
  toggle(force?: boolean): void {
    const next = force ?? !(this.checked && !this.indeterminate);
    // Leaving indeterminate always lands on ticked, the way the platform's
    // own checkbox does: a half-ticked list is finished, not abandoned.
    this.indeterminate = false;
    this.checked = next;
  }

  protected override firstUpdated(): void {
    // Read once as well as on change: happy-dom, and so the tests, never fire
    // slotchange for a slot's first assignment.
    this._readHint();
  }

  protected override updated(): void {
    // Unticked submits nothing at all, as an unticked checkbox does.
    this._internals?.setFormValue(this.checked ? this.value : null);
  }

  private _readHint(): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="hint"]');
    this._hasHint = (slot?.assignedNodes({ flatten: true }).length ?? 0) > 0;
  }

  private readonly _onHintChange = (): void => {
    this._readHint();
  };

  private _onClick(): void {
    if (this.disabled) return;
    const was = this.checked && !this.indeterminate;
    this.indeterminate = false;
    this.checked = !was;
    this.dispatchEvent(
      new CustomEvent<CheckboxChangeEventDetail>('px-checkbox-change', {
        detail: { checked: this.checked, indeterminate: false },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override render() {
    return html`
      <button
        part="base"
        class="base"
        type="button"
        role="checkbox"
        aria-checked=${this.state}
        aria-label=${this.label}
        aria-required=${this.required ? 'true' : 'false'}
        aria-describedby="hint"
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <span part="box" class="box">
          <span part="frame" class="frame"></span>
          <span part="mark" class="mark"></span>
        </span>
        <span class="text">
          <!-- Hidden because aria-label already says it; the drawn copy must
               not be read a second time. -->
          <span part="label" class="label" aria-hidden="true">${this.label}</span>
          <!-- Not hidden, and pointed at by aria-describedby: the hint is the
               part that says what ticking the box will actually do. -->
          <span part="hint" class="hint" id="hint" ?hidden=${!this._hasHint}
            ><slot name="hint" @slotchange=${this._onHintChange}></slot
          ></span>
        </span>
      </button>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-checkbox-color, var(--px-color-accent, #38b764));
      --_empty: var(--px-color-bg, #1a1c2c);
      --_border: var(--px-color-border, #0b0c14);
      --_mark: var(--px-color-text-on-dark, #f4f4f4);
      --_fast: var(--px-duration-fast, 120ms);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    :host([disabled]) .base {
      opacity: 0.5;
    }

    .base {
      display: flex;
      align-items: flex-start;
      gap: calc(var(--_unit) * 2);
      width: 100%;
      padding: calc(var(--_unit) * 1.5) 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1;
      text-align: left;
      cursor: pointer;
    }

    .base:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .box {
      position: relative;
      flex: none;
      width: calc(var(--_unit) * 7);
      height: calc(var(--_unit) * 7);
    }

    .frame {
      position: absolute;
      inset: 0;
      background: var(--_border);
      ${pixelFrame}
    }

    /* Sunk while empty, so an untouched box reads as a hole rather than a
       raised button waiting to be pressed. */
    .frame::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--_empty);
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
      transition: background-color var(--_fast) steps(2, end);
    }

    :host([checked]) .frame::before,
    :host([indeterminate]) .frame::before {
      background: var(--_fill);
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.2);
    }

    /*
     * The tick is drawn pixel by pixel: one art-pixel square, plus four more
     * copies of it offset by box-shadow. A font's tick would be the wrong
     * shape at this size and would not land on the art grid — and the pixel
     * font the kit ships with has no tick glyph at all.
     *
     *     . . . . #
     *     . . . # .
     *     # . # . .
     *     . # . . .
     *
     * The square itself is the bottom pixel of the short leg; the shadows
     * climb away from it in both directions.
     */
    .mark {
      position: absolute;
      left: var(--_unit);
      top: calc(var(--_unit) * 4);
      width: var(--_unit);
      height: var(--_unit);
      background: var(--_mark);
      box-shadow:
        calc(var(--_unit) * -1) calc(var(--_unit) * -1) 0 0 var(--_mark),
        var(--_unit) calc(var(--_unit) * -1) 0 0 var(--_mark),
        calc(var(--_unit) * 2) calc(var(--_unit) * -2) 0 0 var(--_mark),
        calc(var(--_unit) * 3) calc(var(--_unit) * -3) 0 0 var(--_mark);
      opacity: 0;
    }

    :host([checked]:not([indeterminate])) .mark {
      opacity: 1;
    }

    /* Indeterminate is a dash, not a faded tick: "some of these" is a
       different answer, not a weaker yes. */
    :host([indeterminate]) .mark {
      left: calc(var(--_unit) * 2);
      top: calc(var(--_unit) * 3);
      width: calc(var(--_unit) * 3);
      box-shadow: none;
      opacity: 1;
    }

    .text {
      display: block;
      padding-top: calc(var(--_unit) * 1.5);
    }

    .label {
      text-transform: uppercase;
    }

    :host([hide-label]) .label {
      /* Still read: the button's aria-label carries the name. */
      display: none;
    }

    .hint {
      display: block;
      margin-top: var(--_unit);
      color: var(--px-color-text-muted, #94b0c2);
      line-height: 1.6;
      text-transform: none;
    }

    /* Has to be spelled out: the display: block above would otherwise beat
       the user agent's rule for [hidden] and leave an empty hint taking up
       space under every label that has none. */
    .hint[hidden] {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .frame::before {
        transition: none;
      }
    }
  `;
}

if (!customElements.get('px-checkbox')) {
  customElements.define('px-checkbox', PxCheckbox);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-checkbox': PxCheckbox;
  }
  interface HTMLElementEventMap {
    'px-checkbox-change': CustomEvent<CheckboxChangeEventDetail>;
  }
}
