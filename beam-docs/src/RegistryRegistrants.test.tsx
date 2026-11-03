import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { entryPageConfig, resetEntryPageConfig } from '@splicewire/beam-ux/docs';
import { configureDocs } from './configure.js';
import { setDocsConfiguration } from './config.js';
import { RegistryRegistrants, readRegistrants, registrantsUrl } from './RegistryRegistrants.js';
import type { RegistryRegistrantsData } from './generated/types.js';
import type { DocsTransport } from './publications.js';

/**
 * registry-docs ticket 01 ruling 6: the panel always shows the owner and who described the registry; the per-entry
 * list renders only where the server says the registry records registrants, otherwise its one-line note. Hidden
 * entries are absent from the server's answer, so the panel can only show what it was sent. A failure renders nothing.
 */
const recording: RegistryRegistrantsData = {
    root: 'beam.particle.resources',
    describedHere: true,
    owner: 'Splicewire\\Beam\\Particle\\ParticleResourceRegistry',
    describedBy: 'splicewire/laravel-beam',
    recordsRegistrants: true,
    entries: [
        { key: 'beam.particle.resources.users', registrant: 'splicewire/laravel-beam-accounts' },
        { key: 'beam.particle.resources.teams', registrant: 'splicewire/laravel-beam-accounts' },
    ],
    unattributed: 1,
    note: null,
};

const notRecording: RegistryRegistrantsData = {
    root: 'beam.particle.operations',
    describedHere: true,
    owner: 'Splicewire\\Beam\\Particle\\ParticleOperationRegistry',
    describedBy: 'splicewire/laravel-beam',
    recordsRegistrants: false,
    entries: null,
    unattributed: null,
    note: 'This registry does not record who registered each entry.',
};

let calls: string[];
const answering = (value: unknown): DocsTransport => async (url) => {
    calls.push(url);
    return value;
};

beforeEach(() => {
    calls = [];
    setDocsConfiguration({ registryLinkEndpoint: null, registriesEndpoint: '/beam/docs/registries' });
});
afterEach(() => resetEntryPageConfig());

describe('RegistryRegistrants', () => {
    it('asks the registrants route for its root, verbatim', async () => {
        render(<RegistryRegistrants root="beam.particle.resources" transport={answering(recording)} />);
        await screen.findByText('On this site');
        expect(calls).toEqual(['/beam/docs/registries/beam.particle.resources/registrants']);
        expect(registrantsUrl('/x/', 'a.b-c')).toBe('/x/a.b-c/registrants');
    });

    it('lists each entry and its registrant where the registry records them', async () => {
        render(<RegistryRegistrants root="beam.particle.resources" transport={answering(recording)} />);
        const list = await screen.findByRole('list', { name: 'Entries and who registered them' });
        expect(list.querySelectorAll('li')).toHaveLength(2);
        expect(screen.getByText('beam.particle.resources.users')).toBeTruthy();
        expect(screen.getByText('Splicewire\\Beam\\Particle\\ParticleResourceRegistry')).toBeTruthy();
        expect(screen.getAllByText('splicewire/laravel-beam-accounts')).toHaveLength(2);
        expect(screen.getByText('splicewire/laravel-beam')).toBeTruthy();
        expect(screen.getByText('1 entry does not name who registered it.')).toBeTruthy();
    });

    it('shows the owner, who described it and the one-line note where it does not', async () => {
        render(<RegistryRegistrants root="beam.particle.operations" transport={answering(notRecording)} />);
        expect(await screen.findByText('This registry does not record who registered each entry.')).toBeTruthy();
        expect(screen.getByText('Splicewire\\Beam\\Particle\\ParticleOperationRegistry')).toBeTruthy();
        expect(screen.getByText('splicewire/laravel-beam')).toBeTruthy();
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('never lists entries when the registry does not record registrants, whatever else arrives', async () => {
        render(<RegistryRegistrants root="beam.particle.operations" transport={answering({ ...notRecording, entries: recording.entries })} />);
        await screen.findByText('On this site');
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('shows only what the server sent: a hidden entry is simply not there', async () => {
        const filtered = { ...recording, entries: [recording.entries![0]], unattributed: 0 };
        render(<RegistryRegistrants root="beam.particle.resources" transport={answering(filtered)} />);
        const list = await screen.findByRole('list', { name: 'Entries and who registered them' });
        expect(list.querySelectorAll('li')).toHaveLength(1);
        expect(screen.queryByText('beam.particle.resources.teams')).toBeNull();
    });

    it('says a root is not available on this site', async () => {
        const absent = { ...notRecording, describedHere: false, owner: null, describedBy: null, note: 'not available on this host' };
        render(<RegistryRegistrants root="beam.particle.operations" transport={answering(absent)} />);
        expect(await screen.findByText('not available on this host')).toBeTruthy();
        expect(screen.queryByText('On this site')).toBeNull();
    });

    it('renders nothing when the request fails', async () => {
        const failing: DocsTransport = async (url) => {
            calls.push(url);
            throw new Error('offline');
        };
        const { container } = render(<RegistryRegistrants root="beam.particle.resources" transport={failing} />);
        await waitFor(() => expect(calls).toHaveLength(1));
        await Promise.resolve();
        expect(container.innerHTML).toBe('');
    });

    it('renders nothing for an unreadable answer, an index that could not answer, or a panel turned off', async () => {
        expect(readRegistrants({ data: recording })).toBeNull();
        expect(readRegistrants({ ...recording, entries: [{ key: 1 }] })).toBeNull();

        const unreadable = render(<RegistryRegistrants root="beam.particle.resources" transport={answering('<html>')} />);
        await waitFor(() => expect(calls).toHaveLength(1));
        expect(unreadable.container.innerHTML).toBe('');

        const unanswered = render(<RegistryRegistrants root="beam.particle.resources" transport={answering({ ...recording, describedHere: null })} />);
        await waitFor(() => expect(calls).toHaveLength(2));
        expect(unanswered.container.innerHTML).toBe('');

        const off = render(<RegistryRegistrants root="beam.particle.resources" endpoint={null} transport={answering(recording)} />);
        expect(off.container.innerHTML).toBe('');
        expect(calls).toHaveLength(2);
    });

    it('is registered for MDX pages by configureDocs, with the package route as its default', async () => {
        configureDocs({ transport: answering(recording) });
        expect(entryPageConfig().components?.RegistryRegistrants).toBe(RegistryRegistrants);

        render(<RegistryRegistrants root="beam.particle.resources" />);
        await screen.findByText('On this site');
        expect(calls).toEqual(['/beam/docs/registries/beam.particle.resources/registrants']);
    });
});
