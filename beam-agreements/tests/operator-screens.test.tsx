import type { ReactElement } from 'react';
import { QueryClient, keepPreviousData } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
    KNOWN_CONTEXTS,
    createFrameKit,
    type AdminResourceDefinition,
    type ContextManifest,
    type FrameKit,
    type FrameManifest,
    type FrameTransport,
    type Row,
} from '@schemastud/frame';
import type { SummaryPayload } from '@schemastud/frame/cards';
import { createMemoryTransport, type MemoryTransportFixtures } from '@schemastud/frame/testing';
import type { SchemaNode } from '@schemastud/seam';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CoverageCard, OperatorRegistry, PartyHistory } from '../src/index';

afterEach(cleanup);

/**
 * agreements 17a (seam-ahead trial), over frame's memory transport (CONFORM 02-6, 02-8). Every resource key, field,
 * request parameter and figure below is a FIXTURE: the real resources, their filters, the party parameter and the
 * coverage numbers are 02's, 03's and 17b's to declare. The names are deliberately not the ledger's.
 */

const AGREEMENTS = 'fixture-agreements';
const VERSIONS = 'fixture-versions';
const ENTRIES = 'fixture-entries';
const PARTY = 'fixtureParty';

const ROWS: Record<string, Row[]> = {
    [AGREEMENTS]: [{ id: 'a1', title: 'Fixture agreement' }],
    [VERSIONS]: [{ id: 'v1', title: 'Fixture version' }],
    [ENTRIES]: [
        { id: 'e1', title: 'Fixture entry for p-1', who: 'p-1' },
        { id: 'e2', title: 'Fixture entry for p-2', who: 'p-2' },
        { id: 'e3', title: 'Second fixture entry for p-1', who: 'p-1' },
    ],
};

const COVERAGE: SummaryPayload = {
    key: AGREEMENTS,
    label: 'Fixture coverage',
    figures: [
        { key: 'one', label: 'Fixture figure one', value: 3 },
        { key: 'two', label: 'Fixture figure two', value: 7 },
    ],
};

const readOnly = (fields: Record<string, string>): ContextManifest => ({
    byNode: Object.fromEntries(Object.entries(fields).map(([field, label]) => [field, { 'list-column': { participates: true, label } }])),
    inherits: {},
    known: KNOWN_CONTEXTS,
    createAffordance: 'frame',
    actions: [],
    can: { create: false, update: false, delete: false, actions: {} },
});

const resource = (key: string): AdminResourceDefinition => ({ key, data: 'Fixture.Data.RowData', editData: null, createResultData: null, form: 'enriched', nav: { label: key } });

const MANIFEST: FrameManifest = {
    resources: [resource(AGREEMENTS), resource(VERSIONS), resource(ENTRIES)],
    contexts: {
        [AGREEMENTS]: readOnly({ title: 'Title' }),
        [VERSIONS]: readOnly({ title: 'Title' }),
        [ENTRIES]: readOnly({ title: 'Title', who: 'Who' }),
    },
};

const DETAIL = { type: 'object', properties: { title: { type: 'string', title: 'Title' } } } as SchemaNode;

/** The memory transport, with a `list` that honours the fixture party parameter the way a host's resource would. */
function mount(
    ui: (kit: FrameKit) => ReactElement,
    fixtures: MemoryTransportFixtures = {},
    overrides: Partial<FrameTransport> = {},
    queryClient?: QueryClient,
) {
    const transport = createMemoryTransport(
        { rows: ROWS, formSchema: { '*': DETAIL }, manifest: MANIFEST, ...fixtures },
        { summary: async () => COVERAGE, ...overrides },
    );
    const memoryList = transport.list;
    const list = vi.spyOn(transport, 'list').mockImplementation((target, params) => {
        // Narrow to one party the way the host's entries resource would read the fixture parameter.
        const party = params[PARTY];
        if (party !== undefined) {
            const data = (ROWS[target] ?? []).filter((row) => row.who === party);
            return Promise.resolve({ data, total: data.length, page: 1, perPage: 25 }) as ReturnType<typeof memoryList>;
        }
        // The unscoped entries list has more than one page, so its pagination draws.
        if (target === ENTRIES) {
            const page = Number(params.page ?? '1');
            return Promise.resolve({ data: ROWS[ENTRIES], total: 60, page, perPage: 25 }) as ReturnType<typeof memoryList>;
        }
        return memoryList(target, params);
    });
    const get = vi.spyOn(transport, 'get');
    const getFormSchema = vi.spyOn(transport, 'getFormSchema');
    const getFilterSchema = vi.spyOn(transport, 'getFilterSchema');
    const summary = vi.spyOn(transport, 'summary');
    const kit = createFrameKit({ transport, ...(queryClient ? { queryClient } : {}) });
    const view = render(ui(kit));
    return { list, get, getFormSchema, getFilterSchema, summary, kit, view };
}

