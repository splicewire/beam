import type { ReactElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
    FrameActionError,
    KNOWN_CONTEXTS,
    createFrameKit,
    type AdminResourceDefinition,
    type ContextManifest,
    type FrameKit,
    type FrameManifest,
    type FrameTransport,
    type ResourceActionDefinition,
    type Row,
} from '@schemastud/frame';
import type { SchemaNode } from '@schemastud/seam';
import { createMemoryTransport, type MemoryTransportFixtures } from '@schemastud/frame/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgreementsAndConsents, OrganisationAgreements } from '../src/index';

afterEach(cleanup);

/**
 * agreements 10a (seam-ahead trial), over frame's memory transport (CONFORM 02-6, 02-8). Every resource key, field and
 * action below is a FIXTURE: the real entries resource and its withdraw operation are 03's and 10b's to declare, and
 * the screens must render whatever is declared. The field names are deliberately not the ledger's.
 */

const MINE = 'fixture-own-entries';
const ORG = 'fixture-org-entries';

const ROWS: Row[] = [
    { id: '1', title: 'First fixture entry', noted: 'Fixture note one' },
    { id: '2', title: 'Second fixture entry', noted: 'Fixture note two' },
];
const ORG_ROWS: Row[] = [{ id: '9', title: 'Organisation fixture entry', by: 'Fixture Person' }];

const WITHDRAW: ResourceActionDefinition = {
    key: 'withdraw',
    label: 'Withdraw',
    scope: 'record',
    method: 'POST',
    url: '/fixture/entries/{id}/withdraw',
    input: null,
    result: 'toast',
    destructive: true,
};

const columns = (fields: Record<string, string>): ContextManifest['byNode'] =>
    Object.fromEntries(Object.entries(fields).map(([field, label]) => [field, { 'list-column': { participates: true, label } }]));

const context = (byNode: ContextManifest['byNode'], actions: ResourceActionDefinition[], can: Record<string, boolean>): ContextManifest => ({
    byNode,
    inherits: {},
    known: KNOWN_CONTEXTS,
    createAffordance: 'frame',
    actions,
    can: { create: false, update: false, delete: false, actions: can },
});

const resource = (key: string): AdminResourceDefinition => ({
    key,
    data: 'Fixture.Data.EntryData',
    editData: null,
    createResultData: null,
    form: 'enriched',
    nav: { label: key },
});

function manifest(own: ContextManifest, org?: ContextManifest): FrameManifest {
    return {
        resources: [resource(MINE), resource(ORG)],
        contexts: { [MINE]: own, ...(org ? { [ORG]: org } : {}) },
    };
}

const DETAIL_SCHEMA = { type: 'object', properties: { title: { type: 'string', title: 'Title' } } };

/** Mounts `ui` under a real frame kit over the memory transport; returns a spy on the transport's list reads. */
function mount(ui: (props: { kit: FrameKit }) => ReactElement, fixtures: MemoryTransportFixtures, overrides: Partial<FrameTransport> = {}) {
    const transport = createMemoryTransport(
        { rows: { [MINE]: ROWS, [ORG]: ORG_ROWS }, formSchema: { '*': DETAIL_SCHEMA as SchemaNode }, ...fixtures },
        overrides,
    );
    const list = vi.spyOn(transport, 'list');
    const kit = createFrameKit({ transport });
    render(ui({ kit }));
    return { list };
}

const withdrawable = manifest(context(columns({ title: 'Title', noted: 'Noted' }), [WITHDRAW], { withdraw: true }));

