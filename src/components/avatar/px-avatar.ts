import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarStatus = 'none' | 'ok' | 'warn' | 'danger';

/**
 * A framed portrait: a party list, a save slot, the face beside a line of
 * dialogue.
 *
 * Given a `src` it draws the picture unsmoothed; given only a `name` it draws
 * that name's initials, so a party list doesn't fall apart before the art is
 * done. `status` puts a pip in the corner — alive, poisoned, down — which is
 * the one thing a portrait is always asked to carry.
 *
 * A portrait with no name and no alt text is decoration, and is hidden from
 * assistive technology rather than read out as an unlabelled image.
 *
 * @element px-avatar
 *
 * @attr {string} src - The picture. Drawn unsmoothed.
 * @attr {string} alt - What the picture shows. Falls back to `name`.
 * @attr {string} name - Whose face it is; its initials stand in without a src.
 * @attr {'sm'|'md'|'lg'} size - Default "md".
 * @attr {'none'|'ok'|'warn'|'danger'} status - The corner pip. Default "none".
 * @attr {string} statusLabel - What the pip means, e.g. "Poisoned".
 *
 * @csspart base - The portrait.
 * @csspart frame - The pixel frame.
 * @csspart image - The picture.
 * @csspart initials - The letters drawn in place of a picture.
 * @csspart status - The corner pip.
 *
 * @cssprop --px-avatar-size - Overrides the size.
 * @cssprop --px-avatar-fill - The background behind the initials.
 */
export class PxAvatar extends LitElement {
  static override properties = {
    src: { type: String },
    alt: { type: String },
    name: { type: String },
    size: { type: String, reflect: true },
    status: { type: String, reflect: true },
    statusLabel: { type: String, attribute: 'status-label' },
  };

  declare src: string;
  declare alt: string;
  declare name: string;
  declare size: AvatarSize;
  declare status: AvatarStatus;
  declare statusLabel: string;

  constructor() {
    super();
    this.src = '';
    this.alt = '';
    this.name = '';
    this.size = 'md';
    this.status = 'none';
    this.statusLabel = '';
  }

  /** Up to two letters standing in for a missing picture. */
  get initials(): string {
    const words = this.name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const letters = words.length === 1 ? [words[0]?.[0]] : [words[0]?.[0], words.at(-1)?.[0]];
    return letters.filter(Boolean).join('').toUpperCase();
  }

  /** What a screen reader should call this portrait, if anything. */
  get accessibleName(): string {
    return this.alt || this.name;
  }

  protected override render() {
    const name = this.accessibleName;
    const pip = this.status !== 'none';

    return html`
      <div
        part="base"
        class="base"
        role=${name ? 'img' : nothing}
        aria-label=${name || nothing}
        aria-hidden=${name ? nothing : 'true'}
      >
        <span part="frame" class="frame"></span>
        ${
          this.src
            ? html`<img part="image" class="image" src=${this.src} alt="" />`
            : html`<span part="initials" class="initials">${this.initials}</span>`
        }
        ${pip ? html`<span part="status" class="status"></span>` : nothing}
      </div>
      ${
        // The pip is a colour, which is no use on its own: say what it means.
        pip && this.statusLabel ? html`<span class="sr-only">${this.statusLabel}</span>` : nothing
      }
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_size: var(--px-avatar-size, calc(var(--_unit) * 12));
      --_fill: var(--px-avatar-fill, var(--px-color-surface, #333c57));
      --_border: var(--px-color-border, #0b0c14);

      position: relative;
      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    :host([size='sm']) {
      --_size: var(--px-avatar-size, calc(var(--_unit) * 8));
    }

    :host([size='lg']) {
      --_size: var(--px-avatar-size, calc(var(--_unit) * 20));
      font-size: var(--px-font-size-md, 12px);
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
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.15);
    }

    .image {
      position: absolute;
      inset: var(--_unit);
      width: calc(100% - var(--_unit) * 2);
      height: calc(100% - var(--_unit) * 2);
      object-fit: cover;
      image-rendering: pixelated;
    }

    .initials {
      position: absolute;
      inset: var(--_unit);
      display: grid;
      place-items: center;
      color: var(--px-color-text-muted, #94b0c2);
      letter-spacing: 0.1em;
    }

    /* A square pip in the corner, outside the fill so it reads against any
       portrait behind it. */
    .status {
      position: absolute;
      right: 0;
      bottom: 0;
      width: calc(var(--_unit) * 3);
      height: calc(var(--_unit) * 3);
      background: var(--px-color-text-muted, #94b0c2);
      box-shadow: 0 0 0 var(--_unit) var(--_border);
    }

    :host([status='ok']) .status {
      background: var(--px-color-accent, #38b764);
    }

    :host([status='warn']) .status {
      background: var(--px-color-xp, #ffcd75);
    }

    :host([status='danger']) .status {
      background: var(--px-color-danger, #b13e53);
    }

    /* Read by assistive technology, invisible to everyone else. */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;
}

if (!customElements.get('px-avatar')) {
  customElements.define('px-avatar', PxAvatar);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-avatar': PxAvatar;
  }
}
