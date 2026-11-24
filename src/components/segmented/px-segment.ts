import { LitElement, css, html } from 'lit';

/**
 * One choice in a `<px-segmented>`.
 *
 * It is a radio, not a button: exactly one of them is on at a time, and the
 * group it sits in decides which. Only the chosen one is a tab stop, so Tab
 * enters the group once and the arrow keys take it from there.
 *
 * @element px-segment
 *
 * @attr {string} value - What the group reports. Defaults to the segment's text.
 * @attr {boolean} disabled - Skipped by navigation, and can't be chosen.
 * @attr {boolean} selected - Reflected, read-only: set by the group.
 *
 * @slot - The segment's label.
 * @slot icon - Shown before the label; images are rendered unsmoothed.
 *
 * @csspart base - The segment.
 * @csspart label - The label text.
 */
export class PxSegment extends LitElement {
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

  /** `value` when it is set, and the segment's own text when it isn't. */
  get resolvedValue(): string {
    return this.value || this.label;
  }

  /** The text on the segment. */
  get label(): string {
    return (this.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'radio');
  }

  protected override updated(): void {
    this.setAttribute('aria-checked', String(this.selected));
    this.setAttribute('aria-disabled', String(this.disabled));
    // Roving: one tab stop for the group, on whichever segment is chosen.
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

      display: block;
      flex: 1;
      color: var(--px-color-text-muted, #94b0c2);
      cursor: pointer;
      outline: none;
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.4;
      cursor: default;
    }

    :host([selected]) {
      color: var(--px-color-text, #f4f4f4);
    }

    .base {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: calc(var(--_unit) * 1.5);
      padding: calc(var(--_unit) * 2) calc(var(--_unit) * 2.5);
      line-height: 1;
      white-space: nowrap;
    }

    /* The chosen segment is a filled block rather than a tinted one: at this
       size a tint reads as noise, and a solid shape reads instantly. */
    :host([selected]) .base {
      background: var(--px-segmented-color, var(--px-color-highlight, #ffcd75));
      color: var(--px-color-border, #0b0c14);
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

if (!customElements.get('px-segment')) {
  customElements.define('px-segment', PxSegment);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-segment': PxSegment;
  }
}
