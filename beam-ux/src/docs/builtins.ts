import { ProseTemplate, SpreadTemplate } from './templates.js';
import type { ChromeComponent } from './types.js';

/** Generic chrome defaults. Capability packages register their layouts explicitly. */
export const BUILTIN_LAYOUTS: Record<string, ChromeComponent> = {};

export const BUILTIN_TEMPLATES: Record<string, ChromeComponent> = { ProseTemplate, SpreadTemplate };
