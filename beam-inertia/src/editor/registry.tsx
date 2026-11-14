import { useBeamMessages } from '../messages';
import { Link, usePage } from '@inertiajs/react';
import { ManifestTable, SiteNav as BeamSiteNav } from '@splicewire/beam-ux/site';
import type { SiteNavProps } from '@splicewire/beam-ux/site';
import { lazy, Suspense } from 'react';
import { resolveBeamPage } from '../pages';
import { featureEnabled, getBeamInertiaConfig, intakeFormsEnabled, mdxHoldsBlocksEnabled } from '../config';
import { IntakeFormIsland } from './intake';
// Component registry for the visual editor's OPAQUE ISLANDS. A tree node whose `name` is a registered key
// (PascalCase) renders the REAL designed component (sealed block: select / reorder / delete, no drill-in)
// instead of an intrinsic element. Host CONFIG only — the "is this an island" test lives in the package
// canvas (`isIsland(config, name)`); this file just supplies the map. A fresh host registers its own
// designed sections here.
import type { ComponentType } from 'react';















import { DemoFeatureRow, DemoHero } from './islands';
import { richFieldComponents } from '@splicewire/beam-ux/editor';

export function defaultComponents(): Record<
    string,
    ComponentType<Record<string, unknown>>
> { return {
    DemoHero,
    DemoFeatureRow,
    ...richFieldComponents,
    // theme-entries-and-authoring STR-03: the 7 promoted auth pages' real Fortify-bound forms, sealed
    // (position/delete-only in the visual editor, never decomposed) — the files themselves are
    // UNCHANGED in location/content (chisel's scaffold-time feature-toggle operates on these exact
    // paths; moving them would require updating the starter's own chisel-paths.php).
    AuthLogin: Login,
    
    ...(featureEnabled('registration') ? { AuthRegister: Register } : {}),
    
    AuthForgotPassword: ForgotPassword,
    AuthResetPassword: ResetPassword,
    
    ...(featureEnabled('password-confirmation') ? { AuthConfirmPassword: ConfirmPassword } : {}),
    
    
    ...(featureEnabled('2fa') ? { AuthTwoFactorChallenge: TwoFactorChallenge } : {}),
    
    
    ...(featureEnabled('email-verification') ? { AuthVerifyEmail: VerifyEmail } : {}),
    // EP-07d: the packaged form, where the host turned on its public intake door (laravel-beam-ux offers the node
    // there too, so the doctor's registry check agrees).
    ...(intakeFormsEnabled() ? { IntakeForm: IntakeFormIsland } : {}),
    // EP-42: what laravel-beam-ux adds to an MDX page's profile where MDX pages hold blocks (the packages' shipped docs
    // pages place them), only there, so the doctor's registry check agrees.
    ...(mdxHoldsBlocksEnabled() ? { SiteNav: PageSiteNav, ManifestTable: ManifestTable as unknown as ComponentType<Record<string, unknown>> } : {}),
    // The host's own components (configureBeamInertia({ components })), its sections and its MDX kit.
    ...(getBeamInertiaConfig().components as Record<string, ComponentType<Record<string, unknown>>> | undefined),

}; }

/**
 * A sealed island over one of the packaged auth pages, bound to the route that serves that page (`route`, Fortify's
 * default path, as the starters serve them; `{token}` stands for one path segment). The page's form needs that route:
 * its data (the reset token and email, the password rules, a status notice) arrives as the Inertia page props, and its
 * session holds the flow the form answers (a pending two-factor login). On that route the island hands the page the
 * current props, as the route itself would.
 *
 * laravel-beam-ux offers these islands on every content page, though (AuthIslandNodeSource), so anywhere else the island
 * renders a stated refusal, never a form that cannot work (EP-42: a palette-placed reset island rendered a token-less
 * form on a starter's home page).
 */
function authIsland(page: string, route: string, form: Parameters<ReturnType<typeof useBeamMessages>['t']>[0]): ComponentType<Record<string, unknown>> {
    const Page = lazy(async () => ({ default: (await resolveBeamPage(page)) as ComponentType<Record<string, unknown>> }));
    const path = new RegExp(`^${route.replace(/\{[^}]+\}/g, '[^/]+')}$`);

    return function AuthIsland() {
        const m = useBeamMessages();
        const { url, props } = usePage<Record<string, unknown>>();

        if (!path.test(url.split(/[?#]/)[0])) {
            return <div role="note" data-auth-island-refused={route} className="p-4 text-sm">{m.t(form)}</div>;
        }

        return <Suspense fallback={null}><Page {...props} /></Suspense>;
    };
}

const Login = authIsland('auth/login', '/login', 'splicewire-beam-inertia::messages.surfaces_sign_in_own_page');
const Register = authIsland('auth/register', '/register', 'splicewire-beam-inertia::messages.surfaces_sign_up_own_page');
const ForgotPassword = authIsland('auth/forgot-password', '/forgot-password', 'splicewire-beam-inertia::messages.surfaces_password_request_own_page');
const ResetPassword = authIsland('auth/reset-password', '/reset-password/{token}', 'splicewire-beam-inertia::messages.surfaces_password_reset_own_page');
const ConfirmPassword = authIsland('auth/confirm-password', '/user/confirm-password', 'splicewire-beam-inertia::messages.surfaces_password_confirmation_own_page');
const TwoFactorChallenge = authIsland('auth/two-factor-challenge', '/two-factor-challenge', 'splicewire-beam-inertia::messages.surfaces_two_factor_own_page');
const VerifyEmail = authIsland('auth/verify-email', '/email/verify', 'splicewire-beam-inertia::messages.surfaces_email_verification_own_page');

/** `<SiteNav>` draws the site's nav projection, a page prop, as the header's SiteNav reads it (components/site-nav.tsx). */
function PageSiteNav(props: Record<string, unknown>) {
    const { nav } = usePage<{ nav?: SiteNavProps['nav'] }>().props;

    return <BeamSiteNav nav={nav ?? null} linkComponent={Link} {...props} />;
}
