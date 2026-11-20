// @vitest-environment jsdom
// config-sections 10b: the Config area's write half calls laravel-beam's beam-config ops with the payloads they declare.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFrameKit, type FrameManifest } from '@schemastud/frame';
import { createMemoryTransport } from '@schemastud/frame/testing';
import { DraftBar, EditSlot, LockControl, RELEASE_KIND_CONFIG, VersionsPanel } from './edit';
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

const OPS = ['save-draft', 'publish', 'discard-draft', 'versions', 'restore', 'lock'];

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
    // No `beam-ux-release` context: the Release command is not a frame action on the server, so the test does not
    // pretend it is. The draft bar takes the host's callback instead.
    return m as unknown as FrameManifest;
}

function kit(rows: ConfigSectionData[]) {
    const invoke = vi.fn(
        async (action: { key: string }, target: { id?: string | null; data: unknown }): Promise<{ message: string; data: unknown; _target: unknown }> => ({
            message: `${action.key} done`,
            data: null,
            _target: target,
        }),
    );
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
    it("saves an edited value as a draft 'set', as the JSON text save-draft takes", async () => {
        const { Provider, invoke } = kit([SECTION]);
        render(<Provider><EditSlot resource="beam-config" section={SECTION} keyData={editable} realm="operator" /></Provider>);
        // the enum control's option values are the JSON-encoded choices
        fireEvent.change(screen.getByLabelText('Validation mode'), { target: { value: JSON.stringify('lenient') } });
        fireEvent.click(await enabled('Save draft'));
        await waitFor(() => expect(invoke).toHaveBeenCalled());
        const [action, target] = invoke.mock.calls[0]!;
        expect(action.key).toBe('save-draft');
        expect(target.data).toEqual({ root: 'beam.ux', pointer: '/mode', op: 'set', value: JSON.stringify('lenient') });
    });

    it('keeps Save disabled until the value is edited, so an untouched Save writes nothing', async () => {
        const { Provider, invoke } = kit([SECTION]);
        render(<Provider><EditSlot resource="beam-config" section={SECTION} keyData={editable} realm="operator" /></Provider>);
        await enabled('Inherit'); // the manifest has loaded: every declared op is available now
        const save = screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement;
        expect(save.disabled).toBe(true);
        fireEvent.click(save);
        expect(invoke).not.toHaveBeenCalled();
    });

    it("never saves an untouched secret (which would draft it to null and wipe it on publish), and saves what is typed", async () => {
        const secret = { ...APP_CHAT.keys.find((k) => k.secret)!, overridable: true, effect: 'live' as const, ceiling: 'operator' as const };
        const section = { ...APP_CHAT, keys: [secret] };
        const { Provider, invoke } = kit([section]);
        const { container } = render(<Provider><EditSlot resource="beam-config" section={section} keyData={secret} realm="operator" /></Provider>);
        await enabled('Inherit');
        const save = screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement;
        expect(save.disabled).toBe(true);
        fireEvent.click(save);
        expect(invoke).not.toHaveBeenCalled();
        fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'sk-new' } });
        fireEvent.click(await enabled('Save draft'));
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
        expect(invoke.mock.calls[0]![1].data).toEqual({ root: section.root, pointer: secret.pointer, op: 'set', value: JSON.stringify('sk-new') });
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

