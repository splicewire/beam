import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CanvasProvider } from '../canvas/context.js';
import { TreeRender } from '../canvas/TreeRender.js';
import type { JsonBlock } from '../blockdoc/json.js';
import { installClickEventListener, reportEvent, SiteClickEventListener } from './events.js';

afterEach(() => {
    cleanup();
    delete (window as Window & { gtag?: unknown }).gtag;
    delete (window as Window & { dataLayer?: unknown }).dataLayer;
});

describe('site Click Events', () => {
    it('reports one GA4 event and maps the Click Event label to event_label', () => {
        const gtag = vi.fn();
        (window as Window & { gtag?: typeof gtag }).gtag = gtag;

        reportEvent('generate_lead', { event_label: 'Hero CTA', absent: undefined });

        expect(gtag).toHaveBeenCalledOnce();
        expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', { event_label: 'Hero CTA' });
    });

    it('uses the GTM data layer when gtag is not installed', () => {
        const dataLayer: unknown[] = [];
        (window as Window & { dataLayer?: unknown[] }).dataLayer = dataLayer;

        reportEvent('purchase', {
            transaction_id: 'order-9', value: 12,
            items: [{ item_id: 'sku-9', quantity: 2, price: 6 }],
        });

        expect(dataLayer).toEqual([{
            event: 'purchase', transaction_id: 'order-9', value: 12,
            items: [{ item_id: 'sku-9', quantity: 2, price: 6 }],
        }]);
    });

    it('delegates one click to the nearest valid data-bd-event block', () => {
        const gtag = vi.fn();
        (window as Window & { gtag?: typeof gtag }).gtag = gtag;
        const unlisten = installClickEventListener(document);
        render(<div data-bd-event='{"name":"purchase","label":"Outer"}'>
            <button data-bd-event='{"name":"generate_lead","label":"Hero CTA"}'>
                <span>Contact</span>
            </button>
            <button data-bd-event="not-json">Broken</button>
        </div>);

        fireEvent.click(screen.getByText('Contact'));
        fireEvent.click(screen.getByText('Broken'));

        expect(gtag).toHaveBeenCalledOnce();
        expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', { event_label: 'Hero CTA' });
        unlisten();
    });

    it('installs no listener for Preview and canvas rendering remains silent', () => {
        const gtag = vi.fn();
        (window as Window & { gtag?: typeof gtag }).gtag = gtag;
        render(<>
            <SiteClickEventListener enabled={false} />
            <button data-bd-event='{"name":"login"}'>Preview action</button>
            <CanvasProvider config={{ registry: {} }}>
                <TreeRender tree={[{
                    kind: 'block', name: 'button', isComponent: false, props: [], children: [{ kind: 'text', value: 'Canvas action' }],
                    dynamic: false, clickEvent: { name: 'login' },
                } satisfies JsonBlock]} />
            </CanvasProvider>
        </>);

        fireEvent.click(screen.getByText('Preview action'));
        fireEvent.click(screen.getByText('Canvas action'));

        expect(gtag).not.toHaveBeenCalled();
    });
});