describe("the account's agreements & consents", () => {
    it('lists the entries resource with the columns its manifest declares, and opens one read-only', async () => {
        mount(({ kit }) => <kit.Provider><AgreementsAndConsents resource={MINE} /></kit.Provider>, { manifest: withdrawable });

        const section = screen.getByRole('region', { name: 'Agreements & consents' });
        expect(within(section).getByRole('heading', { name: 'Agreements & consents' })).toBeTruthy();
        expect(await within(section).findByText('First fixture entry')).toBeTruthy();
        expect(within(section).getByText('Fixture note two')).toBeTruthy();
        expect(within(section).getByText('Noted')).toBeTruthy();
        // A ledger is appended to elsewhere: the manifest grants no create, so no "New".
        expect(within(section).queryByRole('button', { name: /new/i })).toBeNull();

        fireEvent.click(within(section).getByText('First fixture entry'));
        const title = await within(section).findByRole('textbox', { name: /Title/ });
        expect((title as HTMLInputElement).value).toBe('First fixture entry');
        expect((title as HTMLInputElement).readOnly || (title as HTMLInputElement).disabled).toBe(true);

        fireEvent.click(within(section).getByRole('button', { name: 'Back to the list' }));
        expect(await within(section).findByText('Second fixture entry')).toBeTruthy();
    });

    it('withdraws through the declared confirm-only action: it asks, sends no body, announces and refetches', async () => {
        const invoke = vi.fn(async () => ({ message: 'Withdrawn.', data: null }));
        const { list } = mount(({ kit }) => <kit.Provider><AgreementsAndConsents resource={MINE} /></kit.Provider>, { manifest: withdrawable }, { invoke });
        await screen.findByText('First fixture entry');
        const reads = list.mock.calls.length;

        fireEvent.click(screen.getAllByRole('button', { name: 'Withdraw' })[0]);
        const dialog = screen.getByRole('dialog', { name: 'Withdraw' });
        // Destructive: frame asks in those words before anything is sent.
        expect(within(dialog).getByText('Withdraw? This cannot be undone.')).toBeTruthy();
        expect(invoke).not.toHaveBeenCalled();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Withdraw' }));
        await waitFor(() => expect(invoke).toHaveBeenCalledWith(WITHDRAW, { id: '1', data: undefined }));
        expect((await screen.findByRole('status')).textContent).toContain('Withdrawn.');
        await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(reads));
    });

    it("shows a refusal's message and leaves the entry listed", async () => {
        const invoke = vi.fn(async () => {
            throw new FrameActionError(403, { message: 'Fixture refusal.' });
        });
        mount(({ kit }) => <kit.Provider><AgreementsAndConsents resource={MINE} /></kit.Provider>, { manifest: withdrawable }, { invoke });
        await screen.findByText('First fixture entry');

        fireEvent.click(screen.getAllByRole('button', { name: 'Withdraw' })[0]);
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Withdraw' }));

        // Frame shows the server's message (in the dialog and its notice); nothing is withdrawn.
        expect((await screen.findAllByText(/Fixture refusal\./)).length).toBeGreaterThan(0);
        expect(screen.getByText('First fixture entry')).toBeTruthy();
    });

    it('draws withdraw on the detail too, for the entry shown', async () => {
        const invoke = vi.fn(async () => ({ message: 'Withdrawn.', data: null }));
        mount(({ kit }) => <kit.Provider><AgreementsAndConsents resource={MINE} /></kit.Provider>, { manifest: withdrawable }, { invoke });

        fireEvent.click(await screen.findByText('Second fixture entry'));
        await screen.findByRole('button', { name: 'Back to the list' });
        fireEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Withdraw' }));

        await waitFor(() => expect(invoke).toHaveBeenCalledWith(WITHDRAW, { id: '2', data: undefined }));
    });

    it('draws no withdraw where the actor may not press it, or where the resource declares none', async () => {
        const refused = manifest(context(columns({ title: 'Title' }), [WITHDRAW], { withdraw: false }));
        mount(({ kit }) => <kit.Provider><AgreementsAndConsents resource={MINE} /></kit.Provider>, { manifest: refused });
        await screen.findByText('First fixture entry');
        expect(screen.queryByRole('button', { name: 'Withdraw' })).toBeNull();
        cleanup();

        const undeclared = manifest(context(columns({ title: 'Title' }), [], {}));
        mount(({ kit }) => <kit.Provider><AgreementsAndConsents resource={MINE} /></kit.Provider>, { manifest: undeclared });
        await screen.findByText('First fixture entry');
        expect(screen.queryByRole('button', { name: 'Withdraw' })).toBeNull();
    });
});

describe("the organisation owner's view", () => {
    it('is the same composition over a second resource, showing what that resource declares', async () => {
        const both = manifest(
            context(columns({ title: 'Title' }), [WITHDRAW], { withdraw: true }),
            context(columns({ title: 'Title', by: 'Made by' }), [], {}),
        );
        mount(
            ({ kit }) => (
                <kit.Provider>
                    <OrganisationAgreements resource={ORG} />
                </kit.Provider>
            ),
            { manifest: both },
        );

        const section = screen.getByRole('region', { name: 'Agreed for the organisation' });
        expect(await within(section).findByText('Organisation fixture entry')).toBeTruthy();
        expect(within(section).getByText('Made by')).toBeTruthy();
        expect(within(section).getByText('Fixture Person')).toBeTruthy();
        expect(within(section).queryByText('First fixture entry')).toBeNull();
        expect(within(section).queryByRole('button', { name: 'Withdraw' })).toBeNull();
    });

    it('takes a host heading in place of the default', async () => {
        mount(({ kit }) => <kit.Provider><OrganisationAgreements resource={ORG} heading="Fixture heading" /></kit.Provider>, {
            manifest: manifest(context({}, [], {}), context(columns({ title: 'Title' }), [], {})),
        });
        expect(screen.getByRole('heading', { name: 'Fixture heading' })).toBeTruthy();
        expect(await screen.findByText('Organisation fixture entry')).toBeTruthy();
    });
});
