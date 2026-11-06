/**
 * The Site map (owner-review-20261102 research 37): Outline, Canvas and Columns behind one toggle over the 45-page
 * fixture, sharing one inspector. Each story fixes its view and an in-memory view store, so a shot never inherits a
 * remembered view from the browser.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteMap } from './SiteMap';
import { FIXTURE_PAGES, FIXTURE_PARTS, FIXTURE_SITE, FIXTURE_TENANT_PAGES, FIXTURE_TRACES } from './fixture';
import type { SiteMapView, SiteMapViewStore } from './types';

const memory = (view: SiteMapView): SiteMapViewStore => { let v = view; return { get: () => v, set: (next) => { v = next; } }; };
const noop = () => undefined;

const meta: Meta<typeof SiteMap> = {
    title: 'BeamUx/Site map',
    component: SiteMap,
    parameters: { layout: 'fullscreen' },
    args: {
        pages: FIXTURE_PAGES, traces: FIXTURE_TRACES, parts: FIXTURE_PARTS, siteName: FIXTURE_SITE, defaultSelectedId: 'pricing',
        onOpen: noop, onPageSettings: noop, onAddRedirect: noop, onOpenRedirect: noop, onFileAction: noop,
    },
    render: (args) => <div className="h-dvh"><SiteMap {...args} /></div>,
};
export default meta;
type Story = StoryObj<typeof SiteMap>;

export const Outline: Story = { args: { viewStore: memory('outline') } };
export const Canvas: Story = { args: { viewStore: memory('canvas') } };
export const Columns: Story = { args: { viewStore: memory('columns') } };
export const NeedsAttention: Story = { name: 'Outline, needs attention', args: { viewStore: memory('outline'), defaultFilter: 'attention', defaultSelectedId: 'widgets' } };
export const TenantSite: Story = { name: 'Outline, a tenant site (no File column)', args: { viewStore: memory('outline'), pages: FIXTURE_TENANT_PAGES } };
export const NothingSelected: Story = { name: 'Outline, nothing selected', args: { viewStore: memory('outline'), defaultSelectedId: null } };
