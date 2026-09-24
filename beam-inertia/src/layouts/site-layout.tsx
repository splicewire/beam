import { Head, Link, usePage } from '@inertiajs/react';
import { SiteLayout as BeamSiteLayout } from '@splicewire/beam-ux/site';
import { type ReactNode, useEffect, useState } from 'react';
import AppLogoIcon from '../components/app-logo-icon';
import SiteNav from '../components/site-nav';
import { useAppearance } from '../hooks/use-appearance';
/**
 * The public-site chrome (header + footer) for the starter, in a NEUTRAL theme. The STRUCTURE comes
 * from the generic package `<SiteLayout>` (`@splicewire/beam-ux/site`); this wrapper supplies only the
 * host THEME + the brand + the nav/footer slots. This is the "wrote only config" proof for the site
 * realm — no site-chrome machinery lives in the host.
 *
 * Nav CONTENT is data-driven from the shared `nav` prop via <SiteNav>; the auth affordance + brand are
 * hand-placed here. Every public page wraps its body in <SiteLayout>.
 *
 * theme-entries-and-authoring ticket `str-01`: the chrome reads `--theme-site-*` custom properties
 * instead of hardcoded hex — {@see ThemeSiteStyle} declares those vars from `page.props.theme.site`
 * (the `ThemeResolver` cascade).
 *
 * ## Light and dark
 *
 * The chrome paints through one set of layout variables (`--st-bg`, `--st-fg`, `--st-muted`, …) that
 * `.st-site` binds to the LIGHT theme slots and `.dark .st-site` / `.st-site.dark` re-bind to the
 * `dark*` slots `theme.site` carries (`darkBackground`, …). So the site is dark exactly when the app is:
 * the `.dark` class the app shell's appearance setting toggles on `<html>` (the stored preference,
 * falling back to the system's `prefers-color-scheme`; `initializeTheme` and the Blade head script set
 * it before paint). {@see useSiteDark} covers a host that never applied that class. Inside the site,
 * `dark:` utilities and the beam token layer's `.dark` values follow the same class.
 *
 * Every `var(--theme-site-*, <value>)` carries the pre-theme literal as its fallback — unlike the shell
 * side (which has `OS_SHELL_CSS`'s own literal values as an always-present base layer underneath
 * `ThemeShellStyle`'s override), site has only ONE style layer. Without a fallback, a missing
 * `page.props.theme.site` would compute `background`/`color` to their CSS initial value (transparent —
 * `background-color` isn't inherited), not today's colour — an invisible button, not a safe degrade.
 *
 * The demo islands and the default page tree read the same `--st-*` names (card, hero and dim tones
 * included), so the packaged front door flips with the chrome instead of staying a light panel. The
 * window-mode editor's canvas (`.ve-canvas`) paints its own light surface, so it re-binds the LIGHT
 * values for the tree inside it; the in-place editor edits over the page and keeps the page's scheme.
 */
const CSS = `
.st-site,.st-site .ve-canvas{
  --st-bg:var(--theme-site-background, #f8fafc);
  --st-fg:var(--theme-site-foreground, #0f172a);
  --st-muted:var(--theme-site-muted, #475569);
  --st-accent:var(--theme-site-accent, #0f172a);
  --st-accent-hover:var(--theme-site-accent-hover, #1e293b);
  --st-accent-fg:var(--theme-site-accent-foreground, #fff);
  --st-border:var(--theme-site-border, rgba(15,23,42,.08));
  --st-dim:#64748b;
  --st-card:#fff;
  --st-card-border:#e2e8f0;
  --st-hero-from:#f8fafc;
  --st-hero-to:#eef2ff;
  --st-logo:#000;
  --st-header-bg:color-mix(in srgb, var(--st-bg) 86%, transparent);
}
.st-site{background:var(--st-bg);color:var(--st-fg)}
.dark .st-site,.st-site.dark{
  --st-bg:var(--theme-site-dark-background, #0b0f17);
  --st-fg:var(--theme-site-dark-foreground, #e5e7eb);
  --st-muted:var(--theme-site-dark-muted, #9ca3af);
  --st-accent:var(--theme-site-dark-accent, #8aa4ff);
  --st-accent-hover:var(--theme-site-dark-accent-hover, #a9bdff);
  --st-accent-fg:var(--theme-site-dark-accent-foreground, #0b0f17);
  --st-border:var(--theme-site-dark-border, #262b36);
  --st-dim:var(--st-muted);
  --st-card:color-mix(in srgb, var(--st-fg) 4%, var(--st-bg));
  --st-card-border:var(--st-border);
  --st-hero-from:var(--st-bg);
  --st-hero-to:color-mix(in srgb, var(--st-accent) 14%, var(--st-bg));
  --st-logo:var(--st-fg);
  color-scheme:dark;
}
.st-site a{color:inherit;text-decoration:none}
.st-site .navlink{font-size:14px;color:var(--st-muted);text-decoration:none;transition:color .15s}
.st-site .navlink:hover{color:var(--st-accent)}
.st-site .btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--st-accent);color:var(--st-accent-fg);border:none;border-radius:10px;padding:9px 16px;font:600 14px system-ui;cursor:pointer;transition:background .15s;text-decoration:none}
.st-site .btn-primary:hover{background:var(--st-accent-hover)}
`;

/** `page.props.theme.site` — the resolved `theme.site` namespace (`ThemeSchemas::site()`), light + dark. */
export interface SiteThemeTokens {
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    accentHover: string;
    accentForeground?: string;
    border: string;
    darkBackground?: string;
    darkForeground?: string;
    darkMuted?: string;
    darkAccent?: string;
    darkAccentHover?: string;
    darkAccentForeground?: string;
    darkBorder?: string;
}

