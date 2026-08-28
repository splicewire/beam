import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { OperatorDesk, type OperatorTool } from './index';
import { OPERATOR_DESK_CSS, OPERATOR_DESK_TASKBAR_CENTER_CSS } from './css';

/**
 * The lift's contract, asserted where a diff read cannot reach.
 *
 * Three of these exist because the estate has been bitten by exactly their absence: the CSS must
 * arrive as an INJECTED STRING (a `.css` file import is dead code under `sideEffects: false`), the
 * `beam-ux:*` event names must stay byte-identical (a window event has no compiler), and no import
 * here may reach a host page (a static page import silently costs that page its Vite-manifest entry).
 */
const broadcast = (detail: unknown) =>
    act(() => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail }));
    });

function tool(overrides: Partial<OperatorTool> = {}): OperatorTool {
    return {
        key: 'dashboard',
        title: 'Dashboard',
        accent: '#4B5563',
        render: () => <div>dashboard body</div>,
        size: { width: 720, height: 560 },
        ...overrides,
    };
}

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: /operator/i }));

describe('OperatorDesk — chrome', () => {
    it('injects its CSS as a style element rather than importing a stylesheet', () => {
        const { container } = render(<OperatorDesk tools={[]} />);
        const style = container.querySelector('style');

        expect(style).not.toBeNull();
        expect(style!.innerHTML).toContain('.op-desk-overlay');
        expect(style!.innerHTML).toContain('--op-surface-raised');
    });

    it('anchors the taskbar left by default and centres it on request', () => {
        const { container, rerender } = render(<OperatorDesk tools={[]} />);
        expect(container.querySelector('style')!.innerHTML).not.toContain('translateX(-50%)');

        rerender(<OperatorDesk tools={[]} taskbarPlacement="center" />);
        const css = container.querySelector('style')!.innerHTML;

        expect(css).toContain('translateX(-50%)');
        // The override must come AFTER the base rule — equal specificity, last one wins.
        expect(css.indexOf(OPERATOR_DESK_TASKBAR_CENTER_CSS.trim())).toBeGreaterThan(
            css.indexOf('.op-taskbar{position:absolute'),
        );
    });

    it('names every colour and font as a token with a literal fallback', () => {
        for (const token of [
            '--op-surface',
            '--op-surface-raised',
            '--op-fg',
            '--op-fg-muted',
            '--op-accent',
            '--op-edge',
            '--op-font',
            '--op-font-mono',
        ]) {
            expect(OPERATOR_DESK_CSS).toContain(`var(${token},`);
        }
    });

    it('renders the orb with the host glyph and label', () => {
        render(<OperatorDesk tools={[]} orbLabel="Desk" orbIcon={<span data-testid="glyph" />} />);

        expect(screen.getByRole('button', { name: /desk/i })).toBeTruthy();
        expect(screen.getByTestId('glyph')).toBeTruthy();
    });
});

describe('OperatorDesk — start menu', () => {
    it('omits the brand row unless a brand is supplied', () => {
        const { container, rerender } = render(<OperatorDesk tools={[]} />);
        openMenu();
        expect(container.querySelector('.op-menu-brand')).toBeNull();

        rerender(<OperatorDesk tools={[]} brand={{ mark: <i />, label: 'beam' }} />);
        expect(container.querySelector('.op-menu-brand')!.textContent).toContain('beam');
    });

    it('lists the host tool roster in stable order', () => {
        render(
            <OperatorDesk
                tools={[
                    tool({ key: 'b', title: 'Beta', order: 2 }),
                    tool({ key: 'a', title: 'Alpha', order: 1 }),
                ]}
            />,
        );
        openMenu();
        const labels = Array.from(document.querySelectorAll('.op-menu button')).map((b) => b.textContent);

        expect(labels.join('|')).toMatch(/Alpha.*Beta/);
    });

    it('drops the tool divider when the roster is empty', () => {
        const { container } = render(<OperatorDesk tools={[]} />);
        openMenu();

        expect(container.querySelectorAll('.op-div').length).toBe(0);
    });

    it('renders only the links the host supplies, and sign-out is an action', () => {
        const signOut = vi.fn();
        render(
            <OperatorDesk
                tools={[]}
                links={{ control: { href: '/operator' }, signOut }}
            />,
        );
        openMenu();

        expect(screen.getByRole('link', { name: /control panel/i }).getAttribute('href')).toBe('/operator');
        fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
        expect(signOut).toHaveBeenCalledOnce();
    });

    it('swaps to the front-end link inside the control panel', () => {
        render(
            <OperatorDesk
                tools={[]}
                inControlPanel
                links={{ frontend: { href: '/' }, control: { href: '/operator' } }}
            />,
        );
        openMenu();

        expect(screen.getByRole('link', { name: /front-end/i }).getAttribute('href')).toBe('/');
        expect(screen.queryByRole('link', { name: /control panel/i })).toBeNull();
    });

    it('opens a tool as a float and surfaces it on the taskbar', () => {
        render(<OperatorDesk tools={[tool()]} />);
        openMenu();
        fireEvent.click(screen.getByRole('button', { name: /dashboard/i }));

        expect(screen.getByText('dashboard body')).toBeTruthy();
        expect(document.querySelector('.op-taskbar')).not.toBeNull();
    });
});

