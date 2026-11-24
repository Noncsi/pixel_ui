/**
 * Every element the kit ships, with the one line that says what it is for.
 *
 * A test asserts these keys are exactly the tags in `src/components`, so a
 * component added without a line here — or a line left behind after a
 * component goes — fails the build rather than quietly going missing from
 * the site.
 */
export const CATALOGUE: Record<string, string> = {
  'px-avatar': 'A portrait with a status pip, or initials when there is no picture.',
  'px-badge': 'A count or a word pinned to something else.',
  'px-button': 'The kit’s button, including a toggle variant that stays pushed in.',
  'px-character-creator': 'Ten hairstyles and twenty named colours over a live preview.',
  'px-checkbox': 'An answer submitted later, with a real indeterminate state.',
  'px-collapsible': 'A section that folds away, with a proper heading and region.',
  'px-counter': 'A number that rolls up to its new value and announces only the last one.',
  'px-dialog': 'A modal built on the platform’s own `<dialog>`.',
  'px-dialogue-box': 'The conversation panel, typed a character at a time.',
  'px-divider': 'An engraved rule, optionally with words in the middle.',
  'px-dropdown': 'One of many, hidden until asked for.',
  'px-health-bar': 'A resource spent and restored, with segments and a damage trail.',
  'px-input': 'A text field wrapping a real `<input>`.',
  'px-inventory-grid': 'A bag you move around in two dimensions.',
  'px-inventory-slot': 'One cell of it, which knows whether it is empty.',
  'px-keycap': 'A key or a gamepad button, spelled out for screen readers.',
  'px-marquee': 'A seamless ticker measured in pixels a second.',
  'px-menu': 'A list of choices with one focus stop and gamepad support.',
  'px-menu-item': 'One row of it, with an optional detail on the right.',
  'px-notice': 'A message that stays put, and is only a live region when it arrives.',
  'px-number': 'A stepper for a count, built on a real spinbutton.',
  'px-option': 'One choice inside a dropdown.',
  'px-panel': 'The framed surface everything else is drawn on.',
  'px-progress': 'A bar that only goes up, plus an indeterminate march.',
  'px-rating': 'Stars: a picture when readonly, a slider when not.',
  'px-save-slot': 'One row of the save screen, composed into a single sentence.',
  'px-scrollbox': 'A framed region that scrolls, with arrows at whichever end has more.',
  'px-segment': 'One choice inside a segmented row.',
  'px-segmented': 'Two to four choices with all of them on screen.',
  'px-slider': 'A range, with a value readout and keyboard steps.',
  'px-speech-bubble': 'A pointed bubble for something said out in the world.',
  'px-spinner': 'A small ring that says something is happening.',
  'px-sprite': 'A sprite-sheet player driven by one stepped CSS animation.',
  'px-tab': 'One tab of a tab set.',
  'px-tab-panel': 'The panel behind one tab, kept beside it in the light DOM.',
  'px-tabs': 'One panel at a time out of a set.',
  'px-timer': 'A clock that keeps its own time from the wall clock.',
  'px-toast': 'One notification, which takes itself away.',
  'px-toast-stack': 'Where toasts go, and what a game actually talks to.',
  'px-toggle': 'A setting that takes effect the moment it flips.',
  'px-tooltip': 'A description on hover, on focus, and dismissible with Escape.',
};
