import type { TemplateResult } from 'lit';

/**
 * One example screen in the showcase.
 *
 * `uses` is not documentation that sits beside the code hoping to stay true:
 * a test renders every screen and asserts each tag named here is really in
 * it, and that between them the screens use every element the kit ships. A
 * showcase that quietly stops showing something is the one failure mode that
 * matters here.
 */
export interface Screen {
  /** Also the URL hash, so every screen is a link someone can send. */
  readonly id: string;
  /** What the rail calls it. */
  readonly name: string;
  /** One line on what the screen is for and what it is showing off. */
  readonly caption: string;
  /** How wide the scene should be allowed to get. */
  readonly size?: 'sm' | 'md' | 'lg';
  /** Every `px-` tag the screen puts on the page. */
  readonly uses: readonly string[];
  render(): TemplateResult;
  /** Wiring that needs the real DOM: timers, typing, toasts. */
  mount?(root: ParentNode): void;
}
