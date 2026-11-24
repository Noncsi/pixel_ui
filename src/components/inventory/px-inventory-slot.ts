import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

/** Ids for slots without one, so the grid can point its highlight at them. */
let autoId = 0;

/**
 * One cell of a `<px-inventory-grid>`: a framed square holding an item, or
 * nothing at all.
 *
 * It works out for itself whether it is empty — an empty slot is drawn sunk
 * into the panel rather than standing out of it — so a grid of twenty cells
 * is twenty of these, however few of them hold anything.
 *
 * The grid owns the highlight and the keyboard; a slot only draws itself.
 *
 * @element px-inventory-slot
 *
 * @attr {string} label - What the item is called, for screen readers.
 * @attr {number} count - How many. Drawn in the corner, 1 and 0 left off.
 * @attr {boolean} disabled - A locked cell: skipped by navigation, never chosen.
 * @attr {boolean} active - Reflected, read-only: set by the grid.
 * @attr {boolean} empty - Reflected, read-only: nothing is slotted into it.
 *
 * @slot - The item's art.
 *
 * @csspart base - The cell.
 * @csspart frame - The pixel frame.
 * @csspart count - The number in the corner.
 */
export class PxInventorySlot extends LitElement {
  static override properties = {
    label: { type: String },
    count: { type: Number },
    disabled: { type: Boolean, reflect: true },
    active: { type: Boolean, reflect: true },
    empty: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare count: number;
  declare disabled: boolean;
  declare active: boolean;
  declare empty: boolean;

  constructor() {
    super();
    this.label = '';
    this.count = 0;
    this.disabled = false;
    this.active = false;
    this.empty = true;
  }

  /** What a screen reader should call this cell. */
  get accessibleName(): string {
    const name = this.label || (this.textContent ?? '').trim();
    if (this.empty) return name || 'Empty slot';
    return this.count > 1 ? `${name}, ${this.count}` : name;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'option');
    if (!this.id) this.id = `px-inventory-slot-${(autoId += 1)}`;
  }

  protected override updated(): void {
    this.setAttribute('aria-selected', String(this.active));
    this.setAttribute('aria-disabled', String(this.disabled));

    // The art is usually a picture, so the name has to be spelled out — but
    // only when there is one to give; an unnamed slot is better left to be
    // named by whatever is in it.
    const name = this.accessibleName;
    if (name) this.setAttribute('aria-label', name);
    else this.removeAttribute('aria-label');
  }

  protected override firstUpdated(): void {
    // Not every DOM implementation fires slotchange for a slot's first
    // assignment, so look once as soon as the slot exists.
    const slot = this.renderRoot.querySelector('slot');
    if (slot) this._readSlot(slot);
  }

  private _onSlotChange(event: Event): void {
    this._readSlot(event.target as HTMLSlotElement);
  }

  private _readSlot(slot: HTMLSlotElement): void {
    // An element counts whatever it says: the art is usually an <svg>, whose
    // textContent is empty.
    this.empty = !slot
      .assignedNodes({ flatten: true })
      .some(
        (node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? '').trim() !== '',
      );
  }

  protected override render() {
    return html`
      <div part="base" class="base">
        <span part="frame" class="frame"></span>
        <span class="art"><slot @slotchange=${this._onSlotChange}></slot></span>
        ${
          this.count > 1
            ? html`<span part="count" class="count" aria-hidden="true">${this.count}</span>`
            : nothing
        }
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_size: var(--px-inventory-slot-size, calc(var(--_unit) * 12));
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
      cursor: pointer;
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.4;
      cursor: default;
    }

    .base {
      position: relative;
      width: var(--_size);
      height: var(--_size);
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
      /* A filled slot catches the light along the top; an empty one is a
         hole in the panel, so the shadow goes there instead. */
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.15);
    }

    :host([empty]) .frame::before {
      background: var(--px-color-bg, #1a1c2c);
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
    }

    :host([active]) .frame {
      background: var(--px-color-highlight, #ffcd75);
    }

    .art {
      position: absolute;
      inset: calc(var(--_unit) * 2);
      display: grid;
      place-items: center;
    }

    .count {
      position: absolute;
      right: var(--_unit);
      bottom: var(--_unit);
      padding: 0 calc(var(--_unit) * 0.5);
      /* A chip rather than an outline: the number sits over whatever art the
         slot holds, and the border colour is dark in both themes, so the text
         on it has to be light in both. */
      background: var(--_border);
      color: var(--px-color-text-on-dark, #f4f4f4);
      line-height: 1;
    }

    ::slotted(img),
    ::slotted(svg) {
      display: block;
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }
  `;
}

if (!customElements.get('px-inventory-slot')) {
  customElements.define('px-inventory-slot', PxInventorySlot);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-inventory-slot': PxInventorySlot;
  }
}
