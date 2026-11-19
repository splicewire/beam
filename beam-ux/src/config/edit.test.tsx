// @vitest-environment jsdom
// config-sections 10b: the Config area's write half calls laravel-beam's beam-config ops with the payloads they declare.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFrameKit, type FrameManifest } from '@schemastud/frame';
import { createMemoryTransport } from '@schemastud/frame/testing';
import { DraftBar, EditSlot, LockControl, RELEASE_KIND_CONFIG } from './edit';
import { APP_CHAT, BEAM_UX, SECRET_CANARY } from './ConfigArea.fixtures';
import { BEAM_CONFIG_MANIFEST } from './ConfigArea.manifest.fixtures';
import type { ConfigKeyData, ConfigSectionData } from './model';

afterEach(cleanup);

/** A button once its op is declared: frame's manifest loads asynchronously, and a control waits for it. */
async function enabled(name: string): Promise<HTMLElement> {
    const button = await screen.findByRole('button', { name });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    return button;
}

const OPS = ['save-draft', 'publish', 'discard-draft', 'restore', 'lock'];

/**
 * The beam-config manifest with the ops declared as actions on its CONTEXT entry (what frame's `manifestFor` returns), each
 * allowed in `can.actions`, as laravel-beam lists a mounted op (`Frame/ParticleResourceActions`: key = the op's name).
 */
function manifestWithOps(): FrameManifest {
    const m = structuredClone(BEAM_CONFIG_MANIFEST) as unknown as { contexts: Record<string, Record<string, unknown>> };
    const action = (key: string, scope: 'resource' | 'record', url: string) => ({ key, label: key, scope, method: 'POST', url, input: null, result: 'toast', destructive: false });
    const config = m.contexts['beam-config']!;
    config.actions = OPS.map((key) => action(key, 'resource', `/beam-config/${key}`));
    config.can = { actions: Object.fromEntries(OPS.map((key) => [key, true])) };
    m.contexts['beam-ux-release'] = { ...config, actions: [action('command', 'record', '/beam-ux-release/{id}/command')], can: { actions: { command: true } } };
    return m as unknown as FrameManifest;
}

