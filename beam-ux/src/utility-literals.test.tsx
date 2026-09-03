import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { SidebarProvider, TooltipProvider } from '@schemastud/ui';
import { describe, expect, it } from 'vitest';
import { RegionBlock } from './RegionCanvas';
import { RegionOverlay } from './RegionOverlay';
import { StructurePanel } from './StructurePanel';
import { UX_BUILDER_CSS } from './css';
import { AccountShell } from './account/AccountShell';
import { ACCOUNT_SHELL_CSS } from './account/css';
import { RealmNav, SIDEBAR_ACTIVE_FG } from './nav/RealmNav';
import { REALM_NAV_CSS } from './nav/css';
import type { Region, TreeNode } from './types';

/**
 * beam-docs-satellite 62. Sixteen Tailwind utility literals lived in this package's RUNTIME dist and
 * rendered only at a host whose Tailwind happened to scan `node_modules/@splicewire/beam-ux/dist` —
 * correct markup, no rule behind the class, HTTP 200. `src/docs/css.ts` already records the policy
 * (an injected `<style>` string, because the package ships no `.css` and is `sideEffects: false`);
 * these are the sixteen that lived past it. Each now comes from a sheet the component itself renders,
 * and this file is what stops the seventeenth: the list below is the measured set, and a runtime
 * source that grows one of them back fails here rather than at the next host.
 */
const LEAKED = [
    '-top-2.5',
    'bg-gradient-to-t',
    'hover:ring-1',
    'md:inline',
    'opacity-100',
    'right-6',
    'shadow-2xl',
    'to-transparent',
    'lg:grid-cols-[minmax(0,1fr)_300px]',
    'lg:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]',
    'tracking-[0.1em]',
    'size-[17px]',
    'text-[var(--sidebar-active-foreground,var(--sidebar-foreground))]',
    'hover:text-[var(--sidebar-active-foreground,var(--sidebar-foreground))]',
    'gap-y-0.5',
    'group-data-[collapsible=icon]:hidden',
];

const SRC = path.dirname(fileURLToPath(import.meta.url));

function runtimeSources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const file = path.join(dir, name);
        if (statSync(file).isDirectory()) return runtimeSources(file);
        if (!/\.tsx?$/.test(name)) return [];
        if (/\.(test|stories)\.tsx?$/.test(name) || /story-(fixtures|harness)/.test(name)) return [];
        return [file];
    });
}

const escape = (literal: string) => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('utility literals do not depend on the host scanning this package', () => {
    it('no runtime source carries one of the sixteen as a class token', () => {
        const found: string[] = [];
        for (const file of runtimeSources(SRC)) {
            // Prose may name a utility (the sheets' docblocks do, deliberately); a class token cannot
            // live in a comment, so comments are stripped before the match.
            const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
            for (const literal of LEAKED) {
                if (new RegExp(`(^|[\\s'"\`])${escape(literal)}([\\s'"\`]|$)`, 'm').test(text)) {
                    found.push(`${path.relative(SRC, file)}: ${literal}`);
                }
            }
        }
        expect(found).toEqual([]);
    });

    it('every injected sheet is token-only — no hex, colours only through a host custom property', () => {
        for (const sheet of [UX_BUILDER_CSS, REALM_NAV_CSS, ACCOUNT_SHELL_CSS]) {
            expect(sheet).not.toMatch(/#[0-9a-f]{3,8}\b/i);
            const colours = sheet.match(/(?:color|background(?:-image)?|box-shadow):[^;]+/g) ?? [];
            for (const declaration of colours) {
                // `rgb(0 0 0 / …)` is the one literal a shadow may carry — Tailwind's own shadow ink.
                const outside = declaration.replace(/var\(--[a-z-]+[^)]*\)/g, '').replace(/rgb\(0 0 0 \/ [\d.]+\)/g, '');
                expect(outside, declaration).not.toMatch(/\b(rgb|hsl|oklch|oklab)\(/);
            }
        }
    });
});

const region: Region = {
    id: 'roster',
    label: 'Roster',
    kind: 'frame',
    recordId: '0193b1e0-frame-0000-0000-000000000003',
    recordLabel: 'frame:enrollment',
    note: 'self-loading',
};

describe('the builder chrome renders its own sheet', () => {
    it('RegionOverlay: the floating panel shadow comes from the sheet', () => {
        const { container } = render(
            <RegionOverlay region={region} schema={null} body={{}} onChange={() => {}} onSave={() => {}} onClose={() => {}} />,
        );
        expect(container.querySelector('style')?.textContent).toBe(UX_BUILDER_CSS);
        expect(container.querySelector('.beam-ux-overlay')).not.toBeNull();
        expect(UX_BUILDER_CSS).toMatch(/\.beam-ux-overlay\s*\{[^}]*box-shadow/);
    });

    it('RegionBlock: the engage tab, its hover reveal and the hover ring come from the sheet', () => {
        const { container } = render(<RegionBlock region={region} engaged={false} onEngage={() => {}} />);
        expect(container.querySelector('style')?.textContent).toBe(UX_BUILDER_CSS);
        const block = container.querySelector('.beam-ux-region');
        expect(block).not.toBeNull();
        expect(block?.getAttribute('data-engaged')).toBeNull();
        expect(container.querySelector('.beam-ux-region-tab')).not.toBeNull();
        expect(UX_BUILDER_CSS).toMatch(/\.beam-ux-region-tab\s*\{[^}]*top:\s*-0\.625rem/);
        expect(UX_BUILDER_CSS).toMatch(/\.beam-ux-region:hover\s+\.beam-ux-region-tab/);
        expect(UX_BUILDER_CSS).toMatch(/\.beam-ux-region:not\(\[data-engaged\]\):hover\s*\{[^}]*box-shadow/);

        const engaged = render(<RegionBlock region={region} engaged onEngage={() => {}} />);
        expect(engaged.container.querySelector('.beam-ux-region')?.getAttribute('data-engaged')).toBe('');
    });

    it('StructurePanel: the two-column geometry is a sheet rule with a host-tunable aside width', () => {
        const pageTree: TreeNode = { id: 'layout', label: 'AppLayout', kind: 'layout', children: [] };
        const { container } = render(
            <StructurePanel pageTree={pageTree} palette={[]} selected={null} selectedRegion={null} onSelect={() => {}} renderEditor={() => null} />,
        );
        expect(container.querySelector('style')?.textContent).toBe(UX_BUILDER_CSS);
        expect(container.querySelector('.beam-ux-structure-grid')).not.toBeNull();
        expect(UX_BUILDER_CSS).toMatch(/@media \(min-width: 64rem\)[^}]*\.beam-ux-structure-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, ?1fr\) var\(--beam-ux-structure-aside, ?300px\)/);
        expect(UX_BUILDER_CSS).toMatch(/\.beam-ux-inspector-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, ?1fr\) minmax\(var\(--beam-ux-inspector-min, ?360px\), ?var\(--beam-ux-inspector-max, ?400px\)\)/);
        expect(UX_BUILDER_CSS).toMatch(/\.beam-ux-overlay-dock\s*\{[^}]*right:\s*var\(--beam-ux-overlay-inset, ?1\.5rem\)/);
        expect(UX_BUILDER_CSS).toMatch(/\.beam-ux-mode-hint\s*\{\s*display:\s*none/);
    });
});

