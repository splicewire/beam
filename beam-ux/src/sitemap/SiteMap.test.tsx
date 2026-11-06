import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteMap, type SiteMapProps } from './SiteMap';
import { FIXTURE_PAGES, FIXTURE_PARTS, FIXTURE_TENANT_PAGES, FIXTURE_TRACES } from './fixture';
import { allIssues, buildTree, issuesFor } from './model';
import type { SiteMapView, SiteMapViewStore } from './index';

afterEach(cleanup);

function memoryStore(initial: SiteMapView | null = null): SiteMapViewStore & { value: SiteMapView | null } {
    const store = { value: initial, get: () => store.value, set: (v: SiteMapView) => { store.value = v; } };
    return store;
}

function renderMap(props: Partial<SiteMapProps> = {}) {
    const onOpen = vi.fn();
    const viewStore = props.viewStore ?? memoryStore();
    const utils = render(<SiteMap pages={FIXTURE_PAGES} traces={FIXTURE_TRACES} parts={FIXTURE_PARTS} onOpen={onOpen} viewStore={viewStore} {...props} />);
    return { ...utils, onOpen, viewStore };
}

const inspector = () => screen.getByTestId('site-map-inspector');
const pick = (view: string) => fireEvent.click(screen.getByRole('radio', { name: view }));

describe('the model', () => {
    it('builds the tree from parent ids, with an unseen parent read as a root', () => {
        const roots = buildTree(FIXTURE_PAGES);
        expect(roots.map((r) => r.page.id)).toEqual(['home']);
        expect(roots[0].children.map((c) => c.page.id).slice(0, 3)).toEqual(['product', 'pricing', 'customers']);
        expect(buildTree(FIXTURE_PAGES.filter((p) => p.id !== 'home')).map((r) => r.page.id)).toContain('product');
    });

    it('never treats an answered chain as an issue; a loop and a dead end are', () => {
        const pricing = FIXTURE_PAGES.find((p) => p.id === 'pricing')!;
        expect(pricing.redirects.maxHops).toBe(3);
        expect(issuesFor(pricing).map((i) => i.kind)).toEqual(['file-changed']);
        const kinds = allIssues(FIXTURE_PAGES, FIXTURE_TRACES).map((i) => i.kind);
        expect(kinds.filter((k) => k === 'redirect-loop')).toHaveLength(1);
        expect(issuesFor(FIXTURE_PAGES.find((p) => p.id === 'design-engineer')!).map((i) => i.kind)).toEqual(['redirect-broken']);
    });
});

describe('the view toggle', () => {
    it('opens on Outline by default and switches to Canvas and Columns', () => {
        const { container } = renderMap();
        expect(container.querySelector('[data-site-map-view]')!.getAttribute('data-site-map-view')).toBe('outline');
        expect(screen.getByRole('radio', { name: 'Outline' }).getAttribute('aria-checked')).toBe('true');
        pick('Canvas');
        expect(container.querySelector('[data-view="canvas"]')).toBeTruthy();
        pick('Columns');
        expect(container.querySelector('[data-view="columns"]')).toBeTruthy();
    });

    it('keeps the selection and shows the same inspector in every view', () => {
        renderMap({ defaultSelectedId: 'pricing' });
        const seen: string[] = [];
        for (const view of ['Outline', 'Canvas', 'Columns']) {
            pick(view);
            const panel = inspector();
            expect(within(panel).getByRole('heading', { level: 2, name: 'Pricing' })).toBeTruthy();
            seen.push(panel.textContent ?? '');
        }
        expect(new Set(seen).size).toBe(1);
    });

    it('selecting in one view carries to the next', () => {
        renderMap();
        fireEvent.click(screen.getByRole('treeitem', { name: /^Security/ }));
        expect(within(inspector()).getByRole('heading', { name: 'Security' })).toBeTruthy();
        pick('Columns');
        expect(within(inspector()).getByRole('heading', { name: 'Security' })).toBeTruthy();
        expect(screen.getAllByRole('button', { name: /^Security/ }).some((b) => b.getAttribute('aria-current') === 'true')).toBe(true);
    });

    it('remembers the chosen view for this viewer', () => {
        const store = memoryStore();
        const first = renderMap({ viewStore: store });
        pick('Columns');
        expect(store.value).toBe('columns');
        first.unmount();
        const { container } = renderMap({ viewStore: store });
        expect(container.querySelector('[data-site-map-view]')!.getAttribute('data-site-map-view')).toBe('columns');
    });

    it('moves between views with the arrow keys, as a radio group does', () => {
        renderMap();
        const outline = screen.getByRole('radio', { name: 'Outline' });
        outline.focus();
        fireEvent.keyDown(outline, { key: 'ArrowRight' });
        expect(screen.getByRole('radio', { name: 'Canvas' }).getAttribute('aria-checked')).toBe('true');
        expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Canvas' }));
    });
});