describe("the operator's registry", () => {
    it('lists agreements, versions and entries read-only, each mounting its filter bar', async () => {
        const { getFilterSchema } = mount((kit) => (
            <kit.Provider>
                <OperatorRegistry agreements={AGREEMENTS} versions={VERSIONS} entries={ENTRIES} />
            </kit.Provider>
        ));

        const registry = screen.getByRole('region', { name: 'Agreements registry' });
        expect(await within(within(registry).getByRole('region', { name: 'Agreements' })).findByText('Fixture agreement')).toBeTruthy();
        expect(await within(within(registry).getByRole('region', { name: 'Versions' })).findByText('Fixture version')).toBeTruthy();
        const entries = within(registry).getByRole('region', { name: 'Entries' });
        expect(await within(entries).findByText('Fixture entry for p-2')).toBeTruthy();
        expect(within(entries).getByText('Who')).toBeTruthy();

        // Nothing is created, edited or deleted here: the manifests grant none of it.
        expect(within(registry).queryByRole('button', { name: /new/i })).toBeNull();
        expect(within(registry).queryByRole('button', { name: /delete|edit/i })).toBeNull();
        // Each list asks for its resource's declared filters (the facets bar mounts on them).
        await waitFor(() => expect(getFilterSchema.mock.calls.map(([target]) => target)).toEqual(expect.arrayContaining([AGREEMENTS, VERSIONS, ENTRIES])));
    });

    it("keeps each list's page its own: paging entries sends no page to agreements or versions", async () => {
        const { list } = mount((kit) => (
            <kit.Provider>
                <OperatorRegistry agreements={AGREEMENTS} versions={VERSIONS} entries={ENTRIES} />
            </kit.Provider>
        ));
        const entries = screen.getByRole('region', { name: 'Entries' });
        await within(entries).findByText('Fixture entry for p-2');
        await screen.findByText('Fixture agreement');
        list.mockClear();

        // The kit's pagination control, whatever its exact wording ("Next", "Go to next page").
        const next = within(entries).queryAllByRole('button', { name: /next/i })[0] ?? within(entries).getAllByRole('link', { name: /next/i })[0];
        fireEvent.click(next);

        await waitFor(() => expect(list.mock.calls.some(([target, params]) => target === ENTRIES && params.page === '2')).toBe(true));
        expect(list.mock.calls.filter(([target]) => target !== ENTRIES).every(([, params]) => params.page === undefined)).toBe(true);
        // The other lists still show their first page, unrefetched with a foreign page.
        expect(within(screen.getByRole('region', { name: 'Agreements' })).getByText('Fixture agreement')).toBeTruthy();
    });

    it('opens a record read-only and returns to its list', async () => {
        mount((kit) => (
            <kit.Provider>
                <OperatorRegistry agreements={AGREEMENTS} versions={VERSIONS} entries={ENTRIES} />
            </kit.Provider>
        ));
        const versions = screen.getByRole('region', { name: 'Versions' });
        fireEvent.click(await within(versions).findByText('Fixture version'));
        const title = (await within(versions).findByRole('textbox', { name: /Title/ })) as HTMLInputElement;
        expect(title.value).toBe('Fixture version');
        expect(title.readOnly || title.disabled).toBe(true);

        fireEvent.click(within(versions).getByRole('button', { name: 'Back to the list' }));
        expect(await within(versions).findByText('Fixture version')).toBeTruthy();
    });

    it("draws the coverage resource's summary through frame's summary card, figures as the payload states them", async () => {
        const { summary } = mount((kit) => (
            <kit.Provider>
                <OperatorRegistry agreements={AGREEMENTS} versions={VERSIONS} entries={ENTRIES} coverage={AGREEMENTS} />
            </kit.Provider>
        ));

        expect(await screen.findByText('Fixture coverage')).toBeTruthy();
        expect(screen.getByText('Fixture figure one')).toBeTruthy();
        expect(screen.getByText('7')).toBeTruthy();
        expect(summary).toHaveBeenCalledWith(AGREEMENTS, {});
        expect(document.querySelector('[data-frame-card="stat-row"]')).not.toBeNull();
    });

    it("shows a failed summary's message instead of a card", async () => {
        mount(
            (kit) => (
                <kit.Provider>
                    <OperatorRegistry agreements={AGREEMENTS} versions={VERSIONS} entries={ENTRIES} coverage={AGREEMENTS} />
                </kit.Provider>
            ),
            {},
            { summary: vi.fn(async () => Promise.reject(new Error('Fixture summary refusal.'))) },
            // A failed read is retried with backoff by default; the test asks once.
            new QueryClient({ defaultOptions: { queries: { retry: false } } }),
        );
        expect((await screen.findByRole('alert')).textContent).toContain('Fixture summary refusal.');
    });

    it("never shows a previous request's figures while the next loads, even when the host keeps previous data", async () => {
        const pending = new Promise<SummaryPayload>(() => {});
        const summaryFor = vi.fn(async (_target: string, params: Record<string, string>) =>
            params.period === 'next' ? pending : { ...COVERAGE, label: 'Fixture coverage, first period' },
        );
        const keeping = new QueryClient({ defaultOptions: { queries: { retry: false, placeholderData: keepPreviousData } } });
        const { kit, view } = mount(
            (kit) => (
                <kit.Provider>
                    <CoverageCard resource={AGREEMENTS} params={{ period: 'first' }} />
                </kit.Provider>
            ),
            {},
            { summary: summaryFor },
            keeping,
        );
        expect(await screen.findByText('Fixture coverage, first period')).toBeTruthy();

        view.rerender(
            <kit.Provider>
                <CoverageCard resource={AGREEMENTS} params={{ period: 'next' }} />
            </kit.Provider>,
        );
        await waitFor(() => expect(summaryFor).toHaveBeenCalledWith(AGREEMENTS, { period: 'next' }));
        expect(screen.queryByText('Fixture coverage, first period')).toBeNull();
        expect(document.querySelector('[data-beam-agreements="coverage"][aria-busy="true"]')).not.toBeNull();
    });

    it('draws no coverage card without a coverage resource', async () => {
        const { summary } = mount((kit) => (
            <kit.Provider>
                <OperatorRegistry agreements={AGREEMENTS} versions={VERSIONS} entries={ENTRIES} />
            </kit.Provider>
        ));
        await screen.findByText('Fixture agreement');
        expect(summary).not.toHaveBeenCalled();
        expect(document.querySelector('[data-beam-agreements="coverage"]')).toBeNull();
    });
});