function kit(rows: ConfigSectionData[]) {
    const invoke = vi.fn(async (action: { key: string }, target: { id?: string | null; data: unknown }) => ({ message: `${action.key} done`, data: null, _target: target }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const transport = createMemoryTransport({ rows: { 'beam-config': rows }, manifest: manifestWithOps() }, { invoke });
    return { invoke, ...createFrameKit({ queryClient, transport, urlState: 'memory' }) };
}

const MODE = BEAM_UX.keys.find((k) => k.pointer === '/mode')!;
const editable: ConfigKeyData = { ...MODE, overridable: true, effect: 'live', ceiling: 'tenant' };
const SECTION: ConfigSectionData = {
    ...BEAM_UX,
    keys: BEAM_UX.keys.map((k) => (k.pointer === '/mode' ? editable : k)),
    overrides: [{ pointer: '/mode', op: 'set', value: 'review', secret: false, set: true, setAt: null, revision: 'r1' }],
    pins: { draft: 2, published: 1, draftPending: true },
};

describe('EditSlot', () => {
    it("saves a draft 'set' as the JSON text save-draft takes", async () => {
        const { Provider, invoke } = kit([SECTION]);
        render(<Provider><EditSlot resource="beam-config" section={SECTION} keyData={editable} realm="operator" /></Provider>);
        fireEvent.click(await enabled('Save draft'));
        await waitFor(() => expect(invoke).toHaveBeenCalled());
        const [action, target] = invoke.mock.calls[0]!;
        expect(action.key).toBe('save-draft');
        expect(target.data).toEqual({ root: 'beam.ux', pointer: '/mode', op: 'set', value: JSON.stringify('review') });
    });

    it("inherits with an 'unset' and no value", async () => {
        const { Provider, invoke } = kit([SECTION]);
        render(<Provider><EditSlot resource="beam-config" section={SECTION} keyData={editable} realm="operator" /></Provider>);
        fireEvent.click(await enabled('Inherit'));
        await waitFor(() => expect(invoke).toHaveBeenCalled());
        expect(invoke.mock.calls[0]![1].data).toMatchObject({ op: 'unset', value: null });
    });

    it('offers nothing for a deploy-only key, and names the lock for a tenant', () => {
        const deploy = BEAM_UX.keys.find((k) => k.effect === 'deploy')!;
        const { Provider } = kit([SECTION]);
        const { container, rerender } = render(<Provider><EditSlot resource="beam-config" section={SECTION} keyData={deploy} realm="operator" /></Provider>);
        expect(container.querySelector('[data-config-edit-slot]')).toBeNull();
        const locked = { ...editable, lock: { pointer: '/mode', reason: 'Set by the operator', lockedAt: null } };
        rerender(<Provider><EditSlot resource="beam-config" section={{ ...SECTION, tier: 'tenant' }} keyData={locked} realm="tenant" /></Provider>);
        expect(screen.getByText(/Set by the operator/)).toBeTruthy();
        expect(container.querySelector('[data-config-edit-slot]')).toBeNull();
    });

    it("never prefills a secret's value", () => {
        const secret = { ...APP_CHAT.keys.find((k) => k.secret)!, overridable: true, effect: 'live' as const, ceiling: 'operator' as const };
        const section = { ...APP_CHAT, keys: [secret] };
        const { Provider } = kit([section]);
        const { container } = render(<Provider><EditSlot resource="beam-config" section={section} keyData={secret} realm="operator" /></Provider>);
        expect(container.innerHTML).not.toContain(SECRET_CANARY);
        expect(container.querySelector('input[type="password"]')).not.toBeNull();
    });
});

describe('LockControl', () => {
    it('unlocks with the lock op and locked:false, in the operator realm only', async () => {
        const locked = { ...editable, lock: { pointer: '/mode', reason: 'Policy', lockedAt: null } };
        const { Provider, invoke } = kit([SECTION]);
        const { container, rerender } = render(<Provider><LockControl resource="beam-config" section={SECTION} keyData={locked} realm="operator" /></Provider>);
        fireEvent.click(await enabled('Unlock'));
        await waitFor(() => expect(invoke).toHaveBeenCalled());
        expect(invoke.mock.calls[0]![0].key).toBe('lock');
        expect(invoke.mock.calls[0]![1].data).toEqual({ root: 'beam.ux', pointer: '/mode', locked: false });
        rerender(<Provider><LockControl resource="beam-config" section={SECTION} keyData={locked} realm="tenant" /></Provider>);
        expect(container.querySelector('[data-config-lock]')).toBeNull();
    });
});

describe('DraftBar', () => {
    it('shows the key-level diff and publishes or discards the section', async () => {
        const { Provider, invoke } = kit([SECTION]);
        const { container } = render(<Provider><DraftBar resource="beam-config" section={SECTION} /></Provider>);
        expect(container.querySelector('[data-config-diff-line="/mode"]')).not.toBeNull();
        fireEvent.click(await enabled('Publish'));
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
        expect(invoke.mock.calls[0]![0].key).toBe('publish');
        expect(invoke.mock.calls[0]![1].data).toEqual({ root: 'beam.ux' });
        fireEvent.click(await enabled('Discard'));
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
        expect(invoke.mock.calls[1]![0].key).toBe('discard-draft');
    });

    it('adds the section to the open Release as a config-override member', async () => {
        const { Provider, invoke } = kit([SECTION]);
        render(<Provider><DraftBar resource="beam-config" section={SECTION} release={{ resource: 'beam-ux-release', id: 'rel-1' }} /></Provider>);
        fireEvent.click(await enabled('Add to the Release'));
        await waitFor(() => expect(invoke).toHaveBeenCalled());
        const [action, target] = invoke.mock.calls[0]!;
        expect(action.key).toBe('command');
        expect(target).toMatchObject({ id: 'rel-1', data: { action: 'member', kind: RELEASE_KIND_CONFIG, ref: 'beam.ux' } });
    });

    it('renders nothing with no draft', () => {
        const { Provider } = kit([BEAM_UX]);
        const { container } = render(<Provider><DraftBar resource="beam-config" section={BEAM_UX} /></Provider>);
        expect(container.querySelector('[data-config-draft-bar]')).toBeNull();
    });
});
