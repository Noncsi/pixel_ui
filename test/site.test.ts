import { readFileSync } from 'node:fs';
import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '../src/index.js';
import { CATALOGUE } from '../site/catalogue.js';
import { REPO_URL, SITE_URL } from '../site/links.js';
import { SCREENS } from '../site/screens/index.js';

/**
 * Every element the kit ships, taken from the files rather than from a list
 * someone has to remember to update. A component added tomorrow is in here
 * the moment its file exists.
 */
const KIT_TAGS = Object.keys(import.meta.glob('../src/components/**/px-*.ts', { eager: false }))
  .filter((path) => !path.endsWith('.stories.ts'))
  .map((path) => path.split('/').pop()?.replace('.ts', '') ?? '')
  .sort();

/**
 * `<px-toast>` is the one element no screen writes down: `<px-toast-stack>`
 * builds one per message and throws it away again, which is the whole point
 * of the stack. A separate test below checks that path really works.
 */
const CREATED_AT_RUNTIME = new Set(['px-toast']);

function mount(index: number): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const screen = SCREENS[index];
  if (!screen) throw new Error(`no screen ${index}`);
  render(screen.render(), host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the showcase site', () => {
  it('found the kit on disk', () => {
    // If the glob ever matches nothing, every test below would pass by
    // vacuously checking an empty list.
    expect(KIT_TAGS.length).toBeGreaterThan(30);
  });

  it('has screens, each with an id, a name and a caption', () => {
    expect(SCREENS.length).toBeGreaterThan(0);

    for (const screen of SCREENS) {
      expect(screen.id, 'id').toMatch(/^[a-z-]+$/);
      expect(screen.name.trim(), `${screen.id} name`).not.toBe('');
      expect(screen.caption.trim().length, `${screen.id} caption`).toBeGreaterThan(40);
      expect(screen.uses.length, `${screen.id} uses`).toBeGreaterThan(0);
    }
  });

  it('gives every screen an id of its own, since the id is its URL', () => {
    const ids = SCREENS.map((screen) => screen.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SCREENS.map((screen, index) => [screen.id, index] as const))(
    '%s only claims components the kit actually ships',
    (_id, index) => {
      for (const tag of SCREENS[index]?.uses ?? []) {
        expect(KIT_TAGS, tag).toContain(tag);
        expect(customElements.get(tag), tag).toBeDefined();
      }
    },
  );

  it.each(SCREENS.map((screen, index) => [screen.id, index] as const))(
    '%s really puts every component it claims on the page',
    (_id, index) => {
      const host = mount(index);

      for (const tag of SCREENS[index]?.uses ?? []) {
        // A chip under a screen saying it demonstrates something it quietly
        // stopped rendering is the one way a showcase lies.
        expect(host.querySelector(tag), `${tag} is missing from the screen`).not.toBeNull();
      }
    },
  );

  it.each(SCREENS.map((screen, index) => [screen.id, index] as const))(
    '%s claims every component it puts on the page',
    (_id, index) => {
      const host = mount(index);
      const uses = new Set(SCREENS[index]?.uses ?? []);

      for (const node of host.querySelectorAll('*')) {
        const tag = node.tagName.toLowerCase();
        if (!tag.startsWith('px-')) continue;
        expect(uses, `${tag} is on the screen but not in its uses`).toContain(tag);
      }
    },
  );

  it('shows every component the kit ships, somewhere', () => {
    const shown = new Set(SCREENS.flatMap((screen) => [...screen.uses]));
    const missing = KIT_TAGS.filter((tag) => !shown.has(tag) && !CREATED_AT_RUNTIME.has(tag));

    expect(missing, 'components with nowhere to be seen').toEqual([]);
  });

  it('builds a toast through the stack, which is why no screen writes one', async () => {
    const stack = document.createElement('px-toast-stack') as HTMLElement & {
      toast(message: string): void;
    };
    document.body.append(stack);
    stack.toast('Hello');

    expect(stack.querySelector('px-toast')).not.toBeNull();
  });

  it('links to the same place package.json does', () => {
    // The header's links and the package metadata are two copies of one URL,
    // and a dead link in the header of the thing you are showing people is a
    // bad one to hear about from the person you showed it to.
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      repository: { url: string };
      homepage: string;
    };

    expect(pkg.repository.url).toBe(`git+${REPO_URL}.git`);
    expect(pkg.homepage).toBe(SITE_URL);
  });

  it('publishes under the repository name, which is what Pages uses', () => {
    // github.com/<user>/<repo> becomes <user>.github.io/<repo>/ — the repo
    // name carries over exactly, underscore and all.
    const [, user, repo] = /github\.com\/([^/]+)\/([^/]+)$/.exec(REPO_URL) ?? [];

    expect(user, 'user in REPO_URL').toBeDefined();
    expect(SITE_URL).toBe(`https://${(user ?? '').toLowerCase()}.github.io/${repo}/`);
  });

  it('describes every component in the catalogue, and nothing else', () => {
    expect(Object.keys(CATALOGUE).sort()).toEqual(KIT_TAGS);

    for (const [tag, line] of Object.entries(CATALOGUE)) {
      expect(line.trim().length, `${tag} description`).toBeGreaterThan(20);
    }
  });
});
