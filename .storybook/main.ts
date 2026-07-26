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
        // Dedupe React so any cross-package story binds a single React instance (belt-and-braces;
        // within one repo the workspace already hoists a single copy).
        cfg.resolve ??= {};
        cfg.resolve.dedupe = [...(cfg.resolve.dedupe ?? []), 'react', 'react-dom'];
        // Stub `@inertiajs/react` (component-seams ticket 40). beam-mdx is the ONLY Inertia
        // consumer in the whole beam Storybook (its `context.tsx` + `content-show.tsx`); its
        // render-time touch is just `usePage()` + `<Head>`. The real package boots a global
        // router with side effects and renders a resolved page component — the wrong tool for
        // cataloguing bare surfaces. The stub supplies exactly those two seams, story-driven,
        // so the citation kit renders off pure fixtures with no app/Laravel coupling.
        cfg.resolve.alias = {
            ...(cfg.resolve.alias as Record<string, string> | undefined),
            '@inertiajs/react': fileURLToPath(
                new URL('./inertia-react.stub.tsx', import.meta.url),
            ),
        };
        return cfg;
    },
};

export default config;
