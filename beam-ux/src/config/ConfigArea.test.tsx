// @vitest-environment jsdom
// config-sections 10a: the Config area's read half over fixture `beam-config` rows, served by frame's memory transport
// through the real kit (createFrameKit: the real ListShell, data hooks and widget registry; nothing is mocked).
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { WidgetProps } from '@rjsf/utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createFrameKit, type FrameTransport } from '@schemastud/frame';
import { createMemoryTransport } from '@schemastud/frame/testing';
import type { ConfigSectionData } from '@splicewire/beam-resources/types/config';
import { ConfigArea, listAllRows } from './ConfigArea';
import { APP_CHAT, BEAM_TENANCY, BEAM_UX, CONFIG_SECTIONS, SECRET_CANARY } from './ConfigArea.fixtures';
import { BEAM_CONFIG_MANIFEST } from './ConfigArea.manifest.fixtures';

/** A host's declared control, registered by name through the kit (row 05-10); it shows what `widgetProps` handed it. */
function ModelPicker(props: WidgetProps) {
    return (
        <output
            data-test-widget="model-picker"
            data-readonly={String(props.readonly)}
            data-disabled={String(props.disabled)}
            data-label={props.label}
            data-schema-title={String(props.schema.title)}
        >
            {String(props.value)}
        </output>
    );
}

/**
 * Mount the area as a host does: the kit serves the CURRENT `beam-config` manifest (laravel-frame's own build of
 * ConfigSectionData's declarations), so ListShell resolves columns in manifest mode. `manifest: false` is the
 * no-manifest fallback, kept to its own test.
 */
function mount(section?: string, { manifest = true, rows = CONFIG_SECTIONS }: { manifest?: boolean; rows?: ConfigSectionData[] } = {}) {
    const kit = createFrameKit({
        transport: createMemoryTransport({ rows: { 'beam-config': rows }, ...(manifest ? { manifest: BEAM_CONFIG_MANIFEST } : {}) }),
        urlState: 'memory',
        widgets: (registry) => registry.registerWidget('model-picker', ModelPicker),
    });
    return render(
        <kit.Provider>
            <ConfigArea resource="beam-config" {...(section === undefined ? {} : { section })} />
        </kit.Provider>,
    );
}

/** The key table's row for a pointer, once the section has loaded. */
async function keyRow(pointer: string) {
    await waitFor(() => expect(document.querySelector(`tr[data-config-key="${pointer}"]`)).not.toBeNull());
    return document.querySelector(`tr[data-config-key="${pointer}"]`) as HTMLElement;
}

function rail() {
    return screen.getByRole('navigation', { name: 'Config sections' });
}

afterEach(cleanup);

/** The index table, once its rows have loaded. */
async function indexTable() {
    const table = await waitFor(() => {
        const t = document.querySelector('[data-beam-config-area] table');
        expect(t).not.toBeNull();
        return t as HTMLElement;
    });
    await waitFor(() => expect(within(table).getByText('Beam UX')).toBeTruthy());
    return table;
}

/** Each body row's cells as text, in column order. */
function bodyCells(table: HTMLElement) {
    return [...table.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim() ?? ''));
}

describe('the all-sections index on ListShell', () => {
    it('with the CURRENT beam-config manifest: its declared columns, our cells, and each section’s counts', async () => {
        mount();
        const table = await indexTable();
        // The manifest decides the set and order (#[Column] on root, title, owner); host columns only override cells.
        expect(within(table).getAllByRole('columnheader').map((h) => h.textContent?.trim())).toEqual(['Root', 'Section', 'Owner']);
        const rows = bodyCells(table);
        expect(rows).toHaveLength(CONFIG_SECTIONS.length);
        for (const s of CONFIG_SECTIONS) {
            const row = rows.find((r) => r[0] === s.root);
            expect(row?.[1]).toContain(s.title);
            expect(row?.[2]).toBe(s.owner);
        }
        // The counts ride the Section cell, one per kind, read from `counts`.
        const ux = [...table.querySelectorAll('[data-config-counts]')].find((c) => c.closest('td')?.textContent?.includes('Beam UX'))!;
        expect([...ux.querySelectorAll('[data-config-count]')].map((c) => c.textContent)).toEqual(['6 keys', '2 changeable', '4 deploy-only', '0 secrets']);
        const chat = [...table.querySelectorAll('[data-config-counts]')].find((c) => c.closest('td')?.textContent?.includes('Chat'))!;
        expect(chat.querySelector('[data-config-count="secrets"]')?.textContent).toBe('1 secret');

        fireEvent.click(within(table).getByText('Beam UX'));
        await waitFor(() => expect(document.querySelector('[data-config-section="beam.ux"]')).not.toBeNull());
    });

    it('without a manifest (the fallback): the same three columns pass through, with the counts', async () => {
        mount(undefined, { manifest: false });
        const table = await indexTable();
        expect(within(table).getAllByRole('columnheader').map((h) => h.textContent?.trim())).toEqual(['Root', 'Section', 'Owner']);
        expect(bodyCells(table).find((r) => r[0] === 'beam.tenancy')?.[1]).toContain('1 key');
    });
});

