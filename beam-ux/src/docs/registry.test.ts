import { createRegistryIndex } from '@schemastud/registry';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    CHROME_LAYOUTS_ROOT,
    CHROME_TEMPLATES_ROOT,
    chromeRegistries,
    clearChromeRegistry,
    layoutRegistrant,
    registerChrome,
    registerLayout,
    registerTemplate,
    registeredChromeNames,
    resolveLayout,
    resolveTemplate,
    templateRegistrant,
} from './registry.js';
import { BUILTIN_LAYOUTS, BUILTIN_TEMPLATES } from './builtins.js';
import { ProseTemplate } from './templates.js';
import type { ChromeComponent } from './types.js';

/**
 * registry-kernel-ts 07: the chrome registry on `@schemastud/registry`. What a caller of the exported
 * functions sees; `chrome.test.tsx` holds the cases that predate the kernel and is unchanged.
 */

const component = (): ChromeComponent => () => null;

beforeEach(() => clearChromeRegistry());

describe('a chrome name', () => {
    it('round-trips as it was registered, PascalCase included', () => {
        const DocsLayout = component();
        registerLayout('DocsLayout', DocsLayout);

        expect(resolveLayout('DocsLayout')).toBe(DocsLayout);
        expect(registeredChromeNames().layouts).toEqual(['DocsLayout']);
        // Names are not folded: a different spelling is a different name, as it was in a Map.
        expect(resolveLayout('docslayout')).toBeNull();
        expect(resolveLayout('Docslayout')).toBeNull();
    });

    it.each(['Admin/Users', 'two words', 'kebab-case', 'dotted.name', 'Dotted.Name', 'snake_case'])(
        'carries %j in and out unchanged',
        (name) => {
            const Layout = component();
            registerLayout(name, Layout);

            expect(resolveLayout(name)).toBe(Layout);
            expect(registeredChromeNames().layouts).toEqual([name]);
        },
    );

    it('has an address under its registry root', () => {
        registerLayout('DocsLayout', component());
        registerTemplate('WideTemplate', component());
        const { layouts, templates } = chromeRegistries();

        expect(layouts.keys().map((key) => key.display)).toEqual([`${CHROME_LAYOUTS_ROOT}.DocsLayout`]);
        expect(templates.keys().map((key) => key.display)).toEqual([`${CHROME_TEMPLATES_ROOT}.WideTemplate`]);
    });

    it('answers null for a name that is only the front of registered names', () => {
        // A Map answered undefined here. The kernel's tryResolve would throw (a branch is ambiguous).
        registerLayout('docs.wide', component());
        registerLayout('docs.narrow', component());

        expect(resolveLayout('docs')).toBeNull();
    });
});

describe('a name that spells the registry root', () => {
    it('is its own name, distinct from the short one', () => {
        const Long = component();
        const Short = component();
        registerLayout(`${CHROME_LAYOUTS_ROOT}.x`, Long, 'pkg/long');
        registerLayout('x', Short, 'pkg/short');

        expect(resolveLayout(`${CHROME_LAYOUTS_ROOT}.x`)).toBe(Long);
        expect(resolveLayout('x')).toBe(Short);
        expect(layoutRegistrant(`${CHROME_LAYOUTS_ROOT}.x`)).toBe('pkg/long');
        expect(layoutRegistrant('x')).toBe('pkg/short');
        expect(registeredChromeNames().layouts).toEqual([`${CHROME_LAYOUTS_ROOT}.x`, 'x']);
    });

    it('does not answer for the short name when only the long one is registered, or the reverse', () => {
        registerLayout(`${CHROME_LAYOUTS_ROOT}.x`, component());
        registerTemplate('y', component());

        expect(resolveLayout('x')).toBeNull();
        expect(resolveTemplate(`${CHROME_TEMPLATES_ROOT}.y`)).toBeNull();
    });

    it('holds the root itself as a name distinct from the empty string', () => {
        const Root = component();
        const Empty = component();
        registerLayout(CHROME_LAYOUTS_ROOT, Root, 'pkg/root');
        registerLayout('', Empty, 'pkg/empty');

        expect(resolveLayout(CHROME_LAYOUTS_ROOT)).toBe(Root);
        expect(layoutRegistrant(CHROME_LAYOUTS_ROOT)).toBe('pkg/root');
        expect(layoutRegistrant('')).toBe('pkg/empty');
        expect(registeredChromeNames().layouts).toEqual([CHROME_LAYOUTS_ROOT, '']);
    });
});

