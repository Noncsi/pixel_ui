import { describe, expect, it } from 'vitest';
import {
  BODY,
  GRID,
  HAIR_COLORS,
  HAIR_STYLES,
  TOKENS,
  hairColor,
  hairStyle,
  hairTones,
  shade,
  toRuns,
  type PixelMap,
} from '../src/components/character-creator/character-art.js';

const EVERY_MAP: Array<[string, PixelMap]> = [
  ['body', BODY],
  ...HAIR_STYLES.map((style): [string, PixelMap] => [`hair ${style.id} ${style.name}`, style.map]),
];

describe('character art', () => {
  // A row one character short shifts a whole sprite sideways from that row
  // down, and looks like a drawing mistake rather than a counting one.
  it.each(EVERY_MAP)('%s is a square grid', (_name, map) => {
    expect(map).toHaveLength(GRID);
    for (const row of map) expect(row).toHaveLength(GRID);
  });

  it.each(EVERY_MAP)('%s uses only known tokens', (_name, map) => {
    const tokens = new Set(map.join('').split(''));
    for (const token of tokens) expect(TOKENS).toContain(token);
  });

  it('is drawn for sixteen rather than shrunk to it', () => {
    expect(GRID).toBe(16);

    // Halving a grid throws one pixel in four away, so a sprite reduced
    // rather than redrawn ends up with stray single pixels where a shape
    // used to be. Every run here is at least a whole pixel of something,
    // and the face is down to the two features that read at this size.
    const face = BODY.join('');
    expect(face).toContain('E'); // eyes
    expect(face).toContain('M'); // a mouth
    expect(face).toContain('s'); // and a neck in shadow
    expect(face).not.toContain('W'); // no whites: a glitch beside a 1px pupil
  });

  it('has ten hairstyles, numbered one to ten', () => {
    expect(HAIR_STYLES).toHaveLength(10);
    expect(HAIR_STYLES.map((style) => style.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('has twenty colours, numbered one to twenty', () => {
    expect(HAIR_COLORS).toHaveLength(20);
    expect(HAIR_COLORS.map((color) => color.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
  });

  it('names every style and every colour, and never twice', () => {
    const styles = HAIR_STYLES.map((style) => style.name);
    const colors = HAIR_COLORS.map((color) => color.name);

    expect(new Set(styles).size).toBe(styles.length);
    expect(new Set(colors).size).toBe(colors.length);
    for (const name of [...styles, ...colors]) expect(name.trim()).not.toBe('');
  });

  it('gives every colour a six-digit hex value, and never the same one twice', () => {
    const values = HAIR_COLORS.map((color) => color.value);
    for (const value of values) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(values).size).toBe(values.length);
  });

  it.each(HAIR_STYLES.map((style): [string, PixelMap] => [style.name, style.map]))(
    '%s leaves the face clear below the brow',
    (_name, map) => {
      // The eyes are at columns 5 and 10 on row 6, the mouth at 7 and 8 on
      // row 8. Hair is welcome down the sides and over the temples; what it
      // must not do is cross the middle on those two rows, because there is
      // a feature there and no second row to lose it in.
      for (const run of toRuns(map)) {
        if (run.y !== 6 && run.y !== 8) continue;
        const covers = run.x <= 10 && run.x + run.width > 5;
        expect(covers, `row ${run.y} crosses the face at x=${run.x}`).toBe(false);
      }
    },
  );

  it('draws every hairstyle differently from every other', () => {
    const shapes = HAIR_STYLES.map((style) => style.map.join('\n'));
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it('is one body, whose shoulders widen from the neck', () => {
    // Rows 0 to 11 are head and neck; the torso starts at 12 and gets wider
    // each row until it reaches the frame.
    const widths = BODY.slice(12).map((row) => row.replace(/\./g, '').length);

    expect(widths).toEqual([8, 12, 14, 14]);
  });

  describe('toRuns', () => {
    it('collapses a row of one colour into one rectangle', () => {
      const runs = toRuns(['###.', '#.#.']);

      expect(runs).toEqual([
        { x: 0, y: 0, width: 3, token: '#' },
        { x: 0, y: 1, width: 1, token: '#' },
        { x: 2, y: 1, width: 1, token: '#' },
      ]);
    });

    it('leaves nothing out and invents nothing', () => {
      for (const [, map] of EVERY_MAP) {
        const rebuilt = map.map(() => '.'.repeat(GRID).split(''));
        for (const run of toRuns(map)) {
          for (let step = 0; step < run.width; step += 1) {
            (rebuilt[run.y] as string[])[run.x + step] = run.token;
          }
        }
        expect(rebuilt.map((row) => row.join(''))).toEqual([...map]);
      }
    });

    it('draws a sprite in far fewer rectangles than it has pixels', () => {
      const runs = toRuns(BODY);
      expect(runs.length).toBeLessThan((GRID * GRID) / 4);
    });
  });

  describe('shade', () => {
    it('mixes towards black and towards white', () => {
      expect(shade('#808080', -1)).toBe('#000000');
      expect(shade('#808080', 1)).toBe('#ffffff');
      expect(shade('#808080', 0)).toBe('#808080');
    });

    it('takes a three-digit hex as well', () => {
      expect(shade('#fff', 0)).toBe('#ffffff');
    });

    it('stays inside the range at the ends of the palette', () => {
      expect(shade('#000000', -0.4)).toBe('#000000');
      expect(shade('#ffffff', 0.3)).toBe('#ffffff');
    });

    it('gives a hairstyle three tones that are actually different', () => {
      const tones = hairTones('#7a4a21');
      expect(new Set(Object.values(tones)).size).toBe(3);
      expect(tones['#']).toBe('#7a4a21');
    });
  });

  describe('lookups', () => {
    it('finds a style and a colour by number', () => {
      expect(hairStyle(4).name).toBe('Spiky');
      expect(hairColor(6).name).toBe('Ginger');
    });

    it('falls back to the first rather than to nothing', () => {
      // A missing style would draw a bald, bodiless square; the first one is
      // wrong but it is still a character.
      expect(hairStyle(99)).toBe(HAIR_STYLES[0]);
      expect(hairColor(0)).toBe(HAIR_COLORS[0]);
    });
  });
});
