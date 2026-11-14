// @vitest-environment jsdom
// config-sections 10a: the Config area's read half over fixture `beam-config` rows, served by frame's memory transport
// through the real kit (createFrameKit: the real ListShell, data hooks and widget registry; nothing is mocked).
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { WidgetProps } from '@rjsf/utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createFrameKit } from '@schemastud/frame';
import { createMemoryTransport } from '@schemastud/frame/testing';
import { ConfigArea } from './ConfigArea';
import { APP_CHAT, BEAM_UX, CONFIG_SECTIONS, SECRET_CANARY } from './ConfigArea.fixtures';

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

function mount(section?: string) {
    const kit = createFrameKit({
        transport: createMemoryTransport({ rows: { 'beam-config': CONFIG_SECTIONS } }),
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

describe('the all-sections index on ListShell', () => {
    it('lists every section with its root, owner and counts, and opens one', async () => {
        mount();
        const main = await waitFor(() => {
            const table = document.querySelector('[data-beam-config-area] table');
            expect(table).not.toBeNull();
            return table as HTMLElement;
        });
        await waitFor(() => expect(within(main).getByText('beam.ux')).toBeTruthy());
        for (const s of CONFIG_SECTIONS) {
            expect(within(main).getByText(s.title)).toBeTruthy();
            expect(within(main).getByText(s.owner)).toBeTruthy();
        }
        expect(within(main).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(
            expect.arrayContaining(['Section', 'Owner', 'Keys', 'Changeable', 'Deploy-only', 'Secrets']),
        );
        fireEvent.click(within(main).getByText('Beam UX'));
        await waitFor(() => expect(document.querySelector('[data-config-section="beam.ux"]')).not.toBeNull());
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
