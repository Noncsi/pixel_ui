import {
  LitElement,
  css,
  html,
  nothing,
  svg,
  type SVGTemplateResult,
  type TemplateResult,
} from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';
import {
  BODY,
  GRID,
  HAIR_COLORS,
  HAIR_STYLES,
  type HairColor,
  type HairStyle,
  hairColor,
  hairStyle,
  hairTones,
  toRuns,
  type PixelMap,
} from './character-art.js';

export interface CharacterValue {
  hair: number;
  hairColor: number;
}

export interface CharacterChangeEventDetail extends CharacterValue {
  hairName: string;
  hairColorName: string;
  hairColorValue: string;
}

/** What each group is, and how its arrow keys behave. */
interface Group {
  readonly key: 'hair' | 'hair-color';
  readonly label: string;
  readonly count: number;
  readonly columns: number;
}

/**
 * The screen before the game starts: pick a hairstyle and a colour, and watch
 * the character change as you do.
 *
 * Two choices, thirty options, and one preview that is the point of both of
 * them — nobody picks "hair 7" on purpose, they pick the one that looks
 * right. So every option is drawn rather than named, the hairstyles are drawn
 * in the colour that is currently chosen, and the preview updates on the same
 * frame as the click.
 *
 * There is one body. The skin and the clothes are custom properties, so a
 * game re-skins them without the element having an opinion about it.
 *
 * Each group is a radio group with one tab stop: Tab moves between the two
 * groups, the arrow keys move and choose inside one. The colour grid's up and
 * down arrows move by a row rather than by one, because it is a grid and
 * pretending otherwise makes twenty swatches a twenty-press journey.
 *
 * Inside a `<form>` it submits both values through `ElementInternals`, as
 * `<name>-hair` and `<name>-hair-color`.
 *
 * @element px-character-creator
 *
 * @attr {number} hair - Which hairstyle, 1 to 10. Default 1.
 * @attr {number} hair-color - Which colour, 1 to 20. Default 2.
 * @attr {string} label - A heading for the whole thing, and its accessible name.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {boolean} hide-preview - Draw only the controls.
 * @attr {string} name - Form field prefix.
 *
 * @fires px-character-change - Either changed. `detail: { hair, hairColor, hairName, hairColorName, hairColorValue }`.
 *
 * @csspart base - The whole thing.
 * @csspart preview - The character.
 * @csspart frame - The preview's pixel frame.
 * @csspart group - One of the two choices. Two of them: use `:nth-of-type()`.
 * @csspart group-label - A choice's heading.
 * @csspart option - One option in either group.
 * @csspart swatch - One colour.
 *
 * @cssprop --px-character-size - How big the preview is. Default 24 art pixels.
 * @cssprop --px-character-skin - The skin tone.
 * @cssprop --px-character-clothes - The clothing colour.
 */
export class PxCharacterCreator extends LitElement {
  static formAssociated = true;

  /** The ten hairstyles, in order, for a game that wants to list them. */
  static readonly hairStyles: readonly HairStyle[] = HAIR_STYLES;

  /** The twenty colours, in order, with their names. */
  static readonly hairColors: readonly HairColor[] = HAIR_COLORS;

  static override properties = {
    hair: { type: Number, reflect: true },
    hairColor: { type: Number, attribute: 'hair-color', reflect: true },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
    hidePreview: { type: Boolean, attribute: 'hide-preview', reflect: true },
    name: { type: String },
  };

  declare hair: number;
  declare hairColor: number;
  declare label: string;
  declare disabled: boolean;
  declare hidePreview: boolean;
  declare name: string;

  private _internals: ElementInternals | null = null;

  private readonly _groups: readonly Group[] = [
    { key: 'hair', label: 'Hair', count: HAIR_STYLES.length, columns: 5 },
    { key: 'hair-color', label: 'Colour', count: HAIR_COLORS.length, columns: 10 },
  ];

