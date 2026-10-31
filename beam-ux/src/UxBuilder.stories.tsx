import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UxBuilder } from './UxBuilder';
import { MockUxBuilderProvider, makeMockClient } from './story-harness';
import type { BeamUxEntryBodyData, EntryBody, EntryPublicationState, EntryVersion, UxBuilderClient } from './types';
import { cardEntryBody, palette, pageTree, regions } from './story-fixtures';

/**
 * Catalog story for {@link UxBuilder} (rehome-ui; beamux ticket 08). The in-app UX-builder root — in-app
 * visual editing of the beam site's OWN front-end. Its axis is **mode**: overlay (live canvas + a docked
 * inspector, kind-driven) vs. structure (the layout›template›page composition tree + palette). Load/save
 * routes through the package's react-query hooks over the mocked transport client.
 */
const meta = {
    title: 'BeamUx/UxBuilder',
    component: UxBuilder,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story, context) => (
            <BuilderStoryProvider key={context.id} publication={context.parameters.publication === true}>
                <div className="p-6">
                    <Story />
                </div>
            </BuilderStoryProvider>
        ),
    ],
} satisfies Meta<typeof UxBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

/** OVERLAY mode, inspector placement — the live region canvas with a docked right-hand editor. */
export const OverlayMode: Story = {
    args: {
        regions,
        pageTree,
        palette,
        initialMode: 'overlay',
        editorPlacement: 'inspector',
        initialEngaged: 'card',
    },
};

/** STRUCTURE mode — the composition tree + placement config + component palette. */
export const StructureMode: Story = {
    args: {
        regions,
        pageTree,
        palette,
        initialMode: 'structure',
    },
};


/** Deterministic in-memory publication fixture: no auth, network, compiler or runtime proof is claimed. */
function publicationClient(): UxBuilderClient {
    const clone = <T,>(value: T): T => structuredClone(value);
    let envelope: BeamUxEntryBodyData = clone(cardEntryBody);
    let sequence = 1;
    const baseline: EntryVersion = {
        id: 'story-v1', version: 1, readable: 'v1', label: 'Published baseline', createdBy: null,
        createdAt: '2026-10-31T00:00:00+00:00', isHead: true, isPublished: true,
    };
    let state: EntryPublicationState = {
        id: envelope.id, headVersion: baseline.id, headReadable: baseline.readable,
        publishedVersion: baseline.id, publishedReadable: baseline.readable,
        draftPending: false, versions: [baseline], compileError: null,
    };
    const bodies = new Map<string, EntryBody>([[baseline.id, clone(envelope.body)]]);
    const requireEntry = (id: string) => { if (id !== envelope.id) throw new Error('This story owns only its fixture entry.'); };
    const record = (body: EntryBody, label?: string) => {
        sequence++;
        const version: EntryVersion = { ...baseline, id: `story-v${sequence}`, version: sequence, readable: `v${sequence}`, label: label ?? null, isHead: true, isPublished: false };
        bodies.set(version.id, clone(body));
        envelope = { ...envelope, body: clone(body) };
        state = { ...state, headVersion: version.id, headReadable: version.readable, draftPending: true,
            versions: [version, ...state.versions.map(previous => ({ ...previous, isHead: false }))] };
        return clone(state);
    };
    return {
        loadBody: async id => { requireEntry(id); return clone(envelope); },
        saveBody: async () => { throw new Error('This tenant fixture uses the complete draft/publication lane.'); },
        listVersions: async id => { requireEntry(id); return clone(state); },
        saveDraft: async (id, body, baseVersion, label) => {
            requireEntry(id);
            if (baseVersion !== state.headVersion) throw Object.assign(new Error('The fixture draft changed.'), { status: 409 });
            return record(body, label);
        },
        publish: async (id, ref) => {
            requireEntry(id);
            const version = state.versions.find(value => value.id === ref);
            if (!version) throw new Error('The fixture version does not exist.');
            state = { ...state, publishedVersion: ref, publishedReadable: version.readable,
                draftPending: state.headVersion !== ref,
                versions: state.versions.map(value => ({ ...value, isPublished: value.id === ref })) };
            return clone(state);
        },
        restoreVersion: async (id, ref) => {
            requireEntry(id);
            const body = bodies.get(ref);
            if (!body) throw new Error('The fixture version does not exist.');
            return record(body, `Restored ${ref}`);
        },
    };
}

function BuilderStoryProvider({ children, publication }: { children: ReactNode; publication: boolean }) {
    const [client] = useState(() => publication ? publicationClient() : makeMockClient());
    return <MockUxBuilderProvider client={client}>{children}</MockUxBuilderProvider>;
}

/** Complete tenant lane on the same real schema inspector: edit → draft/publish → history/restore. */
export const TenantPublication: Story = {
    parameters: { publication: true },
    args: {
        regions: [regions[1]],
        pageTree: { id: 'page', label: 'Tenant page', kind: 'page', children: [] },
        palette: [],
        initialEngaged: 'card',
    },
};
