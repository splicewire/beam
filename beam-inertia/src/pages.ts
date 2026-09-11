import { beamUxPages } from '@splicewire/beam-ux/pages';
import { featureEnabled, getBeamInertiaConfig, type PageLoader, type PageModule } from './config';
const defaults: Record<string, PageLoader> = {
    ...beamUxPages as unknown as Record<string, PageLoader>,
    'os': () => import('./pages/os') as unknown as Promise<PageModule>,
    'settings/profile': () => import('./pages/settings/profile') as unknown as Promise<PageModule>,
    'settings/appearance': () => import('./pages/settings/appearance') as unknown as Promise<PageModule>,
    'settings/security': () => import('./pages/settings/security') as unknown as Promise<PageModule>,
    'auth/confirm-password': () => import('./pages/auth/confirm-password') as unknown as Promise<PageModule>,
    'auth/login': () => import('./pages/auth/login') as unknown as Promise<PageModule>,
    'auth/two-factor-challenge': () => import('./pages/auth/two-factor-challenge') as unknown as Promise<PageModule>,
    'auth/register': () => import('./pages/auth/register') as unknown as Promise<PageModule>,
    'auth/entry': () => import('./pages/auth/entry') as unknown as Promise<PageModule>,
    'auth/reset-password': () => import('./pages/auth/reset-password') as unknown as Promise<PageModule>,
    'auth/forgot-password': () => import('./pages/auth/forgot-password') as unknown as Promise<PageModule>,
    'auth/verify-email': () => import('./pages/auth/verify-email') as unknown as Promise<PageModule>,
    'frame/console': () => import('./pages/frame/console') as unknown as Promise<PageModule>,
    'site/home': () => import('./pages/site/home') as unknown as Promise<PageModule>,
    'account/home': () => import('./pages/account/home') as unknown as Promise<PageModule>,
    'operator/dashboard': () => import('./pages/operator/dashboard') as unknown as Promise<PageModule>,
};
const pageFeatures = {
    'auth/register': 'registration',
    'auth/verify-email': 'email-verification',
    'auth/two-factor-challenge': '2fa',
    'auth/confirm-password': 'password-confirmation',
} as const;
export async function resolveBeamPage(name: string): Promise<PageModule['default']> {
    const feature = pageFeatures[name as keyof typeof pageFeatures];
    if (feature && !featureEnabled(feature)) throw new Error(`Page disabled: ${name}`);
    const own = getBeamInertiaConfig().pages;
    const loader = own?.[`./pages/${name}.tsx`] ?? own?.[name] ?? defaults[name];
    if (!loader) throw new Error(`Page not found: ${name}`);
    return (await loader()).default;
}