  constructor() {
    super();
    this.hair = 1;
    // Not jet black: the first colour in a palette is the one people see the
    // shading on least, and a flat silhouette makes the hairstyles harder to
    // tell apart in the picker.
    this.hairColor = 2;
    this.label = '';
    this.disabled = false;
    this.hidePreview = false;
    this.name = '';

    if (typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /** The form this belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this._internals?.form ?? this.closest('form');
  }

  /** Both choices at once. Settable. */
  get value(): CharacterValue {
    return { hair: this.hair, hairColor: this.hairColor };
  }

  set value(next: Partial<CharacterValue>) {
    if (next.hair !== undefined) this.hair = next.hair;
    if (next.hairColor !== undefined) this.hairColor = next.hairColor;
  }

  /**
   * The chosen hairstyle.
   *
   * Deliberately not called `style`: every element already has one, and
   * shadowing `HTMLElement.style` would break inline styling and Lit with it.
   */
  get currentHair(): HairStyle {
    return hairStyle(this.hair);
  }

  /** The chosen colour, name and all. */
  get currentColor(): HairColor {
    return hairColor(this.hairColor);
  }

  /** The character in words, which is what the preview is labelled with. */
  get description(): string {
    const hair = this.currentHair.name.toLowerCase();
    return `Character with ${hair} hair in ${this.currentColor.name.toLowerCase()}`;
  }

  /** Roll one at random. Returns what it landed on. */
  randomize(): CharacterValue {
    const pick = (count: number) => Math.floor(Math.random() * count) + 1;
    this.hair = pick(HAIR_STYLES.length);
    this.hairColor = pick(HAIR_COLORS.length);
    this._emit();
    return this.value;
  }

  protected override willUpdate(): void {
    // Out of range is pulled back in rather than left to draw nothing: an
    // attribute typed by hand should never produce a bald, bodiless square.
    this.hair = this._clamp(this.hair, HAIR_STYLES.length);
    this.hairColor = this._clamp(this.hairColor, HAIR_COLORS.length);
  }

  protected override updated(): void {
    this._setFormValue();

    if (this.label) this.setAttribute('aria-label', this.label);
    else this.removeAttribute('aria-label');
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
  }

  private _clamp(value: number, max: number): number {
    const whole = Math.round(value);
    if (!Number.isFinite(whole)) return 1;
    return Math.min(max, Math.max(1, whole));
  }

  private _setFormValue(): void {
    if (!this._internals) return;
    if (!this.name) {
      this._internals.setFormValue(null);
      return;
    }

    // Two values under one name: a FormData is the only thing setFormValue
    // takes that can carry more than one.
    const data = new FormData();
    data.append(`${this.name}-hair`, String(this.hair));
    data.append(`${this.name}-hair-color`, String(this.hairColor));
    this._internals.setFormValue(data);
  }

  private _emit(): void {
    this.dispatchEvent(
      new CustomEvent<CharacterChangeEventDetail>('px-character-change', {
        detail: {
          ...this.value,
          hairName: this.currentHair.name,
          hairColorName: this.currentColor.name,
          hairColorValue: this.currentColor.value,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** The 1-based index currently chosen in a group. */
  private _indexOf(key: Group['key']): number {
    return key === 'hair' ? this.hair : this.hairColor;
  }

  private _choose(key: Group['key'], index: number, focus = false): void {
    if (this.disabled) return;

    const before = this._indexOf(key);
    if (key === 'hair') this.hair = index;
    else this.hairColor = index;

    if (index !== before) this._emit();

    // The one tab stop moves with the choice, so focus has to follow it or
    // it would be left on an element that is no longer focusable.
    if (focus) {
      void this.updateComplete.then(() => {
        this.renderRoot
          .querySelector<HTMLElement>(`[data-group="${key}"] [data-index="${index}"]`)
          ?.focus();
      });
    }
  }

  private _moveBy(group: Group, delta: number): void {
    const from = this._indexOf(group.key);
    // Wrapping, so the end of a row of ten colours is one press from the
    // start of it rather than nine.
    const next = ((from - 1 + delta + group.count) % group.count) + 1;
    this._choose(group.key, next, true);
  }

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const host = target.closest<HTMLElement>('[data-group]');
    const group = this._groups.find((candidate) => candidate.key === host?.dataset.group);
    if (!group) return;

    switch (event.key) {
      case 'ArrowRight':
        this._moveBy(group, 1);
        break;
      case 'ArrowLeft':
        this._moveBy(group, -1);
        break;
      case 'ArrowDown':
        this._moveBy(group, group.columns);
        break;
      case 'ArrowUp':
        this._moveBy(group, -group.columns);
        break;
      case 'Home':
        this._choose(group.key, 1, true);
        break;
      case 'End':
        this._choose(group.key, group.count, true);
        break;
      default:
        return;
    }

    // Only once a key was handled: the arrows scroll the page otherwise.
    event.preventDefault();
  };

  /** Draw maps as one rectangle per run of identical pixels. */
  private _draw(maps: readonly PixelMap[], tones: Record<string, string>): SVGTemplateResult[] {
    const shapes: SVGTemplateResult[] = [];

    for (const map of maps) {
      for (const run of toRuns(map)) {
        const fill = tones[run.token];
        shapes.push(
          // The hair's three tones change as you pick, so they are filled
          // inline. Everything else is classed, because a fill="" attribute
          // cannot read a custom property and skin and clothes are meant to
          // be re-skinnable.
          fill === undefined
            ? svg`<rect class="t-${run.token}" x=${run.x} y=${run.y} width=${run.width} height="1" />`
            : svg`<rect x=${run.x} y=${run.y} width=${run.width} height="1" fill=${fill} />`,
        );
      }
    }

    return shapes;
  }

  private _sprite(hair: HairStyle, color: string): TemplateResult {
    // The outer <svg> is an html template, not an svg one: the svg tag is for
    // fragments that already sit inside an <svg> element.
    return html`
      <svg viewBox="0 0 ${GRID} ${GRID}" shape-rendering="crispEdges" focusable="false">
        ${this._draw([BODY, hair.map], hairTones(color))}
      </svg>
    `;
  }

  private _option(
    group: Group,
    index: number,
    body: TemplateResult | string,
    name: string,
    extra = '',
  ) {
    const chosen = this._indexOf(group.key) === index;

    return html`
      <button
        part=${`option ${extra}`.trim()}
        class="option ${extra}"
        type="button"
        role="radio"
        aria-checked=${String(chosen)}
        aria-label=${name}
        tabindex=${chosen ? 0 : -1}
        data-index=${index}
        ?disabled=${this.disabled}
        @click=${() => this._choose(group.key, index)}
      >
        ${body}
      </button>
    `;
  }

  private _renderGroup(group: Group, options: TemplateResult[]) {
    const id = `group-${group.key}`;

    return html`
      <div part="group" class="group">
        <p part="group-label" class="group-label" id=${id}>${group.label}</p>
        <div
          class="options ${group.key}"
          role="radiogroup"
          aria-labelledby=${id}
          data-group=${group.key}
          style="--_columns: ${group.columns}"
        >
          ${options}
        </div>
      </div>
    `;
  }

  protected override render() {
    const color = this.currentColor.value;

    const hairs = HAIR_STYLES.map((style) =>
      this._option(
        this._groups[0] as Group,
        style.id,
        // Drawn on the chosen body in the chosen colour, so the picker shows
        // what you are actually going to get rather than a floating wig.
        // Uncropped: at sixteen pixels the hair runs the full width of the
        // sprite, so there is nothing at the sides to crop away.
        html`<span class="mini">${this._sprite(style, color)}</span>`,
        style.name,
        'hair',
      ),
    );

    const colors = HAIR_COLORS.map((entry) =>
      this._option(
        this._groups[1] as Group,
        entry.id,
        html`<span class="swatch-fill" style="background: ${entry.value}"></span>`,
        entry.name,
        'swatch',
      ),
    );

    return html`
      <div part="base" class="base" @keydown=${this._onKeyDown}>
        ${
          this.hidePreview
            ? nothing
            : html`
                <div part="preview" class="preview">
                  <span part="frame" class="frame"></span>
                  <span class="art" role="img" aria-label=${this.description}>
                    ${this._sprite(this.currentHair, color)}
                  </span>
                  <p class="caption" aria-hidden="true">
                    ${this.currentHair.name} · ${this.currentColor.name}
                  </p>
                </div>
              `
        }
        <div class="groups">
          ${this._renderGroup(this._groups[0] as Group, hairs)}
          ${this._renderGroup(this._groups[1] as Group, colors)}
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      /* Sixteen art pixels across twenty-four units: six real pixels each at
         the kit's default unit, which is a whole number, so the sprite stays
         crisp instead of landing between pixels. */
      --_size: var(--px-character-size, calc(var(--_unit) * 24));
      --_skin: var(--px-character-skin, #e8b796);
      --_clothes: var(--px-character-clothes, #41a6f6);
      --_border: var(--px-color-border, #0b0c14);
      --_fill: var(--px-color-surface, #333c57);

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
      display: grid;
      gap: calc(var(--_unit) * 4);
      justify-items: center;
    }

    .preview {
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
      background: var(--px-color-bg, #1a1c2c);
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
    }

    .art {
      position: relative;
      display: block;
      width: var(--_size);
      height: var(--_size);
      padding: calc(var(--_unit) * 2);
    }

    .caption {
      position: relative;
      margin: var(--_unit) 0 calc(var(--_unit) * 2);
      color: var(--px-color-text-muted, #94b0c2);
      text-align: center;
      text-transform: uppercase;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* The parts that never change colour at runtime are classed rather than
       filled inline, so a game can re-skin them with a custom property —
       a fill="" presentation attribute cannot read one. */
    .t-S {
      fill: var(--_skin);
    }

    /* Mixed from the skin rather than a translucent black laid over it: a
       shadow pixel replaces its skin pixel, it does not sit on top of one,
       so anything translucent would show the panel through the face. */
    .t-s {
      fill: color-mix(in srgb, var(--_skin) 78%, #000);
    }

    .t-E {
      fill: var(--_border);
    }

    .t-M {
      fill: #8a4a3a;
    }

    .t-B {
      fill: var(--_clothes);
    }

    /* Mixed from the clothes, for the same reason. */
    .t-b {
      fill: color-mix(in srgb, var(--_clothes) 65%, #000);
    }

    .groups {
      display: grid;
      gap: calc(var(--_unit) * 3);
      width: 100%;
    }

    .group-label {
      margin: 0 0 var(--_unit);
      color: var(--px-color-text-muted, #94b0c2);
      text-transform: uppercase;
    }

    .options {
      display: grid;
      grid-template-columns: repeat(var(--_columns), 1fr);
      gap: var(--_unit);
    }

    .option {
      position: relative;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      background: var(--_fill);
      box-shadow: inset 0 0 0 var(--_unit) var(--_border);
      color: inherit;
      font: inherit;
      line-height: 1;
      cursor: pointer;
    }

    .option:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    /* The preview sits on the darkest colour, the way a portrait frame
       should; these sit on the surface, because the darkest end of the hair
       palette is invisible against the darkest end of the theme and the
       whole job of these tiles is to compare silhouettes. */
    .option.hair {
      aspect-ratio: 1;
      padding: calc(var(--_unit) / 2);
    }

    .mini {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* Surrounded by the surface rather than by the border colour: the border
       is near-black in both themes, and jet black in a near-black frame is a
       colour you cannot see to choose. */
    .option.swatch {
      aspect-ratio: 1;
      padding: var(--_unit);
      background: var(--_fill);
      box-shadow: inset 0 0 0 var(--_unit) var(--_fill);
    }

    .swatch-fill {
      display: block;
      width: 100%;
      height: 100%;
    }

    /*
     * The chosen one is a ring in the highlight colour, not a tint: a tinted
     * swatch would be lying about the colour it is there to show.
     *
     * Last in the file on purpose. It has exactly the same specificity as
     * .option.swatch, which also sets a box-shadow, so the only thing that
     * decides between them is which comes second.
     */
    .option[aria-checked='true'] {
      box-shadow: inset 0 0 0 var(--_unit) var(--px-color-highlight, #ffcd75);
    }
  `;
}

if (!customElements.get('px-character-creator')) {
  customElements.define('px-character-creator', PxCharacterCreator);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-character-creator': PxCharacterCreator;
  }
  interface HTMLElementEventMap {
    'px-character-change': CustomEvent<CharacterChangeEventDetail>;
  }
}
