import { LitElement, css, html } from 'lit';

/** Ids for panels without one, so a tab can point at what it controls. */
let autoId = 0;

/**
 * The content behind one `<px-tab>`.
 *
 * Only the active panel is in the DOM's flow; the rest are hidden outright,
 * so nothing in them is tabbed into or read out. The panel itself is a tab
 * stop, which is what lets a keyboard reach content that scrolls.
 *
 * @element px-tab-panel
 *
 * @attr {string} name - What a tab's `panel` points at. Defaults to matching by position.
 * @attr {boolean} active - Reflected, read-only: set by the tabs.
 *
 * @slot - The panel's content.
 *
 * @csspart base - The panel.
 */
export class PxTabPanel extends LitElement {
  static override properties = {
    name: { type: String },
    active: { type: Boolean, reflect: true },
  };

  declare name: string;
  declare active: boolean;

  constructor() {
    super();
    this.name = '';
    this.active = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tabpanel');
    if (!this.id) this.id = `px-tab-panel-${(autoId += 1)}`;
  }

  protected override updated(): void {
    // A panel that can scroll has to be reachable from the keyboard, and the
    // ARIA pattern asks for exactly this.
    this.setAttribute('tabindex', this.active ? '0' : '-1');
  }

  protected override render() {
    return html`<div part="base" class="base"><slot></slot></div>`;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);

      display: block;
      color: var(--px-color-text, #f4f4f4);
      outline: none;
    }

    /* Not just invisible: a hidden panel is out of the tab order and out of
       the accessibility tree, which is the whole point of hiding it. */
    :host(:not([active])),
    :host([hidden]) {
      display: none;
    }

    .base {
      padding: calc(var(--_unit) * 3) 0;
      line-height: 1.8;
    }

    :host(:focus-visible) .base {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: 0;
    }
  `;
}

if (!customElements.get('px-tab-panel')) {
  customElements.define('px-tab-panel', PxTabPanel);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-tab-panel': PxTabPanel;
  }
}
