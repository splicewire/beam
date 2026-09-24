import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProseTemplate } from '@splicewire/beam-ux/docs';
import { expect, within } from 'storybook/test';
import SiteLayout from '../../layouts/site-layout';
import { setStubPage } from '../../story-harness';

/**
 * Site / Entry — a rendered public entry (the starters' `/about`) as the packaged `site/entry` page
 * frames it: `beamInertiaOptions()` wraps every entry in `<SiteLayout>`, and an entry with no declared
 * template reads through `ProseTemplate` (`<Prose>`). The compiled body is an artifact the story cannot
 * fetch, so its rendered output stands in: the prose elements an MDX body produces, which is what the
 * scheme has to carry (headings, links, list markers, a blockquote, code and a table).
 */
const THEME = {
    site: {
        background: '#f8fafc',
        foreground: '#0f172a',
        muted: '#475569',
        accent: '#0f172a',
        accentHover: '#1e293b',
        border: 'rgba(15,23,42,.08)',
        darkBackground: '#0B0F17',
        darkForeground: '#E5E7EB',
        darkMuted: '#9CA3AF',
        darkAccent: '#8AA4FF',
        darkAccentHover: '#A9BDFF',
        darkAccentForeground: '#0B0F17',
        darkBorder: '#262B36',
    },
};

const ABOUT = { id: 'about', slug: 'about', title: 'About', type: 'page', format: 'mdx', url: '/about' };

function AboutEntry() {
    setStubPage({
        auth: { user: null },
        theme: THEME,
        nav: { items: [{ title: 'Home', href: '/' }, { title: 'About', href: '/about' }] },
    }, '/about');

    return (
        <SiteLayout>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(24px,5vw,48px) clamp(18px,5vw,40px)' }}>
                <ProseTemplate entry={ABOUT} nav={null}>
                    <h1>About this site</h1>
                    <p>
                        This page is a Beam entry: an MDX body compiled to an artifact and rendered through the
                        packaged entry page. <a href="/">Read the home page</a> or sign in to edit it in place.
                    </p>
                    <h2>What ships out of the box</h2>
                    <ul>
                        <li>A public site with its own light and dark scheme.</li>
                        <li>Entries you edit where they render.</li>
                        <li>
                            A theme entry: <code>theme.site</code> tokens, editable from the console.
                        </li>
                    </ul>
                    <blockquote>The site follows the visitor's appearance setting, then the system's.</blockquote>
                    <pre>
                        <code>php artisan splicewire:beam:ux:compile</code>
                    </pre>
                    <table>
                        <thead>
                            <tr>
                                <th>Slot</th>
                                <th>Light</th>
                                <th>Dark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>background</td>
                                <td>#f8fafc</td>
                                <td>#0b0f17</td>
                            </tr>
                        </tbody>
                    </table>
                </ProseTemplate>
            </div>
        </SiteLayout>
    );
}

const meta = {
    title: 'Inertia/Site/Entry',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** Ambient: captured light and dark. */
export const About: Story = {
    render: () => <AboutEntry />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'About this site' })).toBeInTheDocument();
    },
};

/** Pinned dark: the prose inherits the site's dark ink; markers and the quote dim off it. */
export const AboutDark: Story = {
    render: () => <AboutEntry />,
    globals: { colorScheme: 'dark' },
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('.st-site') as HTMLElement;
        const heading = within(canvasElement).getByRole('heading', { name: 'About this site' });
        await expect(getComputedStyle(root).backgroundColor).toBe('rgb(11, 15, 23)');
        await expect(getComputedStyle(heading).color).toBe('rgb(229, 231, 235)');
    },
};
