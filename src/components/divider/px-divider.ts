import { LitElement, css, html, nothing } from 'lit';

/**
 * A rule between things: menu sections, groups of settings, the line above a
 * total.
 *
 * Two art pixels tall rather than one — a dark line with a lighter one under
 * it — which is how an engraved groove is drawn at this scale and what makes
 * it sit in the frame rather than on top of it. With a `label` the rule
 * breaks either side of the words, the way a chapter heading does.
 *
 * @element px-divider
 *
 * @attr {string} label - Words in the middle of the rule.
 * @attr {boolean} vertical - Stand it up, to divide a row instead of a column.
 * @attr {boolean} ornament - Put a diamond in the middle instead of a gap.
 *
 * @csspart base - The rule.
 * @csspart label - The words.
 *
 * @cssprop --px-divider-color - The rule's colour.
 * @cssprop --px-divider-space - Room left either side of it.
 */
export class PxDivider extends LitElement {
  static override properties = {
    label: { type: String },
    vertical: { type: Boolean, reflect: true },
    ornament: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare vertical: boolean;
  declare ornament: boolean;

  constructor() {
    super();
    this.label = '';
    this.vertical = false;
    this.ornament = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'separator');
  }

  protected override updated(): void {
    this.setAttribute('aria-orientation', this.vertical ? 'vertical' : 'horizontal');

    // A separator can carry a name, and when it is labelling a section of a
    // menu that name is the only thing saying where the section begins.
    if (this.label) this.setAttribute('aria-label', this.label);
    else this.removeAttribute('aria-label');
  }

  protected override render() {
    // A vertical rule has no room for words, so the label is ignored rather
    // than drawn sideways.
    const middle = !this.vertical && (this.label !== '' || this.ornament);

    return html`
      <div part="base" class="base">
        <span class="rule"></span>
        ${
          middle
            ? html`<span part="label" class="label" aria-hidden="true"> ${this.label || '◆'} </span>
                <span class="rule"></span>`
            : nothing
        }
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_color: var(--px-divider-color, var(--px-color-border, #0b0c14));
      --_space: var(--px-divider-space, calc(var(--_unit) * 3));

      display: block;
      margin: var(--_space) 0;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text-muted, #94b0c2);
    }

    :host([hidden]) {
      display: none;
    }

    :host([vertical]) {
      display: inline-block;
      align-self: stretch;
      margin: 0 var(--_space);
    }

    .base {
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      height: 100%;
    }

    :host([vertical]) .base {
      flex-direction: column;
    }

    /* Dark over light: at two pixels that reads as a groove cut into the
       panel, where a single line just reads as a scratch on it. */
    .rule {
      flex: 1;
      height: calc(var(--_unit) * 2);
      background: linear-gradient(
        to bottom,
        var(--_color) 0,
        var(--_color) 50%,
        rgb(255 255 255 / 0.12) 50%,
        rgb(255 255 255 / 0.12) 100%
      );
    }

    :host([vertical]) .rule {
      width: calc(var(--_unit) * 2);
      height: auto;
      min-height: calc(var(--_unit) * 4);
      background: linear-gradient(
        to right,
        var(--_color) 0,
        var(--_color) 50%,
        rgb(255 255 255 / 0.12) 50%,
        rgb(255 255 255 / 0.12) 100%
      );
    }

    .label {
      flex: none;
      line-height: 1;
      text-transform: uppercase;
      white-space: nowrap;
    }
  `;
}

if (!customElements.get('px-divider')) {
  customElements.define('px-divider', PxDivider);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-divider': PxDivider;
  }
}