describe('against the two maps it replaced', () => {
    // The module as it was before the kernel: two Maps, a bare set, builtins read after a miss.
    function maps() {
        const layouts = new Map<string, ChromeComponent>();
        const templates = new Map<string, ChromeComponent>();

        return {
            registerLayout: (name: string, c: ChromeComponent) => void layouts.set(name, c),
            registerTemplate: (name: string, c: ChromeComponent) => void templates.set(name, c),
            resolveLayout: (name: string) => (name ? (layouts.get(name) ?? BUILTIN_LAYOUTS[name] ?? null) : null),
            resolveTemplate: (name: string) => (name ? (templates.get(name) ?? BUILTIN_TEMPLATES[name] ?? null) : null),
            names: () => ({
                layouts: [...new Set([...Object.keys(BUILTIN_LAYOUTS), ...layouts.keys()])],
                templates: [...new Set([...Object.keys(BUILTIN_TEMPLATES), ...templates.keys()])],
            }),
        };
    }

    const NAMES = [
        'DocsLayout', 'docslayout', 'ProseTemplate', 'SpreadTemplate', 'x', 'home', 'docs', 'docs.wide', 'docs.wide.deep',
        'Admin/Users', 'two words', ' padded ', 'kebab-case', 'snake_case', 'a:b', 'Dotted.Name', '.lead', 'trail.', 'a..b',
        '', '.', 'beam', 'beam.ux', 'beam.ux.chrome', 'layouts', 'templates', 'layouts.x', 'templates.x',
        CHROME_LAYOUTS_ROOT, `${CHROME_LAYOUTS_ROOT}.x`, `${CHROME_LAYOUTS_ROOT}.x.y`, `${CHROME_LAYOUTS_ROOT}.DocsLayout`,
        `${CHROME_LAYOUTS_ROOT}.`, `${CHROME_LAYOUTS_ROOT}.${CHROME_LAYOUTS_ROOT}`,
        CHROME_TEMPLATES_ROOT, `${CHROME_TEMPLATES_ROOT}.x`, `${CHROME_TEMPLATES_ROOT}.x.y`, `${CHROME_TEMPLATES_ROOT}.ProseTemplate`,
        'toString', 'constructor', '__proto__', 'hasOwnProperty',
    ];

    it('answers every read as the maps did, after every registration, for every name', () => {
        const model = maps();
        const differences: string[] = [];
        const compare = (step: string) => {
            for (const name of NAMES) {
                if (resolveLayout(name) !== model.resolveLayout(name)) differences.push(`${step}: resolveLayout(${JSON.stringify(name)})`);
                if (resolveTemplate(name) !== model.resolveTemplate(name)) differences.push(`${step}: resolveTemplate(${JSON.stringify(name)})`);
            }
            if (JSON.stringify(registeredChromeNames()) !== JSON.stringify(model.names())) differences.push(`${step}: registeredChromeNames()`);
        };

        compare('empty');
        // Each name into layouts, then each into templates in reverse, then every third again (an override).
        for (const name of NAMES) {
            const c = component();
            registerLayout(name, c);
            model.registerLayout(name, c);
            compare(`layout ${JSON.stringify(name)}`);
        }
        for (const name of [...NAMES].reverse()) {
            const c = component();
            registerTemplate(name, c);
            model.registerTemplate(name, c);
            compare(`template ${JSON.stringify(name)}`);
        }
        for (const name of NAMES.filter((_, i) => i % 3 === 0)) {
            const c = component();
            registerLayout(name, c);
            model.registerLayout(name, c);
            registerTemplate(name, c);
            model.registerTemplate(name, c);
            compare(`override ${JSON.stringify(name)}`);
        }

        expect(differences).toEqual([]);
        expect(registeredChromeNames().layouts).toHaveLength(NAMES.length);
    });
});

describe('layouts and templates', () => {
    it('miss in each other, whichever side the name is registered on', () => {
        const Shared = component();
        registerLayout('DocsLayout', Shared);

        expect(resolveTemplate('DocsLayout')).toBeNull();
        expect(templateRegistrant('DocsLayout')).toBeNull();
        expect(registeredChromeNames().templates).not.toContain('DocsLayout');
    });

    it('hold one name each without colliding', () => {
        const AsLayout = component();
        const AsTemplate = component();
        registerLayout('Shared', AsLayout, 'pkg/layout');
        registerTemplate('Shared', AsTemplate, 'pkg/template');

        expect(resolveLayout('Shared')).toBe(AsLayout);
        expect(resolveTemplate('Shared')).toBe(AsTemplate);
        expect(layoutRegistrant('Shared')).toBe('pkg/layout');
        expect(templateRegistrant('Shared')).toBe('pkg/template');
    });

    it('are routed apart by a registry index', () => {
        registerLayout('Shared', component());
        registerTemplate('Shared', component());
        const { layouts, templates } = chromeRegistries();
        const index = createRegistryIndex().describe(layouts, '@splicewire/beam-ux').describe(templates, '@splicewire/beam-ux');

        expect(index.routeTo(layouts.keyFor('Shared'))).toBe(layouts);
        expect(index.routeTo(templates.keyFor('Shared'))).toBe(templates);
    });
});

