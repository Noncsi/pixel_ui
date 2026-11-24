import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type ToastVariant = 'info' | 'success' | 'danger';

/**
 * One notification: "Item acquired!", "Game saved", "You died".
 *
 * It dismisses itself after `duration`, and holds still while the pointer or
 * the keyboard is on it, so a message can't disappear out from under someone
 * reading it. A thin bar drains along the bottom to show the time left.
 *
 * A danger toast is reported as an alert and interrupts a screen reader; the
 * other two are polite and wait their turn.
 *
 * Use `<px-toast-stack>` to place and stack them. On its own a toast is just
 * an element that shows and hides where you put it.
 *
 * @element px-toast
 *
 * @attr {boolean} open - Reflected: whether it is showing. Settable.
 * @attr {'info'|'success'|'danger'} variant - Colour and urgency. Default "info".
 * @attr {number} duration - Milliseconds on screen. 0 stays until dismissed. Default 4000.
 * @attr {boolean} no-close - Drop the dismiss button.
 *
 * @slot - The message.
 * @slot icon - Shown before the message; images are rendered unsmoothed.
 *
 * @fires px-toast-show - It appeared.
 * @fires px-toast-hide - It went away, by timer or by the button.
 *
 * @csspart base - The toast.
 * @csspart frame - The pixel frame behind it.
 * @csspart message - The message text.
 * @csspart close - The dismiss button.
 * @csspart timer - The draining bar.
 *
 * @cssprop --px-toast-color - Overrides the variant's accent colour.
 */
export class PxToast extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true },
    duration: { type: Number },
    noClose: { type: Boolean, attribute: 'no-close' },
  };

  declare open: boolean;
  declare variant: ToastVariant;
  declare duration: number;
  declare noClose: boolean;

  private _timer: ReturnType<typeof setTimeout> | undefined;
  private _startedAt = 0;
  /** What is left of `duration` after any pauses. */
  private _remaining = 0;

  constructor() {
    super();
    this.open = false;
    this.variant = 'info';
    this.duration = 4000;
    this.noClose = false;
  }

  /** Show it, and start the clock again from the top. */
  show(): void {
    if (this.open) return;
    this._remaining = this.duration;
    this.open = true;
    this.dispatchEvent(new CustomEvent('px-toast-show', { bubbles: true, composed: true }));
  }

  /** Take it off screen. */
  hide(): void {
    if (!this.open) return;
    this._stop();
    this.open = false;
    this.dispatchEvent(new CustomEvent('px-toast-hide', { bubbles: true, composed: true }));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A danger toast interrupts; the rest wait for a gap. Both need the role
    // in place before the text arrives, or there is nothing to announce.
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', this.variant === 'danger' ? 'alert' : 'status');
    }

    this.addEventListener('pointerenter', this._pause);
    this.addEventListener('pointerleave', this._resume);
    this.addEventListener('focusin', this._pause);
    this.addEventListener('focusout', this._resume);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerenter', this._pause);
    this.removeEventListener('pointerleave', this._resume);
    this.removeEventListener('focusin', this._pause);
    this.removeEventListener('focusout', this._resume);
    this._stop();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('variant')) {
      this.setAttribute('role', this.variant === 'danger' ? 'alert' : 'status');
    }

    if (changed.has('open')) {
      if (this.open) this._start();
      else this._stop();
    }
  }

  private _start(): void {
    this._stop();
    if (this.duration <= 0) return;
    if (this._remaining <= 0) this._remaining = this.duration;
    this._startedAt = Date.now();
    this._timer = setTimeout(() => this.hide(), this._remaining);
  }

  private _stop(): void {
    clearTimeout(this._timer);
    this._timer = undefined;
  }

  private readonly _pause = (): void => {
    if (this._timer === undefined) return;
    this._remaining -= Date.now() - this._startedAt;
    this._stop();
  };

  private readonly _resume = (): void => {
    if (!this.open || this.duration <= 0) return;
    if (this._remaining <= 0) {
      this.hide();
      return;
    }
    this._startedAt = Date.now();
    this._timer = setTimeout(() => this.hide(), this._remaining);
  };

  protected override render() {
    return html`
      <div part="base" class="base">
        <span part="frame" class="frame"></span>
        <slot name="icon"></slot>
        <div part="message" class="message"><slot></slot></div>
        ${
          this.noClose
            ? nothing
            : html`<button
                part="close"
                class="close"
                type="button"
                aria-label="Dismiss"
                @click=${this.hide}
              >
                ✕
              </button>`
        }
        ${
          // Re-created every time it opens, which is what restarts the drain.
          this.open && this.duration > 0
            ? html`<span
                part="timer"
                class="timer"
                style="animation-duration: ${this.duration}ms"
              ></span>`
            : nothing
        }
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);
      --_accent: var(--px-toast-color, var(--px-color-text-muted, #94b0c2));

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host(:not([open])),
    :host([hidden]) {
      display: none;
    }

    :host([variant='success']) {
      --_accent: var(--px-toast-color, var(--px-color-accent, #38b764));
    }

    :host([variant='danger']) {
      --_accent: var(--px-toast-color, var(--px-color-danger, #b13e53));
    }

    .base {
      position: relative;
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      min-width: calc(var(--_unit) * 40);
      padding: calc(var(--_unit) * 3);
      padding-bottom: calc(var(--_unit) * 4);
      line-height: 1.6;
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
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.15);
    }

    /* A stripe of the variant's colour down the leading edge, the way a
       status message is marked up in most games. */
    .frame::after {
      content: '';
      position: absolute;
      top: var(--_unit);
      bottom: var(--_unit);
      left: var(--_unit);
      width: var(--_unit);
      background: var(--_accent);
    }

    .message,
    .close,
    slot::slotted(*) {
      position: relative;
    }

    .message {
      flex: 1;
      margin-left: var(--_unit);
    }

    .close {
      flex: none;
      padding: 0;
      border: 0;
      background: none;
      color: var(--px-color-text-muted, #94b0c2);
      font: inherit;
      line-height: 1;
      cursor: pointer;
    }

    .close:hover {
      color: var(--px-color-text, #f4f4f4);
    }

    .close:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .timer {
      position: absolute;
      left: calc(var(--_unit) * 2);
      right: calc(var(--_unit) * 2);
      bottom: calc(var(--_unit) * 2);
      height: var(--_unit);
      background: var(--_accent);
      transform-origin: left;
      animation-name: drain;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }

    /* Held still while anyone is reading it, matching the paused timer. */
    :host(:hover) .timer,
    :host(:focus-within) .timer {
      animation-play-state: paused;
    }

    ::slotted(img),
    ::slotted(svg) {
      display: block;
      height: 1em;
      image-rendering: pixelated;
    }

    @keyframes drain {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      /* The toast still goes away on time; only the moving bar is dropped. */
      .timer {
        display: none;
      }
    }
  `;
}

if (!customElements.get('px-toast')) {
  customElements.define('px-toast', PxToast);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-toast': PxToast;
  }
  interface HTMLElementEventMap {
    'px-toast-show': CustomEvent<void>;
    'px-toast-hide': CustomEvent<void>;
  }
}
