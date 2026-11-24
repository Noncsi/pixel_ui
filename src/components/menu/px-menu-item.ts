import { LitElement, css, html } from 'lit';

/**
 * One row of a `<px-menu>`.
 *
 * It carries no navigation of its own: the menu that contains it owns the
 * highlight, the keyboard and the gamepad, and sets `active` on whichever row
 * is current. On its own an item is just a labelled row with an arrow that
 * only shows when it is the active one.
 *
 * The arrow always takes up its space, shown or not, so moving the highlight
 * never shifts the text sideways.
 *
 * @element px-menu-item
 *
 * @attr {string} value - What the menu reports when this row is chosen. Defaults to its text.
 * @attr {boolean} disabled - Greys the row out; navigation skips it and it can't be chosen.
 * @attr {boolean} active - Reflected, read-only: set by the menu on the current row.
 *
 * @slot - The row's label.
 * @slot icon - Shown before the label; images are rendered unsmoothed.
 * @slot detail - Shown at the end of the row, for a setting's current value.
 *
 * @csspart base - The row.
 * @csspart cursor - The arrow marking the active row.
 * @csspart label - The label text.
 */
export class PxMenuItem extends LitElement {
  static override properties = {
    value: { type: String },
    disabled: { type: Boolean, reflect: true },
    active: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare disabled: boolean;
  declare active: boolean;

  constructor() {
    super();
    this.value = '';
    this.disabled = false;
    this.active = false;
  }

  /** `value` when it is set, and the row's label when it isn't. */
  get resolvedValue(): string {
    if (this.value) return this.value;

    // The label is the default slot only: an icon's title or the current
    // setting in the detail slot is not part of what this row is called.
    return [...this.childNodes]
      .filter((node) => !(node instanceof Element) || !node.slot)
      .map((node) => node.textContent ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The menu points aria-activedescendant at these, so each needs a role
    // and an id. The menu assigns the id; the role belongs with the item.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'menuitem');
  }

  protected override updated(): void {
    // Not `disabled`: a disabled menuitem still has to be announced, so it is
    // reported as unavailable rather than hidden from the tree.
    this.setAttribute('aria-disabled', String(this.disabled));
  }

  protected override render() {
    return html`
      <div part="base" class="base">
        <span part="cursor" class="cursor" aria-hidden="true">►</span>
        <slot name="icon"></slot>
        <span part="label" class="label"><slot></slot></span>
        <span class="detail"><slot name="detail"></slot></span>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);

      display: block;
      color: var(--px-color-text, #f4f4f4);
      cursor: pointer;
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      color: var(--px-color-text-muted, #94b0c2);
      opacity: 0.5;
      cursor: default;
    }

    :host([active]) {
      color: var(--px-color-highlight, #ffcd75);
    }

    .base {
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      padding: calc(var(--_unit) * 1.5) 0;
      line-height: 1;
      white-space: nowrap;
    }

    /* Hidden rather than absent: the arrow holds its space on every row, so
       the labels don't jump when the highlight moves. */
    .cursor {
      visibility: hidden;
    }

    :host([active]) .cursor {
      visibility: visible;
    }

    .label {
      text-transform: uppercase;
    }

    .detail {
      margin-left: auto;
      padding-left: calc(var(--_unit) * 4);
      color: var(--px-color-text-muted, #94b0c2);
    }

    :host([active]) .detail {
      color: inherit;
    }

    ::slotted(img),
    ::slotted(svg) {
      display: block;
      height: 1em;
      image-rendering: pixelated;
    }
  `;
}

if (!customElements.get('px-menu-item')) {
  customElements.define('px-menu-item', PxMenuItem);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-menu-item': PxMenuItem;
  }
}
