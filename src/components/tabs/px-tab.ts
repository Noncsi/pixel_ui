import { LitElement, css, html } from 'lit';

/** Ids for tabs without one, so a panel can name the tab that labels it. */
let autoId = 0;

/**
 * One tab in a `<px-tabs>`.
 *
 * It puts itself in the tab strip — a tab with no `slot` takes `slot="nav"`
 * on its own, so the markup stays as short as the thing it describes — and
 * leaves the choosing to the `<px-tabs>` around it.
 *
 * Only the selected tab is a tab stop; the arrow keys move between them from
 * there, which is how a tab strip is meant to behave.
 *
 * @element px-tab
 *
 * @attr {string} panel - The `name` of the panel this tab shows. Defaults to matching by position.
 * @attr {boolean} disabled - Greys it out; it can't be selected or focused.
 * @attr {boolean} selected - Reflected, read-only: set by the tabs.
 *
 * @slot - The tab's label.
 * @slot icon - Shown before the label; images are rendered unsmoothed.
 *
 * @csspart base - The tab.
 * @csspart label - The label text.
 */
export class PxTab extends LitElement {
  static override properties = {
    panel: { type: String },
    disabled: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
  };

  declare panel: string;
  declare disabled: boolean;
  declare selected: boolean;

  constructor() {
    super();
    this.panel = '';
    this.disabled = false;
    this.selected = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tab');
    if (!this.id) this.id = `px-tab-${(autoId += 1)}`;
    // The tab strip is a slot of its own, and a tab belongs in it.
    if (!this.slot) this.slot = 'nav';
  }

  protected override updated(): void {
    this.setAttribute('aria-selected', String(this.selected));
    this.setAttribute('aria-disabled', String(this.disabled));
    // Roving: one tab stop for the whole strip, on whichever tab is current.
    this.setAttribute('tabindex', this.selected && !this.disabled ? '0' : '-1');
  }

  protected override render() {
    return html`
      <div part="base" class="base">
        <slot name="icon"></slot>
        <span part="label" class="label"><slot></slot></span>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);

      position: relative;
      display: block;
      color: var(--px-color-text-muted, #94b0c2);
      cursor: pointer;
      outline: none;
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.5;
      cursor: default;
    }

    :host([selected]) {
      color: var(--px-color-text, #f4f4f4);
    }

    .base {
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      padding: calc(var(--_unit) * 2) calc(var(--_unit) * 3);
      line-height: 1;
      white-space: nowrap;
    }

    /* The selected tab is marked by a bar on the edge the panel is on, so the
       strip reads the same whichever way round it is. */
    .base::after {
      content: '';
      position: absolute;
      background: var(--px-color-highlight, #ffcd75);
      opacity: 0;
    }

    :host([selected]) .base::after {
      opacity: 1;
    }

    :host(:not([vertical])) .base::after {
      right: 0;
      bottom: 0;
      left: 0;
      height: var(--_unit);
    }

    :host([vertical]) .base::after {
      top: 0;
      bottom: 0;
      left: 0;
      width: var(--_unit);
    }

    :host(:focus-visible) .base {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: calc(var(--_unit) * -1);
    }

    .label {
      text-transform: uppercase;
    }

    ::slotted(img),
    ::slotted(svg) {
      display: block;
      height: 1em;
      image-rendering: pixelated;
    }
  `;
}

if (!customElements.get('px-tab')) {
  customElements.define('px-tab', PxTab);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-tab': PxTab;
  }
}
