import { css } from 'lit';

/**
 * Steps the four corners off a box by one art pixel, the way a sprite would.
 *
 * Drop it into the rule for the element that paints the frame: that element's
 * own background becomes the border, and the inside is drawn by a child or by
 * `::before` inset by the same unit. Reads `--px-unit`, so re-scaling the art
 * grid re-scales the corners with it.
 */
export const pixelFrame = css`
  --_frame-unit: var(--px-unit, 4px);

  clip-path: polygon(
    0 var(--_frame-unit),
    var(--_frame-unit) var(--_frame-unit),
    var(--_frame-unit) 0,
    calc(100% - var(--_frame-unit)) 0,
    calc(100% - var(--_frame-unit)) var(--_frame-unit),
    100% var(--_frame-unit),
    100% calc(100% - var(--_frame-unit)),
    calc(100% - var(--_frame-unit)) calc(100% - var(--_frame-unit)),
    calc(100% - var(--_frame-unit)) 100%,
    var(--_frame-unit) 100%,
    var(--_frame-unit) calc(100% - var(--_frame-unit)),
    0 calc(100% - var(--_frame-unit))
  );
`;
