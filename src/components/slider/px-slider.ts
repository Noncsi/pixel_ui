import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';
import { onGamepadAction, type GamepadAction } from '../../utils/gamepad.js';

export interface SliderEventDetail {
  value: number;
}

/**
 * A chunky slider for volumes, brightness and the other options-screen dials.
 *
 * A real `<input type="range">` sits invisibly over the artwork, so dragging,
 * touch, the arrow keys, Home, End and Page Up/Down all behave exactly as the
 * platform defines them, and screen readers get a proper slider. The frame,
 * fill and handle are drawn underneath it.
 *
 * A gamepad nudges it left and right by one step while it has focus, holding
 * to repeat.
 *
 * @element px-slider
 *
 * @attr {number} value - Current amount. Clamped to min…max. Default 50.
 * @attr {number} min - Default 0.
 * @attr {number} max - Default 100.
 * @attr {number} step - Default 1.
 * @attr {string} label - The text beside the slider, and its accessible name.
 * @attr {boolean} hide-label - Keep the label for screen readers only.
 * @attr {string} unit - Appended to the shown value, e.g. "%".
 * @attr {boolean} show-value - Show the value at the end of the row.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 *
 * @fires px-slider-input - The value is being changed. `detail: { value }`.
 * @fires px-slider-change - The value was committed. `detail: { value }`.
 *
 * @csspart base - The row.
 * @csspart label - The label text.
 * @csspart track - The slider's frame and background.
 * @csspart fill - The filled part of the track.
 * @csspart knob - The handle.
 * @csspart value - The shown value.
 *
 * @cssprop --px-slider-height - Height of the track. Default 5 art pixels.
 * @cssprop --px-slider-color - The fill colour.
 */
