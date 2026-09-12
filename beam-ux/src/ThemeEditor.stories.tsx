import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeEditor } from './ThemeEditor';
import { entryIds, themeEntryBody } from './story-fixtures';
import { MockUxBuilderProvider, makeMockClient } from './story-harness';

/**
 * Catalog story for {@link ThemeEditor} (G2-BEAM-THEME-NAV) — the theme entry's editor seat.
 *
 * Unlike {@link RegionInspector}'s stories, this component is CONNECTED: it loads through the
 * package's react-query layer and the injected `UxBuilderClient`, so every story mounts inside
 * `<MockUxBuilderProvider>` and its axis is the QUERY state (loaded / loading / failed), not a prop.
 *
 * The loaded story renders the real `@schemastud/seam` SchemaForm over the server's own theme schema —
 * two namespaced fieldsets (`canvas`, `site`) — while the fixture's body also carries `shell`, the
 * namespace the schema deliberately omits. Nothing on screen shows that third namespace; that it
 * SURVIVES a save is what `ThemeEditor.test.tsx` pins.
 */
const meta = {
    title: 'BeamUx/ThemeEditor',
    component: ThemeEditor,
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <div className="w-[460px] max-w-full">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ThemeEditor>;

export default meta;

const bodies = { [entryIds.theme]: themeEntryBody };

/** The theme loaded — the SchemaForm over `{canvas, site}`, with Save / Discard beneath it. */
export const Loaded: StoryObj = {
    render: () => (
        <MockUxBuilderProvider client={makeMockClient({ bodies })}>
            <ThemeEditor entryId={entryIds.theme} />
        </MockUxBuilderProvider>
    ),
};

/** The read still in flight — the state a host's own spinner must not double up on. */
export const Loading: StoryObj = {
    render: () => (
        <MockUxBuilderProvider client={makeMockClient({ bodies, hang: true })}>
            <ThemeEditor entryId={entryIds.theme} />
        </MockUxBuilderProvider>
    ),
};

/**
 * The read refused or failed. A theme screen a member reaches (the `save-body` op declares
 * `ability: 'ux.author'` and the read declares the same) lands here rather than on an empty form that
 * would look authored-and-blank.
 */
export const Failed: StoryObj = {
    render: () => (
        <MockUxBuilderProvider
            client={{
                loadBody: () => Promise.reject(new Error('load 403')),
                saveBody: () => Promise.reject(new Error('save 403')),
            }}
        >
            <ThemeEditor entryId={entryIds.theme} />
        </MockUxBuilderProvider>
    ),
};