describe("one party's history", () => {
    it("passes the host's scope on the entries resource's parameterized reads, and lists only that party", async () => {
        const { list, get, getFormSchema } = mount((kit) => (
            <kit.Provider>
                <PartyHistory resource={ENTRIES} scope={{ [PARTY]: 'p-1' }} />
            </kit.Provider>
        ));

        const history = screen.getByRole('region', { name: 'History' });
        expect(await within(history).findByText('Fixture entry for p-1')).toBeTruthy();
        expect(within(history).getByText('Second fixture entry for p-1')).toBeTruthy();
        expect(within(history).queryByText('Fixture entry for p-2')).toBeNull();
        expect(list.mock.calls.every(([target, params]) => target !== ENTRIES || params[PARTY] === 'p-1')).toBe(true);

        fireEvent.click(within(history).getByText('Second fixture entry for p-1'));
        expect(await within(history).findByRole('textbox', { name: /Title/ })).toBeTruthy();
        expect(get).toHaveBeenCalledWith(ENTRIES, 'e3', expect.objectContaining({ [PARTY]: 'p-1' }));
        // The detail's schema read (the read projection) carries the scope too.
        expect(getFormSchema).toHaveBeenCalledWith(ENTRIES, expect.anything(), 'read', expect.objectContaining({ [PARTY]: 'p-1' }));
        expect(getFormSchema.mock.calls.filter(([target]) => target === ENTRIES).every(([, , , params]) => params?.[PARTY] === 'p-1')).toBe(true);
    });

    it('keeps two histories apart, each its own party, beside the unscoped list', async () => {
        mount((kit) => (
            <kit.Provider>
                <PartyHistory resource={ENTRIES} scope={{ [PARTY]: 'p-1' }} heading="First fixture party" />
                <PartyHistory resource={ENTRIES} scope={{ [PARTY]: 'p-2' }} heading="Second fixture party" />
                <OperatorRegistry agreements={AGREEMENTS} versions={VERSIONS} entries={ENTRIES} />
            </kit.Provider>
        ));

        const [first, second] = screen.getAllByRole('region', { name: 'History' });
        expect(within(first).getByRole('heading', { name: 'First fixture party' })).toBeTruthy();
        expect(await within(first).findByText('Fixture entry for p-1')).toBeTruthy();
        expect(within(first).queryByText('Fixture entry for p-2')).toBeNull();
        expect(await within(second).findByText('Fixture entry for p-2')).toBeTruthy();
        expect(within(second).queryByText('Fixture entry for p-1')).toBeNull();

        const all = screen.getByRole('region', { name: 'Entries' });
        expect(await within(all).findByText('Fixture entry for p-1')).toBeTruthy();
        expect(within(all).getByText('Fixture entry for p-2')).toBeTruthy();
    });
});
