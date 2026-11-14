import { AuthMessage } from '../../components/auth-message';
import { setLayoutProps } from '@inertiajs/react';
import { englishBeamMessages, useBeamMessages } from '../../messages';
import { featureEnabled } from '../../config';
import { Form, Head, usePage } from '@inertiajs/react';

import { Link } from '@inertiajs/react';

import DeleteUser from '../../components/delete-user';
import Heading from '../../components/heading';
import InputError from '../../components/input-error';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { Auth } from '../../types';

import type { ProfilePageData } from '@splicewire/beam-resources/types/accounts-pages';


type PageProps = {
    auth: Auth;
};

/**
 * A locale's own name for itself ("Español", "Deutsch"), so a reader finds their language in any UI language; the tag
 * when the runtime cannot name it.
 */
export function languageName(tag: string): string {
    try {
        return new Intl.DisplayNames([tag], { type: 'language' }).of(tag) ?? tag;
    } catch {
        return tag;
    }
}

export default function Profile(
    
    { mustVerifyEmail, status, preferredLocale = null, supportedLocales = [] }: ProfilePageData,
    
) {
    const messages = useBeamMessages();
    setLayoutProps({ breadcrumbs: [{ title: messages.t('splicewire-beam-inertia::messages.auth_profile_settings'), href: { method: 'get', url: '/settings/profile' } }] });
    const { auth } = usePage<PageProps>().props;

    return (
        // Sections space themselves: the settings layout's `space-y-12` only reaches a page's
        // direct children when that layout wraps it, so a bare mount put each section's Save
        // flush against the next heading.
        <div className="space-y-12">
            <Head title={messages.t('splicewire-beam-inertia::messages.auth_profile_settings')} />

            <h1 className="sr-only">{messages.t('splicewire-beam-inertia::messages.auth_profile_settings')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={messages.t('splicewire-beam-inertia::messages.auth_profile')}
                    description={messages.t('splicewire-beam-inertia::messages.auth_update_your_name_and_email_address')}
                />

                <Form
                    action="/settings/profile"
                    method="patch"
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">{messages.t('splicewire-beam-inertia::messages.auth_name')}</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder={messages.t('splicewire-beam-inertia::messages.auth_full_name')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{messages.t('splicewire-beam-inertia::messages.auth_email_address')}</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder={messages.t('splicewire-beam-inertia::messages.auth_email_address')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {/* localization 36: the person's language. "Automatic" (empty) clears the choice; it is saved only
                                by this explicit submit, never by negotiation. */}
                            {supportedLocales.length > 0 && (
                                <div className="grid gap-2">
                                    <Label htmlFor="preferredLocale">{messages.t('splicewire-beam-inertia::messages.auth_language')}</Label>

                                    <select
                                        id="preferredLocale"
                                        name="preferredLocale"
                                        defaultValue={preferredLocale ?? ''}
                                        className="mt-1 block h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm"
                                    >
                                        <option value="">{messages.t('splicewire-beam-inertia::messages.auth_automatic')}</option>
                                        {supportedLocales.map((tag) => (
                                            <option key={tag} value={tag} lang={tag}>
                                                {languageName(tag)}
                                            </option>
                                        ))}
                                    </select>

                                    <InputError
                                        className="mt-2"
                                        message={errors.preferredLocale}
                                    />
                                </div>
                            )}

                            {featureEnabled('email-verification') && (<>
                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            <AuthMessage text={messages.t('splicewire-beam-inertia::messages.auth_unverified_email_prompt', { action: '\uFFFC0\uFFFC' })} parts={[<Link
                                                href="/email/verification-notification"
                                                method="post"
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                {messages.t('splicewire-beam-inertia::messages.auth_click_here_to_re_send_the_verification_email')}</Link>]} />
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-primary">
                                                {messages.t('splicewire-beam-inertia::messages.auth_a_new_verification_link_has_been_sent_to_your_email_address')}</div>
                                        )}
                                    </div>
                                )}
                            </>)}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {messages.t('splicewire-beam-inertia::messages.auth_save')}</Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </div>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: englishBeamMessages.t('splicewire-beam-inertia::messages.auth_profile_settings'),
            href: { method: 'get', url: '/settings/profile' },
        },
    ],
};
