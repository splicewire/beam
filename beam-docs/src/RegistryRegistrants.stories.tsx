import type { Meta, StoryObj } from '@storybook/react-vite';
import { RegistryRegistrants } from './RegistryRegistrants';
import type { RegistryRegistrantsData } from './generated/types';
import type { DocsTransport } from './publications';

/**
 * Catalog stories for {@link RegistryRegistrants}, the registry page's live panel. Its axis is **what the serving
 * site can say**: a registry that records who registered each entry, one that cannot, and a root this site does not
 * compose. Each story answers through a stub transport, so the catalog makes no request.
 */
const meta = {
    title: 'BeamDocs/RegistryRegistrants',
    component: RegistryRegistrants,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof RegistryRegistrants>;

export default meta;

const answer = (data: RegistryRegistrantsData): DocsTransport => async () => data;

// The package's default route. The panel renders nothing without an endpoint (`configureDocs` sets one for MDX pages),
// so each story names it; the stub transport answers it and nothing is requested.
const endpoint = '/beam/docs/registries';

/** Per-entry registrants, where the registry records them. */
export const RecordsRegistrants: StoryObj = {
    render: () => (
        <RegistryRegistrants
            root="beam.particle.resources"
            endpoint={endpoint}
            transport={answer({
                root: 'beam.particle.resources',
                describedHere: true,
                owner: 'Splicewire\\Beam\\Particle\\ParticleResourceRegistry',
                describedBy: 'splicewire/laravel-beam',
                recordsRegistrants: true,
                entries: [
                    { key: 'beam.particle.resources.users', registrant: 'splicewire/laravel-beam-accounts' },
                    { key: 'beam.particle.resources.teams', registrant: 'splicewire/laravel-beam-accounts' },
                    { key: 'beam.particle.resources.beam-ux-entry', registrant: 'splicewire/laravel-beam-ux' },
                ],
                unattributed: 2,
                note: null,
            })}
        />
    ),
};

/** The owner and who described it, with the one-line note in place of the list. */
export const DoesNotRecord: StoryObj = {
    render: () => (
        <RegistryRegistrants
            root="beam.particle.operations"
            endpoint={endpoint}
            transport={answer({
                root: 'beam.particle.operations',
                describedHere: true,
                owner: 'Splicewire\\Beam\\Particle\\ParticleOperationRegistry',
                describedBy: 'splicewire/laravel-beam',
                recordsRegistrants: false,
                entries: null,
                unattributed: null,
                note: 'This registry does not record who registered each entry.',
            })}
        />
    ),
};

/** A documented root this site does not compose: shown, not hidden. */
export const NotOnThisSite: StoryObj = {
    render: () => (
        <RegistryRegistrants
            root="composition.kinds"
            endpoint={endpoint}
            transport={answer({
                root: 'composition.kinds',
                describedHere: false,
                owner: null,
                describedBy: null,
                recordsRegistrants: false,
                entries: null,
                unattributed: null,
                note: 'not available on this host',
            })}
        />
    ),
};
