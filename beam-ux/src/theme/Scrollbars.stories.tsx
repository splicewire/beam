import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

/**
 * The scrollbar rule in `tokens.css` (owner-review-20261102 research 05), on the overflow containers an app
 * shell actually has: the deep rail, a tab strip, a wide table, a sheet, and the `<main>` that scrolls the
 * page. Flip the Scheme toolbar for dark. The bars only draw where the platform shows them: macOS with
 * "Show scroll bars: Always" or a mouse attached, Windows and Linux always.
 *
 * What to look for: no grey gutter on any tinted surface; a thumb that reads on the paper and on the rail
 * alike (it is a share of each container's own ink); thin bars everywhere except the page scroller
 * (`<main>`), which keeps the full-width target; and the chip row, whose `[scrollbar-width:none]` still
 * hides its bar. The rule applies only in a document with a `[data-beam-shell]`: `OutsideAShell` is a site
 * page, and keeps the platform's bars.
 */
const meta = {
    title: 'BeamUx/Theme/Scrollbars',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const sections = ['Workspace', 'Knowledge', 'Automation', 'Operator'];
const railItems = [
    'Overview', 'Threads', 'Circuits', 'Studio', 'Calendar', 'Sources', 'Collections', 'Silos', 'Golden sets',
    'Evaluations', 'Hooks', 'Schedules', 'Conduits', 'Models', 'Agents', 'Members', 'Teams', 'Billing', 'Plans',
    'Usage', 'Audit log', 'Settings',
];
const tabs = [
    'Summary', 'Entries', 'Redirects', 'Site health', 'Sitemap', 'Theme', 'Layouts', 'Templates', 'Pages',
    'Media', 'Forms', 'Releases', 'Recordings', 'Access',
];
const columns = ['Entry', 'Kind', 'Path', 'Template', 'Status', 'Updated', 'Owner', 'Mirror', 'Sitemap', 'Redirects'];
const rows = [
    ['Home', 'page', '/', 'landing', 'Published', '2 Nov', 'Ana Ruiz', 'In sync', 'Included', '0'],
    ['Pricing', 'page', '/pricing', 'marketing', 'Draft', '1 Nov', 'Sam Lee', 'Ahead', 'Included', '2'],
    ['Changelog', 'collection', '/changelog', 'feed', 'Published', '30 Oct', 'Ana Ruiz', 'In sync', 'Included', '0'],
    ['Docs', 'collection', '/docs', 'docs', 'Published', '28 Oct', 'Jo Park', 'Behind', 'Included', '5'],
    ['Legal', 'page', '/legal/terms', 'plain', 'Published', '12 Oct', 'Sam Lee', 'In sync', 'Excluded', '1'],
];
const settings = [
    ['Display name', 'Northwind Studio'], ['Address', 'northwind.splicewire.app'], ['Plan', 'Growth'],
    ['Region', 'eu-west'], ['Retention', '90 days'], ['Default model', 'Router · balanced'],
    ['Spend limit', '$400 / month'], ['Owner', 'Ana Ruiz'], ['Created', '14 Mar 2026'],
    ['Members', '18'], ['Teams', '4'], ['Conduits', '7'], ['Hooks', '3'], ['Schedules', '5'],
];

function Shell() {
    return (
        <div data-beam-shell="desk" className="flex h-[600px] overflow-hidden bg-background text-foreground" data-testid="shell">
            <aside className="flex w-[216px] flex-none flex-col bg-sidebar-deep py-[18px] text-sidebar-foreground">
                <div className="px-5 pb-4 text-sm font-semibold text-sidebar-active-foreground">Northwind</div>
                <nav aria-label="Navigation" data-testid="rail" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 text-[13px] font-medium">
                    {sections.map((section, s) => (
                        <section key={section} aria-label={section}>
                            <h2 className="px-3 pb-1 text-xs text-sidebar-foreground/60">{section}</h2>
                            <ul className="space-y-0.5">
                                {railItems.slice(s * 6, s * 6 + 7).map((item, i) => (
                                    <li key={item}>
                                        <a
                                            href="#"
                                            aria-current={s === 0 && i === 1 ? 'page' : undefined}
                                            className={
                                                s === 0 && i === 1
                                                    ? 'block rounded-md bg-sidebar-accent px-3 py-1.5 text-sidebar-active-foreground'
                                                    : 'block rounded-md px-3 py-1.5 hover:bg-sidebar-accent/50'
                                            }
                                        >
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-none items-center gap-3 border-b border-border bg-card px-6 py-2">
                    <div role="tablist" aria-label="Site sections" data-testid="tabs" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1">
                        {tabs.map((tab, i) => (
                            <button
                                key={tab}
                                role="tab"
                                aria-selected={i === 0}
                                className={
                                    i === 0
                                        ? 'flex-none rounded-md bg-accent px-3 py-1.5 text-sm text-accent-foreground'
                                        : 'flex-none rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted'
                                }
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex min-h-0 flex-1">
                    <main data-testid="main" data-beam-scroller="page" className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto bg-background px-6 py-6">
                        <h1 className="text-lg font-semibold">Entries</h1>

                        <div aria-label="Filters" data-testid="chips" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                            {['All kinds', 'Pages', 'Collections', 'Published', 'Drafts', 'Ahead of mirror', 'Behind mirror', 'In sitemap', 'Has redirects', 'Owned by me'].map((chip) => (
                                <span key={chip} className="flex-none rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                                    {chip}
                                </span>
                            ))}
                        </div>

                        <div data-testid="table" className="overflow-x-auto rounded-md border border-border bg-card">
                            <table className="w-max min-w-full text-left text-sm">
                                <thead className="border-b border-border text-xs text-muted-foreground">
                                    <tr>
                                        {columns.map((column) => (
                                            <th key={column} className="px-4 py-2 font-medium whitespace-nowrap">{column}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row[0]} className="border-b border-border last:border-0">
                                            {row.map((cell, i) => (
                                                <td key={i} className="px-4 py-2 whitespace-nowrap">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {Array.from({ length: 6 }, (_, i) => (
                            <p key={i} className="max-w-prose text-sm leading-6 text-muted-foreground">
                                Entries are the pages and collections a site serves. Each row opens the entry editor; the
                                mirror column says whether the published copy matches the draft, and the sitemap column
                                whether search engines are told about it.
                            </p>
                        ))}
                    </main>

                    <aside aria-label="Workspace details" data-testid="sheet" className="w-[280px] flex-none overflow-y-auto border-l border-border bg-card px-5 py-5">
                        <h2 className="pb-3 text-sm font-semibold">Workspace details</h2>
                        <dl className="space-y-3 text-sm">
                            {settings.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-xs text-muted-foreground">{label}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </aside>
                </div>
            </div>
        </div>
    );
}

/**
 * Every container really overflows (so a bar is drawn), takes the tokenised colours, and is thin except
 * `<main>`; the document's own bar is untouched; the chip row's utility still beats the base layer.
 */
export const OverflowContainers: Story = {
    render: () => <Shell />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const style = (id: string) => getComputedStyle(canvas.getByTestId(id));

        for (const id of ['rail', 'tabs', 'table', 'sheet', 'main']) {
            const el = canvas.getByTestId(id);
            await expect(el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth, `${id} overflows`).toBe(true);
            await expect(style(id).scrollbarColor, id).not.toBe('auto');
        }
        for (const id of ['rail', 'tabs', 'table', 'sheet']) {
            await expect(style(id).scrollbarWidth, id).toBe('thin');
        }
        await expect(style('main').scrollbarWidth).toBe('auto');
        await expect(style('chips').scrollbarWidth).toBe('none');
        await expect(getComputedStyle(document.documentElement).scrollbarColor).toBe('auto');
        await expect(getComputedStyle(document.documentElement).scrollbarWidth).toBe('auto');
    },
};

/** A site page (no `[data-beam-shell]` in the document): a prose code block keeps the platform's own bar. */
export const OutsideAShell: Story = {
    render: () => (
        <article className="max-w-xl space-y-3 bg-background p-6 text-foreground">
            <h1 className="text-lg font-semibold">Release notes</h1>
            <pre data-testid="code" className="overflow-x-auto rounded-md border border-border bg-card p-4 text-xs">
                {'composer require splicewire/laravel-beam-ux && php artisan splicewire:beam:install --with-ux --with-docs --with-sitemap'}
            </pre>
        </article>
    ),
    play: async ({ canvasElement }) => {
        const code = within(canvasElement).getByTestId('code');
        await expect(code.scrollWidth > code.clientWidth).toBe(true);
        await expect(getComputedStyle(code).scrollbarColor).toBe('auto');
        await expect(getComputedStyle(code).scrollbarWidth).toBe('auto');
    },
};
