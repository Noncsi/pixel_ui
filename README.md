# Pixel UI

[![CI](https://github.com/Noncsi/pixel_ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Noncsi/pixel_ui/actions/workflows/ci.yml)
[![Pages](https://github.com/Noncsi/pixel_ui/actions/workflows/pages.yml/badge.svg)](https://github.com/Noncsi/pixel_ui/actions/workflows/pages.yml)

A pixel-art game UI kit built as framework-agnostic **Web Components** with
[Lit](https://lit.dev). Health bars, dialogue boxes, menus and the other DOM bits
that are tedious to build on a canvas, and that work the same in Phaser,
React, Angular, Vue or a plain HTML page.

**[See it →](https://noncsi.github.io/pixel_ui/)** — seven example game
screens built from the kit, or
**[every component on its own](https://noncsi.github.io/pixel_ui/storybook/)**
in Storybook.

```html
<link rel="stylesheet" href="@noncsi/pixel-ui/tokens.css" />
<script type="module">
  import '@noncsi/pixel-ui';
</script>

<px-health-bar label="HP" value="80" segments="10" show-value></px-health-bar>
```

## Principles

- **Framework-agnostic.** Standard custom elements; Lit is a peer of the host
  app, not bundled.
- **Accessible by default.** Real ARIA roles and states, keyboard support, and
  every animation switched off under `prefers-reduced-motion`.
- **Themeable through tokens.** Every component reads `--px-*` custom
  properties from `tokens.css`, so a game re-skins the kit in one place. Dark
  by default; `data-theme="light"` on any container flips it.
- **Styled on purpose, open on purpose.** Styles live in Shadow DOM so the
  game can't break them. What's meant to be customised is exposed as CSS
  properties and `::part()`s, and documented on each component.

Two tokens are worth knowing when re-theming: `--px-color-highlight` is the
"this one is picked" colour — the active menu row, the speaker's name and every
focus ring — and `--px-color-accent` is the positive/"on" colour the toggle and
the slider fill use. Both get a value of their own under `data-theme="light"`,
because the gold that reads on a dark panel disappears on a light one.

## Getting started

```bash
npm install
npm run format   # once, so the files match your local Prettier
npm run dev      # playground at http://localhost:5173
```

| Script               | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Vite playground (`index.html`) with HMR             |
| `npm run site`       | The showcase site at http://localhost:5173          |
| `npm test`           | Vitest + happy-dom, once (`test:watch` to watch)    |
| `npm run lint`       | ESLint (`lint:fix` to apply)                        |
| `npm run format`     | Prettier (`format:check` to verify)                 |
| `npm run check`      | typecheck + lint + format + test, what CI runs      |
| `npm run build`      | type declarations + ES module bundle into `dist/`   |
| `npm run build:site` | the showcase site into `dist-site/`, then checks it |

There are three ways to look at this kit, and they are for three different
things:

| Where                        | What it is for                                                      |
| ---------------------------- | ------------------------------------------------------------------- |
| `site/` (`npm run site`)     | The showcase: finished screens a game would actually build          |
| Storybook                    | One component at a time, every state, with controls and a11y checks |
| `index.html` (`npm run dev`) | The scratch playground used while building; not meant to be pretty  |

### The showcase site

```bash
npm run site         # http://localhost:5173
npm run build:site   # static site into dist-site/
```

Seven screens — title, character creation, load game, dialogue, a field HUD, a
shop and an options menu — each built from the kit and nothing else. The site's
own CSS does layout only; every pixel of the look comes from the components,
which is the claim it is making and would be a lie if the frame were doing the
work.

Under each screen is a row of chips naming every component on it. Those chips
are not a comment hoping to stay true: `test/site.test.ts` renders every
screen and asserts that each tag it claims is really there, that each tag it
renders is claimed, and that between them the screens use **every element the
kit ships** — the list of which is read from `src/components` with
`import.meta.glob`, so a component added tomorrow is in it the moment its file
exists. A showcase quietly ceasing to show something is the one failure mode
that matters here, and it fails the build instead.

It is a separate Vite build (`vite.site.config.ts`). The library build leaves
Lit external so a consumer brings their own; the site is an ordinary app that
bundles everything, with `base: './'` so the same output works at a domain
root, under a repository path, or from a `file://` URL.

`build:site` ends by running `scripts/verify-site-build.mjs`, which counts the
custom element registrations in the output and fails if the kit is not in
there. That is not a hypothetical: `sideEffects` in `package.json` listed only
`./dist`, so when a bundler read it while building from source it dropped
every `customElements.define` as dead code. The site still rendered — unknown
elements keep their text — so the screens came out as bare unstyled tags, and
nothing in the source, the type check, the tests or the build log could see
it. Storybook's build had the same hole. `./src/**` is in `sideEffects` now,
and the check is there so it stays fixed.

### Deploying to GitHub Pages

`.github/workflows/pages.yml` publishes on every push to `main`, and can be
run by hand from the Actions tab:

| URL                                                                                  | What is there              |
| ------------------------------------------------------------------------------------ | -------------------------- |
| [noncsi.github.io/pixel_ui/](https://noncsi.github.io/pixel_ui/)                     | The showcase               |
| [noncsi.github.io/pixel_ui/storybook/](https://noncsi.github.io/pixel_ui/storybook/) | Every component on its own |

Both are live from the first push to `main` after Pages is switched on. The
repository name carries into the URL exactly, underscore and all, which is why
`site/links.ts` and `package.json` agree on it and a test holds them there.

Neither build needs to be told the repository path it will sit under — the
site because `base: './'`, Storybook because its builder emits relative URLs
anyway — so the same output also works at a domain root.

The workflow runs `npm run check` before it builds. CI already runs it on the
same push, and it runs here as well on purpose: this is the workflow that puts
something in front of people, and it should not be able to publish a build
that failed its own tests.

Switching Pages on is a one-time setup step, done once per repository either in
the browser — **Settings → Pages → Build and deployment → Source → GitHub
Actions** — or in one command:

```bash
gh api repos/<user>/<repo>/pages -X POST -f build_type=workflow
```

What cannot do it is the workflow itself, which is worth writing down because
it looks as though it can. `actions/configure-pages` takes an `enablement`
input that creates the Pages site over the API, but creating one is a
repository-admin operation, and `GITHUB_TOKEN` is not an administrator however
the workflow's `permissions:` block is written. Asking for it fails the build
outright with `Resource not accessible by integration`, after everything else
in it has already succeeded. The `gh` command above runs as a user token with
`repo` scope, which _is_ admin on its owner's own repository, so it has no such
trouble — the distinction is whose token is asking, not which endpoint.

Pages for a private repository needs a paid plan; a public one does not.

### Storybook

```bash
npm run storybook         # http://localhost:6006
npm run build-storybook   # static site into storybook-static/
```

Stories live next to the component they document (`*.stories.ts`) and are picked
up automatically. `.storybook/preview.ts` loads `tokens.css` and wraps every
story in the pixel background and font, with a toolbar switch for the light
theme; `preview-head.html` pulls in Press Start 2P.

The `@storybook/addon-docs` and `@storybook/addon-a11y` addons are installed.
Storybook's installer also offers a Vitest addon that runs each story as a
browser test — it isn't set up here, because it would pull Playwright into
`npm test` and CI; `npm test` stays Vitest + happy-dom.

## Components

### `<px-avatar>`

A framed portrait: a party list, a save slot, the face beside a line of
dialogue.

| Attribute      | Property         | Default  | Notes                               |
| -------------- | ---------------- | -------- | ----------------------------------- |
| `src`          | `src`            | `''`     | The picture, drawn unsmoothed       |
| `alt`          | `alt`            | `''`     | What it shows; falls back to `name` |
| `name`         | `name`           | `''`     | Whose face; its initials stand in   |
| `size`         | `size`           | `'md'`   | `sm` · `md` · `lg`                  |
| `status`       | `status`         | `'none'` | `none` · `ok` · `warn` · `danger`   |
| `status-label` | `statusLabel`    | `''`     | What the pip means, e.g. "Poisoned" |
| —              | `initials`       | —        | Read-only                           |
| —              | `accessibleName` | —        | Read-only                           |

**Parts:** `base`, `frame`, `image`, `initials`, `status`.
**CSS properties:** `--px-avatar-size`, `--px-avatar-fill`.

Given only a `name` it draws that name's initials, so a party list doesn't
fall apart before the art is done. A portrait with no name and no alt text is
decoration, and is hidden from assistive technology rather than read out as an
unlabelled image. The status pip is a colour, which says nothing on its own —
`status-label` is what makes it mean something.

### `<px-badge>`

A small chip for a count or a state: unread mail on a tab, how many of an
item is in a slot, NEW on a menu row.

| Attribute | Property  | Default     | Notes                                      |
| --------- | --------- | ----------- | ------------------------------------------ |
| `variant` | `variant` | `'neutral'` | `neutral` · `accent` · `danger` · `xp`     |
| `label`   | `label`   | `''`        | What it means, e.g. "3 unread"             |
| `max`     | `max`     | `0`         | Caps the drawn number: 143 → "99+". 0 = no |
| `dot`     | `dot`     | `false`     | A dot with no number at all                |

**Parts:** `base`. **CSS properties:** `--px-badge-color`.

A bare "3" tells a screen reader nothing, so a badge with a `label` hides the
digits from the accessibility tree and reads "3 unread" instead. That's done
with visually hidden **text**, not `aria-label`, which is unreliable on an
element with no role of its own. `max` only caps what is _drawn_ — the real
number stays in the DOM, and the label still says what it is.

### `<px-button>`

A framed pixel button around a real `<button>`, so Enter, Space, focus and the
disabled state behave exactly as the platform defines them. Pressing it moves
the one-pixel highlight to the bottom edge and drops the label by one art pixel
— the frame itself never moves, so nothing reflows.

| Attribute    | Property    | Default     | Notes                                 |
| ------------ | ----------- | ----------- | ------------------------------------- |
| `variant`    | `variant`   | `'primary'` | `primary` · `secondary` · `danger`    |
| `size`       | `size`      | `'md'`      | `sm` (8px type) · `md` (12px)         |
| `type`       | `type`      | `'button'`  | `button` · `submit` · `reset`         |
| `disabled`   | `disabled`  | `false`     | Greys it out and stops it responding  |
| `toggle`     | `toggle`    | `false`     | Two-state button, adds `aria-pressed` |
| `pressed`    | `pressed`   | `false`     | State of a toggle button. Reflected   |
| `full-width` | `fullWidth` | `false`     | Stretches to the container            |
| —            | `form`      | —           | Read-only: the form it belongs to     |

**Events:** `px-toggle` when a toggle button flips, with `detail: { pressed }`.
Ordinary `click` crosses the shadow boundary on its own, so `onclick` works.

**Slots:** default (the label), `icon` (before the label; images and SVG are
rendered unsmoothed at `1em`).

**Parts:** `base`, `frame`, `label`. **CSS properties:** `--px-button-color`.

The frame is a layer inside the button rather than the button's own background,
so the `:focus-visible` ring isn't cut off by the stepped corners.

Inside a `<form>`, `type="submit"` and `type="reset"` act on it. The form is
found through `ElementInternals` where it exists and by walking the DOM where it
doesn't, so the button works in both.

### `<px-character-creator>`

The screen before the game starts: pick a hairstyle and a colour, and watch
the character change as you do.

| Attribute      | Property       | Default | Notes                                       |
| -------------- | -------------- | ------- | ------------------------------------------- |
| `hair`         | `hair`         | `1`     | 1 to 10. Reflected                          |
| `hair-color`   | `hairColor`    | `2`     | 1 to 20. Reflected                          |
| `label`        | `label`        | `''`    | Heading and accessible name                 |
| `disabled`     | `disabled`     | `false` |                                             |
| `hide-preview` | `hidePreview`  | `false` | Draw only the controls                      |
| `name`         | `name`         | `''`    | Form field prefix                           |
| —              | `value`        | —       | Both at once. Settable                      |
| —              | `currentHair`  | —       | Read-only: the chosen style, with its name  |
| —              | `currentColor` | —       | Read-only: the chosen colour, with its name |
| —              | `description`  | —       | Read-only: the character in a sentence      |
| —              | `form`         | —       | Read-only: the form it is in                |

**Methods:** `randomize()`.
**Events:** `px-character-change`, with
`detail: { hair, hairColor, hairName, hairColorName, hairColorValue }`.
**Parts:** `base`, `preview`, `frame`, `group`, `group-label`, `option`,
`swatch`.
**CSS properties:** `--px-character-size`, `--px-character-skin`,
`--px-character-clothes`.

**There is one body.** There were two, differing only in the width of the
shoulders, because sixteen pixels is no room for anything subtler and anything
subtler would have been a caricature — which is a decent argument for not
splitting the body in two at all. What a character looks like is the hair, the
colour, and the skin and clothing custom properties, which a game sets without
the element having an opinion about it.

**Every option is drawn, not named.** Nobody picks "hair 7" on purpose — they
pick the one that looks right. So each hairstyle is a small portrait of the
body wearing that hair in the colour you have chosen. The picker shows what
you are going to get rather than a floating wig or a stand-in grey.

**Every option is also named**, which matters more here than anywhere else in
the kit: a grid of twenty coloured squares with no names is unusable, and the
names have to be words people say — "auburn", not `#943f2a`. The preview
composes the lot into one sentence, _"Character with ponytail hair in
ginger"_, the same way `<px-save-slot>` does.

Each of the two is a radio group with **one tab stop**: Tab moves between
groups, arrows move and choose inside one. The colour grid's up and down
arrows move by a whole row, because it is a grid of ten by two and treating it
as a line of twenty makes the last swatch a twenty-press journey. Everything
wraps.

The chosen option is marked with a ring in the highlight colour rather than a
tint — a tinted swatch would be lying about the colour it is there to show.

#### The art

The sprites live in `character-art.ts` as grids of single characters, one per
pixel, which is the only representation of pixel art that stays readable in a
source file:

```
'...SSESSSSESS...'
'...SSSSMMSSSS...'
'......ssss......'
```

`.` nothing, `S` skin, `s` skin in shadow, `E` eye, `M` mouth, `B` clothing,
`b` clothing in shadow, `#` hair, `o` hair in shadow, `+` hair catching light.
A test asserts every map is exactly **sixteen by sixteen**, because a row one
character short shifts a whole sprite sideways from that row down and reads as
a drawing mistake rather than a counting one.

Sixteen is the size the drawing is **for**, not a budget it was squeezed into.
The face is two eyes and a mouth because that is what reads here: a white next
to a one-pixel pupil is a glitch rather than an eye, and a nose is a smudge.
The one piece of modelling it can spare is the neck, drawn in shadow rather
than in skin, which stops the head looking stuck on. What sixteen does give is
a silhouette you can tell from another silhouette across ten tiles, which is
the whole job of the picker.

Halving a grid is not the mirror of doubling it. Doubling changes nothing —
every pixel becomes four — while halving throws one pixel in four away, which
leaves stray single pixels where a shape used to be. So this is the drawing
made again at this size, not a larger one shrunk. Two tests hold it there: one
for the tokens that belong at this size, and one that no hairstyle crosses the
middle of the rows the eyes and mouth are on, since there is no second row to
lose a feature in.

Hair is drawn in three tones derived from the one colour you pick —
`shade(value, -0.4)` and `shade(value, 0.3)` — so twenty colours cover sixty
without a palette sixty long. Skin and clothing are classed rather than
filled, because a `fill=""` presentation attribute cannot read a custom
property and those two are meant to be re-skinnable; their shadow tokens are
`color-mix`ed from the same properties rather than being a translucent black,
since a shadow pixel _replaces_ its skin pixel rather than sitting on top of
one, and anything translucent would show the panel through the face.

Each sprite is drawn as one rectangle per **run** of identical pixels rather
than one per pixel. The picker draws eleven sprites at once: a rectangle per
pixel would be nearly three thousand of them, and runs bring that to a few
hundred while drawing exactly the same thing.

Nothing is cropped. At this size the hair runs the full width of the sprite —
the ponytail's tail reaches the last column — so there is nothing at the sides
to crop away.

`HAIR_STYLES` and `HAIR_COLORS` are exported, and are also on the class as
`PxCharacterCreator.hairStyles` and `.hairColors`, for a game that wants to
build its own picker over the same art.

The body's shoulders widen over three rows from the neck, between where the
two of them used to sit, and a test holds them to that so a stray edit cannot
quietly reshape the torso.

### `<px-checkbox>`

The box you tick. `<px-toggle>` is the other half of this pair, and the choice
between them is **when the change happens**: a toggle takes effect the moment
it flips, which is why it reads ON and OFF; a checkbox is one answer among
several that is submitted later. Fullscreen is a toggle. "I have read the
terms" is a checkbox.

| Attribute       | Property        | Default | Notes                             |
| --------------- | --------------- | ------- | --------------------------------- |
| `checked`       | `checked`       | `false` | Reflected                         |
| `indeterminate` | `indeterminate` | `false` | Reflected; neither on nor off     |
| `disabled`      | `disabled`      | `false` |                                   |
| `required`      | `required`      | `false` | Passed on as `aria-required`      |
| `label`         | `label`         | `''`    | Accessible name, also drawn       |
| `hide-label`    | `hideLabel`     | `false` | Label for screen readers only     |
| `name`          | `name`          | `''`    | Form field name                   |
| `value`         | `value`         | `'on'`  | Submitted while ticked            |
| —               | `state`         | —       | Read-only: `true`/`false`/`mixed` |
| —               | `form`          | —       | Read-only: the form it is in      |

**Methods:** `toggle(force?)`.
**Events:** `px-checkbox-change`, with `detail: { checked, indeterminate }`.
**Slots:** `hint`.
**Parts:** `base`, `box`, `frame`, `mark`, `label`, `hint`.
**CSS properties:** `--px-checkbox-color`.

It can also sit at `indeterminate`, which a toggle cannot, for the parent of a
part-ticked list. Unlike the native checkbox that state is a reflected
attribute, so CSS can see it, and clicking out of it ticks the box the way the
platform does — a half-ticked list is finished, not abandoned.

The tick is drawn pixel by pixel, with one art-pixel square and four copies of
it offset by `box-shadow`. A font's tick is the wrong shape at this size and
would not land on the art grid; the pixel font the kit ships with has no tick
glyph at all. Indeterminate is a dash rather than a faded tick, because "some
of these" is a different answer and not a weaker yes.

The label is already the accessible name, so the drawn copy is hidden — but the
`hint` is not, and is pointed at with `aria-describedby`, because it is the part
that says what ticking the box will actually do. An empty hint is `hidden`, so
it costs no space.

### `<px-collapsible>`

A section that folds away: a settings category, one chapter of a quest log, the
spoiler under "how do I beat this".

| Attribute  | Property   | Default | Notes                               |
| ---------- | ---------- | ------- | ----------------------------------- |
| `summary`  | `summary`  | `''`    | Heading text, and the region's name |
| `open`     | `open`     | `false` | Reflected                           |
| `disabled` | `disabled` | `false` |                                     |
| `level`    | `level`    | `3`     | Heading level, clamped to 1–6       |
| `flat`     | `flat`     | `false` | Drop the frame, keep the fold       |

**Methods:** `toggle(force?)`, `show()`, `hide()`.
**Events:** `px-collapsible-toggle`, with `detail: { open }`.
**Slots:** default, `aside`.
**Parts:** `base`, `frame`, `heading`, `marker`, `summary`, `content`.
**CSS properties:** `--px-collapsible-fill`.

`<px-tabs>` and this one both hide content behind a heading, and the difference
is whether the reader has to choose. Tabs show one panel out of a set, so
opening one closes another; these are independent. Stack several and you have
an accordion — the kit deliberately does not enforce one-open-at-a-time,
because a game that wants it can close the others in its own handler, and most
games do not want it.

The heading is a real button inside an element carrying `role="heading"`, so a
screen reader can jump between sections by heading, and `level` places it in
the page's outline. That wrapper is deliberately **not** `display: contents`,
which would take its box away and, in more than one browser, the heading role
with it. The content is a named region, which is what makes "go to the thing I
just opened" work; both `aria-controls` and `aria-labelledby` only work here
because the button and the region share one shadow root.

The fold goes from `grid-template-rows: 0fr` to `1fr`, the one way to animate
to a height nobody has measured — `height: auto` does not transition.
`visibility` rides along, so a shut section is out of the accessibility tree
and out of the tab order; because it flips only at the far end of the
transition, the content does not wink out while the section is still folding.
The spacing lives one level inside the clipped box, since padding on the grid
item would be a floor for the row and leave the section a few pixels tall when
it is meant to be shut.

### `<px-counter>`

A number that rolls up to its new value: gold after a battle, a score tally,
XP earned. Set `value` and it counts from wherever it was, easing out so the
last few digits settle rather than stopping dead.

| Attribute   | Property       | Default | Notes                                   |
| ----------- | -------------- | ------- | --------------------------------------- |
| `value`     | `value`        | `0`     | The number to count to                  |
| `duration`  | `duration`     | `600`   | How long the roll takes, in ms          |
| `pad`       | `pad`          | `0`     | Zero-pad to this many digits            |
| `separator` | `separator`    | `''`    | Between thousands, e.g. `,`             |
| `prefix`    | `prefix`       | `''`    | Drawn in front, e.g. `×` or `$`         |
| `label`     | `label`        | `''`    | What the number is, for a screen reader |
| —           | `displayValue` | —       | Read-only: the number on screen now     |
| —           | `rolling`      | —       | Read-only: true while it moves          |

**Methods:** `snap()` jumps to the target.
**Events:** `px-counter-end` when the roll lands, with `detail: { value }`.
**Parts:** `base`.

The first value it's given is where it starts, not something to roll to.
Under `prefers-reduced-motion`, or with `duration="0"`, it just shows the
number. The rolling digits are hidden from assistive technology — announcing
sixty intermediate numbers would be unusable — and the figure it lands on is
reported once, the same approach `<px-dialogue-box>` takes with its typing.

### `<px-dialog>`

A modal. It's a real `<dialog>` underneath, opened with `showModal()`, so the
focus trap, the backdrop, Escape and making the rest of the page inert are the
browser's own — all things that are easy to do badly by hand. The kit adds the
frame.

| Attribute    | Property    | Default | Notes                                  |
| ------------ | ----------- | ------- | -------------------------------------- |
| `open`       | `open`      | `false` | Reflected. `show()` / `close()` set it |
| `label`      | `label`     | `''`    | The title, and the accessible name     |
| `hide-label` | `hideLabel` | `false` | Keep the title for screen readers only |
| `no-dismiss` | `noDismiss` | `false` | No Escape, no backdrop click           |

**Methods:** `show()`, `close(returnValue)`.
**Events:** `px-dialog-open`, and `px-dialog-close` with
`detail: { returnValue }` — `"dismiss"` when it was backed out of.
**Slots:** default (the body), `footer` (the buttons).
**Parts:** `base`, `frame`, `title`, `content`, `footer`.
**CSS properties:** `--px-dialog-width`.

A click that lands on the dialog element itself landed on the backdrop — every
pixel of the dialog's own box is covered by the frame or the body — which is
how backdrop dismissal is detected without measuring anything.

### `<px-dialogue-box>`

A dialogue box that types its line out one character at a time, pausing a beat
longer at the end of a sentence. Clicking the box finishes the line early;
clicking again asks for the next one.

| Attribute           | Property           | Default | Notes                                   |
| ------------------- | ------------------ | ------- | --------------------------------------- |
| `text`              | `text`             | `''`    | Setting it starts the typing again      |
| `speaker`           | `speaker`          | `''`    | Shown above the line when set           |
| `speed`             | `speed`            | `30`    | Characters per second                   |
| `punctuation-pause` | `punctuationPause` | `250`   | Extra ms after `.?!…`, half after `,;:` |
| `typing`            | `typing`           | `false` | Reflected, read-only, for styling       |
| —                   | `done`             | —       | Read-only: the whole line is shown      |

**Methods:** `skip()` shows the rest at once, `restart()` types the line again,
`advance()` asks for the next one.

**Events:** `px-typing-start` and `px-typing-end`, both with
`detail: { text, skipped }`, and `px-dialogue-advance`.

**Slots:** `portrait` (left of the text) and `choices` (buttons shown once the
line is done — they replace the continue arrow, and clicking one doesn't
advance the box).

**Parts:** `base`, `frame`, `speaker`, `text`, `advance`.
**CSS properties:** `--px-dialogue-box-lines` (height of the text area, default 3).

The whole line is in the DOM from the first character — the untyped tail is
just invisible — so the box never reflows as it fills. The visible line is
hidden from assistive technology and the finished line is announced once from a
live region, rather than a character at a time; under `prefers-reduced-motion`
it appears whole. Use the native `hidden` attribute to take the box off screen.

### `<px-divider>`

A rule between things: menu sections, groups of settings, the line above a
total.

| Attribute  | Property   | Default | Notes                                    |
| ---------- | ---------- | ------- | ---------------------------------------- |
| `label`    | `label`    | `''`    | Words in the middle of the rule          |
| `vertical` | `vertical` | `false` | Stand it up, to divide a row             |
| `ornament` | `ornament` | `false` | A diamond in the middle instead of a gap |

**Parts:** `base`, `label`.
**CSS properties:** `--px-divider-color`, `--px-divider-space`.

Two art pixels tall rather than one — a dark line with a lighter one under it
— which is how an engraved groove reads at this scale, and what makes it sit
_in_ the frame rather than on top of it. It's a `separator`, and a `label`
becomes its accessible name, since in a menu that name is the only thing
saying where a section begins. A vertical rule leaves the words off rather
than turning them sideways, but keeps the name.

### `<px-dropdown>` and `<px-option>`

A pixel stand-in for `<select>`: a framed button that opens a list.

```html
<px-dropdown label="Difficulty" value="normal">
  <px-option value="easy">Easy</px-option>
  <px-option value="normal">Normal</px-option>
  <px-option value="hard">Hard</px-option>
</px-dropdown>
```

| Attribute     | Property         | Default      | Notes                          |
| ------------- | ---------------- | ------------ | ------------------------------ |
| `value`       | `value`          | first option | The chosen option's value      |
| `label`       | `label`          | `''`         | Accessible name for the button |
| `placeholder` | `placeholder`    | `'Select…'`  | Shown while nothing is chosen  |
| `open`        | `open`           | `false`      | Reflected                      |
| `disabled`    | `disabled`       | `false`      |                                |
| `full-width`  | `fullWidth`      | `false`      | Stretches to the container     |
| —             | `options`        | —            | Read-only                      |
| —             | `selectedOption` | —            | Read-only                      |

Closed, up and down change the value where it stands, the way a native select
does; Enter, Space or alt+down open the list. Open, the arrows move through it,
Enter or Space chooses, Escape backs out, and focus returns to the button
either way. A press outside closes it.

**Methods:** `show()`, `close()`, `select(value)`, `focus()`.
**Events:** `px-dropdown-change` with `detail: { value, label, index }`, plus
`px-dropdown-open` and `px-dropdown-close`.
**Parts:** `trigger`, `frame`, `value`, `arrow`, `menu` — and `base`, `check`,
`label` on `<px-option>`.

Navigation moves real focus onto the options rather than pointing at them with
`aria-activedescendant`: the options are children of the dropdown and the list
that holds them is in the shadow root, and an id can't be followed across that
boundary. Moving focus needs no ids at all.

`<px-option>` takes `value` (falling back to its own text), `disabled`, and a
reflected read-only `selected`; it slots a label and an `icon`.

### `<px-health-bar>`

A segmented resource bar for health, mana or XP. When the value drops, the fill
snaps down and a pale damage trail drains after it. When it rises, the fill
grows slowly.

| Attribute       | Property       | Default    | Notes                                 |
| --------------- | -------------- | ---------- | ------------------------------------- |
| `value`         | `value`        | `100`      | Clamped to `0…max`                    |
| `max`           | `max`          | `100`      |                                       |
| `label`         | `label`        | `''`       | Accessible name, shown above the bar  |
| `variant`       | `variant`      | `'health'` | `health` · `mana` · `xp`              |
| `segments`      | `segments`     | `0`        | Notches across the bar                |
| `low-threshold` | `lowThreshold` | `0.25`     | Fraction under which the bar is "low" |
| `show-value`    | `showValue`    | `false`    | Shows `value / max`                   |
| `hide-label`    | `hideLabel`    | `false`    | Label for screen readers only         |
| `low`           | —              | —          | Reflected, read-only, for styling     |

**Events:** `px-low` (crossed under the threshold) and `px-depleted` (reached
zero). Both fire on the transition, never on first render, with
`detail: { value, max }`.

**Parts:** `base`, `label`, `value`, `track`, `trail`, `fill`.
**CSS properties:** `--px-health-bar-height`, `--px-health-bar-color`.

### `<px-input>`

A framed text field: name entry, a save-file name, a seed, a cheat code. It
wraps a real `<input>`, so selection, the caret, autofill, IME and every
keyboard shortcut are the platform's.

| Attribute     | Property      | Default  | Notes                             |
| ------------- | ------------- | -------- | --------------------------------- |
| `value`       | `value`       | `''`     | The text in the field             |
| `label`       | `label`       | `''`     | Accessible name, also drawn       |
| `hide-label`  | `hideLabel`   | `false`  | Label for screen readers only     |
| `placeholder` | `placeholder` | `''`     | Shown while it is empty           |
| `maxlength`   | `maxlength`   | `0`      | Longest value. `0` is no limit    |
| `type`        | `type`        | `'text'` | `text` · `password`               |
| `uppercase`   | `uppercase`   | `false`  | Folds what is typed to upper case |
| `show-count`  | `showCount`   | `false`  | Shows "3/8". Needs `maxlength`    |
| `disabled`    | `disabled`    | `false`  |                                   |
| `readonly`    | `readonly`    | `false`  |                                   |
| `name`        | `name`        | `''`     | Form field name                   |
| —             | `form`        | —        | Read-only: the form it is in      |

**Methods:** `clear()`, `focus()`.
**Events:** `px-input` as it is typed and `px-input-change` when committed,
both with `detail: { value }`.
**Parts:** `base`, `label`, `field`, `frame`, `input`, `count`.
**CSS properties:** `--px-input-width`.

`uppercase` folds the **value**, not just the drawing of it, so what you read
back is what was on screen. Same for `maxlength`: the value is clipped, not
only the typing.

### `<px-inventory-grid>` and `<px-inventory-slot>`

A bag: a framed grid of cells, driven in two dimensions. Write one
`<px-inventory-slot>` per cell, empty ones included — that way the bag is the
shape it says it is, and an empty slot is a place things can go rather than a
hole in the layout.

| Attribute    | Property     | Default | Notes                                 |
| ------------ | ------------ | ------- | ------------------------------------- |
| `label`      | `label`      | `''`    | Accessible name, also drawn as a head |
| `columns`    | `columns`    | `5`     | Cells across                          |
| `index`      | `index`      | `0`     | The highlighted cell                  |
| `hide-label` | `hideLabel`  | `false` | Keep the heading for screen readers   |
| `flat`       | `flat`       | `false` | Drop the frame                        |
| —            | `slots`      | —       | Read-only: the cells, in order        |
| —            | `activeSlot` | —       | Read-only                             |

Left and right step through the bag in order, up and down jump a whole row,
both wrap. Home and End go to the ends, Enter and Space choose, Escape backs
out. A gamepad drives it the same way while the grid has focus. Like
`<px-menu>`, the grid is one focus stop and reports the highlight through
`aria-activedescendant`.

**Methods:** `select()`, `moveBy(delta)`, `moveToEnd('first' | 'last')`.
**Events:** `px-inventory-active`, `px-inventory-select` — both with
`detail: { index, slot, label }` — and `px-inventory-cancel`.
**Parts:** `base`, `frame`, `label`, `grid`.
**CSS properties:** `--px-inventory-slot-size`.

It's reported as a **listbox** of options rather than a grid: the ARIA grid
pattern wants rows, and a bag hasn't got any — it has a run of cells that
happens to be drawn `columns` wide.

`<px-inventory-slot>` takes `label`, `count` (drawn in the corner above 1) and
`disabled`, with reflected read-only `active` and `empty`. It works out `empty`
for itself from what's slotted into it, and names itself "Potion, 12" or
"Empty slot" for a screen reader, since the art is a picture.

### `<px-keycap>`

A key or a controller button, drawn as the thing itself: "Press [SPACE] to
jump", "[W][A][S][D] to move", a whole remapping screen. A keyboard cap is a
square key with a lit top edge; a gamepad one is the rounded octagon those
buttons actually are.

| Attribute | Property  | Default      | Notes                                |
| --------- | --------- | ------------ | ------------------------------------ |
| `device`  | `device`  | `'keyboard'` | `keyboard` · `gamepad`               |
| `size`    | `size`    | `'sm'`       | `sm` (8px type) · `md` (12px)        |
| `pressed` | `pressed` | `false`      | Draw it held down                    |
| `label`   | `label`   | `''`         | Spells the key out, e.g. "Space bar" |

**Parts:** `base`, `frame`, `label`. **CSS properties:** `--px-keycap-color`.

The legend is marked up as `<kbd>`, so it is read as input rather than as
loose text. It is presentational on purpose: `pressed` is set by the game and
not watched for here, because a decorative element that subscribed to the
gamepad would keep the polling loop running for the whole page — which is
exactly what the "only while focused" rule exists to avoid.

### `<px-marquee>`

Text that scrolls past: end credits, a news crawl, an item name too long for
the slot it's in.

| Attribute   | Property    | Default  | Notes                                |
| ----------- | ----------- | -------- | ------------------------------------ |
| `speed`     | `speed`     | `30`     | **Pixels a second**, not a duration  |
| `direction` | `direction` | `'left'` | `left` · `right`                     |
| `gap`       | `gap`       | `40`     | Pixels between one copy and the next |
| `paused`    | `paused`    | `false`  | Hold it where it is                  |
| `no-pause`  | `noPause`   | `false`  | Keep going under the pointer         |
| —           | `distance`  | —        | Read-only: one lap, in pixels        |
| —           | `duration`  | —        | Read-only: one lap, in ms            |

**Methods:** `play()`, `pause()`, `measure()`.
**Parts:** `base`, `track`. **CSS properties:** `--px-marquee-gap`.

The loop is seamless because the content is there twice — the second copy is
a clone of the first, **hidden from assistive technology** so the words aren't
read out twice — and the track slides exactly one copy's width before
starting over. Speed is in pixels a second rather than a duration, so a long
line and a short one crawl at the same pace instead of one tearing past.

It stops while the pointer is on it, because that's the one thing a reader
wants from a moving line. Under `prefers-reduced-motion` it doesn't move and
the clone is dropped, rather than left sitting there saying everything twice.

### `<px-menu>` and `<px-menu-item>`

A framed list of rows driven by the keyboard, a gamepad or the mouse. The menu
is one focus stop rather than one per row: focus never moves between the rows,
and the highlighted one is reported through `aria-activedescendant`, so a
screen reader reads it as the highlight moves. Call `focus()` when the menu
opens.

| Attribute     | Property      | Default      | Notes                                 |
| ------------- | ------------- | ------------ | ------------------------------------- |
| `label`       | `label`       | `''`         | Accessible name, also drawn as a head |
| `orientation` | `orientation` | `'vertical'` | `vertical` · `horizontal`             |
| `index`       | `index`       | `0`          | The highlighted row                   |
| `no-loop`     | `noLoop`      | `false`      | Stop at the ends instead of wrapping  |
| `hide-label`  | `hideLabel`   | `false`      | Keep the heading for screen readers   |
| `flat`        | `flat`        | `false`      | Drop the frame, for a title screen    |
| —             | `items`       | —            | Read-only: the rows, in order         |
| —             | `activeItem`  | —            | Read-only: the highlighted row        |

| Key              | Gamepad           | Does                                   |
| ---------------- | ----------------- | -------------------------------------- |
| ↑ / ↓ (or ← / →) | D-pad, left stick | Moves the highlight, skipping disabled |
| Home / End       | —                 | Jumps to the first or last usable row  |
| Enter / Space    | A                 | Chooses the highlighted row            |
| Escape           | B                 | Backs out                              |

**Methods:** `select()`, `moveBy(delta)`, `moveToEnd('first' | 'last')`.

**Events:** `px-menu-active` (the highlight moved), `px-menu-select` (a row was
chosen), both with `detail: { value, index, item }`, and `px-menu-cancel`.

**Parts:** `base`, `frame`, `label`, `items`.

Each row is a `<px-menu-item>`:

| Attribute  | Property   | Default | Notes                                    |
| ---------- | ---------- | ------- | ---------------------------------------- |
| `value`    | `value`    | `''`    | What's reported; falls back to the label |
| `disabled` | `disabled` | `false` | Skipped by navigation, can't be chosen   |
| `active`   | `active`   | `false` | Reflected, read-only: set by the menu    |

**Slots:** default (the label), `icon` (before it), `detail` (at the end of the
row, for a setting's current value — it isn't part of the row's value).
**Parts:** `base`, `cursor`, `label`.

### `<px-number>`

A stepper: how many potions to buy, how many to drop, how many lives to start
with. **`<px-slider>` is for a range you sweep through; this is for a count
you land on exactly.**

| Attribute    | Property          | Default | Notes                         |
| ------------ | ----------------- | ------- | ----------------------------- |
| `value`      | `value`           | `0`     | Clamped to `min…max`          |
| `min`        | `min`             | `0`     |                               |
| `max`        | `max`             | `99`    |                               |
| `step`       | `step`            | `1`     | How much a press moves it     |
| `label`      | `label`           | `''`    | Accessible name, also drawn   |
| `hide-label` | `hideLabel`       | `false` | Label for screen readers only |
| `disabled`   | `disabled`        | `false` |                               |
| `name`       | `name`            | `''`    | Form field name               |
| —            | `atMin` / `atMax` | —       | Read-only                     |
| —            | `form`            | —       | Read-only: the form it is in  |

**Methods:** `stepUp()`, `stepDown()`, `focus()`.
**Events:** `px-number-input` and `px-number-change`, with `detail: { value }`.
**Parts:** `base`, `label`, `field`, `frame`, `decrement`, `input`, `increment`.

It wraps a real `<input type="number">`, which the browser reports as a
spinbutton and steps with the up and down arrows on its own. The native
spinner arrows are hidden — they're four pixels tall and nothing like the art
— and replaced with a − and a + big enough to hit, each named after what it
does ("Increase Potions"). The button that would go past an end is disabled.
Clearing the field to type a new number doesn't snap it to the minimum under
the caret; the value is tidied up on commit instead.

### `<px-notice>`

A message that stays put: "no connection", "this save is from an older
version", "autosave is off".

| Attribute     | Property      | Default  | Notes                                    |
| ------------- | ------------- | -------- | ---------------------------------------- |
| `variant`     | `variant`     | `'info'` | `info`, `success`, `warning` or `danger` |
| `heading`     | `heading`     | `''`     | A line above the message                 |
| `live`        | `live`        | `'off'`  | `off`, `polite` or `assertive`           |
| `dismissible` | `dismissible` | `false`  | Add a button that closes it              |
| `open`        | `open`        | `true`   | Reflected                                |
| `no-mark`     | `noMark`      | `false`  | Drop the leading glyph                   |

**Methods:** `dismiss()`, `show()`.
**Events:** `px-notice-dismiss`.
**Slots:** default, `actions`.
**Parts:** `base`, `frame`, `mark`, `heading`, `message`, `close`.
**CSS properties:** `--px-notice-color`.

`<px-toast>` is the other half of this pair, and the difference is whether the
message is still true in ten seconds. A toast reports something that _happened_
— item acquired, game saved — and takes itself away. A notice describes a state
that _holds_, so it sits in the layout and stays until the state changes. If
someone would want to go back and reread it, it is a notice.

That is also why this one has a `warning` variant and the toast does not: a
warning you need to keep looking at has no business vanishing after four
seconds. `--px-color-warning` is gold on the dark theme and a burnt orange on
the light one, and it is the only accent whose brightness flips between the
two, so it carries its own `--px-color-text-on-warning` the way danger does.

**It is not a live region by default**, and that is the deliberate part. A live
region announces when it is inserted or when its text changes, so a notice
rendered with the page would announce nothing anyway — it is read in order like
the rest of the page, which is right. Set `live` only for a notice that arrives
after the page did; `assertive` becomes `role="alert"` and interrupts,
`polite` becomes `role="status"` and waits. The playground builds its result
notice and appends it rather than un-hiding one, because arriving is what makes
a live region speak.

### `<px-panel>`

The framed surface every other component in the kit is drawn on, on its own —
for the screens the kit doesn't cover. A shop, a character sheet, a quest log
is a panel with something in it, and none of them needs a component of its own.

| Attribute    | Property    | Default | Notes                                  |
| ------------ | ----------- | ------- | -------------------------------------- |
| `label`      | `label`     | `''`    | Heading, and the region's name         |
| `hide-label` | `hideLabel` | `false` | Keep the heading for screen readers    |
| `inset`      | `inset`     | `false` | Sink the surface instead of raising it |
| `flat`       | `flat`      | `false` | Drop the frame, keep the padding       |

**Slots:** default, `header` (beside the heading), `footer`.
**Parts:** `base`, `frame`, `header`, `label`, `content`, `footer`.
**CSS properties:** `--px-panel-fill`, `--px-panel-padding`.

With a `label` it becomes a named `group`, so a screen reader can be sent to
it; without one it stays a plain box, because announcing an unnamed region is
just noise. A header or footer with nothing in it collapses, gap and all.

`inset` is what a list or a block of text usually wants to sit in — an inset
panel inside a raised one is how most game screens are put together.

### `<px-progress>`

A progress bar: a loading screen, a cast time, a download. **This is the one
that only goes up** — `<px-health-bar>` is for a resource spent and restored
in play, with segments, a low threshold, a damage trail and events to match.

| Attribute       | Property        | Default | Notes                            |
| --------------- | --------------- | ------- | -------------------------------- |
| `value`         | `value`         | `0`     | Clamped to `0…max`               |
| `max`           | `max`           | `100`   |                                  |
| `label`         | `label`         | `''`    | Accessible name, also drawn      |
| `hide-label`    | `hideLabel`     | `false` | Label for screen readers only    |
| `show-value`    | `showValue`     | `false` | Shows the percentage             |
| `indeterminate` | `indeterminate` | `false` | No number yet: march instead     |
| —               | `ratio`         | —       | Read-only: 0…1                   |
| —               | `percent`       | —       | Read-only: rounded whole percent |

**Parts:** `base`, `label`, `value`, `track`, `fill`.
**CSS properties:** `--px-progress-height`, `--px-progress-color`.

An indeterminate bar drops `aria-valuenow` rather than reporting `0`, which is
how a screen reader is told there is no position yet. Under
`prefers-reduced-motion` it stops marching and stands still as a striped
track, which still reads as "working" without anything moving.

### `<px-rating>`

A row of stars: a weapon's rarity, a level's difficulty, how much the
innkeeper's daughter likes you.

| Attribute     | Property      | Default  | Notes                                           |
| ------------- | ------------- | -------- | ----------------------------------------------- |
| `value`       | `value`       | `0`      | How many are filled                             |
| `max`         | `max`         | `5`      | How many there are                              |
| `shape`       | `shape`       | `'star'` | `star`, `heart` or `diamond`                    |
| `glyph`       | `glyph`       | `''`     | A filled glyph of your own                      |
| `empty-glyph` | `emptyGlyph`  | `''`     | The hollow one to match it                      |
| `readonly`    | `readonly`    | `false`  | Show it without letting anyone change it        |
| `disabled`    | `disabled`    | `false`  |                                                 |
| `label`       | `label`       | `''`     | What is being rated                             |
| `unit`        | `unit`        | `''`     | The word for one of them; defaults from `shape` |
| `unit-plural` | `unitPlural`  | `''`     | The word for more than one                      |
| `allow-zero`  | `allowZero`   | `false`  | Let the row be cleared                          |
| `name`        | `name`        | `''`     | Form field name                                 |
| —             | `min`         | —        | Read-only: `0` with `allow-zero`, else `1`      |
| —             | `interactive` | —        | Read-only: neither readonly nor disabled        |
| —             | `valueText`   | —        | Read-only: e.g. `"3 of 5 stars"`                |
| —             | `form`        | —        | Read-only: the form it is in                    |

**Methods:** `rate(value)`, `nudge(delta)`.
**Events:** `px-rating-change`, with `detail: { value, max }`.
**Parts:** `base`, `item`.
**CSS properties:** `--px-rating-color`, `--px-rating-empty-color`,
`--px-rating-size`.

Two jobs in one element, and which one it is doing matters more than it looks.
`readonly` makes it a picture: `role="img"`, no focus stop, nothing to press,
and the whole reading in its accessible name. Without it the row is a control,
and then it is a **slider** rather than five buttons — one tab stop, arrow keys
to change the value, Home and End for the ends. Five separate focus stops to
say one number is the usual mistake here, and a ten-skull boss makes it ten.

Both shapes of every glyph are drawn, never one shape at two opacities. A faded
star says "maybe"; a hollow one says "not this one", which is the actual
meaning, and it survives a forced-colours mode that flattens opacity. A custom
`glyph` with no `empty-glyph` keeps the shape's hollow one rather than
repeating itself, since two identical glyphs would make a half-full row look
full. Hovering shows what a click would set without changing `aria-valuenow`:
hovering is not choosing.

Whole numbers only. Half stars need a half glyph the pixel grid has no room for
at this size, and a rating nobody can set by keyboard is not worth the
arithmetic. A `value` past the end of the row is pulled back onto it. Zero is
always a legal value to _show_ — `allow-zero` is about whether a person can
clear the row, not about whether a game may display an unrated thing.

The three shapes come from the fallback font, not from Press Start 2P, which is
why they are glyphs you can replace rather than art the kit insists on. The
filled ones take `--px-color-highlight`, not `--px-color-xp`: gold reads on the
dark theme and all but vanishes on the light one, and a star nobody can see is
not a rating.

### `<px-save-slot>`

One row of the save or load screen: who the save belongs to, how far they got,
and how long it took.

| Attribute     | Property         | Default   | Notes                                  |
| ------------- | ---------------- | --------- | -------------------------------------- |
| `slot-number` | `slotNumber`     | `0`       | The number shown, from 1. 0 omits it   |
| `name`        | `name`           | `''`      | Whose save it is                       |
| `level`       | `level`          | `0`       | 0 omits it                             |
| `location`    | `location`       | `''`      |                                        |
| `playtime`    | `playtime`       | `0`       | Seconds played                         |
| `saved`       | `saved`          | `''`      | Free text: the kit formats no dates    |
| `empty`       | `empty`          | `false`   | Reflected                              |
| `selected`    | `selected`       | `false`   | Reflected                              |
| `disabled`    | `disabled`       | `false`   |                                        |
| `empty-text`  | `emptyText`      | `'Empty'` | What an empty slot reads               |
| —             | `clock`          | —         | Read-only: e.g. `"4:12"`               |
| —             | `playtimeText`   | —         | Read-only: e.g. `"4 hours 12 minutes"` |
| —             | `accessibleName` | —         | Read-only: the whole row as a sentence |

**Methods:** `select()`.
**Events:** `px-save-slot-select`, with `detail: { slotNumber, empty }`.
**Slots:** default — a portrait or thumbnail, rendered unsmoothed.
**Parts:** `base`, `frame`, `number`, `art`, `name`, `detail`, `playtime`,
`saved`.
**CSS properties:** `--px-save-slot-art-size`.

The whole row is one button, because that is the thing being chosen. An empty
slot is still a button — you save into it — and only `disabled` takes it out of
the tab order.

The interesting part is its name. Four or five scraps of text drawn in a grid
read fine with eyes and terribly one at a time, so the row composes them into
one sentence: _"Slot 2: Noemi, level 12, Dark Forest, 4 hours 12 minutes"_.
Every drawn copy is hidden, so nothing is said twice, and the playtime is
spelled out in words rather than read as the clock face `4:12`, which a screen
reader says as "four twelve" — a time of day. Fields you leave out drop from
the sentence as well as from the row.

The chosen row carries `aria-current`, not `aria-pressed`. A save slot is not a
toggle you push in and out; `aria-pressed` would have every other row in the
list announcing "not pressed", where `aria-current` says "current" on the one
row it is true of and nothing on the rest.

### `<px-scrollbox>`

A framed box that scrolls: a quest log, an item description, the credits.
Scrolling is native — the wheel, a touch drag, the scrollbar, Page Up and
Down, Home and End all work because nothing here reimplements them. What it
adds is the frame, a scrollbar that matches the kit, and an arrow at whichever
end has more to read.

| Attribute    | Property   | Default | Notes                                     |
| ------------ | ---------- | ------- | ----------------------------------------- |
| `label`      | `label`    | `''`    | The region's accessible name              |
| `flat`       | `flat`     | `false` | Drop the frame, keep the scrolling        |
| `more-above` | —          | —       | Reflected, read-only: more to see upwards |
| `more-below` | —          | —       | Reflected, read-only: more downwards      |
| —            | `atTop`    | —       | Read-only                                 |
| —            | `atBottom` | —       | Read-only                                 |

**Methods:** `scrollToTop()`, `scrollToBottom()`, `measure()`.
**Parts:** `base`, `frame`, `content`, `hint`.
**CSS properties:** `--px-scrollbox-height`.

A region that scrolls has to be reachable by keyboard, so the box is a tab
stop; with a `label` it is a named region a screen reader can be sent to. It
re-measures on scroll, on `slotchange` and through a `ResizeObserver`, so a
log that grows keeps its arrows honest; `measure()` is there for the times
the contents change some other way.

### `<px-segmented>` and `<px-segment>`

A row of choices with all of them on screen: EASY | NORMAL | HARD.

```html
<px-segmented label="Difficulty" value="normal">
  <px-segment value="easy">Easy</px-segment>
  <px-segment value="normal">Normal</px-segment>
  <px-segment value="hard">Hard</px-segment>
</px-segmented>
```

| Attribute    | Property          | Default       | Notes                  |
| ------------ | ----------------- | ------------- | ---------------------- |
| `value`      | `value`           | first segment | The chosen value       |
| `label`      | `label`           | `''`          | Accessible name        |
| `full-width` | `fullWidth`       | `false`       | Stretches to container |
| `disabled`   | `disabled`        | `false`       |                        |
| —            | `segments`        | —             | Read-only              |
| —            | `selectedSegment` | —             | Read-only              |

**Methods:** `select(value)`, `moveBy(delta)`.
**Events:** `px-segmented-change`, with `detail: { value, label, index }`.
**Parts:** `base`, `frame` — and `base`, `label` on `<px-segment>`.
**CSS properties:** `--px-segmented-color`.

It's a **radio group**, so the arrow keys move _and_ choose as they go, and
only the chosen segment is a tab stop — Tab enters the group once and leaves
it rather than walking through every option.

This is the kit's third way to pick one of a few things, and they aren't
interchangeable: `<px-dropdown>` hides the choices until asked, which is right
when there are many; `<px-slider>` is for a range; this is for two to four
options worth showing side by side, which is most of an options screen.

### `<px-slider>`

A chunky slider for volumes and the other options-screen dials. A real
`<input type="range">` sits invisibly over the artwork, so dragging, touch, the
arrow keys, Home, End and Page Up/Down are the platform's own, and screen
readers get a proper slider. A gamepad nudges it by one step with ← and →.

| Attribute    | Property    | Default | Notes                           |
| ------------ | ----------- | ------- | ------------------------------- |
| `value`      | `value`     | `50`    | Clamped to `min…max`            |
| `min`        | `min`       | `0`     |                                 |
| `max`        | `max`       | `100`   |                                 |
| `step`       | `step`      | `1`     |                                 |
| `label`      | `label`     | `''`    | Accessible name, also drawn     |
| `hide-label` | `hideLabel` | `false` | Label for screen readers only   |
| `unit`       | `unit`      | `''`    | Appended to the shown value     |
| `show-value` | `showValue` | `false` | Shows the value after the track |
| `disabled`   | `disabled`  | `false` |                                 |
| —            | `ratio`     | —       | Read-only: position, 0…1        |

**Events:** `px-slider-input` while it moves and `px-slider-change` when the
value is committed, both with `detail: { value }`.

**Parts:** `base`, `label`, `track`, `fill`, `knob`, `value`.
**CSS properties:** `--px-slider-height`, `--px-slider-color`.

### `<px-speech-bubble>`

A pointed bubble for something said out in the world: a shopkeeper calling
after you, a sign, a barked "!" over a guard's head.

| Attribute   | Property    | Default    | Notes                             |
| ----------- | ----------- | ---------- | --------------------------------- |
| `placement` | `placement` | `'bottom'` | Which side the tail leaves from   |
| `align`     | `align`     | `'center'` | `start` · `center` · `end`        |
| `speaker`   | `speaker`   | `''`       | Shown above the words when set    |
| `no-tail`   | `noTail`    | `false`    | A plain framed bubble, no pointer |

**Parts:** `base`, `frame`, `speaker`, `tail`.
**CSS properties:** `--px-speech-bubble-max-width`.

This is the _other_ kind of dialogue. `<px-dialogue-box>` is the panel at the
bottom of the screen that types a conversation out, with a portrait and an
advance arrow. This one points at whoever is talking, says its piece and goes
— no typing, no portrait, no advance. Put it where you want it; it doesn't
follow anything on its own. A bubble floating **above** a character has
`placement="bottom"`, because that's the side the tail comes out of.

### `<px-spinner>`

A small marker that something is happening: a button waiting on the server, a
slot loading, a corner of the HUD saving in the background.

| Attribute    | Property    | Default     | Notes                                    |
| ------------ | ----------- | ----------- | ---------------------------------------- |
| `label`      | `label`     | `'Loading'` | What is being waited for                 |
| `show-label` | `showLabel` | `false`     | Draw it beside the ring as well          |
| `duration`   | `duration`  | `800`       | One turn of the ring, in ms              |
| `quiet`      | `quiet`     | `false`     | Say nothing: already announced elsewhere |

**Parts:** `base`, `ring`, `block`, `label`.
**CSS properties:** `--px-spinner-size`, `--px-spinner-color`.

`<px-progress indeterminate>` is the other way to say "working", and the
difference is room. A bar wants a line of its own and a label above it; this
fits beside a word. Neither knows how far along it is — reach for the bar when
the wait owns the screen, and for this when it does not.

The ring is eight blocks on a three-by-three grid with the middle left out,
lit one at a time. Nothing rotates, which is the only way a ring of pixels
turns without going soft at the corners: the eight animation delays are one
step apart over a turn, and all of them negative, so the ring is already
turning on its first frame instead of lighting up block by block from a
standstill.

A spinner is a live region, and **a live region is read by its contents, not by
its accessible name** — so the label is real text inside it rather than an
`aria-label`, which would announce nothing at all. It is announced once when
the spinner appears, which is what you want: a wait that says "loading" every
frame is unusable. `aria-busy` goes on the host, because the thing that is busy
is whatever the spinner is standing in for.

Under `prefers-reduced-motion` the ring stops and stands still with every block
lit, which still reads as "working" with nothing moving — the same move
`<px-progress>` makes with its marching stripes.

### `<px-sprite>`

A sprite sheet played back as an animation: an idle character on a save slot,
a coin that spins, a torch that flickers in a menu.

| Attribute      | Property      | Default | Notes                                |
| -------------- | ------------- | ------- | ------------------------------------ |
| `src`          | `src`         | `''`    | The sheet                            |
| `frame-width`  | `frameWidth`  | `16`    | One frame's width in the sheet       |
| `frame-height` | `frameHeight` | `16`    | One frame's height in the sheet      |
| `frames`       | `frames`      | `1`     | How many frames in the row           |
| `row`          | `row`         | `0`     | Which row to play, from 0            |
| `fps`          | `fps`         | `8`     | Frames a second                      |
| `scale`        | `scale`       | `1`     | Drawn this many times its size       |
| `paused`       | `paused`      | `false` | Hold on the current frame            |
| `once`         | `once`        | `false` | Play through once instead of loop    |
| `label`        | `label`       | `''`    | What it shows; unnamed is decoration |
| —              | `duration`    | —       | Read-only: one loop, in ms           |

**Methods:** `play()`, `pause()`. **Parts:** `base`.

Playback is **one CSS animation** stepping `background-position` across the
sheet — no timer and no frame loop, so there's nothing for a hidden tab to
throttle out of step. `steps(n)` is what makes it land on whole frames rather
than sliding between them.

`scale` sizes the artwork rather than applying a transform, so the element
really occupies the room it draws in — a transform would leave its box at
one-times size and everything beside it laid out around a sprite that isn't
there. Under `prefers-reduced-motion` it shows the first frame and stays.

### `<px-tabs>`, `<px-tab>` and `<px-tab-panel>`

A tab strip and the panels behind it. Tabs and panels are both children of
`<px-tabs>` — that's what lets `aria-controls` and `aria-labelledby` reach each
other, which they couldn't across a shadow root. A tab finds its panel by
`panel="name"`, or by position when it doesn't say. A `<px-tab>` with no `slot`
puts itself in the strip, so the markup stays short.

```html
<px-tabs>
  <px-tab panel="items">Items</px-tab>
  <px-tab panel="gear">Gear</px-tab>

  <px-tab-panel name="items">Potion ×12</px-tab-panel>
  <px-tab-panel name="gear">Rusty Sword</px-tab-panel>
</px-tabs>
```

| Attribute     | Property      | Default        | Notes                     |
| ------------- | ------------- | -------------- | ------------------------- |
| `orientation` | `orientation` | `'horizontal'` | `horizontal` · `vertical` |
| `index`       | `index`       | `0`            | The selected tab          |
| —             | `tabs`        | —              | Read-only                 |
| —             | `panels`      | —              | Read-only                 |
| —             | `activeTab`   | —              | Read-only                 |
| —             | `activePanel` | —              | Read-only                 |

Arrow keys move along the strip and select as they go, Home and End jump to the
ends, disabled tabs are stepped over. Only the selected tab is a tab stop, so
Tab leaves the strip rather than walking through it.

**Methods:** `show(panel)` by name, `select(index)`, `moveBy(delta)`.
**Events:** `px-tab-change`, with `detail: { name, index, tab }`.
**Parts:** `base`, `nav`, `body` — and `base`/`label` on `<px-tab>`, `base` on
`<px-tab-panel>`.

`<px-tab>` takes `panel`, `disabled` and a reflected read-only `selected`, and
slots a label plus an `icon`. `<px-tab-panel>` takes `name` and a reflected
read-only `active`; a hidden panel is `display: none`, so nothing in it is
tabbed into or read out.

### `<px-timer>`

A clock: a countdown on a timed level, a speedrun split, a boss timer.

| Attribute   | Property    | Default  | Notes                                       |
| ----------- | ----------- | -------- | ------------------------------------------- |
| `value`     | `value`     | `60`     | Seconds on the clock                        |
| `running`   | `running`   | `false`  | Reflected. `start()` / `pause()` set it     |
| `direction` | `direction` | `'down'` | `down` · `up`                               |
| `warn-at`   | `warnAt`    | `10`     | Seconds at which it turns urgent. 0 = never |
| `label`     | `label`     | `''`     | What the clock is for                       |
| `warning`   | `warning`   | —        | Reflected, read-only                        |
| —           | `seconds`   | —        | Read-only: whole seconds, never below 0     |
| —           | `formatted` | —        | Read-only: `M:SS`, or `H:MM:SS`             |

**Methods:** `start()`, `pause()`, `reset(seconds?)`.
**Events:** `px-timer-tick`, `px-timer-warn` and `px-timer-end`, with
`detail: { value }`. **Parts:** `base`. **CSS properties:** `--px-timer-color`.

It keeps time by remembering when it started and reading the real clock, not
by counting ticks — a backgrounded tab throttles timers, and a counted clock
would quietly fall behind. It polls faster than a second so a late poll never
shows a skipped number.

A timer that reads itself out every second is unusable, so the digits are not
a live region. It announces two things instead: when it crosses `warn-at`, and
when it runs out.

### `<px-toast>` and `<px-toast-stack>`

Notifications: "Item acquired!", "Game saved", "You died". A toast dismisses
itself after `duration` and holds still while the pointer or the keyboard is on
it, so a message can't vanish mid-read. A thin bar drains along the bottom to
show the time left.

A toast is for something that _happened_. `<px-notice>` is for a state that
_holds_ — if someone would want to go back and reread it, it belongs there.

The stack is what a game actually talks to:

```js
const toasts = document.querySelector('px-toast-stack');
toasts.toast('Item acquired: Rusty Sword', { variant: 'success' });
```

| Attribute  | Property   | Default  | Notes                                   |
| ---------- | ---------- | -------- | --------------------------------------- |
| `open`     | `open`     | `false`  | Reflected. `show()` / `hide()` set it   |
| `variant`  | `variant`  | `'info'` | `info` · `success` · `danger`           |
| `duration` | `duration` | `4000`   | Milliseconds. `0` stays until dismissed |
| `no-close` | `noClose`  | `false`  | Drop the dismiss button                 |

**Events:** `px-toast-show` and `px-toast-hide`.
**Slots:** default (the message), `icon`.
**Parts:** `base`, `frame`, `message`, `close`, `timer`.
**CSS properties:** `--px-toast-color`.

A `danger` toast is reported as an `alert` and interrupts a screen reader; the
other two are a polite `status` and wait their turn.

`<px-toast-stack>` takes `placement` (`top-left` · `top` · `top-right` ·
`bottom-left` · `bottom` · `bottom-right`, default `bottom-right`) and `max`
(default 5; `0` for no limit — the oldest goes early once the limit is hit). Its
`toast(message, options)` creates, shows and then throws away a `<px-toast>`,
so nothing piles up in the DOM; `clear()` takes them all off screen. The stack
doesn't catch the pointer, only the toasts in it do, so it can sit over the game
without swallowing clicks.

### `<px-toggle>`

The settings-row kind of switch: a label, then a two-position track reading ON
or OFF. (`<px-button toggle>` is the other kind — a button that stays pushed
in, and `<px-checkbox>` is the one for an answer submitted later.) It wraps a
real `<button role="switch">`, and inside a `<form>` it submits its `value`
while on and nothing while off, like a checkbox.

| Attribute    | Property    | Default | Notes                         |
| ------------ | ----------- | ------- | ----------------------------- |
| `checked`    | `checked`   | `false` | Reflected                     |
| `disabled`   | `disabled`  | `false` |                               |
| `label`      | `label`     | `''`    | Accessible name, also drawn   |
| `hide-label` | `hideLabel` | `false` | Label for screen readers only |
| `name`       | `name`      | `''`    | Form field name               |
| `value`      | `value`     | `'on'`  | Submitted while it is on      |
| —            | `form`      | —       | Read-only: the form it is in  |

**Events:** `px-toggle-change`, with `detail: { checked }`.

**Parts:** `base`, `label`, `track`, `knob`, `state`.
**CSS properties:** `--px-toggle-color`.

### `<px-tooltip>`

Wraps whatever it describes. It shows on hover after `delay`, at once on
keyboard focus, and goes away on Escape — so it's reachable without a mouse.

| Attribute   | Property    | Default | Notes                                 |
| ----------- | ----------- | ------- | ------------------------------------- |
| `text`      | `text`      | `''`    | What it says                          |
| `placement` | `placement` | `'top'` | `top` · `bottom` · `left` · `right`   |
| `open`      | `open`      | `false` | Reflected. `show()` / `hide()` too    |
| `disabled`  | `disabled`  | `false` | Stops it showing at all               |
| `delay`     | `delay`     | `0`     | Milliseconds of hover before it shows |

**Events:** `px-tooltip-show`, `px-tooltip-hide`.
**Parts:** `base`. **CSS properties:** `--px-tooltip-max-width`.

The bubble is positioned with plain CSS and does **not** flip away from the edge
of the window: `placement` is a decision, not a hint. Pick the side with room,
or reach for a positioning library if you need collision handling.

Because nothing outside a shadow root can point into it, the tooltip adds one
hidden `<span>` of its own among its children and points the trigger's
`aria-describedby` at that — `aria-describedby` reads a hidden element quite
happily. Both the span and the trigger live inside the `<px-tooltip>`, so
nothing is touched that you didn't hand over. The drawn bubble is hidden from
assistive technology, which reads the span instead, once, open or not.

## Gamepad support

The Gamepad API has no events — a page has to poll it — so the kit runs one
animation-frame loop for every component that wants a controller, and only
while something is listening. It turns buttons and the left stick into six
actions: `up`, `down`, `left`, `right`, `confirm` (A) and `cancel` (B). The
four directions repeat while held.

`<px-menu>`, `<px-inventory-grid>` and `<px-slider>` subscribe **while they have
focus** and drop the subscription when they lose it, so two menus on one page
never both move. A game that opens a menu should call `menu.focus()`.

The same loop is available for a game's own use:

```js
import { gamepadSupported, onGamepadAction } from '@noncsi/pixel-ui';

const stop = onGamepadAction((action) => {
  if (action === 'cancel') closePauseScreen();
});
```

## Using it in a framework

- **React 19:** `<px-health-bar value={hp} onpx-low={...} />` works directly.
  For React 18, wrap components with `@lit/react`.
- **Angular:** add `CUSTOM_ELEMENTS_SCHEMA`, then
  `<px-health-bar [value]="hp" (px-low)="onLow()">`.
- **Vue:** `compilerOptions.isCustomElement: (tag) => tag.startsWith('px-')`.

## Roadmap

- [x] Tokens, health bar, button, dialogue box, Storybook
- [x] Menu with keyboard and gamepad navigation
- [x] Toggle and slider
- [x] Tooltip, toast, tabs
- [x] Inventory grid, dropdown, modal dialog
- [x] Panel, text input, progress bar
- [x] Keycap, segmented control, scrollbox
- [x] Stepper, badge, rolling counter
- [x] Avatar, timer, sprite-sheet player
- [x] Divider, speech bubble, marquee
- [x] Checkbox, collapsible section, rating
- [x] Spinner, inline notice, save slot
- [x] Character creator, with its own pixel art
- [x] A showcase site of finished screens, with a test that keeps it honest
- [ ] Showcase and Storybook deployed to GitHub Pages
- [ ] Published to npm with a changelog
- [ ] Used in a real game