describe('RealmNav renders its own sheet', () => {
    it('the group label tracking, icon size and active colour are sheet rules keyed by data-active', () => {
        const items = [
            { kind: 'nav/section', title: 'Library', href: null, active: false, activeTrail: false, children: [] },
            { kind: 'nav/link', title: 'Songs', href: '/songs', active: true, activeTrail: false, children: [] },
            { kind: 'nav/link', title: 'Lyrics', href: '/lyrics', active: false, activeTrail: false, children: [] },
        ];
        const { container } = render(
            <RealmNav items={items} variant="flat-with-headers" icon={(_n, ctx) => <i className={ctx.className} />} />,
        );
        expect(container.querySelector('style')?.textContent).toBe(REALM_NAV_CSS);
        expect(container.querySelector('.beam-nav-label')).not.toBeNull();
        expect(container.querySelector('i.beam-nav-icon')).not.toBeNull();
        const [active, idle] = Array.from(container.querySelectorAll('a'));
        expect(active.className).toContain('beam-nav-item');
        expect(active.getAttribute('data-active')).toBe('true');
        expect(idle.getAttribute('data-active')).toBe('false');

        expect(REALM_NAV_CSS).toMatch(/\.beam-nav-label\s*\{[^}]*letter-spacing:\s*0\.1em/);
        expect(REALM_NAV_CSS).toMatch(/\.beam-nav-icon\s*\{[^}]*(width|inline-size):\s*17px/);
        expect(REALM_NAV_CSS).toContain(`.beam-nav-item[data-active='true'] { color: ${SIDEBAR_ACTIVE_FG}; }`);
        expect(REALM_NAV_CSS).toContain(`.beam-nav-item[data-active='false']:hover { color: ${SIDEBAR_ACTIVE_FG}; }`);
    });
});

describe('AccountShell renders its own sheet', () => {
    it('the collapsed-rail action and the metrics row gap are sheet rules', () => {
        const { container } = render(
            <SidebarProvider>
                <TooltipProvider>
                    <AccountShell
                        nav={{ items: [{ title: 'Dashboard', href: '/account' }] }}
                        shell={{
                            plan: { tier: 'free', label: 'Free', credits: 6, max: 8 },
                            profile: { handle: '@drew', avatar: 'DM', metrics: [{ label: 'SONGS', value: '4' }] },
                            account: { email: 'drew@example.test', paymentMethodLabel: null },
                            upsells: [],
                        }}
                        action={<button type="button">New</button>}
                        sections={{ profile: true }}
                    >
                        <div>page</div>
                    </AccountShell>
                </TooltipProvider>
            </SidebarProvider>,
        );
        const sheets = Array.from(container.querySelectorAll('style')).map((s) => s.textContent);
        expect(sheets).toContain(ACCOUNT_SHELL_CSS);
        expect(container.querySelector('.beam-ux-account-action')).not.toBeNull();
        expect(container.querySelector('.beam-ux-account-metrics')).not.toBeNull();
        expect(ACCOUNT_SHELL_CSS).toMatch(/\[data-collapsible='icon'\] \.beam-ux-account-action\s*\{\s*display:\s*none/);
        expect(ACCOUNT_SHELL_CSS).toMatch(/\.beam-ux-account-metrics\s*\{[^}]*row-gap:\s*0\.125rem/);
    });
});
