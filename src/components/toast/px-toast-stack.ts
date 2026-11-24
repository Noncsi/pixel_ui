import { LitElement, css, html } from 'lit';
import { PxToast, type ToastVariant } from './px-toast.js';

export type ToastPlacement =
  'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';

export interface ToastOptions {
  variant?: ToastVariant;
  /** Milliseconds on screen. 0 stays until dismissed. */
  duration?: number;
  /** Drop the dismiss button. */
  noClose?: boolean;
}

/**
 * Where toasts go: a fixed corner of the window that stacks them.
 *
 * Put one in the page, keep a reference to it, and call `toast()`. Each
 * message is a `<px-toast>` the stack creates, shows and throws away once it
 * is gone, so nothing piles up in the DOM. The newest is always the one
 * nearest the edge the stack is anchored to.
 *
 * The stack itself doesn't catch the pointer — only the toasts in it do — so
 * it can sit over the game without swallowing clicks.
 *
 * @element px-toast-stack
 *
 * @attr {string} placement - Corner or edge. Default "bottom-right".
 * @attr {number} max - How many to show at once; the oldest goes early. 0 is no limit. Default 5.
 *
 * @slot - The toasts. `toast()` fills this for you.
 *
 * @csspart base - The stack.
 */
export class PxToastStack extends LitElement {
  static override properties = {
    placement: { type: String, reflect: true },
    max: { type: Number },
  };

  declare placement: ToastPlacement;
  declare max: number;

  constructor() {
    super();
    this.placement = 'bottom-right';
    this.max = 5;
  }

  /** The toasts currently in the stack, oldest first. */
  get toasts(): PxToast[] {
    return [...this.children].filter((child): child is PxToast => child instanceof PxToast);
  }

  /** Show a message. Returns the toast, in case you want to hold onto it. */
  toast(message: string, options: ToastOptions = {}): PxToast {
    const toast = document.createElement('px-toast');
    toast.textContent = message;
    if (options.variant) toast.variant = options.variant;
    if (options.duration !== undefined) toast.duration = options.duration;
    if (options.noClose) toast.noClose = true;

    // Gone from the DOM as soon as it is gone from the screen, however it
    // went — the timer ran out, or someone dismissed it.
    toast.addEventListener('px-toast-hide', () => toast.remove(), { once: true });

    this.append(toast);
    toast.show();
    this._trim();
    return toast;
  }

  /** Take every toast off screen at once. */
  clear(): void {
    for (const toast of this.toasts) toast.hide();
  }

  private _trim(): void {
    if (this.max <= 0) return;
    const toasts = this.toasts;
    for (const toast of toasts.slice(0, Math.max(0, toasts.length - this.max))) {
      toast.hide();
    }
  }

  protected override render() {
    return html`<slot part="base"></slot>`;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);

      position: fixed;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: calc(var(--_unit) * 2);
      max-height: 100vh;
      padding: calc(var(--_unit) * 4);
      overflow: hidden;
      /* The stack is a region, not a surface: clicks go through it to the
         game, and only the toasts themselves take the pointer. */
      pointer-events: none;
    }

    :host([hidden]) {
      display: none;
    }

    ::slotted(px-toast) {
      pointer-events: auto;
    }

    /* Anchored at the top, the newest toast belongs nearest the top edge,
       which is the reverse of DOM order. */
    :host([placement^='top']) {
      top: 0;
      flex-direction: column-reverse;
    }

    :host([placement^='bottom']) {
      bottom: 0;
    }

    :host([placement$='left']) {
      left: 0;
      align-items: flex-start;
    }

    :host([placement$='right']) {
      right: 0;
      align-items: flex-end;
    }

    :host([placement='top']),
    :host([placement='bottom']) {
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
    }
  `;
}

if (!customElements.get('px-toast-stack')) {
  customElements.define('px-toast-stack', PxToastStack);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-toast-stack': PxToastStack;
  }
}