describe('a registrant', () => {
    it('is read back for a layout and a template', () => {
        registerLayout('DocsLayout', component(), '@splicewire/beam-docs');
        registerTemplate('WideTemplate', component(), 'app/host');

        expect(layoutRegistrant('DocsLayout')).toBe('@splicewire/beam-docs');
        expect(templateRegistrant('WideTemplate')).toBe('app/host');
    });

    it('is recorded on every name registerChrome is given', () => {
        registerChrome({ layouts: { A: component(), B: component() }, templates: { T: component() } }, 'app/host');

        expect(layoutRegistrant('A')).toBe('app/host');
        expect(layoutRegistrant('B')).toBe('app/host');
        expect(templateRegistrant('T')).toBe('app/host');
    });

    it('is null when the registrant given is not a string', () => {
        registerLayout('Odd', component(), 42 as never);

        expect(layoutRegistrant('Odd')).toBeNull();
    });

    it('is null when nobody was named, when the name is unregistered and for a packaged builtin', () => {
        registerLayout('Anonymous', component());
        registerChrome({ templates: { AlsoAnonymous: component() } });

        expect(layoutRegistrant('Anonymous')).toBeNull();
        expect(templateRegistrant('AlsoAnonymous')).toBeNull();
        expect(layoutRegistrant('NeverRegistered')).toBeNull();
        // ProseTemplate resolves, from builtins.ts, and nobody registered it.
        expect(resolveTemplate('ProseTemplate')).toBe(ProseTemplate);
        expect(templateRegistrant('ProseTemplate')).toBeNull();
    });
});

describe('registering a taken name (Supersede)', () => {
    it('replaces the component and names the later registrant', () => {
        const Packaged = component();
        const Host = component();
        registerLayout('DocsLayout', Packaged, '@splicewire/beam-docs');
        registerLayout('DocsLayout', Host, 'app/host');

        expect(resolveLayout('DocsLayout')).toBe(Host);
        expect(layoutRegistrant('DocsLayout')).toBe('app/host');
    });

    it('records what was displaced, with both registrants', () => {
        const Packaged = component();
        registerLayout('DocsLayout', Packaged, '@splicewire/beam-docs');
        registerLayout('DocsLayout', component(), 'app/host');
        const { layouts } = chromeRegistries();

        expect(layouts.superseded(layouts.keyFor('DocsLayout'))).toMatchObject([
            { entry: Packaged, by: '@splicewire/beam-docs', supersededBy: 'app/host' },
        ]);
    });

    it('keeps the enumeration order', () => {
        registerChrome({ layouts: { First: component(), Second: component(), Third: component() } });
        registerLayout('Second', component());
        registerLayout('First', component());

        expect(registeredChromeNames().layouts).toEqual(['First', 'Second', 'Third']);
    });

    it('lists a builtin once, in its packaged place, when a host registers over it', () => {
        const HostProse = component();
        registerTemplate('HostTemplate', component());
        registerTemplate('ProseTemplate', HostProse, 'app/host');

        expect(resolveTemplate('ProseTemplate')).toBe(HostProse);
        expect(templateRegistrant('ProseTemplate')).toBe('app/host');
        expect(registeredChromeNames().templates).toEqual(['ProseTemplate', 'SpreadTemplate', 'HostTemplate']);
    });
});

describe('clearChromeRegistry', () => {
    it('empties both registries and leaves the builtins', () => {
        registerLayout('DocsLayout', component(), 'app/host');
        registerTemplate('WideTemplate', component(), 'app/host');
        clearChromeRegistry();

        expect(resolveLayout('DocsLayout')).toBeNull();
        expect(resolveTemplate('WideTemplate')).toBeNull();
        expect(layoutRegistrant('DocsLayout')).toBeNull();
        expect(templateRegistrant('WideTemplate')).toBeNull();
        expect(registeredChromeNames()).toEqual({ layouts: [], templates: ['ProseTemplate', 'SpreadTemplate'] });
        expect(chromeRegistries().layouts.keys()).toEqual([]);
        expect(chromeRegistries().templates.keys()).toEqual([]);
    });

    it('forgets what was superseded and takes registrations again', () => {
        registerLayout('DocsLayout', component(), 'first');
        registerLayout('DocsLayout', component(), 'second');
        clearChromeRegistry();
        const Again = component();
        registerLayout('DocsLayout', Again, 'third');
        const { layouts } = chromeRegistries();

        expect(resolveLayout('DocsLayout')).toBe(Again);
        expect(layouts.superseded(layouts.keyFor('DocsLayout'))).toEqual([]);
    });
});