export class PxSlider extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    unit: { type: String },
    showValue: { type: Boolean, attribute: 'show-value' },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare label: string;
  declare hideLabel: boolean;
  declare unit: string;
  declare showValue: boolean;
  declare disabled: boolean;

  private _stopGamepad: (() => void) | undefined;

  constructor() {
    super();
    this.value = 50;
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.label = '';
    this.hideLabel = false;
    this.unit = '';
    this.showValue = false;
    this.disabled = false;
  }

  /** The value after clamping to min…max. */
  get clampedValue(): number {
    const value = Number.isFinite(this.value) ? this.value : this.min;
    return Math.min(Math.max(value, this.min), this.safeMax);
  }

  /** How far along the track the value sits, 0…1. */
  get ratio(): number {
    const span = this.safeMax - this.min;
    return span > 0 ? (this.clampedValue - this.min) / span : 0;
  }

  private get safeMax(): number {
    return this.max > this.min ? this.max : this.min + 1;
  }

  private get safeStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // focusin rather than focus: the thing that takes focus is the input in
    // the shadow root, and focusin is the one that bubbles up to the host.
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('focusin', this._onFocusIn);
    this.removeEventListener('focusout', this._onFocusOut);
    this._releaseGamepad();
  }

  /**
   * Move to `value` and report it both ways, the way an arrow key on a range
   * input does. A value that clamps back to where it already was is no change
   * at all, and says nothing — again, as the native control behaves.
   */
  private _commit(value: number): void {
    const next = Math.min(Math.max(value, this.min), this.safeMax);
    if (next === this.clampedValue) return;

    this.value = next;
    this._emit('px-slider-input');
    this._emit('px-slider-change');
  }

  private _emit(type: 'px-slider-input' | 'px-slider-change'): void {
    this.dispatchEvent(
      new CustomEvent<SliderEventDetail>(type, {
        detail: { value: this.clampedValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).valueAsNumber;
    this._emit('px-slider-input');
  }

  private _onChange(): void {
    // The native change event doesn't leave the shadow root; this one does.
    this._emit('px-slider-change');
  }

  private readonly _onFocusIn = (): void => {
    if (this._stopGamepad || this.disabled) return;
    this._stopGamepad = onGamepadAction(this._onGamepadAction);
  };

  private readonly _onFocusOut = (): void => {
    this._releaseGamepad();
  };

  private _releaseGamepad(): void {
    this._stopGamepad?.();
    this._stopGamepad = undefined;
  }

  private readonly _onGamepadAction = (action: GamepadAction): void => {
    if (this.disabled) return;
    if (action === 'left') this._commit(this.clampedValue - this.safeStep);
    else if (action === 'right') this._commit(this.clampedValue + this.safeStep);
  };

  protected override render() {
    const shown = `${this.clampedValue}${this.unit}`;

    return html`
      <div part="base" class="base">
        ${
          this.label && !this.hideLabel
            ? html`<span part="label" class="label" aria-hidden="true">${this.label}</span>`
            : nothing
        }
        <div part="track" class="track" style="--_ratio: ${this.ratio}">
          <span class="frame"></span>
          <span part="fill" class="fill"></span>
          <span part="knob" class="knob"></span>
          <input
            class="input"
            type="range"
            .value=${String(this.clampedValue)}
            min=${this.min}
            max=${this.safeMax}
            step=${this.safeStep}
            ?disabled=${this.disabled}
            aria-label=${this.label || nothing}
            aria-valuetext=${this.unit ? shown : nothing}
            @input=${this._onInput}
            @change=${this._onChange}
          />
        </div>
        ${
          this.showValue
            ? html`<span part="value" class="value" aria-hidden="true">${shown}</span>`
            : nothing
        }
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_height: var(--px-slider-height, calc(var(--_unit) * 5));
      --_fill: var(--px-slider-color, var(--px-color-accent, #38b764));
      --_empty: var(--px-color-bg, #1a1c2c);
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

    .track {
      position: relative;
      flex: 1;
      height: var(--_height);
      min-width: calc(var(--_unit) * 12);
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
      background: var(--_empty);
    }

    /* Inside the frame, so the fill never covers the border. */
    .fill {
      position: absolute;
      top: var(--_unit);
      bottom: var(--_unit);
      left: var(--_unit);
      width: calc((100% - var(--_unit) * 2) * var(--_ratio));
      background: var(--_fill);
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.25);
    }

    /* Full height on purpose: a handle that stands past the track is what
       makes it read as a slider rather than a progress bar. */
    .knob {
      position: absolute;
      top: 0;
      bottom: 0;
      left: calc(var(--_ratio) * (100% - var(--_unit) * 3));
      width: calc(var(--_unit) * 3);
      background: var(--px-color-text, #f4f4f4);
      box-shadow:
        inset 0 var(--_unit) 0 rgb(255 255 255 / 0.35),
        inset 0 calc(var(--_unit) * -1) 0 rgb(0 0 0 / 0.35);
    }

    /* The real control, invisible but still the thing you drag and focus.
       It is transparent rather than opacity: 0 so its focus ring still
       paints — and it carries the ring because it has no clip-path to cut
       the ring off, unlike the frame. */
    .input {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      margin: 0;
      appearance: none;
      background: transparent;
      cursor: pointer;
    }

    .input:disabled {
      cursor: default;
    }

    .input::-webkit-slider-thumb {
      appearance: none;
      width: calc(var(--_unit) * 3);
      height: var(--_height);
      background: transparent;
    }

    .input::-moz-range-thumb {
      width: calc(var(--_unit) * 3);
      height: var(--_height);
      border: 0;
      border-radius: 0;
      background: transparent;
    }

    .input:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .value {
      flex: none;
      min-width: calc(var(--_unit) * 8);
      color: var(--px-color-text-muted, #94b0c2);
      text-align: right;
    }
  `;
}

if (!customElements.get('px-slider')) {
  customElements.define('px-slider', PxSlider);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-slider': PxSlider;
  }
  interface HTMLElementEventMap {
    'px-slider-input': CustomEvent<SliderEventDetail>;
    'px-slider-change': CustomEvent<SliderEventDetail>;
  }
}
