import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

/**
 * The beam per-repo Storybook — the "free-tier" catalog of the composition architecture
 * (component-seams map; ticket 23 repeats the schemastud pilot, ticket 08, in the beam repo).
 *
 * This is ONE of several per-repo Storybooks (schemastud/ + splicewire/splice/ get their own);
 * the project-neutral portal at ~/Workspaces/storybook composes them via `refs` — beam is the
 * `:6007` ref (ticket 12). This config catalogues only THIS repo's workspaces.
 *
 * Stories are COLOCATED (`*.stories.tsx` beside each component) and aggregated across every
 * beam workspace by the glob below (`../beam-mainframe/src`, `../beam-calendar/src`, …).
 */
const config: StorybookConfig = {
    stories: ['../*/src/**/*.stories.@(ts|tsx|mdx)'],
    addons: [],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    viteFinal: async (cfg) => {
        cfg.plugins ??= [];
        // Tailwind v4 — the packages are headless (tsup libs, no CSS pipeline); the workbench
        // supplies the Tailwind + token layer so `bg-primary` etc. render skinned. Per-package
        // self-contained token defaults (ticket 07's aspiration) can graduate later.
        cfg.plugins.push(tailwindcss());
        // Linked Frame/facets must share both React and the QueryClient context with
        // this workbench's providers, matching beam-inertia's mounted test harness.
        cfg.resolve ??= {};
        cfg.resolve.dedupe = [...(cfg.resolve.dedupe ?? []), 'react', 'react-dom', '@tanstack/react-query'];
        cfg.resolve.alias = {
            ...(cfg.resolve.alias as Record<string, string> | undefined),
            // Stub `@inertiajs/react` (component-seams ticket 40). beam-mdx is the ONLY Inertia
            // consumer in the whole beam Storybook (its `context.tsx` + `content-show.tsx`); its
            // render-time touch is just `usePage()` + `<Head>`. The real package boots a global
            // router with side effects and renders a resolved page component — the wrong tool
            // for cataloguing bare surfaces. The stub supplies exactly those two seams,
            // story-driven, so the citation kit renders off pure fixtures with no app/Laravel
            // coupling.
            '@inertiajs/react': fileURLToPath(
                new URL('./inertia-react.stub.tsx', import.meta.url),
            ),
        };
        // Pin `@schemastud/big-calendar`'s `@tanstack/react-query` import to beam's own copy.
        // `@schemastud/big-calendar` is vendored via a `file:` link into a SEPARATE workspace
        // (`~/Workspaces/js/packages/schemastud`), which has its own independently-installed
        // `node_modules/@tanstack/react-query`. Node's resolution walks up from a file's REAL
        // (symlink-resolved) location, so `big-calendar/src/hooks.ts`'s
        // `useQuery`/`useQueryClient` always resolved to schemastud's own copy — a different
        // module instance, with its own `QueryClientContext` object, than the one beam's
        // `story-harness.tsx` (`WithQuery`) and `CompositionCalendar.tsx` resolve to. A provider
        // from one copy is invisible to a hook reading the other's Context, so every
        // Calendar/CompositionCalendar story (the only satellite that renders through
        // `BigCalendarSurface`'s own `useCalendarEvents`) threw "No QueryClient set, use
        // QueryClientProvider to set one". Scoped to imports FROM big-calendar's own real path
        // so every other resolution in this catalog is untouched.
        const beamReactQueryEntry = fileURLToPath(
            new URL('../node_modules/@tanstack/react-query/build/modern/index.js', import.meta.url),
        );
        cfg.plugins.push({
            name: 'beam-pin-big-calendar-react-query',
            enforce: 'pre',
            resolveId(source: string, importer?: string) {
                if (source === '@tanstack/react-query' && importer?.includes('/schemastud/big-calendar/')) {
                    return beamReactQueryEntry;
                }
                return null;
            },
        });
        return cfg;
    },
};

export default config;
