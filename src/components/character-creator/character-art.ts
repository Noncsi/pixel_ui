/**
 * The art for `<px-character-creator>`, kept apart from the element so the
 * drawing can be read, checked and replaced without going through the
 * component.
 *
 * Everything is a square grid of single characters, one per pixel, which is
 * the only representation of pixel art that stays legible in a source file.
 * A test asserts every map is exactly GRID by GRID, because a row one
 * character short silently shifts a whole sprite and nothing else would
 * catch it.
 *
 * Tokens:
 *   `.` nothing      `S` skin        `s` skin in shadow
 *   `E` eye          `M` mouth
 *   `B` clothing     `b` clothing in shadow
 *   `#` hair         `o` hair in shadow              `+` hair catching light
 */

export type PixelMap = readonly string[];

/**
 * Both dimensions of every map.
 *
 * Sixteen is the size the drawing is for, not a budget it was squeezed into.
 * The face is two eyes and a mouth because that is what reads at this size:
 * a white next to a one-pixel pupil is a glitch rather than an eye, and a
 * nose is a smudge. What sixteen does give is a silhouette you can tell from
 * another silhouette across ten tiles, which is the whole job of the picker.
 *
 * Halving a grid is not the opposite of doubling it. Doubling changes nothing
 * — every pixel becomes four — while halving throws one pixel in four away,
 * so this is the drawing made again at this size rather than the larger one
 * shrunk.
 */
export const GRID = 16;

/** Every token that may appear in a map. The test holds the maps to this. */
export const TOKENS = '.SsEMBbo#+';

/**
 * The body every character is drawn on.
 *
 * One of them. There were two, differing only in the width of the shoulders,
 * because sixteen pixels is no room for anything subtler and anything subtler
 * would have been a caricature — which is a decent argument for not splitting
 * the body in two at all. The shoulders here widen over three rows from the
 * neck, between where the two used to sit.
 *
 * The neck is drawn in shadow rather than in skin: the one pixel of modelling
 * the face can spare, and the thing that stops the head looking stuck on.
 *
 * What the character looks like is `hair` and `hair-color`, plus the skin and
 * clothing custom properties, which is the whole of it.
 */
export const BODY: PixelMap = [
  '................',
  '................',
  '................',
  '....SSSSSSSS....',
  '...SSSSSSSSSS...',
  '...SSSSSSSSSS...',
  '...SSESSSSESS...',
  '...SSSSSSSSSS...',
  '...SSSSMMSSSS...',
  '....SSSSSSSS....',
  '.....SSSSSS.....',
  '......ssss......',
  '....BBBBBBBB....',
  '..BBBBBBBBBBBB..',
  '.BBBBBBBBBBBBBB.',
  '.BbBBBBBBBBBBbB.',
];

export interface HairStyle {
  /** 1 to 10, which is what the element's `hair` attribute takes. */
  readonly id: number;
  readonly name: string;
  readonly map: PixelMap;
}

