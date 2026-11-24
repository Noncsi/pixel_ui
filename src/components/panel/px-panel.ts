import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

/**
 * A framed surface: the box every other component in the kit is drawn on,
 * on its own, for the screens the kit doesn't cover.
 *
 * A shop, a character sheet, a quest log — all of them are a panel with
 * something in it, and none of them needs a component of its own. `inset`
 * sinks the surface into the page instead of standing it out, which is what
 * a list or a block of text usually wants to sit in.
 *
 * It takes no part in the keyboard: a panel is a surface, not a control. With
 * a `label` it becomes a named region, so a screen reader can jump to it.
 *
 * @element px-panel
 *
 * @attr {string} label - The heading, and the region's accessible name.
 * @attr {boolean} hide-label - Keep the heading for screen readers only.
 * @attr {boolean} inset - Sink the surface instead of standing it out.
 * @attr {boolean} flat - Drop the frame, keeping the padding.
 *
 * @slot - The contents.
 * @slot header - Beside the heading: a count, a close button.
 * @slot footer - Along the bottom.
 *
 * @csspart base - The panel.
 * @csspart frame - The pixel frame behind it.
 * @csspart header - The heading row.
 * @csspart label - The heading.
 * @csspart content - The contents.
 * @csspart footer - The bottom row.
 *
 * @cssprop --px-panel-fill - The surface colour.
 * @cssprop --px-panel-padding - Space inside the frame. Default 4 art pixels.
 */
export class PxPanel extends LitElement {
  static override properties = {
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    inset: { type: Boolean, reflect: true },
    flat: { type: Boolean, reflect: true },
    _hasHeader: { state: true },
    _hasFooter: { state: true },
  };

  declare label: string;
  declare hideLabel: boolean;
  declare inset: boolean;
  declare flat: boolean;

  declare private _hasHeader: boolean;
  declare private _hasFooter: boolean;

  constructor() {
    super();
    this.label = '';
    this.hideLabel = false;
    this.inset = false;
    this.flat = false;
    this._hasHeader = false;
    this._hasFooter = false;
  }

  protected override updated(): void {
    // A panel with a name is somewhere a screen reader can be sent; one
    // without is just a box, and saying so would only add noise.
    if (this.label) {
      this.setAttribute('role', 'group');
      this.setAttribute('aria-label', this.label);
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    }
  }

  protected override firstUpdated(): void {
    // Not every DOM implementation fires slotchange for a slot's first
    // assignment, so look once as soon as the slots exist.
    for (const name of ['header', 'footer'] as const) {
      const slot = this.renderRoot.querySelector(`slot[name="${name}"]`);
      if (slot instanceof HTMLSlotElement) this._applySlot(name, slot);
    }
  }

  private _onSlotChange(name: 'header' | 'footer', event: Event): void {
    this._applySlot(name, event.target as HTMLSlotElement);
  }

  private _applySlot(name: 'header' | 'footer', slot: HTMLSlotElement): void {
    const filled = slot.assignedElements().length > 0;
    if (name === 'header') this._hasHeader = filled;
    else this._hasFooter = filled;
  }

  protected override render() {
    const showHeading = Boolean(this.label) && !this.hideLabel;
    const showHeader = showHeading || this._hasHeader;

    return html`
      <div part="base" class="base">
        ${this.flat ? nothing : html`<span part="frame" class="frame"></span>`}
        <div part="header" class="header ${showHeader ? '' : 'empty'}">
          ${
            showHeading
              ? html`<p part="label" class="label" aria-hidden="true">${this.label}</p>`
              : nothing
          }
          <slot name="header" @slotchange=${(e: Event) => this._onSlotChange('header', e)}></slot>
        </div>
        <div part="content" class="content"><slot></slot></div>
        <div part="footer" class="footer ${this._hasFooter ? '' : 'empty'}">
          <slot name="footer" @slotchange=${(e: Event) => this._onSlotChange('footer', e)}></slot>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_pad: var(--px-panel-padding, calc(var(--_unit) * 4));
      --_fill: var(--px-panel-fill, var(--px-color-surface, #333c57));
      --_border: var(--px-color-border, #0b0c14);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    /* Sunk rather than raised: the surface goes back to the page colour and
       the highlight moves to the bottom, so it reads as a hole. */
    :host([inset]) {
      --_fill: var(--px-panel-fill, var(--px-color-bg, #1a1c2c));
    }

    .base {
      position: relative;
      padding: var(--_pad);
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

    :host([inset]) .frame::before {
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
    }

    .header,
    .content,
    .footer {
      position: relative;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: calc(var(--_unit) * 3);
      margin-bottom: calc(var(--_unit) * 3);
    }

    .label {
      margin: 0;
      color: var(--px-color-text-muted, #94b0c2);
      text-transform: uppercase;
    }

    .footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: calc(var(--_unit) * 2);
      margin-top: calc(var(--_unit) * 3);
    }

    /* Nothing in a row: no gap left behind it either. */
    .header.empty,
    .footer.empty {
      display: none;
    }
  `;
}

if (!customElements.get('px-panel')) {
  customElements.define('px-panel', PxPanel);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-panel': PxPanel;
  }
}