describe('the Outline tree keyboard', () => {
    it('has one tab stop; arrows move, Enter selects, a second Enter opens the editor', async () => {
        const user = userEvent.setup();
        const { onOpen } = renderMap();
        const rows = () => screen.getByRole('tree').querySelectorAll<HTMLElement>('[data-row]');
        expect([...rows()].filter((r) => r.tabIndex === 0)).toHaveLength(1);
        rows()[0].focus();
        await user.keyboard('{ArrowDown}');
        expect(document.activeElement?.getAttribute('data-row')).toBe('product');
        await user.keyboard('{Enter}');
        expect(within(inspector()).getByRole('heading', { name: 'Product' })).toBeTruthy();
        expect(onOpen).not.toHaveBeenCalled();
        await user.keyboard('{Enter}');
        expect(onOpen).toHaveBeenCalledWith({ kind: 'page', page: expect.objectContaining({ id: 'product' }) });
    });

    it('Left collapses, Right expands, Left on a leaf climbs to its parent; Home and End jump', async () => {
        const user = userEvent.setup();
        renderMap();
        const row = (id: string) => screen.getByRole('tree').querySelector<HTMLElement>(`[data-row="${id}"]`);
        row('product')!.focus();
        await user.keyboard('{ArrowLeft}');
        expect(row('canvas')).toBeNull();
        await user.keyboard('{ArrowRight}');
        expect(row('canvas')).toBeTruthy();
        row('canvas')!.focus();
        await user.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(row('product'));
        await user.keyboard('{End}');
        expect(document.activeElement?.getAttribute('data-row')).toBe('partners');
        await user.keyboard('{Home}');
        expect(document.activeElement?.getAttribute('data-row')).toBe('home');
    });

    it('a double-click opens the editor', () => {
        const { onOpen } = renderMap();
        fireEvent.doubleClick(screen.getByRole('tree').querySelector('[data-row="about"]')!);
        expect(onOpen).toHaveBeenCalledWith({ kind: 'page', page: expect.objectContaining({ id: 'about' }) });
    });
});

describe('the inspector and the realm', () => {
    it('opens the Entry editor from the inspector', () => {
        const { onOpen } = renderMap({ defaultSelectedId: 'about' });
        fireEvent.click(within(inspector()).getByRole('button', { name: /Open in editor/ }));
        expect(onOpen).toHaveBeenCalledWith({ kind: 'page', page: expect.objectContaining({ id: 'about' }) });
    });

    it('draws the File column and section only when the rows carry a file (central only, D-37-d)', () => {
        const central = renderMap({ defaultSelectedId: 'security' });
        expect(within(inspector()).getByRole('heading', { name: 'File' })).toBeTruthy();
        expect(screen.getByText('File', { selector: 'span' })).toBeTruthy();
        central.unmount();
        renderMap({ pages: FIXTURE_TENANT_PAGES, defaultSelectedId: 'security' });
        expect(within(inspector()).queryByRole('heading', { name: 'File' })).toBeNull();
        expect(screen.queryByText('File', { selector: 'span' })).toBeNull();
    });

    it('offers a file repair only through the release member the server names', () => {
        const onFileAction = vi.fn();
        const first = renderMap({ defaultSelectedId: 'security', onFileAction });
        fireEvent.click(within(inspector()).getByRole('button', { name: /Restore file/ }));
        expect(onFileAction).toHaveBeenCalledWith('restore', expect.objectContaining({ id: 'security' }));
        first.unmount();
        renderMap({ defaultSelectedId: 'widgets', onFileAction });
        expect(within(inspector()).queryByRole('button', { name: /Restore/ })).toBeNull();
        expect(within(inspector()).getByText(/newest Release froze another version/)).toBeTruthy();
    });

    it('shows a chain as information on the page, not as an issue', () => {
        renderMap({ defaultSelectedId: 'pricing' });
        const panel = inspector();
        expect(within(panel).getByText(/through 3 redirects/)).toBeTruthy();
        expect(within(panel).queryByText(/Old address fails a guest/)).toBeNull();
    });

    it('says why a page is left out of search, in the sitemap\'s own terms', () => {
        renderMap({ defaultSelectedId: 'design-engineer' });
        expect(within(inspector()).getByText(/A page above it is not published/)).toBeTruthy();
    });
});