/** Ten silhouettes, chosen to be told apart at a glance rather than to be ten variations on a fringe. */
export const HAIR_STYLES: readonly HairStyle[] = [
  {
    id: 1,
    name: 'Buzz',
    map: [
      '................',
      '................',
      '....++######....',
      '...o########o...',
      '...o........o...',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 2,
    name: 'Short',
    map: [
      '................',
      '.....######.....',
      '...++########o..',
      '..o##########o..',
      '..o##########o..',
      '..o..........o..',
      '..o..........o..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 3,
    name: 'Side part',
    map: [
      '................',
      '....######......',
      '..+#########o...',
      '..o##########o..',
      '..o####.....#o..',
      '..o..........o..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 4,
    name: 'Spiky',
    map: [
      '...#..#..#..#...',
      '..##+##+##+##+..',
      '..##########o...',
      '..o##########o..',
      '..o##########o..',
      '..o..........o..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 5,
    name: 'Bowl',
    map: [
      '................',
      '....########....',
      '..++########oo..',
      '..o##########o..',
      '..o##########o..',
      '..o##########o..',
      '..o..........o..',
      '..o..........o..',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 6,
    name: 'Curly',
    map: [
      '....#..##..#....',
      '..+##########+..',
      '.o############o.',
      '.o############o.',
      '.o############o.',
      '.o#..........#o.',
      '.oo..........oo.',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 7,
    name: 'Ponytail',
    map: [
      '................',
      '....######......',
      '..++########o...',
      '..o##########o##',
      '..o##########o##',
      '..o..........o##',
      '..o...........o#',
      '..............o#',
      '...............o',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 8,
    name: 'Long',
    map: [
      '................',
      '.....######.....',
      '...++######oo...',
      '..o##########o..',
      '..o##########o..',
      '.o###......###o.',
      '.o##........##o.',
      '.o##........##o.',
      '.o##........##o.',
      '.o##........##o.',
      '.o##........##o.',
      '.oo..........oo.',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 9,
    name: 'Braids',
    map: [
      '................',
      '.....######.....',
      '...++######oo...',
      '..o##########o..',
      '..o##########o..',
      '..##........##..',
      '..oo........oo..',
      '..##........##..',
      '..oo........oo..',
      '...#..........#.',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  {
    id: 10,
    name: 'Mohawk',
    map: [
      '.......##.......',
      '......+##+......',
      '......####......',
      '......####......',
      '.....o####o.....',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
  },
];

export interface HairColor {
  /** 1 to 20, which is what the element's `hair-color` attribute takes. */
  readonly id: number;
  /**
   * The name is not decoration. A grid of twenty coloured squares is
   * unusable without one, and it has to be a word people say — "auburn",
   * not "#943f2a".
   */
  readonly name: string;
  readonly value: string;
}

/** Eleven that grow out of a head and nine that do not. */
export const HAIR_COLORS: readonly HairColor[] = [
  { id: 1, name: 'Jet black', value: '#15161f' },
  { id: 2, name: 'Dark brown', value: '#3b2412' },
  { id: 3, name: 'Chestnut', value: '#5d3a1a' },
  { id: 4, name: 'Chocolate', value: '#7a4a21' },
  { id: 5, name: 'Auburn', value: '#943f2a' },
  { id: 6, name: 'Ginger', value: '#c05a28' },
  { id: 7, name: 'Copper', value: '#e08a3c' },
  { id: 8, name: 'Honey', value: '#e3b65a' },
  { id: 9, name: 'Platinum', value: '#f2e0b0' },
  { id: 10, name: 'Ash', value: '#b6b6c2' },
  { id: 11, name: 'Snow', value: '#f0f0f4' },
  { id: 12, name: 'Rose', value: '#ef7ba5' },
  { id: 13, name: 'Crimson', value: '#b13e53' },
  { id: 14, name: 'Plum', value: '#7a3b8f' },
  { id: 15, name: 'Violet', value: '#a06ad8' },
  { id: 16, name: 'Cobalt', value: '#3d5bd4' },
  { id: 17, name: 'Sky', value: '#41a6f6' },
  { id: 18, name: 'Teal', value: '#3fb6a8' },
  { id: 19, name: 'Moss', value: '#38b764' },
  { id: 20, name: 'Lime', value: '#a7e04a' },
];

/** One horizontal run of identical pixels. */
export interface Run {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly token: string;
}

/**
 * Collapse a map into horizontal runs.
 *
 * A rectangle per pixel would be two hundred and fifty-six of them per
 * sprite, and the picker draws thirteen sprites at once. Runs cut that by
 * roughly four fifths and draw exactly the same thing, because a row of one
 * colour is one rectangle.
 */
export function toRuns(map: PixelMap): Run[] {
  const runs: Run[] = [];

  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const token = row[x] as string;
      let width = 1;
      while (row[x + width] === token) width += 1;
      if (token !== '.') runs.push({ x, y, width, token });
      x += width;
    }
  });

  return runs;
}

/** Mix a hex colour towards black (amount below 0) or white (above). */
export function shade(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;

  const channels = [0, 2, 4].map((offset) => {
    const base = Number.parseInt(full.slice(offset, offset + 2), 16);
    const target = amount < 0 ? 0 : 255;
    const mixed = Math.round(base + (target - base) * Math.abs(amount));
    return Math.min(255, Math.max(0, mixed));
  });

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** The three tones a hair colour is drawn in. */
export function hairTones(value: string): Record<string, string> {
  return {
    '#': value,
    // Far enough apart to read at this size; any closer and the shading
    // disappears on the darker end of the palette.
    o: shade(value, -0.4),
    '+': shade(value, 0.3),
  };
}

/** Look a style up by id, falling back to the first rather than to nothing. */
export function hairStyle(id: number): HairStyle {
  return HAIR_STYLES.find((style) => style.id === id) ?? (HAIR_STYLES[0] as HairStyle);
}

/** Look a colour up by id, falling back to the first rather than to nothing. */
export function hairColor(id: number): HairColor {
  return HAIR_COLORS.find((color) => color.id === id) ?? (HAIR_COLORS[0] as HairColor);
}
