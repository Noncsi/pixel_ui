import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface DialogCloseEventDetail {
  /** Whatever was passed to `close()`, or "dismiss" when it was backed out of. */
  returnValue: string;
}

/**
 * A modal: "Save game?", "Really quit?", the shop screen.
 *
 * It is a real `<dialog>` underneath, opened with `showModal()`, so the focus
 * trap, the backdrop, the Escape key and making the rest of the page inert
 * are the browser's own — all of which are easy to do badly by hand. What the
 * kit adds is the frame around it.
 *
 * Clicking the backdrop dismisses it, as Escape does. `no-dismiss` turns both
 * off for the times a choice has to be made.
 *
 * @element px-dialog
 *
 * @attr {boolean} open - Reflected: whether the modal is up. Settable.
 * @attr {string} label - The title, and the modal's accessible name.
 * @attr {boolean} hide-label - Keep the title for screen readers only.
 * @attr {boolean} no-dismiss - No Escape, no backdrop click: it has to be answered.
 *
 * @slot - The body.
 * @slot footer - The buttons along the bottom.
 *
 * @fires px-dialog-open - The modal came up.
 * @fires px-dialog-close - It went away. `detail: { returnValue }`.
 *
 * @csspart base - The dialog.
 * @csspart frame - The pixel frame behind it.
 * @csspart title - The title.
 * @csspart content - The body.
 * @csspart footer - The row of buttons.
 *
 * @cssprop --px-dialog-width - How wide it is. Default 280px.
 */
export class PxDialog extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    noDismiss: { type: Boolean, attribute: 'no-dismiss' },
    _hasFooter: { state: true },
  };

  declare open: boolean;
  declare label: string;
  declare hideLabel: boolean;
  declare noDismiss: boolean;

  declare private _hasFooter: boolean;

  /** Held between `close(value)` and the native close event that follows. */
  private _returnValue = '';

  constructor() {
    super();
    this.open = false;
    this.label = '';
    this.hideLabel = false;
    this.noDismiss = false;
    this._hasFooter = false;
  }

  protected override firstUpdated(): void {
    // Not every DOM implementation fires slotchange for a slot's first
    // assignment, so look once as soon as the slot exists.
    const slot = this.renderRoot.querySelector('slot[name="footer"]');
    if (slot instanceof HTMLSlotElement) this._hasFooter = slot.assignedElements().length > 0;
  }

  private _onFooterSlotChange(event: Event): void {
    this._hasFooter = (event.target as HTMLSlotElement).assignedElements().length > 0;
  }

  /** Put the modal up. */
  show(): void {
    if (this.open) return;
    this._returnValue = '';
    this.open = true;
  }

  /** Take it down, with a value saying how it was answered. */
  close(returnValue = ''): void {
    if (!this.open) return;
    this._returnValue = returnValue;
    this.open = false;
    // Said now rather than waited for: the native close event is queued as a
    // task, which a background tab can hold on to for a long time. When the
    // close started here there is nothing to wait for — we know the answer.
    this._emitClose();
  }

  private get _dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector('dialog');
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (!changed.has('open')) return;

    const dialog = this._dialog;
    if (!dialog) return;

    if (this.open && !dialog.open) {
      // showModal is what brings the focus trap and the inert background;
      // falling back to the open attribute keeps the component usable where
      // it isn't implemented, without pretending to be modal.
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      this.dispatchEvent(new CustomEvent('px-dialog-open', { bubbles: true, composed: true }));
    } else if (!this.open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close(this._returnValue);
      else {
        dialog.removeAttribute('open');
        this._emitClose();
      }
    }
  }

  private _emitClose(): void {
    this.dispatchEvent(
      new CustomEvent<DialogCloseEventDetail>('px-dialog-close', {
        detail: { returnValue: this._returnValue },
        // A dialog's close is its own business; composed, but it doesn't need
        // to cross out of a host that wraps it.
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * The native close event, for the closes we didn't start: Escape, or a
   * form inside the dialog submitting. A close of our own has already been
   * reported, and `open` is already false, which is how the two are told
   * apart — so nothing is announced twice.
   */
  private readonly _onClose = (): void => {
    if (!this.open) return;
    this.open = false;
    this._emitClose();
  };

  /** Escape asks first; no-dismiss says no. */
  private readonly _onCancel = (event: Event): void => {
    if (!this.noDismiss) {
      this._returnValue = 'dismiss';
      return;
    }
    event.preventDefault();
  };

  /**
   * A click that lands on the dialog itself landed on the backdrop: every
   * pixel of the dialog's own box is covered by the frame or the body.
   */
  private readonly _onClick = (event: MouseEvent): void => {
    if (this.noDismiss) return;
    if (event.target !== this._dialog) return;
    this.close('dismiss');
  };

  protected override render() {
    return html`
      <dialog
        part="base"
        class="base"
        aria-label=${this.label || nothing}
        @close=${this._onClose}
        @cancel=${this._onCancel}
        @click=${this._onClick}
      >
        <span part="frame" class="frame"></span>
        <div class="body">
          ${
            this.label && !this.hideLabel
              ? html`<p part="title" class="title" aria-hidden="true">${this.label}</p>`
              : nothing
          }
          <div part="content" class="content"><slot></slot></div>
          <div part="footer" class="footer ${this._hasFooter ? '' : 'empty'}">
            <slot name="footer" @slotchange=${this._onFooterSlotChange}></slot>
          </div>
        </div>
      </dialog>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);

      display: contents;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
    }

    .base {
      position: relative;
      box-sizing: border-box;
      width: var(--px-dialog-width, 280px);
      max-width: calc(100vw - var(--_unit) * 8);
      padding: calc(var(--_unit) * 4);
      border: 0;
      background: none;
      color: var(--px-color-text, #f4f4f4);
      font: inherit;
    }

    .base::backdrop {
      background: rgb(0 0 0 / 0.65);
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

    .body {
      position: relative;
    }

    .title {
      margin: 0 0 calc(var(--_unit) * 3);
      color: var(--px-color-highlight, #ffcd75);
      text-transform: uppercase;
    }

    .content {
      line-height: 1.8;
    }

    .footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: calc(var(--_unit) * 2);
      margin-top: calc(var(--_unit) * 4);
    }

    /* Nothing in the footer: no gap left behind it. */
    .footer.empty {
      display: none;
    }
  `;
}

if (!customElements.get('px-dialog')) {
  customElements.define('px-dialog', PxDialog);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-dialog': PxDialog;
  }
  interface HTMLElementEventMap {
    'px-dialog-open': CustomEvent<void>;
    'px-dialog-close': CustomEvent<DialogCloseEventDetail>;
  }
}
