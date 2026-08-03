import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RegionInspector } from './RegionInspector';
import { cardEntryBody, regions } from './story-fixtures';
import type { Region } from './types';

/**
 * Catalog story for {@link RegionInspector} (rehome-ui; beamux ticket 08). The docked region-editor
 * panel. Its axis is **kind**: form → the REAL @schemastud/seam SchemaForm over the loaded schema+body;
 * richtext / frame / list → their preview editors. The inspector is presentational (body/schema in,
 * onChange/onSave out), so each story owns a tiny controlled buffer.
 */
const meta = {
    title: 'BeamUx/RegionInspector',
    component: RegionInspector,
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <div className="w-[400px] max-w-full">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof RegionInspector>;

export default meta;

const byId = (id: string): Region => regions.find((r) => r.id === id)!;

function Controlled({
    region,
    schema,
    initialBody,
}: {
    region: Region;
    schema: Record<string, unknown> | null;
    initialBody: Record<string, unknown>;
}) {
    const [body, setBody] = useState<Record<string, unknown>>(initialBody);
    return (
        <RegionInspector
            region={region}
            schema={schema}
            body={body}
            onChange={setBody}
            onSave={() => {}}
        />
    );
}

/** The `form` kind — real SchemaForm over the loaded `program-card` schema + body. */
export const Form: StoryObj = {
    render: () => (
        <Controlled
            region={byId('card')}
            schema={cardEntryBody.schema}
            initialBody={cardEntryBody.body}
        />
    ),
};

/** The `richtext` kind — the blockdoc preview editor. */
export const Richtext: StoryObj = {
    render: () => <Controlled region={byId('hero')} schema={null} initialBody={{}} />,
};

/** The `frame` kind — the opaque self-managing EditShell island. */
export const Frame: StoryObj = {
    render: () => <Controlled region={byId('roster')} schema={null} initialBody={{}} />,
};

/** The `list` kind — the route-bound collection editor. */
export const List: StoryObj = {
    render: () => <Controlled region={byId('list')} schema={null} initialBody={{}} />,
};