/** 101 sections: more than one page of the rail's 100. The last sorts last and is the one a search must find. */
function manySections(): ConfigSectionData[] {
    return Array.from({ length: 101 }, (_, i) => {
        const n = String(i + 1).padStart(3, '0');
        const root = i === 100 ? 'zeta.last' : `pkg.s${n}`;
        return { ...BEAM_TENANCY, id: root, root, title: i === 100 ? 'Zeta the hundred-and-first' : `Section ${n}` };
    });
}

/** A server that honours `per_page` and `page` and caps a page at 100, as the declared `perPage: 100` does. */
function pagingServer(rows: ConfigSectionData[]) {
    const calls: Record<string, string>[] = [];
    const list = (async (_resource: string, params: Record<string, string>) => {
        calls.push({ ...params });
        const per = Math.min(Number(params.per_page ?? 25), 100);
        const page = Number(params.page ?? 1);
        return { data: rows.slice((page - 1) * per, page * per), total: rows.length, page, perPage: per };
    }) as FrameTransport['list'];
    return { calls, list };
}

describe('the rail reads every page', () => {
    it('numbered pages: 101 sections across two pages of 100, and search finds the 101st', async () => {
        const rows = manySections();
        const server = pagingServer(rows);
        const kit = createFrameKit({ transport: createMemoryTransport({ rows: { 'beam-config': rows }, manifest: BEAM_CONFIG_MANIFEST }, { list: server.list }), urlState: 'memory' });
        render(
            <kit.Provider>
                <ConfigArea resource="beam-config" />
            </kit.Provider>,
        );
        await waitFor(() => expect(within(rail()).getByText('All sections').parentElement?.textContent).toContain('101'));
        expect(server.calls).toEqual(expect.arrayContaining([{ per_page: '100' }, { per_page: '100', page: '2' }]));
        fireEvent.change(within(rail()).getByLabelText('Find a section'), { target: { value: 'zeta' } });
        fireEvent.click(within(rail()).getByText('Zeta the hundred-and-first'));
        await waitFor(() => expect(document.querySelector('[data-config-section="zeta.last"]')).not.toBeNull());
    });

    it('cursor pages: follows nextCursor until it is null', async () => {
        const rows = manySections();
        const kit = createFrameKit({
            transport: createMemoryTransport({
                cursorPages: {
                    '': { data: rows.slice(0, 100), perPage: 100, nextCursor: 'c2' },
                    c2: { data: rows.slice(100), perPage: 100, nextCursor: null },
                },
                rows: { 'beam-config': rows },
                manifest: BEAM_CONFIG_MANIFEST,
            }),
            urlState: 'memory',
        });
        render(
            <kit.Provider>
                <ConfigArea resource="beam-config" />
            </kit.Provider>,
        );
        await waitFor(() => expect(within(rail()).getByText('All sections').parentElement?.textContent).toContain('101'));
        fireEvent.change(within(rail()).getByLabelText('Find a section'), { target: { value: 'zeta' } });
        expect(within(rail()).getByText('Zeta the hundred-and-first')).toBeTruthy();
    });

    it('a transport that never ends its pages stops with an error, not a loop', async () => {
        const list = (async () => ({ data: [{ ...BEAM_TENANCY, id: `x${Math.random()}` }], perPage: 1, nextCursor: 'again' })) as unknown as FrameTransport['list'];
        await expect(listAllRows({ ...createMemoryTransport(), list }, 'beam-config', 1)).rejects.toThrow('more than 100 pages');
    });
});

describe('the section rail', () => {
    it('groups the sections by family, finds one, and opens it', async () => {
        mount();
        await waitFor(() => expect(within(rail()).getByText('Beam UX')).toBeTruthy());
        expect(within(rail()).getByText('app')).toBeTruthy();
        expect(within(rail()).getByText('beam')).toBeTruthy();
        expect(within(rail()).getByText('All sections').parentElement?.textContent).toContain('3');

        fireEvent.change(within(rail()).getByLabelText('Find a section'), { target: { value: 'tenan' } });
        expect(within(rail()).queryByText('Beam UX')).toBeNull();
        fireEvent.click(within(rail()).getByText('Tenancy'));
        await waitFor(() => expect(document.querySelector('[data-config-section="beam.tenancy"]')).not.toBeNull());
        expect(within(rail()).getByText('Tenancy').closest('button')?.getAttribute('aria-current')).toBe('page');
    });
});

