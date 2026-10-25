// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CanvasProvider } from '../canvas/context';
import { PageEditor, __resetEditMode } from '../canvas/PageEditor';

vi.mock('./local-session', async original => ({
    ...await original<typeof import('./local-session')>(),
    IndexedDbSessions: class { async forEntry() { return []; } async write() {} close() {} },
}));
afterEach(() => { cleanup(); __resetEditMode(); });

it('keeps expanded settings below the toolbar and reachable after Reload theirs', async () => {
    const body = [{ kind: 'block' as const, name: 'p', isComponent: false, dynamic: false, props: [], children: [{ kind: 'text' as const, value: 'Body' }] }];
    const state = { id: 'settings-layout', headVersion: 'v1', headReadable: 'v1', publishedVersion: 'v1', publishedReadable: 'v1', draftPending: false, versions: [], compileError: null };
    const saveDraft = vi.fn().mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }));
    render(<CanvasProvider config={{ registry: {}, MdxView: () => null, MdxEdit: () => null }}>
        <PageEditor slug="settings-layout" entryId="settings-layout" userId="author" body={body}
            pageSettings={{ title: 'Original' }} transport={{ saveBody: vi.fn(), saveDraft,
                listVersions: async () => state, publish: vi.fn(), restoreVersion: vi.fn(),
                loadBody: async () => ({ body, pageSettings: { title: 'Reloaded' } }),
            }} />
    </CanvasProvider>);
    act(() => window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } })));
    await screen.findByLabelText('Title');
    const summary = screen.getByText('Page settings', { selector: 'summary' });
    fireEvent.click(summary);
    const checkLayout = () => {
        const panel = screen.getByRole('region', { name: 'Page settings fields' });
        const bar = summary.closest('.pe-bar')!;
        // jsdom verifies the rendered CSS contract; the browser regression measures real rectangles.
        expect(getComputedStyle(panel).position).toBe('fixed');
        expect(parseFloat(getComputedStyle(panel).top)).toBeGreaterThanOrEqual(parseFloat(getComputedStyle(bar).height));
        expect(getComputedStyle(panel).overflowY || getComputedStyle(panel).overflow).toBe('auto');
        expect(getComputedStyle(panel).maxHeight).not.toBe('none');
    };
    checkLayout();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved' } });
    fireEvent.click(summary);
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    const reload = await screen.findByRole('button', { name: 'Reload theirs' });
    const dialog = screen.getByRole('alertdialog', { name: 'Save conflict' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(getComputedStyle(dialog).position).toBe('fixed');
    expect(Number(getComputedStyle(dialog).zIndex)).toBeGreaterThan(2147483201);
    await waitFor(() => expect(document.activeElement).toBe(reload));
    fireEvent.click(reload);
    await waitFor(() => expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Reloaded'));
    fireEvent.click(summary);
    checkLayout();
    expect(screen.queryByRole('alertdialog', { name: 'Save conflict' })).toBeNull();
    fireEvent.click(summary);
    expect(summary.parentElement?.hasAttribute('open')).toBe(false);
});
