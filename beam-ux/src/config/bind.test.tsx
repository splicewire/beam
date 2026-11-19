// @vitest-environment jsdom
// config-sections 10b: the realm view of a section, and the binding surface (useConfigValue, ConfigFields).
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { createFrameKit } from '@schemastud/frame';
import { createMemoryTransport } from '@schemastud/frame/testing';
import { ConfigFields, useConfigValue } from './bind';
import { admitsTenant, keyFor, resolveConfigValue, sectionForRealm, valueAt } from './model';
import { APP_CHAT, BEAM_UX, SECRET_CANARY } from './ConfigArea.fixtures';
import type { ConfigSectionData } from './model';

afterEach(cleanup);

describe('the realm view of a section', () => {
    it('admits a key to the tenant realm only when its ceiling reaches the tenant tier', () => {
        expect(BEAM_UX.keys.filter(admitsTenant).map((k) => k.pointer)).toEqual(['/mode']);
        expect(APP_CHAT.keys.filter(admitsTenant).map((k) => k.pointer)).toEqual(['/default_model']);
    });

    it('leaves the operator realm row as served', () => {
        expect(sectionForRealm(APP_CHAT, 'operator')).toBe(APP_CHAT);
    });

    it('drops every env name, install path and layer source in the tenant realm', () => {
        const tenant = sectionForRealm(APP_CHAT, 'tenant');
        expect(tenant.keys.map((k) => k.pointer)).toEqual(['/default_model']);
        expect(tenant.files).toEqual({ package: null, host: null });
        expect(tenant.keys.every((k) => k.env === null && k.layers.every((l) => l.source === null))).toBe(true);
        const text = JSON.stringify(tenant);
        expect(text).not.toContain('CHAT_DEFAULT_MODEL');
        expect(text).not.toContain('OPENAI_API_KEY');
    });
});

describe('resolving a pointer', () => {
    it('finds the exact key, or the nearest declared key above a pointer into its value', () => {
        expect(keyFor(BEAM_UX, '/site/reserved_prefixes')?.pointer).toBe('/site/reserved_prefixes');
        expect(keyFor(BEAM_UX, '/site/reserved_prefixes/0')?.pointer).toBe('/site/reserved_prefixes');
        expect(keyFor(BEAM_UX, '/nope')).toBeUndefined();
    });

    it('reads the effective values, through objects and lists', () => {
        expect(valueAt(BEAM_UX, '/mode')).toBe(BEAM_UX.values.mode);
        expect(valueAt(BEAM_UX, '/nope/deeper')).toBeUndefined();
    });

    it("never answers a secret's value, only whether it is set", () => {
        const resolved = resolveConfigValue(APP_CHAT, '/openai/api_key');
        expect(resolved).toMatchObject({ secret: true, value: undefined, set: true });
        expect(JSON.stringify(resolved.value ?? null)).not.toContain(SECRET_CANARY);
    });
});

function kit(rows: ConfigSectionData[]) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return createFrameKit({ queryClient, transport: createMemoryTransport({ rows: { 'beam-config': rows } }), urlState: 'memory' });
}

function Probe({ root, pointer, realm }: { root: string; pointer: string; realm?: 'operator' | 'tenant' }) {
    const v = useConfigValue('beam-config', root, pointer, realm);
    if (v.isPending) return <p>pending</p>;
    return <p data-testid="probe">{JSON.stringify({ value: v.value ?? null, secret: v.secret, set: v.set, key: v.key?.pointer ?? null })}</p>;
}

describe('useConfigValue', () => {
    it('reads one pointer of one section', async () => {
        const { Provider } = kit([BEAM_UX]);
        render(<Provider><Probe root="beam.ux" pointer="/mode" /></Provider>);
        await waitFor(() => expect(screen.getByTestId('probe').textContent).toContain('"key":"/mode"'));
    });

    it('answers nothing in the tenant realm for a key the tenant tier cannot reach', async () => {
        const { Provider } = kit([BEAM_UX]);
        render(<Provider><Probe root="beam.ux" pointer="/cache_ttl" realm="tenant" /></Provider>);
        await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe(JSON.stringify({ value: null, secret: false, set: false, key: null })));
    });

    it('keeps a secret out of the DOM', async () => {
        const { Provider } = kit([APP_CHAT]);
        const { container } = render(<Provider><Probe root="app.chat" pointer="/openai/api_key" /></Provider>);
        await waitFor(() => expect(screen.getByTestId('probe').textContent).toContain('"secret":true'));
        expect(container.innerHTML).not.toContain(SECRET_CANARY);
    });
});

describe('ConfigFields', () => {
    it('labels each pointer from the schema and keeps secrets out of the DOM', async () => {
        const { Provider } = kit([APP_CHAT]);
        const { container } = render(
            <Provider>
                <ConfigFields resource="beam-config" root="app.chat" pointers={['/default_model', '/openai/api_key']} />
            </Provider>,
        );
        await waitFor(() => expect(container.querySelector('[data-config-fields="app.chat"]')).not.toBeNull());
        expect(container.querySelectorAll('[data-config-field]').length).toBe(2);
        expect(container.innerHTML).not.toContain(SECRET_CANARY);
        // A field is labelled by the schema or a humanized token, never by its raw pointer.
        expect(container.querySelector('dt')?.textContent).not.toMatch(/^\//);
    });

    it('shows only tenant-reachable pointers in the tenant realm, with no env name', async () => {
        const { Provider } = kit([APP_CHAT]);
        const { container } = render(
            <Provider>
                <ConfigFields resource="beam-config" root="app.chat" pointers={['/default_model', '/openai/api_key', '/google.cse.query/limit']} realm="tenant" />
            </Provider>,
        );
        await waitFor(() => expect(container.querySelector('[data-config-fields="app.chat"]')).not.toBeNull());
        expect([...container.querySelectorAll('[data-config-field]')].map((n) => n.getAttribute('data-config-field'))).toEqual(['/default_model']);
        expect(container.innerHTML).not.toContain('CHAT_DEFAULT_MODEL');
    });
});
