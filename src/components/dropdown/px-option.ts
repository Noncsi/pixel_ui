import { LitElement, css, html } from 'lit';

/** Ids for options without one. */
let autoId = 0;

/**
 * One choice in a `<px-dropdown>`.
 *
 * It is focusable but never a tab stop: the dropdown moves focus onto it
 * while the list is open, which is how a list of choices is navigated without
 * pointing at anything across a shadow root.
 *
 * @element px-option
 *
 * @attr {string} value - What the dropdown reports. Defaults to the option's text.
 * @attr {boolean} disabled - Skipped by navigation, and can't be chosen.
 * @attr {boolean} selected - Reflected, read-only: set by the dropdown.
 *
 * @slot - The option's label.
 * @slot icon - Shown before the label; images are rendered unsmoothed.
 *
 * @csspart base - The row.
 * @csspart check - The mark on the chosen option.
 * @csspart label - The label text.
 */
export class PxOption extends LitElement {
  static override properties = {
    value: { type: String },
    disabled: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare disabled: boolean;
  declare selected: boolean;

  constructor() {
    super();
    this.value = '';
    this.disabled = false;
    this.selected = false;
  }

  /** `value` when it is set, and the option's own text when it isn't. */
  get resolvedValue(): string {
    return this.value || this.label;
  }

  /** What the dropdown shows once this option is chosen. */
  get label(): string {
    return (this.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'option');
    if (!this.id) this.id = `px-option-${(autoId += 1)}`;
    // Focusable on purpose, in the tab order never.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
  }

  protected override updated(): void {
    this.setAttribute('aria-selected', String(this.selected));
    this.setAttribute('aria-disabled', String(this.disabled));
  }

  protected override render() {
    return html`
      <div part="base" class="base">
        <span part="check" class="check" aria-hidden="true">►</span>
        <slot name="icon"></slot>
        <span part="label" class="label"><slot></slot></span>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);

      display: block;
      color: var(--px-color-text, #f4f4f4);
      cursor: pointer;
      outline: none;
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      color: var(--px-color-text-muted, #94b0c2);
      opacity: 0.5;
      cursor: default;
    }

    /* Focus is the highlight here: the dropdown moves it as you navigate. */
    :host(:focus) {
      color: var(--px-color-highlight, #ffcd75);
    }

    .base {
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      padding: calc(var(--_unit) * 1.5) calc(var(--_unit) * 2);
      line-height: 1;
      white-space: nowrap;
    }

    /* Reserved whether or not it shows, so the labels never shift. */
    .check {
      visibility: hidden;
    }

    :host([selected]) .check,
    :host(:focus) .check {
      visibility: visible;
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

if (!customElements.get('px-option')) {
  customElements.define('px-option', PxOption);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-option': PxOption;
  }
}