describe('the key table', () => {
    it('shows Key · Value · Set by · Fed by · Applies, labelled from the section schema', async () => {
        mount('beam.ux');
        const row = await keyRow('/cache_ttl');
        const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
        expect(headers).toEqual(['Key', 'Value', 'Set by', 'Fed by', 'Applies']);
        expect(within(row).getByText('Page cache lifetime')).toBeTruthy();
        expect(within(row).getByText('/cache_ttl')).toBeTruthy();
        expect(within(row).getByText('600')).toBeTruthy();
        expect(row.querySelector('[data-config-tier="host"]')?.textContent).toBe('host file');
        expect(row.querySelector('[data-config-fed-by="env"]')?.textContent).toContain('BEAM_UX_CACHE_TTL');
        expect(row.querySelector('[data-config-fed-by="env"]')?.textContent).toContain('unset · file default');
        expect(row.querySelector('[data-config-effect]')?.getAttribute('data-config-effect')).toBe('reload');
    });

    it('never labels a key with its raw key name: an untitled key is humanized, a dotted pointer is one token', async () => {
        mount('app.chat');
        const row = await keyRow('/google.cse.query/limit');
        expect(within(row).getByText('Limit')).toBeTruthy();
        expect(row.querySelector('th button span')?.textContent).not.toBe('limit');
        expect(within(await keyRow('/default_model')).getByText('Default model')).toBeTruthy();
    });

    it('reads a provider-written key, a host file key and a package key as their Fed-by source', async () => {
        mount('beam.ux');
        expect((await keyRow('/site/reserved_prefixes')).querySelector('[data-config-fed-by]')?.getAttribute('data-config-fed-by')).toBe('provider');
        expect((await keyRow('/site/artifact_root')).querySelector('[data-config-fed-by="file"]')?.textContent).toContain('config/beam/ux.php');
        expect((await keyRow('/mode')).querySelector('[data-config-fed-by="file"]')?.textContent).toContain('vendor/splicewire/laravel-beam-ux/config/beam/ux.php');
    });

    it('filters keys with chips over what the row carries', async () => {
        mount('beam.ux');
        await keyRow('/cache_ttl');
        const chip = (name: RegExp) => screen.getByRole('tab', { name });
        expect(chip(/^All/).textContent).toContain('6');
        expect(chip(/^Changeable/).textContent).toContain('2');
        expect(chip(/^Deploy-only/).textContent).toContain('4');
        expect(chip(/^Env-fed/).textContent).toContain('1');
        expect((chip(/^Secrets/) as HTMLButtonElement).disabled).toBe(true);

        fireEvent.click(chip(/^Changeable/));
        expect(document.querySelectorAll('tr[data-config-key]').length).toBe(2);
        expect(document.querySelector('tr[data-config-key="/theme"]')).toBeNull();
        fireEvent.click(chip(/^Deploy-only/));
        expect([...document.querySelectorAll('tr[data-config-key]')].map((r) => r.getAttribute('data-config-key'))).toEqual([
            '/theme',
            '/legacy_blocks',
            '/site/artifact_root',
            '/site/reserved_prefixes',
        ]);
    });

    it('names the shadowed package keys and the provider-written keys above the table', async () => {
        mount('beam.ux');
        await keyRow('/cache_ttl');
        const notes = screen.getAllByRole('note').map((n) => n.textContent ?? '');
        expect(notes.some((n) => n.includes('replaces 1 package key') && n.includes('/site/artifact_root'))).toBe(true);
        expect(notes.some((n) => n.includes('2 keys are written by a service provider'))).toBe(true);
    });
});

