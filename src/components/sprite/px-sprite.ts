import { LitElement, css, html, nothing } from 'lit';

/**
 * A sprite sheet, played back as an animation: an idle character on a save
 * slot, a coin that spins, a torch that flickers in a menu.
 *
 * The playback is one CSS animation stepping `background-position` across the
 * sheet — no timer, no frame loop, nothing for a hidden tab to throttle out
 * of step. `steps(n)` is what makes it land on whole frames instead of
 * sliding between them.
 *
 * The sheet is read as a horizontal strip of equal frames; `row` picks a row
 * out of a sheet that has several, which is how most sheets are laid out
 * (one row per animation).
 *
 * Under `prefers-reduced-motion` it shows the first frame and stays there.
 *
 * @element px-sprite
 *
 * @attr {string} src - The sheet.
 * @attr {number} frame-width - One frame's width in the sheet, in pixels.
 * @attr {number} frame-height - One frame's height in the sheet, in pixels.
 * @attr {number} frames - How many frames in the row. Default 1.
 * @attr {number} row - Which row of the sheet to play, from 0. Default 0.
 * @attr {number} fps - Frames a second. Default 8.
 * @attr {number} scale - Drawn this many times its size. Default 1.
 * @attr {boolean} paused - Hold on the current frame.
 * @attr {boolean} once - Play through once instead of looping.
 * @attr {string} label - What it shows. Without one it counts as decoration.
 *
 * @csspart base - The sprite.
 *
 */
export class PxSprite extends LitElement {
  static override properties = {
    src: { type: String },
    frameWidth: { type: Number, attribute: 'frame-width' },
    frameHeight: { type: Number, attribute: 'frame-height' },
    frames: { type: Number },
    row: { type: Number },
    fps: { type: Number },
    scale: { type: Number },
    paused: { type: Boolean, reflect: true },
    once: { type: Boolean, reflect: true },
    label: { type: String },
  };

  declare src: string;
  declare frameWidth: number;
  declare frameHeight: number;
  declare frames: number;
  declare row: number;
  declare fps: number;
  declare scale: number;
  declare paused: boolean;
  declare once: boolean;
  declare label: string;

  constructor() {
    super();
    this.src = '';
    this.frameWidth = 16;
    this.frameHeight = 16;
    this.frames = 1;
    this.row = 0;
    this.fps = 8;
    this.scale = 1;
    this.paused = false;
    this.once = false;
    this.label = '';
  }

  /** Frames in the strip, never fewer than one. */
  get safeFrames(): number {
    return Number.isFinite(this.frames) && this.frames > 0 ? Math.floor(this.frames) : 1;
  }

  /** How long one loop takes, in milliseconds. */
  get duration(): number {
    const fps = Number.isFinite(this.fps) && this.fps > 0 ? this.fps : 8;
    return (this.safeFrames / fps) * 1000;
  }

  /** Start playing again from wherever it stopped. */
  play(): void {
    this.paused = false;
  }

  /** Hold on the frame that is showing. */
  pause(): void {
    this.paused = true;
  }

  protected override render() {
    const frames = this.safeFrames;
    const scale = Number.isFinite(this.scale) && this.scale > 0 ? this.scale : 1;
    const width = this.frameWidth * scale;
    const height = this.frameHeight * scale;
    const sheet = frames * width;

    // Scaled by sizing the artwork rather than by transform: a transform
    // would leave the element's box at one-times size, and everything beside
    // it laid out around a sprite that isn't there.
    //
    // The animation is written out here rather than in the stylesheet: it
    // needs the frame count inside steps(), which has to be a literal.
    const style = [
      `width: ${width}px`,
      `height: ${height}px`,
      `--_sheet: ${sheet}px`,
      this.src ? `background-image: url("${this.src}")` : '',
      `background-size: ${sheet}px auto`,
      `background-position: 0 ${-this.row * height}px`,
      frames > 1
        ? `animation: px-sprite-play ${this.duration}ms steps(${frames}) ${
            this.once ? '1 forwards' : 'infinite'
          }`
        : '',
    ]
      .filter(Boolean)
      .join('; ');

    return html`
      <span
        part="base"
        class="base"
        style=${style}
        role=${this.label ? 'img' : nothing}
        aria-label=${this.label || nothing}
        aria-hidden=${this.label ? nothing : 'true'}
      ></span>
    `;
  }

  static override styles = css`
    :host {
      display: inline-block;
      line-height: 0;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: block;
      background-repeat: no-repeat;
      /* Whole pixels, scaled up: the whole point of a sprite sheet. */
      image-rendering: pixelated;
    }

    :host([paused]) .base {
      animation-play-state: paused;
    }

    @keyframes px-sprite-play {
      to {
        background-position-x: calc(var(--_sheet) * -1);
      }
    }

    /* Asked for no motion: the first frame, and nothing else. */
    @media (prefers-reduced-motion: reduce) {
      .base {
        animation: none;
      }
    }
  `;
}

if (!customElements.get('px-sprite')) {
  customElements.define('px-sprite', PxSprite);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-sprite': PxSprite;
  }
}
