import { LitElement, css, html } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface ToggleChangeEventDetail {
  checked: boolean;
}

/**
 * An on/off switch for an options screen.
 *
 * This is the settings-row kind of switch — a label, then a chunky two-position
 * track that reads ON or OFF — as opposed to `<px-button toggle>`, which is a
 * button that stays pushed in. It wraps a real `<button role="switch">`, so
 * Enter, Space, focus and the disabled state are the platform's.
 *
 * Inside a `<form>` it submits its `value` while it is on and nothing while it
 * is off, the way a checkbox does.
 *
 * @element px-toggle
 *
 * @attr {boolean} checked - Whether it is on. Reflected.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {string} label - The text beside the switch, and its accessible name.
 * @attr {boolean} hide-label - Keep the label for screen readers only.
 * @attr {string} name - Form field name.
 * @attr {string} value - Form value submitted while it is on. Default "on".
 *
 * @fires px-toggle-change - It was switched. `detail: { checked }`.
 *
 * @csspart base - The button wrapping the whole row.
 * @csspart label - The label text.
 * @csspart track - The switch's frame.
 * @csspart knob - The part that slides.
 * @csspart state - The ON / OFF text.
 *
 * @cssprop --px-toggle-color - The fill while it is on.
 */
export class PxToggle extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    name: { type: String },
    value: { type: String },
  };

  declare checked: boolean;
  declare disabled: boolean;
  declare label: string;
  declare hideLabel: boolean;
  declare name: string;
  declare value: string;

  private _internals: ElementInternals | null = null;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.label = '';
    this.hideLabel = false;
    this.name = '';
    this.value = 'on';

    if (typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /** The form this switch belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this._internals?.form ?? this.closest('form');
  }

  protected override updated(): void {
    // A switch that is off submits nothing at all, like an unchecked checkbox.
    this._internals?.setFormValue(this.checked ? this.value : null);
  }

  private _onClick(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent<ToggleChangeEventDetail>('px-toggle-change', {
        detail: { checked: this.checked },
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
        role="switch"
        aria-checked=${String(this.checked)}
        aria-label=${this.label}
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <span part="label" class="label" aria-hidden="true">${this.label}</span>
        <span part="track" class="track">
          <span class="frame"></span>
          <span part="knob" class="knob"></span>
        </span>
        <span part="state" class="state" aria-hidden="true">${this.checked ? 'on' : 'off'}</span>
      </button>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_on: var(--px-toggle-color, var(--px-color-accent, #38b764));
      --_off: var(--px-color-bg, #1a1c2c);
      --_border: var(--px-color-border, #0b0c14);
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
      align-items: center;
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

    .label {
      text-transform: uppercase;
    }

    :host([hide-label]) .label {
      /* Still read, just not drawn: the button's aria-label carries the name. */
      display: none;
    }

    .track {
      position: relative;
      flex: none;
      width: calc(var(--_unit) * 10);
      height: calc(var(--_unit) * 5);
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
      background: var(--_off);
      transition: background-color var(--_fast) steps(2, end);
    }

    :host([checked]) .frame::before {
      background: var(--_on);
    }

    /* One art pixel in from the frame, and one art pixel of travel short of
       the far edge, so the knob never overlaps the border. */
    .knob {
      position: absolute;
      top: var(--_unit);
      left: var(--_unit);
      width: calc(var(--_unit) * 4);
      height: calc(var(--_unit) * 3);
      background: var(--px-color-text-muted, #94b0c2);
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.25);
      transition: transform var(--_fast) steps(2, end);
    }

    :host([checked]) .knob {
      transform: translateX(calc(var(--_unit) * 4));
      background: var(--px-color-text, #f4f4f4);
    }

    .state {
      flex: none;
      width: calc(var(--_unit) * 6);
      color: var(--px-color-text-muted, #94b0c2);
      text-transform: uppercase;
    }

    :host([checked]) .state {
      color: var(--_on);
    }

    @media (prefers-reduced-motion: reduce) {
      .frame::before,
      .knob {
        transition: none;
      }
    }
  `;
}

if (!customElements.get('px-toggle')) {
  customElements.define('px-toggle', PxToggle);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-toggle': PxToggle;
  }
  interface HTMLElementEventMap {
    'px-toggle-change': CustomEvent<ToggleChangeEventDetail>;
  }
}