describe('the Cascade inspector', () => {
    it('stacks the layers top-down and strikes the losing values through', async () => {
        mount('beam.ux');
        fireEvent.click(within(await keyRow('/site/reserved_prefixes')).getByRole('button', { name: /Where .* comes from/ }));
        const pane = await screen.findByRole('complementary', { name: 'Cascade for Reserved URL prefixes' });
        const layers = [...pane.querySelectorAll('[data-config-layer]')];
        expect(layers.map((l) => l.getAttribute('data-config-layer'))).toEqual(['provider', 'host', 'package']);
        expect(layers.map((l) => l.getAttribute('data-config-standing'))).toEqual(['wins', 'loses', 'loses']);
        const struck = layers[1].querySelector('[data-config-value]') as HTMLElement;
        expect(struck.className).toContain('line-through');
        expect(struck.textContent).toBe('["admin"]');
        expect((layers[0].querySelector('[data-config-value]') as HTMLElement).className).not.toContain('line-through');
    });

    it('marks a shadowed package layer and a removed one with why they are out of play', async () => {
        mount('beam.ux');
        fireEvent.click(within(await keyRow('/site/artifact_root')).getByText('Artifact root'));
        let pane = await screen.findByRole('complementary', { name: 'Cascade for Artifact root' });
        const shadowed = pane.querySelector('[data-config-standing="shadowed"]') as HTMLElement;
        expect(shadowed.getAttribute('data-config-layer')).toBe('package');
        expect(shadowed.textContent).toContain('hidden by the host file’s top-level copy');
        expect(shadowed.querySelector('[data-config-value]')?.className).toContain('line-through');

        fireEvent.click(within(await keyRow('/legacy_blocks')).getByText('Legacy blocks'));
        pane = await screen.findByRole('complementary', { name: 'Cascade for Legacy blocks' });
        const removed = pane.querySelector('[data-config-standing="removed"]') as HTMLElement;
        expect(removed.textContent).toContain('removed from config() by a service provider');
        expect(pane.querySelector('[data-config-standing="wins"]')?.getAttribute('data-config-layer')).toBe('provider');
    });

    // config-sections 17: the package closed Validation mode to the operator tier.
    const CLOSED_UX: ConfigSectionData = {
        ...BEAM_UX,
        keys: BEAM_UX.keys.map((k) => (k.pointer === '/mode' ? { ...k, closed: ['operator'], overridable: false } : k)),
    };

    it('draws a tier the package closed as closed, in its place on the ladder, never as not set', async () => {
        mount('beam.ux', { rows: [APP_CHAT, CLOSED_UX, BEAM_TENANCY] });
        fireEvent.click(within(await keyRow('/mode')).getByText('Validation mode'));
        const pane = await screen.findByRole('complementary', { name: 'Cascade for Validation mode' });
        const layers = [...pane.querySelectorAll('[data-config-layer]')];
        expect(layers.map((l) => [l.getAttribute('data-config-layer'), l.getAttribute('data-config-standing')])).toEqual([
            ['operator', 'closed'],
            ['package', 'wins'],
        ]);
        expect(layers[0]!.textContent).toContain('The package closed this key to the operator.');
        expect(layers[0]!.textContent).not.toMatch(/not set/i);
        expect(pane.querySelector('[data-config-closed-to="operator"]')?.textContent).toBe('closed to the operator');
    });

    it('draws no closed row for an open key', async () => {
        mount('beam.ux');
        fireEvent.click(within(await keyRow('/mode')).getByText('Validation mode'));
        const pane = await screen.findByRole('complementary', { name: 'Cascade for Validation mode' });
        expect(pane.querySelector('[data-config-standing="closed"], [data-config-closed-to]')).toBeNull();
    });

    it('closes', async () => {
        mount('beam.ux');
        fireEvent.click(within(await keyRow('/mode')).getByText('Validation mode'));
        fireEvent.click(await screen.findByRole('button', { name: 'Close the inspector' }));
        expect(screen.queryByRole('complementary', { name: /Cascade for/ })).toBeNull();
    });
});

