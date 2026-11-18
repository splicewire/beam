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
