import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type NoticeVariant = 'info' | 'success' | 'warning' | 'danger';
export type NoticeLive = 'off' | 'polite' | 'assertive';

/** The glyph each variant leads with. */
const MARKS: Record<NoticeVariant, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  danger: '×',
};

/**
 * A message that stays put: "no connection", "this save is from an older
 * version", "autosave is off".
 *
 * `<px-toast>` is the other half of this pair, and the difference is whether
 * the message is still true in ten seconds. A toast reports something that
 * happened — item acquired, game saved — and takes itself away. A notice
 * describes a state that holds, so it sits in the layout and stays until the
 * state changes. If someone would want to go back and reread it, it is a
 * notice.
 *
 * That is also why this one has a `warning` variant and the toast does not: a
 * warning you need to keep looking at has no business vanishing after four
 * seconds.
 *
 * **It is not a live region by default**, and that is deliberate. A live
 * region announces when it is inserted or when its text changes, so a notice
 * rendered with the page would announce nothing anyway — it is read in order
 * like the rest of the page, which is right. Set `live` only for a notice
 * that arrives, or changes, while someone is already on the page.
 *
 * @element px-notice
 *
 * @attr {'info'|'success'|'warning'|'danger'} variant - Colour and glyph. Default "info".
 * @attr {string} heading - A line above the message.
 * @attr {'off'|'polite'|'assertive'} live - Announce it when it arrives. Default "off".
 * @attr {boolean} dismissible - Add a button that closes it.
 * @attr {boolean} open - Reflected: whether it is showing. Default true.
 * @attr {boolean} no-mark - Drop the leading glyph.
 *
 * @slot - The message.
 * @slot actions - Buttons along the bottom.
 *
 * @fires px-notice-dismiss - It was closed by its button.
 *
 * @csspart base - The notice.
 * @csspart frame - The pixel frame behind it.
 * @csspart mark - The leading glyph.
 * @csspart heading - The heading line.
 * @csspart message - The message.
 * @csspart close - The dismiss button.
 *
 * @cssprop --px-notice-color - Overrides the variant's accent colour.
 */
export class PxNotice extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    heading: { type: String },
    live: { type: String, reflect: true },
    dismissible: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    noMark: { type: Boolean, attribute: 'no-mark', reflect: true },
  };

  declare variant: NoticeVariant;
  declare heading: string;
  declare live: NoticeLive;
  declare dismissible: boolean;
  declare open: boolean;
  declare noMark: boolean;

  constructor() {
    super();
    this.variant = 'info';
    this.heading = '';
    this.live = 'off';
    this.dismissible = false;
    this.open = true;
    this.noMark = false;
  }

  /** Close it, as its button would. */
  dismiss(): void {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent('px-notice-dismiss', { bubbles: true, composed: true }));
  }

  /** Show it again. */
  show(): void {
    this.open = true;
  }

  protected override updated(): void {
    // A danger notice that arrives mid-page is an alert; anything else that
    // arrives is polite. Nothing here is a live region unless asked, because
    // one that was always on the page has nothing to announce.
    if (this.live === 'off') {
      this.removeAttribute('role');
      this.removeAttribute('aria-live');
      return;
    }

    this.setAttribute('role', this.live === 'assertive' ? 'alert' : 'status');
    this.setAttribute('aria-live', this.live);
  }

  private _onClose(): void {
    this.dismiss();
  }

  protected override render() {
    if (!this.open) return nothing;

    return html`
      <div part="base" class="base">
        <span part="frame" class="frame"></span>
        <div class="row">
          ${
            this.noMark
              ? nothing
              : html`<span part="mark" class="mark" aria-hidden="true"
                  >${MARKS[this.variant] ?? MARKS.info}</span
                >`
          }
          <div class="body">
            ${this.heading ? html`<p part="heading" class="heading">${this.heading}</p>` : nothing}
            <div part="message" class="message"><slot></slot></div>
            <!-- The slot is the flex row itself: a wrapper around it would be
                 a box that is never empty, because the slot is in it, and so
                 could not be collapsed when nothing is slotted. -->
            <slot name="actions" class="actions"></slot>
          </div>
          ${
            this.dismissible
              ? html`<button
                  part="close"
                  class="close"
                  type="button"
                  aria-label="Dismiss"
                  @click=${this._onClose}
                >
                  ×
                </button>`
              : nothing
          }
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_accent: var(--px-notice-color, var(--px-color-text-muted, #94b0c2));
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]),
    :host(:not([open])) {
      display: none;
    }

    :host([variant='success']) {
      --_accent: var(--px-notice-color, var(--px-color-accent, #38b764));
    }

    :host([variant='warning']) {
      --_accent: var(--px-notice-color, var(--px-color-warning, #ffcd75));
    }

    :host([variant='danger']) {
      --_accent: var(--px-notice-color, var(--px-color-danger, #b13e53));
    }

    .base {
      position: relative;
      padding: var(--_unit);
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
    }

    /* The accent is a bar down the leading edge rather than a tint over the
       whole box: a tinted panel at this palette either drowns the text or is
       too faint to carry the meaning on its own. */
    .frame::after {
      content: '';
      position: absolute;
      left: var(--_unit);
      top: var(--_unit);
      bottom: var(--_unit);
      width: var(--_unit);
      background: var(--_accent);
    }

    .row {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: calc(var(--_unit) * 2);
      padding: calc(var(--_unit) * 2);
      padding-left: calc(var(--_unit) * 3);
    }

    .mark {
      flex: none;
      display: grid;
      place-items: center;
      width: calc(var(--_unit) * 4);
      height: calc(var(--_unit) * 4);
      background: var(--_accent);
      color: var(--px-color-text-on-dark, #f4f4f4);
      line-height: 1;
    }

    /* Warning is the one accent that flips: gold on the dark theme wants
       dark text, burnt orange on the light theme wants light. Its own token
       carries that, the way --px-color-text-on-danger does. */
    :host([variant='warning']) .mark {
      color: var(--px-color-text-on-warning, #0b0c14);
    }

    .body {
      flex: 1;
      min-width: 0;
    }

    /* The heading is plain text, not the accent colour: success green and
       danger red are chosen to read as fills with something light on them,
       and as words on the light theme's pale panel they all but disappear.
       The variant is already said twice over, by the bar and by the glyph. */
    .heading {
      margin: 0 0 var(--_unit);
      color: var(--px-color-text, #f4f4f4);
      text-transform: uppercase;
    }

    .message {
      line-height: 1.8;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--_unit);
    }

    .actions::slotted(*) {
      margin-top: calc(var(--_unit) * 2);
    }

    .close {
      flex: none;
      width: calc(var(--_unit) * 4);
      height: calc(var(--_unit) * 4);
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
      outline-offset: calc(var(--_unit) / 2);
    }
  `;
}

if (!customElements.get('px-notice')) {
  customElements.define('px-notice', PxNotice);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-notice': PxNotice;
  }
}
