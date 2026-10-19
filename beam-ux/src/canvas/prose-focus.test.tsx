// @vitest-environment jsdom
import { render, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ProseRun from './ProseRun';
import profile from '../editor/default-profile.fixture.json';

const { focus } = vi.hoisted(() => ({ focus: vi.fn() }));
vi.mock('@schemastud/blockdoc/react', async () => {
    const React = await import('react');
    return { BlockdocEditor: React.forwardRef(function DeferredEditor(_props, ref) {
        const [ready, setReady] = React.useState(false);
        React.useEffect(() => { const timer = setTimeout(() => setReady(true), 0); return () => clearTimeout(timer); }, []);
        // Tiptap's handle exists before its live editor is available.
        React.useImperativeHandle(ref, () => ({
            editor: ready ? { commands: { focus } } : null,
            view: ready ? { focus } : null,
        }), [ready]);
        return <div />;
    }) };
});
afterEach(() => { cleanup(); focus.mockClear(); });

it('focuses when a deferred editor becomes ready, only once per activation', async () => {
    const { rerender } = render(<ProseRun value={[]} profile={profile} onChange={() => {}} />);
    await waitFor(() => expect(focus).toHaveBeenCalledTimes(1));
    rerender(<ProseRun value={[]} profile={profile} onChange={() => {}} />);
    expect(focus).toHaveBeenCalledTimes(1);
});
