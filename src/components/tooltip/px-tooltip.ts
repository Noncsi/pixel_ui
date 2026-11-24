import { LitElement, css, html } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Ids for the hidden description each tooltip gives its trigger. */
let autoId = 0;

/**
 * A pixel tooltip that wraps whatever it describes.
 *
 * It shows on hover after `delay`, at once on keyboard focus, and goes away on
 * Escape — so it is reachable without a mouse. The bubble is positioned with
 * plain CSS against the trigger and does not flip away from the edge of the
 * window; `placement` is a decision, not a hint.
 *
 * Because a shadow root can't be pointed at from outside it, the tooltip adds
 * one hidden `<span>` of its own among its children and points the trigger's
 * `aria-describedby` at that. Both live inside this element, so nothing is
 * touched that the page didn't hand over. The drawn bubble is hidden from
 * assistive technology, which reads that span instead — once, whether or not
 * the bubble happens to be open.
 *
 * @element px-tooltip
 *
 * @attr {string} text - What the tooltip says.
 * @attr {'top'|'bottom'|'left'|'right'} placement - Which side. Default "top".
 * @attr {boolean} open - Reflected: whether the bubble is showing. Settable.
 * @attr {boolean} disabled - Stops it showing at all.
 * @attr {number} delay - Milliseconds to hover before it shows. Default 0.
 *
 * @slot - The trigger: whatever the tooltip describes.
 *
 * @fires px-tooltip-show - The bubble appeared.
 * @fires px-tooltip-hide - The bubble went away.
 *
 * @csspart base - The bubble.
 *
 * @cssprop --px-tooltip-max-width - How wide the bubble may get. Default 160px.
 */
export class PxTooltip extends LitElement {
  static override properties = {
    text: { type: String },
    placement: { type: String, reflect: true },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    delay: { type: Number },
  };

  declare text: string;
  declare placement: TooltipPlacement;
  declare open: boolean;
  declare disabled: boolean;
  declare delay: number;

  private _description: HTMLSpanElement | undefined;
  private _timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.text = '';
    this.placement = 'top';
    this.open = false;
    this.disabled = false;
    this.delay = 0;
  }

  /** Show the bubble now, ignoring `delay`. */
  show(): void {
    if (this.disabled || this.open || !this.text) return;
    this._clearTimer();
    this.open = true;
    this.dispatchEvent(new CustomEvent('px-tooltip-show', { bubbles: true, composed: true }));
  }

  /** Hide the bubble, and cancel a show that was still waiting out its delay. */
  hide(): void {
    this._clearTimer();
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent('px-tooltip-hide', { bubbles: true, composed: true }));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointerenter', this._onPointerEnter);
    this.addEventListener('pointerleave', this._onLeave);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onLeave);
    this.addEventListener('keydown', this._onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerenter', this._onPointerEnter);
    this.removeEventListener('pointerleave', this._onLeave);
    this.removeEventListener('focusin', this._onFocusIn);
    this.removeEventListener('focusout', this._onLeave);
    this.removeEventListener('keydown', this._onKeyDown);
    this._clearTimer();
  }

  protected override updated(): void {
    this._describeTrigger();
  }

  /**
   * Keep the hidden description in step with `text`, and make sure the trigger
   * points at it. aria-describedby reads a hidden element quite happily, so
   * the description is there whether the bubble is open or not.
   */
  private _describeTrigger(): void {
    if (!this._description) {
      const span = document.createElement('span');
      span.id = `px-tooltip-${(autoId += 1)}`;
      span.hidden = true;
      // A slot name nothing renders: it stays in the tree for
      // aria-describedby and is never drawn or counted as the trigger.
      span.slot = 'px-description';
      this._description = span;
      this.append(span);
    }

    this._description.textContent = this.text;

    const trigger = this._trigger;
    if (!trigger) return;
    if (trigger.getAttribute('aria-describedby') !== this._description.id) {
      trigger.setAttribute('aria-describedby', this._description.id);
    }
  }

  /** The first slotted element: what the tooltip is about. */
  private get _trigger(): Element | null {
    for (const child of this.children) {
      if (child !== this._description) return child;
    }
    return null;
  }

  private _clearTimer(): void {
    clearTimeout(this._timer);
    this._timer = undefined;
  }

  private readonly _onPointerEnter = (): void => {
    if (this.disabled) return;
    if (this.delay > 0) {
      this._clearTimer();
      this._timer = setTimeout(() => this.show(), this.delay);
      return;
    }
    this.show();
  };

  private readonly _onFocusIn = (): void => {
    // Focus means the keyboard is driving: waiting out a hover delay would
    // only make the tooltip feel broken.
    this.show();
  };

  private readonly _onLeave = (): void => {
    this.hide();
  };

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.open) {
      this.hide();
      event.stopPropagation();
    }
  };

  protected override render() {
    return html`
      <slot></slot>
      <div part="base" class="bubble" aria-hidden="true" ?hidden=${!this.open}>
        <span class="text">${this.text}</span>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);

      position: relative;
      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    .bubble {
      position: absolute;
      z-index: 10;
      width: max-content;
      max-width: var(--px-tooltip-max-width, 160px);
      padding: calc(var(--_unit) * 2) calc(var(--_unit) * 3);
      background: var(--_border);
      line-height: 1.6;
      text-align: left;
      pointer-events: none;
      ${pixelFrame}
    }

    .bubble[hidden] {
      display: none;
    }

    .bubble::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--_fill);
    }

    .text {
      position: relative;
    }

    /* One art pixel of air between the trigger and the bubble on every side. */
    :host([placement='top']) .bubble {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: calc(var(--_unit) * 2);
    }

    :host([placement='bottom']) .bubble {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: calc(var(--_unit) * 2);
    }

    :host([placement='left']) .bubble {
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-right: calc(var(--_unit) * 2);
    }

    :host([placement='right']) .bubble {
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-left: calc(var(--_unit) * 2);
    }
  `;
}

if (!customElements.get('px-tooltip')) {
  customElements.define('px-tooltip', PxTooltip);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-tooltip': PxTooltip;
  }
  interface HTMLElementEventMap {
    'px-tooltip-show': CustomEvent<void>;
    'px-tooltip-hide': CustomEvent<void>;
  }
}
