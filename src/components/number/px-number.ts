import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface NumberEventDetail {
  value: number;
}

/**
 * A stepper: how many potions to buy, how many to drop, how many lives to
 * start with.
 *
 * It wraps a real `<input type="number">`, which the browser reports as a
 * spinbutton and steps with the up and down arrows on its own. The native
 * spinner arrows are hidden and replaced with a − and a + big enough to hit,
 * because the browser's own are four pixels tall and nowhere near the art.
 *
 * `<px-slider>` is the one for a range you sweep through. This is for a count
 * you land on exactly.
 *
 * @element px-number
 *
 * @attr {number} value - The count. Clamped to min…max.
 * @attr {number} min - Default 0.
 * @attr {number} max - Default 99.
 * @attr {number} step - How much a press moves it. Default 1.
 * @attr {string} label - The text beside it, and its accessible name.
 * @attr {boolean} hide-label - Keep the label for screen readers only.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {string} name - Form field name.
 *
 * @fires px-number-input - The count is being changed. `detail: { value }`.
 * @fires px-number-change - The count was committed. `detail: { value }`.
 *
 * @csspart base - The row.
 * @csspart label - The label text.
 * @csspart field - The framed box.
 * @csspart frame - The pixel frame.
 * @csspart decrement - The − button.
 * @csspart input - The input itself.
 * @csspart increment - The + button.
 */
export class PxNumber extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    disabled: { type: Boolean, reflect: true },
    name: { type: String },
  };

  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare label: string;
  declare hideLabel: boolean;
  declare disabled: boolean;
  declare name: string;

  private _internals: ElementInternals | null = null;

  constructor() {
    super();
    this.value = 0;
    this.min = 0;
    this.max = 99;
    this.step = 1;
    this.label = '';
    this.hideLabel = false;
    this.disabled = false;
    this.name = '';

    if (typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /** The value after clamping to min…max. */
  get clampedValue(): number {
    const value = Number.isFinite(this.value) ? this.value : this.min;
    return Math.min(Math.max(value, this.min), this.safeMax);
  }

  /** True once it can go no higher. */
  get atMax(): boolean {
    return this.clampedValue >= this.safeMax;
  }

  /** True once it can go no lower. */
  get atMin(): boolean {
    return this.clampedValue <= this.min;
  }

  /** The form this field belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this._internals?.form ?? this.closest('form');
  }

  /** One step up, as the + button does. */
  stepUp(): void {
    this._commit(this.clampedValue + this.safeStep);
  }

  /** One step down, as the − button does. */
  stepDown(): void {
    this._commit(this.clampedValue - this.safeStep);
  }

  override focus(options?: FocusOptions): void {
    const input = this.renderRoot.querySelector('input');
    if (input) input.focus(options);
    else super.focus(options);
  }

  private get safeMax(): number {
    return this.max >= this.min ? this.max : this.min;
  }

  private get safeStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }

  protected override updated(): void {
    this._internals?.setFormValue(String(this.clampedValue));
  }

  private _emit(type: 'px-number-input' | 'px-number-change'): void {
    this.dispatchEvent(
      new CustomEvent<NumberEventDetail>(type, {
        detail: { value: this.clampedValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Move to `next`, clamped. A step that changes nothing says nothing. */
  private _commit(next: number): void {
    const clamped = Math.min(Math.max(next, this.min), this.safeMax);
    if (clamped === this.clampedValue) return;

    this.value = clamped;
    this._emit('px-number-input');
    this._emit('px-number-change');
  }

  private _onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Mid-typing the field can be empty, or "-", which is not a number yet.
    // Leave it be rather than snapping it to the minimum under the caret.
    if (input.value === '' || Number.isNaN(input.valueAsNumber)) return;

    const clamped = Math.min(Math.max(input.valueAsNumber, this.min), this.safeMax);
    if (clamped === this.clampedValue) return;

    this.value = clamped;
    this._emit('px-number-input');
  }

  /** On commit, whatever is in the field becomes a number in range. */
  private _onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = Number.isNaN(input.valueAsNumber) ? this.clampedValue : input.valueAsNumber;
    this.value = Math.min(Math.max(parsed, this.min), this.safeMax);
    input.value = String(this.clampedValue);
    this._emit('px-number-change');
  }

  protected override render() {
    const name = this.label ? ` ${this.label}` : '';

    return html`
      <div part="base" class="base">
        ${
          this.label && !this.hideLabel
            ? html`<span part="label" class="label" aria-hidden="true">${this.label}</span>`
            : nothing
        }
        <div part="field" class="field">
          <span part="frame" class="frame"></span>
          <button
            part="decrement"
            class="step"
            type="button"
            aria-label="Decrease${name}"
            ?disabled=${this.disabled || this.atMin}
            @click=${this.stepDown}
          >
            −
          </button>
          <input
            part="input"
            class="input"
            type="number"
            .value=${String(this.clampedValue)}
            min=${this.min}
            max=${this.safeMax}
            step=${this.safeStep}
            aria-label=${this.label || nothing}
            ?disabled=${this.disabled}
            @input=${this._onInput}
            @change=${this._onChange}
          />
          <button
            part="increment"
            class="step"
            type="button"
            aria-label="Increase${name}"
            ?disabled=${this.disabled || this.atMax}
            @click=${this.stepUp}
          >
            +
          </button>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-bg, #1a1c2c);
      --_border: var(--px-color-border, #0b0c14);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.5;
    }

    .base {
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      line-height: 1;
    }

    .label {
      flex: none;
      text-transform: uppercase;
    }

    .field {
      position: relative;
      display: flex;
      align-items: stretch;
      margin-left: auto;
    }

    .frame {
      position: absolute;
      inset: 0;
      background: var(--_border);
      ${pixelFrame}
    }

    .frame::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--_fill);
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
    }

    .step {
      position: relative;
      flex: none;
      width: calc(var(--_unit) * 6);
      padding: 0;
      border: 0;
      background: none;
      color: var(--px-color-text, #f4f4f4);
      font: inherit;
      line-height: 1;
      cursor: pointer;
    }

    .step:disabled {
      color: var(--px-color-text-muted, #94b0c2);
      opacity: 0.4;
      cursor: default;
    }

    .step:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: calc(var(--_unit) * -1);
    }

    .input {
      position: relative;
      box-sizing: content-box;
      width: calc(var(--_unit) * 6);
      padding: calc(var(--_unit) * 2) 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1;
      text-align: center;
      /* The browser's own spinner is four pixels tall and nothing like the
         art; the − and + beside it do that job instead. */
      appearance: textfield;
      -moz-appearance: textfield;
    }

    .input::-webkit-inner-spin-button,
    .input::-webkit-outer-spin-button {
      appearance: none;
      margin: 0;
    }

    .input:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: calc(var(--_unit) * -1);
    }
  `;
}

if (!customElements.get('px-number')) {
  customElements.define('px-number', PxNumber);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-number': PxNumber;
  }
  interface HTMLElementEventMap {
    'px-number-input': CustomEvent<NumberEventDetail>;
    'px-number-change': CustomEvent<NumberEventDetail>;
  }
}
