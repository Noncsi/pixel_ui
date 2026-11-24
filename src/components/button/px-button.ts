import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md';
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonToggleEventDetail {
  pressed: boolean;
}

/**
 * A pixel-art button, framed like the rest of the kit.
 *
 * It wraps a real `<button>` in its shadow root, so Enter, Space, focus and
 * the disabled state all behave the way the platform defines them. With
 * `toggle` it becomes a two-state button (`aria-pressed`), which is what menus
 * and option screens usually want.
 *
 * Inside a `<form>` it submits or resets like a native button: the form is
 * found through `ElementInternals` where that exists, and through the DOM
 * otherwise.
 *
 * @element px-button
 *
 * @attr {'primary'|'secondary'|'danger'} variant - Colour scheme. Default "primary".
 * @attr {'sm'|'md'} size - Type scale. Default "md".
 * @attr {'button'|'submit'|'reset'} type - Behaviour inside a form. Default "button".
 * @attr {boolean} disabled - Greys the button out and stops it responding.
 * @attr {boolean} toggle - Makes it a two-state button that flips `pressed` when clicked.
 * @attr {boolean} pressed - The state of a toggle button. Reflected.
 * @attr {boolean} full-width - Stretch to the width of the container.
 *
 * @slot - The label.
 * @slot icon - Shown before the label; images are rendered unsmoothed.
 *
 * @fires px-toggle - A toggle button changed state. `detail: { pressed }`.
 *
 * @csspart base - The button itself.
 * @csspart frame - The pixel frame and fill behind the label.
 * @csspart label - The label text.
 *
 * @cssprop --px-button-color - Overrides the variant's fill colour.
 */
export class PxButton extends LitElement {
  /** Lets the browser associate the button with a surrounding form. */
  static formAssociated = true;

  /** Focus lands on the inner button, so `<px-button>` is focusable itself. */
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    type: { type: String },
    disabled: { type: Boolean, reflect: true },
    toggle: { type: Boolean, reflect: true },
    pressed: { type: Boolean, reflect: true },
    fullWidth: { type: Boolean, attribute: 'full-width', reflect: true },
  };

  declare variant: ButtonVariant;
  declare size: ButtonSize;
  declare type: ButtonType;
  declare disabled: boolean;
  declare toggle: boolean;
  declare pressed: boolean;
  declare fullWidth: boolean;

  private _internals: ElementInternals | null = null;

  constructor() {
    super();
    this.variant = 'primary';
    this.size = 'md';
    this.type = 'button';
    this.disabled = false;
    this.toggle = false;
    this.pressed = false;
    this.fullWidth = false;

    // Not every DOM implementation has ElementInternals; `form` falls back to
    // walking the tree, so the button still works where it is missing.
    if (typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /** The form this button belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this._internals?.form ?? this.closest('form');
  }

  private _onClick(): void {
    if (this.disabled) return;

    if (this.toggle) {
      this.pressed = !this.pressed;
      this.dispatchEvent(
        new CustomEvent<ButtonToggleEventDetail>('px-toggle', {
          detail: { pressed: this.pressed },
          bubbles: true,
          composed: true,
        }),
      );
    }

    // The inner button is always type="button": the shadow root has no form of
    // its own, so submitting and resetting are done here instead.
    const form = this.form;
    if (!form) return;
    if (this.type === 'submit' && typeof form.requestSubmit === 'function') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  }

  protected override render() {
    return html`
      <button
        part="base"
        class="base"
        type="button"
        ?disabled=${this.disabled}
        aria-pressed=${this.toggle ? String(this.pressed) : nothing}
        @click=${this._onClick}
      >
        <span part="frame" class="frame"></span>
        <slot name="icon"></slot>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-button-color, var(--px-color-surface, #333c57));
      --_text: var(--px-color-text, #f4f4f4);
      --_border: var(--px-color-border, #0b0c14);
      --_fast: var(--px-duration-fast, 120ms);

      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-md, 12px);
    }

    :host([hidden]) {
      display: none;
    }

    :host([size='sm']) {
      font-size: var(--px-font-size-sm, 8px);
    }

    /* Outlined: the inside matches the page, so only the frame reads. */
    :host([variant='secondary']) {
      --_fill: var(--px-button-color, var(--px-color-bg, #1a1c2c));
      --_text: var(--px-color-text-muted, #94b0c2);
    }

    /* The red fill is the same in both themes, so the label has to be too:
       the light theme's dark text would barely read against it. */
    :host([variant='danger']) {
      --_fill: var(--px-button-color, var(--px-color-danger, #b13e53));
      --_text: var(--px-color-text-on-danger, #f4f4f4);
    }

    :host([full-width]) {
      display: block;
    }

    :host([full-width]) .base {
      width: 100%;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    :host([disabled]) .base {
      opacity: 0.5;
    }

    .base {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: calc(var(--_unit) * 2);
      box-sizing: border-box;
      min-height: calc(var(--_unit) * 8);
      padding: calc(var(--_unit) * 2) calc(var(--_unit) * 3);
      border: 0;
      background: none;
      color: var(--_text);
      font: inherit;
      line-height: 1;
      text-transform: uppercase;
      cursor: pointer;
    }

    /* The frame is a layer of its own rather than the button's background: a
       clip-path would cut off the focus ring, and that has to stay visible. */
    .frame {
      position: absolute;
      inset: 0;
      background: var(--_border);
      ${pixelFrame}
    }

    /* Same construction as the health bar's track: the frame's background is
       the border, and ::before paints the fill one art pixel inside it. */
    .frame::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--_fill);
      /* A one-pixel highlight along the top sells the pixel-art look. */
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.25);
      transition: filter var(--_fast) steps(2, end);
    }

    /* Keep the label and the icon above the frame. A <slot> is display:
       contents and so has no box of its own: the slotted node is what has to
       be lifted, or it paints underneath. */
    .label,
    slot::slotted(*) {
      position: relative;
    }

    .base:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: 0;
    }

    /* Pressed: the highlight moves to the bottom edge and the content drops by
       one art pixel, so the button looks pushed in without moving its frame. */
    :host(:active:not([disabled])) .frame::before,
    .base[aria-pressed='true'] .frame::before {
      box-shadow: inset 0 calc(var(--_unit) * -1) 0 rgb(0 0 0 / 0.25);
      filter: brightness(0.85);
    }

    :host(:active:not([disabled])) .label,
    :host(:active:not([disabled])) slot::slotted(*),
    .base[aria-pressed='true'] .label,
    .base[aria-pressed='true'] slot::slotted(*) {
      transform: translateY(var(--_unit));
    }

    ::slotted(img),
    ::slotted(svg) {
      display: block;
      height: 1em;
      image-rendering: pixelated;
    }

    @media (prefers-reduced-motion: reduce) {
      .base::before {
        transition: none;
      }
    }
  `;
}

if (!customElements.get('px-button')) {
  customElements.define('px-button', PxButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-button': PxButton;
  }
  interface HTMLElementEventMap {
    'px-toggle': CustomEvent<ButtonToggleEventDetail>;
  }
}
