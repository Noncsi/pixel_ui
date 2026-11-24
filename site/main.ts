import { html, render } from 'lit';
// The kit's design tokens. Imported rather than linked from the HTML, so the
// bundler resolves it from outside this build's root and hands the browser
// real CSS.
import '../src/styles/tokens.css';
// Side effect: defines every custom element in the kit.
import '../src/index.js';
import { CATALOGUE } from './catalogue.js';
import { REPO_URL } from './links.js';
import { SCREENS, type Screen } from './screens/index.js';

const THEME_KEY = 'px-site-theme';

/** Where each part of the page lives. */
const el = {
  nav: document.getElementById('nav') as HTMLUListElement,
  scene: document.getElementById('scene') as HTMLElement,
  screen: document.getElementById('screen') as HTMLElement,
  name: document.getElementById('screen-name') as HTMLElement,
  caption: document.getElementById('screen-caption') as HTMLElement,
  uses: document.getElementById('uses') as HTMLUListElement,
  catalogue: document.getElementById('catalogue') as HTMLUListElement,
  theme: document.getElementById('theme') as HTMLButtonElement,
  themeLabel: document.getElementById('theme-label') as HTMLElement,
  storybook: document.getElementById('storybook') as HTMLAnchorElement,
  source: document.getElementById('source') as HTMLAnchorElement,
};

el.source.href = REPO_URL;

/*
 * Deployed, Storybook sits one level under this page; running locally there
 * is nothing there, and the thing the link should open is its own dev
 * server. Pointing at `./storybook/` in both places would give whoever is
 * working on the site a 404 every time.
 */
el.storybook.href = import.meta.env.DEV ? 'http://localhost:6006/' : './storybook/';

/* Theme ----------------------------------------------------------------- */

function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset['theme'] = theme;
  el.theme.setAttribute('aria-pressed', String(theme === 'light'));
  // The button says what pressing it will do, not what the page is now.
  el.themeLabel.textContent = theme === 'light' ? 'Dark theme' : 'Light theme';
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // A private window can refuse storage; the theme still works, it just
    // does not survive a reload.
  }
}

function startingTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* see above */
  }
  // The kit is dark by default, and so is the site, unless the reader's
  // system says otherwise.
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

el.theme.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset['theme'] === 'light' ? 'dark' : 'light');
});

applyTheme(startingTheme());

/* Screens --------------------------------------------------------------- */

function screenFromHash(): Screen {
  const id = window.location.hash.replace('#', '');
  return SCREENS.find((screen) => screen.id === id) ?? (SCREENS[0] as Screen);
}

function show(screen: Screen, { focus = false } = {}): void {
  el.name.textContent = screen.name;
  el.caption.textContent = screen.caption;
  el.scene.dataset['size'] = screen.size ?? 'sm';

  // Rendered rather than cloned, so leaving a screen tears down its timers
  // and listeners with the elements that owned them.
  render(screen.render(), el.scene);
  screen.mount?.(el.scene);

  render(html`${screen.uses.map((tag) => html`<li><code>&lt;${tag}&gt;</code></li>`)}`, el.uses);

  for (const link of el.nav.querySelectorAll('a')) {
    const current = link.getAttribute('href') === `#${screen.id}`;
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  // Only when the reader asked for a different screen: moving focus on the
  // first paint would drag the page past the header for no reason.
  if (focus) el.screen.focus();
}

render(
  html`${SCREENS.map(
    (screen, index) => html`
      <li>
        <a href="#${screen.id}">
          <span class="index">${String(index + 1).padStart(2, '0')}</span>
          <span>${screen.name}</span>
        </a>
      </li>
    `,
  )}`,
  el.nav,
);

window.addEventListener('hashchange', () => show(screenFromHash(), { focus: true }));
show(screenFromHash());

/* Catalogue and counts -------------------------------------------------- */

render(
  html`${Object.entries(CATALOGUE).map(
    ([tag, line]) => html`
      <li>
        <b>&lt;${tag}&gt;</b>
        <span>${line}</span>
      </li>
    `,
  )}`,
  el.catalogue,
);

/*
 * Counted rather than written down, and otherwise only things that stay
 * true. A test count baked into a page is a number that is wrong a month
 * later, and a stale figure on the thing you are showing people is worse
 * than no figure: the README carries those, next to the code that moves
 * them.
 */
const counts: Record<string, string> = {
  'stat-components': `${Object.keys(CATALOGUE).length} custom elements`,
  'stat-tests': 'Lit 3, no framework',
  'stat-size': 'Dark and light themes',
};

for (const [id, text] of Object.entries(counts)) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}