// config-sections 10b (flagship browser proof finding, lead ruling 21:21Z): "Your value" must follow the section's pins.
// The /mode editor is an uncontrolled enum <select> whose option values are the JSON-encoded choices (as the 'saves an
// edited value' test above notes), so values read back JSON-quoted. The live value is 'strict'.
describe('EditSlot after the pins move', () => {
    const fieldValue = (container: HTMLElement) =>
        (container.querySelector('[data-config-edit-slot] select, [data-config-edit-slot] textarea, [data-config-edit-slot] input') as HTMLSelectElement | null)?.value;
    const withDraft = (value: string, draft: number): ConfigSectionData => ({
        ...SECTION,
        overrides: [{ pointer: '/mode', op: 'set', value, secret: false, set: true, setAt: null, revision: `r${draft}` }],
        pins: { draft, published: 1, draftPending: true },
    });
    // Wire-faithful pins (r10 NIT-1): after a Discard or a Publish the draft pin EQUALS the published one
    // (laravel-beam ConfigOverrideStore::discardDraft / publish), e.g. {1,1,false} and {2,2,false}.
    const live = (value: string, published: number, root = SECTION.root): { section: ConfigSectionData; key: ConfigKeyData } => {
        const key = { ...editable, value };
        return { key, section: { ...SECTION, root, keys: SECTION.keys.map((k) => (k.pointer === '/mode' ? key : k)), overrides: [], pins: { draft: published, published, draftPending: false } } };
    };

    it('shows the LIVE value again after a Discard, not the discarded draft', () => {
        const { Provider } = kit([SECTION]);
        const { container, rerender } = render(<Provider><EditSlot resource="beam-config" section={withDraft('lenient', 2)} keyData={editable} realm="operator" /></Provider>);
        expect(fieldValue(container)).toBe('"lenient"');
        const discarded = live('strict', 1);
        rerender(<Provider><EditSlot resource="beam-config" section={discarded.section} keyData={discarded.key} realm="operator" /></Provider>);
        expect(fieldValue(container)).toBe('"strict"');
    });

    it('starts clean after a Publish: an edit typed before it is not left armed for the next Save draft', async () => {
        const { Provider } = kit([SECTION]);
        const before = live('strict', 1);
        const { container, rerender } = render(<Provider><EditSlot resource="beam-config" section={before.section} keyData={before.key} realm="operator" /></Provider>);
        fireEvent.change(screen.getByLabelText('Validation mode'), { target: { value: JSON.stringify('lenient') } });
        expect(((await enabled('Save draft')) as HTMLButtonElement).disabled).toBe(false);
        const published = live('lenient', 2);
        rerender(<Provider><EditSlot resource="beam-config" section={published.section} keyData={published.key} realm="operator" /></Provider>);
        expect(fieldValue(container)).toBe('"lenient"');
        // r10 SHOULD-2: wait for the ops to be available first, so "disabled" can only mean "not dirty".
        await enabled('Inherit');
        expect((screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement).disabled).toBe(true);
    });

    // r10 SHOULD-1: switching to ANOTHER section whose pins happen to be equal and which has a key at the same pointer
    // must not carry the old field (and its dirty edit) over: Save draft would write it to the NEW section's root.
    it('starts over when the section changes, even with equal pins and a shared pointer', async () => {
        const { Provider } = kit([SECTION]);
        const first = live('strict', 1, 'beam.ux');
        const { container, rerender } = render(<Provider><EditSlot resource="beam-config" section={first.section} keyData={first.key} realm="operator" /></Provider>);
        fireEvent.change(screen.getByLabelText('Validation mode'), { target: { value: JSON.stringify('lenient') } });
        expect(((await enabled('Save draft')) as HTMLButtonElement).disabled).toBe(false);
        const other = live('strict', 1, 'beam.other');
        rerender(<Provider><EditSlot resource="beam-config" section={other.section} keyData={other.key} realm="operator" /></Provider>);
        expect(fieldValue(container)).toBe('"strict"');
        await enabled('Inherit');
        expect((screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('shows a Restored draft, not the value it replaced', () => {
        const { Provider } = kit([SECTION]);
        const { container, rerender } = render(<Provider><EditSlot resource="beam-config" section={withDraft('lenient', 2)} keyData={editable} realm="operator" /></Provider>);
        expect(fieldValue(container)).toBe('"lenient"');
        rerender(<Provider><EditSlot resource="beam-config" section={withDraft('strict', 3)} keyData={editable} realm="operator" /></Provider>);
        expect(fieldValue(container)).toBe('"strict"');
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
        expect(invoke.mock.calls[0]![1].data).toEqual({ root: 'beam.ux', pointer: '/mode', locked: false, reason: null });
        rerender(<Provider><LockControl resource="beam-config" section={SECTION} keyData={locked} realm="tenant" /></Provider>);
        expect(container.querySelector('[data-config-lock]')).toBeNull();
    });
});

describe('DraftBar', () => {
    // config-sections 10b impeccable audit P2-1 (lead 01:01Z): the count line is a choice string, so it must go through
    // m.choice. m.t rendered the raw "1 change pending|1 changes pending" in both realms of the flagship.
    it('says "1 change pending" and "2 changes pending", never the raw choice string', () => {
        const { Provider } = kit([SECTION]);
        const header = (container: HTMLElement) => container.querySelector('[data-config-draft-bar] header p')?.textContent;
        const one = render(<Provider><DraftBar resource="beam-config" section={SECTION} /></Provider>);
        expect(header(one.container)).toBe('1 change pending');
        one.unmount();
        const theme = BEAM_UX.keys.find((k) => k.pointer === '/theme')!;
        const two: ConfigSectionData = {
            ...SECTION,
            keys: SECTION.keys.map((k) => (k.pointer === '/theme' ? { ...theme, overridable: true, effect: 'live', ceiling: 'tenant' } : k)),
            overrides: [...SECTION.overrides, { pointer: '/theme', op: 'set', value: 'dark', secret: false, set: true, setAt: null, revision: 'r2' }],
        };
        const both = render(<Provider><DraftBar resource="beam-config" section={two} /></Provider>);
        expect(header(both.container)).toBe('2 changes pending');
        expect(header(both.container)).not.toContain('|');
    });

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

    it("names the Release it joins, adds the section as a config-override member through the host's command, and confirms", async () => {
        const { Provider, invoke } = kit([SECTION]);
        const command = vi.fn(async () => ({ id: 'rel-1' }));
        render(<Provider><DraftBar resource="beam-config" section={SECTION} release={{ id: 'rel-1', title: 'Spring launch', command }} /></Provider>);
        expect(screen.getByText('Joins “Spring launch”, the first open draft Release.')).toBeTruthy();
        // the live region is mounted EMPTY, so the confirmation is announced when it appears
        expect(screen.getByRole('status').textContent).toBe('');
        fireEvent.click(await enabled('Add to the Release'));
        await waitFor(() => expect(command).toHaveBeenCalledTimes(1));
        expect(command).toHaveBeenCalledWith({ action: 'member', kind: RELEASE_KIND_CONFIG, ref: 'beam.ux' });
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Added to “Spring launch”.'));
        expect(invoke).not.toHaveBeenCalled();
    });

    it('says the Release holds an earlier draft after a Save draft since joining, and re-adding re-pins it', async () => {
        const { Provider } = kit([SECTION]);
        const command = vi.fn(async () => ({ id: 'rel-1' }));
        const release = { id: 'rel-1', title: 'Spring launch', command };
        const { rerender } = render(<Provider><DraftBar resource="beam-config" section={SECTION} release={release} /></Provider>);
        fireEvent.click(await enabled('Add to the Release'));
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Added to “Spring launch”.'));

        // a later Save draft moves the section's draft pin (2 -> 3): the Release still pins draft 2
        const resaved = { ...SECTION, pins: { ...SECTION.pins, draft: 3 } };
        rerender(<Provider><DraftBar resource="beam-config" section={resaved} release={release} /></Provider>);
        expect(screen.getByRole('status').textContent).toBe('“Spring launch” holds an earlier draft of this section. Add it again to take this draft.');
        expect(screen.queryByText('Added to “Spring launch”.')).toBeNull();

        fireEvent.click(await enabled('Add to the Release'));
        await waitFor(() => expect(command).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Added to “Spring launch”.'));
    });

    it.each([
        // Discard draft: the draft is restored to the published version, so nothing is pending
        ['Discard draft', { draft: 1, published: 1, draftPending: false }],
        // a direct Publish: the pending draft became the published version, so nothing is pending
        ['a direct Publish', { draft: 2, published: 2, draftPending: false }],
    ] as const)('claims neither added nor an earlier draft after %s, and disables Add while nothing is pending', async (_what, pins) => {
        const { Provider } = kit([SECTION]);
        const release = { id: 'rel-1', title: 'Spring launch', command: vi.fn(async () => ({ id: 'rel-1' })) };
        const { rerender } = render(<Provider><DraftBar resource="beam-config" section={SECTION} release={release} /></Provider>);
        fireEvent.click(await enabled('Add to the Release'));
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Added to “Spring launch”.'));

        const after = { ...SECTION, pins };
        rerender(<Provider><DraftBar resource="beam-config" section={after} release={release} /></Provider>);
        expect(screen.getByRole('status').textContent).toBe('');
        expect(screen.queryByText(/holds an earlier draft/)).toBeNull();
        expect(screen.getByText('Joins “Spring launch”, the first open draft Release.')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Add to the Release' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('disables Add when the section has overrides but no pending draft', async () => {
        const { Provider } = kit([SECTION]);
        const idle = { ...SECTION, pins: { draft: 1, published: 1, draftPending: false } };
        render(<Provider><DraftBar resource="beam-config" section={idle} release={{ id: 'rel-1', title: 'Spring launch', command: vi.fn() }} /></Provider>);
        await enabled('Publish');
        expect((screen.getByRole('button', { name: 'Add to the Release' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("never shows one section's confirmation on another section", async () => {
        const { Provider } = kit([SECTION]);
        const release = { id: 'rel-1', title: 'Spring launch', command: vi.fn(async () => ({ id: 'rel-1' })) };
        const { rerender } = render(<Provider><DraftBar resource="beam-config" section={SECTION} release={release} /></Provider>);
        fireEvent.click(await enabled('Add to the Release'));
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Added to “Spring launch”.'));

        const other = { ...SECTION, id: 'beam.other', root: 'beam.other' };
        rerender(<Provider><DraftBar resource="beam-config" section={other} release={release} /></Provider>);
        expect(screen.getByRole('status').textContent).toBe('');
        expect(screen.getByText('Joins “Spring launch”, the first open draft Release.')).toBeTruthy();
    });

    it("shows the Release command's refusal (message and field errors) beside the bar, and confirms nothing", async () => {
        const { Provider } = kit([SECTION]);
        const command = vi.fn(async () => {
            // the shape the host's command rejects with: the server's message, and its field errors
            throw Object.assign(new Error('The section has no pending draft to add.'), { errors: { member: ['beam.ux has no pending draft.'] } });
        });
        render(<Provider><DraftBar resource="beam-config" section={SECTION} release={{ id: 'rel-1', title: 'Spring launch', command }} /></Provider>);
        fireEvent.click(await enabled('Add to the Release'));
        expect(await screen.findByText('beam.ux has no pending draft.')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toBe('');
        expect(screen.getByText('Joins “Spring launch”, the first open draft Release.')).toBeTruthy();
    });

    it('offers no Release control without an open Release', async () => {
        const { Provider } = kit([SECTION]);
        render(<Provider><DraftBar resource="beam-config" section={SECTION} /></Provider>);
        await enabled('Publish');
        expect(screen.queryByRole('button', { name: 'Add to the Release' })).toBeNull();
    });

    it('renders nothing with no draft', () => {
        const { Provider } = kit([BEAM_UX]);
        const { container } = render(<Provider><DraftBar resource="beam-config" section={BEAM_UX} /></Provider>);
        expect(container.querySelector('[data-config-draft-bar]')).toBeNull();
    });
});

describe('VersionsPanel', () => {
    it("lists versions with the versions op and restores one with {root, version}", async () => {
        const { Provider, invoke } = kit([SECTION]);
        invoke.mockImplementation(async (action: { key: string }, target: { id?: string | null; data: unknown }) =>
            action.key === 'versions'
                ? { message: 'ok', data: { versions: [
                    { id: 'v2', version: 2, label: null, published: true, draft: false },
                    { id: 'v3', version: 3, label: null, published: false, draft: true },
                ] }, _target: target }
                : { message: `${action.key} done`, data: null, _target: target });
        const { container } = render(<Provider><VersionsPanel resource="beam-config" section={SECTION} /></Provider>);
        fireEvent.click(await enabled('Show versions'));
        await waitFor(() => expect(container.querySelector('[data-config-version="2"]')).not.toBeNull());
        expect(invoke.mock.calls[0]![0].key).toBe('versions');
        expect(invoke.mock.calls[0]![1].data).toEqual({ root: 'beam.ux' });
        // the draft version offers no restore; the published one does
        expect(container.querySelector('[data-config-version="3"] button')).toBeNull();
        fireEvent.click(await enabled('Restore as draft'));
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
        expect(invoke.mock.calls[1]![0].key).toBe('restore');
        expect(invoke.mock.calls[1]![1].data).toEqual({ root: 'beam.ux', version: 2 });
    });
});
