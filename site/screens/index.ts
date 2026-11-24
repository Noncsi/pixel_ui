import { create } from './create.js';
import { dialogue } from './dialogue.js';
import { explore } from './explore.js';
import { load } from './load.js';
import { settings } from './settings.js';
import { shop } from './shop.js';
import { title } from './title.js';
import type { Screen } from './types.js';

/** In the order a game would meet them. */
export const SCREENS: readonly Screen[] = [title, create, load, dialogue, explore, shop, settings];

export type { Screen } from './types.js';
