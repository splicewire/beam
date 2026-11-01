// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({ Head: () => null }));
vi.mock('@splicewire/beam-ux/canvas', () => ({ useEditMode: () => false }));
vi.mock('@splicewire/beam-ux/docs', () => ({ entryPageConfig: () => ({}) }));
vi.mock('../../editor/canvas-config', () => ({ canvasConfig: { registry: {} } }));
vi.mock('../../editor/intake', () => ({ IntakeFormsFromPage: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('../../editor/page-editor', () => ({ default: () => <div data-testid="editor" /> }));
vi.mock('../../layouts/site-layout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@splicewire/beam-ux/site', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@splicewire/beam-ux/site')>();
    return {
        ...actual,
        EntryBody: () => <button data-testid="event-node" data-bd-event='{"name":"generate_lead","label":"hero-cta"}'>Hero CTA</button>,
        PreviewBoundary: ({ children }: { children: ReactNode }) => <div data-testid="preview">{children}</div>,
    };
});

import SiteHome from './home';

const entry = {
    id: '01a001bc-0000-7000-8000-0000000000aa',
    slug: 'home',
    artifact: { url: '/beam/ux/artifacts/01a001bc/abc123', version: 'abc123' },
};

afterEach(() => {
    cleanup();
    Reflect.deleteProperty(window, 'dataLayer');
});

describe('site/home click events', () => {
    it('reports a published home click once and preserves its event marker', () => {
        const dataLayer: unknown[] = [];
        Object.defineProperty(window, 'dataLayer', { configurable: true, value: dataLayer });
        render(<SiteHome entry={entry} />);

        const node = screen.getByTestId('event-node');
        expect(node.getAttribute('data-bd-event')).toBe('{"name":"generate_lead","label":"hero-cta"}');
        fireEvent.click(node);

        expect(dataLayer).toEqual([{ event: 'generate_lead', event_label: 'hero-cta' }]);
    });

    it('does not report a Preview click and preserves its event marker', () => {
        const dataLayer: unknown[] = [];
        Object.defineProperty(window, 'dataLayer', { configurable: true, value: dataLayer });
        render(<SiteHome entry={entry} preview={{ label: 'Spring', exitUrl: '/_beam/preview/exit', mode: 'preview' }} />);

        const node = screen.getByTestId('event-node');
        expect(node.getAttribute('data-bd-event')).toBe('{"name":"generate_lead","label":"hero-cta"}');
        fireEvent.click(node);

        expect(dataLayer).toEqual([]);
    });
});