describe('the states a key renders', () => {
    it('deploy-only names its env var', async () => {
        mount('app.chat');
        fireEvent.click(within(await keyRow('/openai/api_key')).getByText('OpenAI API key'));
        const note = (await screen.findByRole('complementary', { name: 'Cascade for OpenAI API key' })).querySelector('[data-config-change]');
        expect(note?.getAttribute('data-config-change')).toBe('deploy');
        expect(note?.textContent).toBe('Deploy-only. Set OPENAI_API_KEY in the server environment, then deploy.');
    });

    it('deploy-only names its file when no env var feeds it, and the provider when one writes it', async () => {
        mount('beam.ux');
        fireEvent.click(within(await keyRow('/site/artifact_root')).getByText('Artifact root'));
        expect((await screen.findByRole('complementary', { name: 'Cascade for Artifact root' })).querySelector('[data-config-change]')?.textContent).toBe(
            'Deploy-only. Edit config/beam/ux.php, then deploy.',
        );
        fireEvent.click(within(await keyRow('/legacy_blocks')).getByText('Legacy blocks'));
        expect((await screen.findByRole('complementary', { name: 'Cascade for Legacy blocks' })).querySelector('[data-config-change]')?.textContent).toContain(
            'A service provider writes it at boot',
        );
    });

    it('reload and live say when a change applies', async () => {
        mount('beam.ux');
        fireEvent.click(within(await keyRow('/cache_ttl')).getByText('Page cache lifetime'));
        const reload = (await screen.findByRole('complementary', { name: 'Cascade for Page cache lifetime' })).querySelector('[data-config-change]');
        expect(reload?.getAttribute('data-config-change')).toBe('reload');
        expect(reload?.textContent).toBe('Applies after long-lived workers reload.');
        expect((await keyRow('/cache_ttl')).querySelector('[data-config-effect="reload"]')?.textContent).toBe('on reload');

        fireEvent.click(within(await keyRow('/mode')).getByText('Validation mode'));
        const live = (await screen.findByRole('complementary', { name: 'Cascade for Validation mode' })).querySelector('[data-config-change]');
        expect(live?.getAttribute('data-config-change')).toBe('live');
        expect(live?.textContent).toBe('Applies on the next request, job and command.');
        expect((await keyRow('/mode')).querySelector('[data-config-effect="live"]')?.textContent).toBe('live');
    });

    it('an env var the process cannot see under config:cache reads as unknown, never as file default', async () => {
        mount('app.chat');
        const fed = (await keyRow('/default_model')).querySelector('[data-config-fed-by="env"]');
        expect(fed?.textContent).toContain('unknown under config:cache');
        expect(fed?.textContent).not.toContain('file default');
    });

    it('a declared control the kit registers mounts read-only through widgetProps, labelled from the schema', async () => {
        mount('app.chat');
        const cell = (await keyRow('/default_model')).querySelector('[data-config-value="widget"]');
        const widget = cell?.querySelector('[data-test-widget="model-picker"]');
        expect(widget?.textContent).toBe('gpt-x');
        expect(widget?.getAttribute('data-readonly')).toBe('true');
        expect(widget?.getAttribute('data-disabled')).toBe('true');
        expect(widget?.getAttribute('data-label')).toBe('Default model');
        expect(widget?.getAttribute('data-schema-title')).toBe('Default model');
    });

    it('a declared control nothing registers draws the unbound marker, not a default input', async () => {
        mount('beam.ux');
        const row = await keyRow('/theme');
        const marker = row.querySelector('[data-frame-unbound]');
        expect(marker?.getAttribute('data-frame-unbound-widget')).toBe('brand-picker');
        expect(row.querySelector('input, textarea, select')).toBeNull();
    });
});

describe('the secret state', () => {
    it('shows set or not set, and a secret value never reaches the DOM', async () => {
        mount('app.chat');
        const row = await keyRow('/openai/api_key');
        expect(row.querySelector('[data-config-secret]')?.textContent).toBe('set');
        expect(document.body.innerHTML).not.toContain(SECRET_CANARY);

        // Every surface that shows the key: the inspector (each layer), every filter, and the index.
        fireEvent.click(within(row).getByRole('button', { name: /Where .* comes from/ }));
        const pane = await screen.findByRole('complementary', { name: 'Cascade for OpenAI API key' });
        expect(pane.querySelector('[data-config-standing="wins"] [data-config-secret]')?.textContent).toBe('set');
        expect(document.body.innerHTML).not.toContain(SECRET_CANARY);
        for (const tab of screen.getAllByRole('tab')) {
            if (!(tab as HTMLButtonElement).disabled) fireEvent.click(tab);
            expect(document.body.innerHTML).not.toContain(SECRET_CANARY);
        }
        // Not as an attribute value or title either.
        for (const el of document.body.querySelectorAll('*')) {
            for (const attr of el.getAttributeNames()) expect(el.getAttribute(attr) ?? '').not.toContain(SECRET_CANARY);
        }
    });

    it('reads not set for a secret without a value', async () => {
        const unset = { ...APP_CHAT, id: 'app.chat.unset', keys: APP_CHAT.keys.map((k) => (k.secret ? { ...k, set: false, value: null, layers: [] } : k)) };
        const kit = createFrameKit({ transport: createMemoryTransport({ rows: { 'beam-config': [unset, BEAM_UX] } }), urlState: 'memory' });
        render(
            <kit.Provider>
                <ConfigArea resource="beam-config" section="app.chat.unset" />
            </kit.Provider>,
        );
        expect((await keyRow('/openai/api_key')).querySelector('[data-config-secret]')?.textContent).toBe('not set');
    });
});
