import { LitElement, css, html } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface CollapsibleToggleEventDetail {
  open: boolean;
}

/**
 * A section that folds away: a settings category, one chapter of a quest log,
 * the spoiler under "how do I beat this".
 *
 * `<px-tabs>` and this one both hide content behind a heading, and the choice
 * between them is whether the reader has to pick. Tabs show one panel at a
 * time out of a set, so opening one closes another; these are independent, so
 * all of them can be open, or none. Stack several and you have an accordion —
 * the kit deliberately does not enforce one-open-at-a-time, because a game
 * that wants that can close the others in its own handler, and most do not.
 *
 * The heading is a real button inside an element with `role="heading"`, so
 * screen readers can jump between sections by heading, and `level` sets where
 * it sits in the page's outline. The content is a named region, which is what
 * lets "go to the thing I just opened" work.
 *
 * @element px-collapsible
 *
 * @attr {string} summary - The heading text. Also the region's name.
 * @attr {boolean} open - Whether the content is showing. Reflected.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {number} level - Heading level, 1 to 6. Default 3.
 * @attr {boolean} flat - Drop the frame, keeping the fold.
 *
 * @slot - The content that folds away.
 * @slot aside - Something small beside the heading: a count, a badge.
 *
 * @fires px-collapsible-toggle - It was opened or closed. `detail: { open }`.
 *
 * @csspart base - The whole section.
 * @csspart frame - The pixel frame behind it.
 * @csspart heading - The row with the summary in it.
 * @csspart marker - The little arrow.
 * @csspart summary - The summary text.
 * @csspart content - The region that folds.
 *
 * @cssprop --px-collapsible-fill - The heading row's fill.
 */
export class PxCollapsible extends LitElement {
  static override properties = {
    summary: { type: String },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    level: { type: Number },
    flat: { type: Boolean, reflect: true },
  };

  declare summary: string;
  declare open: boolean;
  declare disabled: boolean;
  declare level: number;
  declare flat: boolean;

  constructor() {
    super();
    this.summary = '';
    this.open = false;
    this.disabled = false;
    this.level = 3;
    this.flat = false;
  }

  /** Open it, close it, or flip it. */
  toggle(force?: boolean): void {
    const next = force ?? !this.open;
    if (next === this.open) return;
    this.open = next;
    this._emit();
  }

  /** Open it. */
  show(): void {
    this.toggle(true);
  }

  /** Close it. */
  hide(): void {
    this.toggle(false);
  }

  private _emit(): void {
    this.dispatchEvent(
      new CustomEvent<CollapsibleToggleEventDetail>('px-collapsible-toggle', {
        detail: { open: this.open },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onClick(): void {
    if (this.disabled) return;
    this.toggle();
  }

  protected override render() {
    // A level outside 1-6 is not a heading level, so it is clamped rather
    // than passed on to assistive technology as nonsense. Nought is clamped
    // like any other number out of range — falling back to the default for
    // it would quietly turn level="0" into a third-level heading.
    const asked = Math.round(this.level);
    const level = Number.isFinite(asked) ? Math.min(6, Math.max(1, asked)) : 3;

    return html`
      <div part="base" class="base">
        <span part="frame" class="frame"></span>
        <div class="inner">
          <div role="heading" aria-level=${level} class="heading-wrap">
            <button
              part="heading"
              class="heading"
              type="button"
              id="heading"
              aria-expanded=${String(this.open)}
              aria-controls="content"
              ?disabled=${this.disabled}
              @click=${this._onClick}
            >
              <span part="marker" class="marker" aria-hidden="true">${this.open ? '▼' : '▶'}</span>
              <span part="summary" class="summary">${this.summary}</span>
            </button>
          </div>
          <span class="aside"><slot name="aside"></slot></span>
          <div part="content" class="content" id="content" role="region" aria-labelledby="heading">
            <div class="body">
              <div class="pad"><slot></slot></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-collapsible-fill, var(--px-color-surface, #333c57));
      --_border: var(--px-color-border, #0b0c14);
      --_fast: var(--px-duration-fast, 120ms);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
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

    :host([flat]) .base {
      padding: 0;
    }

    :host([flat]) .frame {
      display: none;
    }

    .inner {
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      padding: var(--_unit);
    }

    /* Deliberately not display: contents, which would take the box away and
       with it, in more than one browser, the heading role this element exists
       to carry. */
    .heading-wrap {
      grid-column: 1;
    }

    .heading {
      display: flex;
      width: 100%;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      padding: calc(var(--_unit) * 1.5) 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1;
      text-align: left;
      cursor: pointer;
    }

    .heading:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .marker {
      flex: none;
      width: calc(var(--_unit) * 3);
      color: var(--px-color-text-muted, #94b0c2);
    }

    :host([open]) .marker {
      color: var(--px-color-highlight, #ffcd75);
    }

    .summary {
      text-transform: uppercase;
    }

    .aside {
      grid-column: 2;
      display: flex;
      align-items: center;
      padding-left: calc(var(--_unit) * 2);
      color: var(--px-color-text-muted, #94b0c2);
    }

    /*
     * The fold is a one-row grid going from 0fr to 1fr, which is the one way
     * to transition to a height nobody has measured — height: auto does not
     * animate. Visibility rides along so a closed section is out of the
     * accessibility tree and out of the tab order, and because it only flips
     * at the far end of the transition the content does not wink out while
     * the section is still folding shut.
     */
    .content {
      grid-column: 1 / -1;
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition:
        grid-template-rows var(--_fast) steps(4, end),
        visibility var(--_fast);
    }

    :host([open]) .content {
      grid-template-rows: 1fr;
      visibility: visible;
    }

    .body {
      overflow: hidden;
    }

    /* The spacing lives one level in, inside the clipped box: padding on the
       grid item itself would be floor for the row and keep the section a few
       pixels tall when it is meant to be shut. */
    .pad {
      padding-top: calc(var(--_unit) * 2);
      line-height: 1.8;
    }

    @media (prefers-reduced-motion: reduce) {
      .content {
        transition: none;
      }
    }
  `;
}

if (!customElements.get('px-collapsible')) {
  customElements.define('px-collapsible', PxCollapsible);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-collapsible': PxCollapsible;
  }
  interface HTMLElementEventMap {
    'px-collapsible-toggle': CustomEvent<CollapsibleToggleEventDetail>;
  }
}