describe('Site parts', () => {
    it('lists the non-page entries and opens each through its door', () => {
        const { onOpen } = renderMap();
        const parts = screen.getByRole('region', { name: 'Site parts' });
        fireEvent.click(within(parts).getByRole('button', { name: 'Theme' }));
        expect(onOpen).toHaveBeenCalledWith({ kind: 'part', part: expect.objectContaining({ type: 'theme' }) });
        fireEvent.click(within(parts).getByRole('button', { name: 'Hero' }));
        expect(onOpen).toHaveBeenLastCalledWith({ kind: 'part', part: expect.objectContaining({ id: 'cmp-hero', type: 'component' }) });
    });
});

describe('filters', () => {
    it('Needs attention keeps the pages with an issue and their ancestors as context', () => {
        renderMap();
        fireEvent.click(screen.getByRole('radio', { name: /Needs attention/ }));
        const ids = [...screen.getByRole('tree').querySelectorAll('[data-row]')].map((r) => r.getAttribute('data-row'));
        expect(ids).toContain('security');
        expect(ids).toContain('design-engineer');
        expect(ids).not.toContain('fable');
        expect(ids).toContain('product');
    });
});

describe('impeccable P1 fixes', () => {
    it('counts one loop once, in the filter, the strip and the loose list', () => {
        renderMap();
        expect(screen.getByRole('radio', { name: /Needs attention/ }).textContent).toContain('7');
        const loose = screen.getByRole('region', { name: 'Redirects that reach no page' });
        // The /promo ↔ /launch loop is one row; the other row is /status leaving the site.
        expect(within(loose).getAllByRole('listitem')).toHaveLength(2);
        pick('Columns');
        expect(screen.getByRole('region', { name: 'Needs attention' }).textContent).toContain('1 redirect reaching no page');
    });

    it('gives Canvas one tab stop, with arrows walking the tree and Enter twice opening the editor', async () => {
        const user = userEvent.setup();
        const { container, onOpen } = renderMap();
        pick('Canvas');
        const cards = () => [...container.querySelectorAll<HTMLElement>('[data-card]')];
        expect(cards().filter((c) => c.tabIndex === 0)).toHaveLength(1);
        cards()[0].focus();
        await user.keyboard('{ArrowDown}');
        expect(document.activeElement?.getAttribute('data-card')).toBe('product');
        await user.keyboard('{ArrowLeft}');
        expect(document.activeElement?.getAttribute('data-card')).toBe('home');
        await user.keyboard('{Enter}{Enter}');
        expect(onOpen).toHaveBeenCalledWith({ kind: 'page', page: expect.objectContaining({ id: 'home' }) });
    });

    it('exposes the tree item itself as the focus target, with its level and state', () => {
        renderMap({ defaultSelectedId: 'pricing' });
        const item = screen.getByRole('treeitem', { name: /^Pricing/ });
        expect(item.getAttribute('aria-level')).toBe('2');
        expect(item.getAttribute('aria-selected')).toBe('true');
        expect(item.hasAttribute('data-row')).toBe(true);
    });
});

