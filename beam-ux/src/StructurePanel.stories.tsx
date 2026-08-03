import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RegionInspector } from './RegionInspector';
import { StructurePanel } from './StructurePanel';
import { cardEntryBody, palette, pageTree, regions } from './story-fixtures';

/**
 * Catalog story for {@link StructurePanel} (rehome-ui; beamux ticket 08). Structure mode — the
 * page-composition layer, kept separate from overlay editing: the layout›template›page composition tree
 * with the selected region's placement config, plus the component palette. Its axis is **selection**
 * (which region node is picked in the tree). The `renderEditor` slot mounts the inspector for the
 * selection off the fixture body/schema.
 */
const meta = {
    title: 'BeamUx/StructurePanel',
    component: StructurePanel,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof StructurePanel>;

export default meta;

function Harness({ initial }: { initial: string }) {
    const [selected, setSelected] = useState<string | null>(initial);
    const selectedRegion = regions.find((r) => r.id === selected) ?? null;
    return (
        <StructurePanel
            pageTree={pageTree}
            palette={palette}
            selected={selected}
            selectedRegion={selectedRegion}
            onSelect={setSelected}
            renderEditor={(region) => (
                <RegionInspector
                    key={region.id}
                    region={region}
                    schema={region.kind === 'form' ? cardEntryBody.schema : null}
                    body={region.kind === 'form' ? cardEntryBody.body : {}}
                    onChange={() => {}}
                    onSave={() => {}}
                />
            )}
        />
    );
}

/** The `form` region selected in the tree — its placement config shows the SchemaForm. */
export const FormSelected: StoryObj = {
    render: () => <Harness initial="card" />,
};

/** The route-bound `list` region selected — the tree with its list placement config. */
export const ListSelected: StoryObj = {
    render: () => <Harness initial="list" />,
};