describe('OperatorDesk — the beam-ux event contract', () => {
    it('disables "Edit this page" until the page says it is editable', () => {
        render(<OperatorDesk tools={[]} />);
        openMenu();
        const button = screen.getByRole('button', { name: /edit this page/i }) as HTMLButtonElement;

        // The 2026-08-09 ancestor rendered the "n/a" badge WITHOUT `disabled`, so the button was a
        // silent no-op rather than an obviously-inert control. Assert the attribute, not the badge.
        expect(button.disabled).toBe(true);
        expect(button.textContent).toContain('n/a');
    });

    it('dispatches beam-ux:edit when no page-properties surface is supplied', () => {
        const edit = vi.fn();
        window.addEventListener('beam-ux:edit', edit);
        render(<OperatorDesk tools={[]} />);
        broadcast({ mode: 'domain', editable: true, slug: 'about' });
        openMenu();
        fireEvent.click(screen.getByRole('button', { name: /edit this page/i }));

        expect(edit).toHaveBeenCalledOnce();
        window.removeEventListener('beam-ux:edit', edit);
    });

    it('dispatches beam-ux:exit when the in-place editor is already open', () => {
        const exit = vi.fn();
        window.addEventListener('beam-ux:exit', exit);
        render(<OperatorDesk tools={[]} />);
        broadcast({ mode: 'window', editable: true, slug: 'about' });
        openMenu();
        fireEvent.click(screen.getByRole('button', { name: /exit editing/i }));

        expect(exit).toHaveBeenCalledOnce();
        window.removeEventListener('beam-ux:exit', exit);
    });

    it('opens a page:{slug} float when the host renders page properties', () => {
        render(
            <OperatorDesk
                tools={[]}
                renderPageProperties={({ slug, editable, editing }) => (
                    <div>
                        props {slug} {String(editable)} {String(editing)}
                    </div>
                )}
            />,
        );
        broadcast({ mode: 'domain', editable: true, slug: 'about' });
        openMenu();
        fireEvent.click(screen.getByRole('button', { name: /edit this page/i }));

        expect(screen.getByText(/props about true false/)).toBeTruthy();
        // Title bar AND taskbar entry — the window is both open and docked.
        expect(screen.getAllByText('Page · about').length).toBe(2);
    });

    it("close() dismisses the properties float by minimizing it — it stays docked", () => {
        render(
            <OperatorDesk
                tools={[]}
                renderPageProperties={({ close }) => (
                    <button type="button" onClick={close}>
                        hand off
                    </button>
                )}
            />,
        );
        broadcast({ mode: 'domain', editable: true, slug: 'about' });
        openMenu();
        fireEvent.click(screen.getByRole('button', { name: /edit this page/i }));
        fireEvent.click(screen.getByRole('button', { name: /hand off/i }));

        expect(screen.queryByRole('button', { name: /hand off/i })).toBeNull();
        // Still on the taskbar: minimized, not closed.
        expect(document.querySelector('.op-taskbar')!.textContent).toContain('Page · about');
    });
});

describe('OperatorDesk — the router seam', () => {
    it('hands the host a nav guard it arms on a window-body click', () => {
        let api: { shouldSuppress: () => boolean; disarm: () => void } | null = null;
        const { container } = render(
            <OperatorDesk
                tools={[tool()]}
                navGuard={(a) => {
                    api = a;
                }}
            />,
        );
        openMenu();
        fireEvent.click(screen.getByRole('button', { name: /dashboard/i }));

        expect(api).not.toBeNull();
        expect(api!.shouldSuppress()).toBe(false);

        fireEvent.click(container.querySelector('.op-win-body')!);
        expect(api!.shouldSuppress()).toBe(true);

        api!.disarm();
        expect(api!.shouldSuppress()).toBe(false);
    });

    it('lets the host resolve window kinds the desk does not know', () => {
        render(
            <OperatorDesk
                tools={[tool({ key: 'custom', title: 'Custom' })]}
                resolveWindow={(key) =>
                    key === 'custom'
                        ? { title: 'Overridden', accent: '#000', render: () => <div>host body</div> }
                        : null
                }
            />,
        );
        openMenu();
        fireEvent.click(screen.getByRole('button', { name: /custom/i }));

        expect(screen.getByText('host body')).toBeTruthy();
        expect(screen.getAllByText('Overridden').length).toBe(2);
    });
});
