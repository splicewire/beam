import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApiReference } from './ApiReference';
import type { ApiReferenceFactory } from './ApiReference';

/**
 * Catalog stories for {@link ApiReference} (beam-docs-satellite ticket 20, ADR-0210 §5) — the OpenAPI
 * reference surface, named for its ROLE so the renderer behind it is swappable in one file. Its axis
 * is **where the renderer comes from**: an injected factory (air-gapped / CSP-strict, nothing fetched)
 * versus the default CDN load.
 *
 * The catalog must not pull a multi-megabyte renderer off a CDN, so every story injects a stub factory
 * that reports the configuration it was handed. That configuration IS the contract this component owns.
 */
const meta = {
    title: 'BeamUx/Site/ApiReference',
    component: ApiReference,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof ApiReference>;

export default meta;

/** A stand-in renderer: prints the config it received instead of rendering a spec. */
const stubRenderer: ApiReferenceFactory = (target, configuration) => {
    const element = target as HTMLElement;
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(configuration, null, 2);
    element.appendChild(pre);
};

/** The default: the host's OWN spec (a beam site documents itself), with the MCP curation applied. */
export const SelfDocumenting: StoryObj = {
    render: () => <ApiReference specUrl="/beam/openapi.json" createApiReference={stubRenderer} />,
};

/** Brand theming is a PROP — the package ships no palette and no fonts. */
export const HostThemed: StoryObj = {
    render: () => (
        <ApiReference
            specUrl="/beam/openapi.json"
            createApiReference={stubRenderer}
            customCss={`
                .scalar-app { --scalar-font: 'Space Grotesk', sans-serif; --scalar-font-code: 'IBM Plex Mono', monospace; }
                .light-mode { --scalar-color-accent: #14803f; }
                .dark-mode { --scalar-color-accent: #35d07a; }
            `}
        />
    ),
};

/** Opting out of the curation: a site with no separate MCP page can let the renderer show its layer. */
export const McpLayerVisible: StoryObj = {
    render: () => (
        <ApiReference specUrl="/beam/openapi.json" createApiReference={stubRenderer} hideMcpLayer={false} />
    ),
};
