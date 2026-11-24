import { svg, type SVGTemplateResult } from 'lit';

/**
 * The little sprites the screens need, drawn here rather than shipped as
 * files, so the site has no art pipeline and the whole thing is one build.
 *
 * Each is an eight by eight grid of paths. `shape-rendering="crispEdges"`
 * keeps them on the pixel grid at any size the kit scales them to.
 */

const sprite = (body: SVGTemplateResult): SVGTemplateResult =>
  svg`<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;

export const potion = sprite(
  svg`<path fill="#38b764" d="M3 0h2v2H3zM2 2h4v6H2z" />
      <path fill="#f4f4f4" d="M3 4h1v2H3z" />`,
);

export const sword = sprite(
  svg`<path fill="#94b0c2" d="M3 0h2v5H3zM2 5h4v1H2z" />
      <path fill="#7a4a21" d="M3 6h2v2H3z" />`,
);

export const shield = sprite(
  svg`<path fill="#41a6f6" d="M1 1h6v1H1zM1 2h1v4H1zM6 2h1v4H6zM2 6h4v1H2z" />
      <path fill="#f4f4f4" d="M3 3h2v2H3z" />`,
);

export const key = sprite(
  svg`<path fill="#ffcd75" d="M1 1h3v3H1zM4 2h3v1H4zM6 3h1v2H6z" />
      <path fill="#1a1c2c" d="M2 2h1v1H2z" />`,
);

export const herb = sprite(
  svg`<path fill="#38b764" d="M1 2h2v1H1zM5 2h2v1H5zM3 3h2v3H3z" />
      <path fill="#a7e04a" d="M3 1h2v2H3z" />`,
);

export const scroll = sprite(
  svg`<path fill="#e3b65a" d="M1 1h6v6H1z" />
      <path fill="#7a4a21" d="M2 2h4v1H2zM2 4h4v1H2zM2 6h3v1H2z" />`,
);

/** A face, for portraits and avatars. */
export const face = (skin: string, hair: string): SVGTemplateResult =>
  sprite(
    svg`<path fill=${hair} d="M1 0h6v3H1z" />
        <path fill=${skin} d="M1 2h6v5H1z" />
        <path fill="#1a1c2c" d="M2 4h1v1H2zM5 4h1v1H5zM3 6h2v1H3z" />`,
  );

/**
 * A six-frame spinning coin as a data URL, because `<px-sprite>` wants a
 * sheet and the site has no files to give it.
 */
export function coinSheet(): string {
  const widths = [10, 8, 6, 2, 6, 8];
  const rects = widths
    .map(
      (width, index) =>
        `<rect x="${index * 16 + (16 - width) / 2}" y="3" width="${width}" height="10" fill="#ffcd75"/>`,
    )
    .join('');

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="16" shape-rendering="crispEdges">${rects}</svg>`,
  )}`;
}
