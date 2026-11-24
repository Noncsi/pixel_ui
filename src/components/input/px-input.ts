import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface InputEventDetail {
  value: string;
}

/**
 * A framed text field: name entry, a save-file name, a seed, a cheat code.
 *
 * It wraps a real `<input>`, so selection, the caret, autofill, IME and every
 * keyboard shortcut are the platform's. `uppercase` is for the arcade kind of
 * name entry — it folds the value itself rather than only drawing it that
 * way, so what you read back is what was on screen.
 *
 * Inside a `<form>` it submits under its `name`, like a native field.
 *
 * @element px-input
 *
 * @attr {string} value - The text in the field.
 * @attr {string} label - The text beside it, and its accessible name.
 * @attr {boolean} hide-label - Keep the label for screen readers only.
 * @attr {string} placeholder - Shown while it is empty.
 * @attr {number} maxlength - Longest the value may be. 0 is no limit.
 * @attr {'text'|'password'} type - Default "text".
 * @attr {boolean} uppercase - Fold what is typed to upper case.
 * @attr {boolean} show-count - Show "3/8" at the end. Needs maxlength.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {boolean} readonly - Shows the value but refuses edits.
 * @attr {string} name - Form field name.
 *
 * @fires px-input - The text changed as it was typed. `detail: { value }`.
 * @fires px-input-change - The text was committed. `detail: { value }`.
 *
 * @csspart base - The row.
 * @csspart label - The label text.
 * @csspart field - The framed box around the input.
 * @csspart frame - The pixel frame.
 * @csspart input - The input itself.
 * @csspart count - The "3/8" counter.
 *
 * @cssprop --px-input-width - How wide the field is. Default 100%.
 */
export class PxInput extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    value: { type: String },
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    placeholder: { type: String },
    maxlength: { type: Number },
    type: { type: String },
    uppercase: { type: Boolean, reflect: true },
    showCount: { type: Boolean, attribute: 'show-count' },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    name: { type: String },
  };

  declare value: string;
  declare label: string;
  declare hideLabel: boolean;
  declare placeholder: string;
  declare maxlength: number;
  declare type: 'text' | 'password';
  declare uppercase: boolean;
  declare showCount: boolean;
  declare disabled: boolean;
  declare readonly: boolean;
  declare name: string;

  private _internals: ElementInternals | null = null;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.hideLabel = false;
    this.placeholder = '';
    this.maxlength = 0;
    this.type = 'text';
    this.uppercase = false;
    this.showCount = false;
    this.disabled = false;
    this.readonly = false;
    this.name = '';

    if (typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /** The form this field belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this._internals?.form ?? this.closest('form');
  }

  /** Put the caret in the field. */
  override focus(options?: FocusOptions): void {
    const input = this.renderRoot.querySelector('input');
    if (input) input.focus(options);
    else super.focus(options);
  }

  /** Empty the field, as a Clear button would. */
  clear(): void {
    if (this.value === '') return;
    this.value = '';
    this._emit('px-input');
    this._emit('px-input-change');
  }

  protected override updated(): void {
    this._internals?.setFormValue(this.value);
  }

  /** Fold and clip a value the way this field is configured to. */
  private _normalise(raw: string): string {
    const folded = this.uppercase ? raw.toUpperCase() : raw;
    return this.maxlength > 0 ? folded.slice(0, this.maxlength) : folded;
  }

  private _emit(type: 'px-input' | 'px-input-change'): void {
    this.dispatchEvent(
      new CustomEvent<InputEventDetail>(type, {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = this._normalise(input.value);

    // Folding can leave the field showing something other than the value;
    // writing it back keeps the two in step without losing the caret.
    if (input.value !== next) input.value = next;

    if (next === this.value) return;
    this.value = next;
    this._emit('px-input');
  }

  private _onChange(): void {
    // The native change event doesn't leave the shadow root; this one does.
    this._emit('px-input-change');
  }

  protected override render() {
    const count = this.maxlength > 0 && this.showCount;

    return html`
      <div part="base" class="base">
        ${
          this.label && !this.hideLabel
            ? html`<span part="label" class="label" aria-hidden="true">${this.label}</span>`
            : nothing
        }
        <div part="field" class="field">
          <span part="frame" class="frame"></span>
          <input
            part="input"
            class="input"
            .value=${this.value}
            type=${this.type}
            placeholder=${this.placeholder || nothing}
            maxlength=${this.maxlength > 0 ? this.maxlength : nothing}
            aria-label=${this.label || nothing}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            @input=${this._onInput}
            @change=${this._onChange}
          />
        </div>
        ${
          count
            ? html`<span part="count" class="count" aria-hidden="true">
                ${this.value.length}/${this.maxlength}
              </span>`
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

      display: block;
      width: var(--px-input-width, 100%);
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
      flex: 1;
      min-width: calc(var(--_unit) * 16);
    }

    /* Sunk, the way a field should read against a raised panel. */
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

    /* The input sits above the frame and carries the focus ring itself: the
       frame's clip-path would cut the ring off. */
    .input {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      padding: calc(var(--_unit) * 2) calc(var(--_unit) * 2.5);
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1.4;
    }

    :host([uppercase]) .input {
      text-transform: uppercase;
    }

    .input::placeholder {
      color: var(--px-color-text-muted, #94b0c2);
      opacity: 1;
    }

    .input:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: 0;
    }

    .input:disabled {
      cursor: default;
    }

    .count {
      flex: none;
      color: var(--px-color-text-muted, #94b0c2);
    }
  `;
}

if (!customElements.get('px-input')) {
  customElements.define('px-input', PxInput);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-input': PxInput;
  }
  interface HTMLElementEventMap {
    'px-input': CustomEvent<InputEventDetail>;
    'px-input-change': CustomEvent<InputEventDetail>;
  }
}