const SLOT_VARS: [keyof SiteThemeTokens, string][] = [
    ['background', 'background'],
    ['foreground', 'foreground'],
    ['muted', 'muted'],
    ['accent', 'accent'],
    ['accentHover', 'accent-hover'],
    ['accentForeground', 'accent-foreground'],
    ['border', 'border'],
    ['darkBackground', 'dark-background'],
    ['darkForeground', 'dark-foreground'],
    ['darkMuted', 'dark-muted'],
    ['darkAccent', 'dark-accent'],
    ['darkAccentHover', 'dark-accent-hover'],
    ['darkAccentForeground', 'dark-accent-foreground'],
    ['darkBorder', 'dark-border'],
];

/** The `.st-site` declarations for a resolved `theme.site` — one `--theme-site-*` per present slot. */
export function siteThemeCss(site: Partial<SiteThemeTokens>): string {
    const lines = SLOT_VARS.filter(([key]) => typeof site[key] === 'string' && site[key] !== '').map(
        ([key, name]) => `  --theme-site-${name}:${site[key]};`,
    );

    return `.st-site{\n${lines.join('\n')}\n}`;
}

/** Renders nothing when `page.props.theme.site` is absent — `CSS`'s `var(--theme-site-*, <hex>)` refs
 * fall through to their literal fallback then, matching the pre-theme palette exactly. */
function ThemeSiteStyle() {
    const page = usePage<{ theme?: { site?: SiteThemeTokens } }>();
    const site = page.props.theme?.site;

    if (!site) {
        return null;
    }

    return <style dangerouslySetInnerHTML={{ __html: siteThemeCss(site) }} />;
}

/**
 * Whether the site renders dark: the app's resolved appearance (the stored preference, else the
 * system `prefers-color-scheme`), re-read when the system scheme changes. The same answer the app
 * shell's `.dark` class gives — this only matters where that class was never applied, so it marks the
 * site root itself rather than touching `<html>`.
 */
export function useSiteDark(): boolean {
    const { resolvedAppearance } = useAppearance();
    const [, rerender] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => rerender((n) => n + 1);
        query.addEventListener('change', onChange);

        return () => query.removeEventListener('change', onChange);
    }, []);

    return resolvedAppearance === 'dark';
}

const brand = (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <AppLogoIcon
            style={{
                width: 22,
                height: 22,
                display: 'block',
                color: 'var(--st-fg, #0f172a)',
                // A host logo is typically an unfilled path (the starters' mark), which paints black.
                fill: 'var(--st-logo, #000)',
            }}
        />
        <span
            style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--st-fg, #0f172a)',
            }}
        >
            Beam Starter
        </span>
    </Link>
);

// This site's ONE chrome renders for guests AND signed-in principals alike (SiteLayout has no separate
// authed variant) - the guest "Sign in"/"Dashboard" pair below must reflect real auth state, not a fixed
// guest assumption. `AuthNavLinks` is the one piece of the header that reads `usePage()`.
function AuthNavLinks() {
    const page = usePage<{
        auth: { user: { name: string } | null };
        can?: Record<string, boolean>;
    }>();
    const { auth, can } = page.props;

    if (!auth.user) {
        return (
            <>
                <a className="navlink" href="/login">
                    Sign in
                </a>
                <a className="btn-primary" href="/dashboard">
                    Dashboard
                </a>
            </>
        );
    }

    return (
        <>
            {can?.['app:operator'] && (
                <a className="navlink" href="/operator">
                    Operator
                </a>
            )}
            <Link className="navlink" href="/dashboard">
                Dashboard
            </Link>
            <Link className="navlink" href="/logout" method="post" as="button">
                Log out
            </Link>
        </>
    );
}

const nav = (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            marginLeft: 'auto',
            flexWrap: 'wrap',
        }}
    >
        <SiteNav />
        <AuthNavLinks />
    </div>
);

export default function SiteLayout({ children }: { children: ReactNode }) {
    const dark = useSiteDark();
    const page = usePage<{ auth: { user: unknown }; nav?: { items: { title: string; href?: string | null }[] } }>();
    // The content links are the SAME `nav` prop the header's SiteNav reads (the `site` sitemap), so a renamed
    // nav title reaches the footer too. The fixed pair is only the fallback for a host that shares no nav.
    const contentLinks = page.props.nav?.items
        .filter((item): item is { title: string; href: string } => Boolean(item.href))
        .map(({ title, href }) => ({ title, href })) ?? [
        { title: 'Home', href: '/' },
        { title: 'About', href: '/about' },
    ];
    const footerLinks = [
        ...contentLinks,
        page.props.auth.user
            ? { title: 'Dashboard', href: '/dashboard' }
            : { title: 'Sign in', href: '/login' },
    ];

    return (
        <BeamSiteLayout
            linkComponent={Link}
            brand={brand}
            nav={nav}
            footerLinks={footerLinks}
            head={
                <>
                    <Head title="Beam Starter" />
                    <style dangerouslySetInnerHTML={{ __html: CSS }} />
                    <ThemeSiteStyle />
                </>
            }
            footerBrand={brand}
            footerStyle={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 48,
                padding: '28px clamp(18px,5vw,56px)',
                borderTop: '1px solid var(--st-border)',
                color: 'var(--st-dim)',
                fontSize: 13,
            }}
            footerLinkClassName="navlink"
            footerLinkStyle={{ marginLeft: 18 }}
            className={dark ? 'st-site dark' : 'st-site'}
            style={{
                fontFamily: 'system-ui, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
            headerStyle={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                flexWrap: 'wrap',
                padding: '16px clamp(18px,5vw,56px)',
                background: 'var(--st-header-bg)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--st-border)',
            }}
            mainStyle={{ flex: 1, width: '100%' }}
        >
            {children}
        </BeamSiteLayout>
    );
}
