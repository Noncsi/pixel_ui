/**
 * Checks that the built showcase still has the kit in it.
 *
 * Importing a component module registers a custom element, which is a side
 * effect in a top-level call and nothing else in the file points at. A
 * bundler told the package has no side effects will drop every one of them,
 * and the result is a page that still renders: unknown elements keep their
 * text, so the screens come out as bare unstyled tags rather than as an
 * error. Nothing in the source, the type check or the tests can see this —
 * they run before the bundler does — and the build log is a normal size,
 * because the kit is small next to Lit.
 *
 * It happened once, with `sideEffects` in package.json listing only `dist`.
 * This is the check that would have caught it.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src/components';
const OUT = 'dist-site/assets';

/** Every element the kit ships, counted from the files. */
function expectedTags() {
  const tags = [];
  for (const dir of readdirSync(SRC, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of readdirSync(join(SRC, dir.name))) {
      if (file.startsWith('px-') && file.endsWith('.ts') && !file.endsWith('.stories.ts')) {
        tags.push(file.replace('.ts', ''));
      }
    }
  }
  return tags.sort();
}

const bundles = readdirSync(OUT).filter((file) => file.endsWith('.js'));
const code = bundles.map((file) => readFileSync(join(OUT, file), 'utf8')).join('\n');

const tags = expectedTags();
const missing = tags.filter((tag) => !code.includes(`"${tag}"`) && !code.includes(`'${tag}'`));
const defines = code.match(/customElements\.define/g)?.length ?? 0;

if (missing.length > 0 || defines < tags.length) {
  console.error(
    [
      'The built site is missing the kit.',
      '',
      `  custom element registrations found: ${defines}`,
      `  elements the kit ships:             ${tags.length}`,
      missing.length > 0 ? `  tags not in the bundle:             ${missing.join(', ')}` : '',
      '',
      'The usual cause is tree shaking: check that "sideEffects" in',
      'package.json still covers ./src/**, which is what keeps the',
      'customElements.define calls from being dropped as dead code.',
    ]
      .filter(Boolean)
      .join('\n'),
  );
  process.exit(1);
}

console.log(`Site build looks right: ${defines} elements registered, all ${tags.length} present.`);
