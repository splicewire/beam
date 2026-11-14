import { useBeamMessages } from '../../messages';
// Components
import { Form, usePage } from '@inertiajs/react';
import TextLink from '../../components/text-link';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import type { AuthEntryPageData } from '@splicewire/beam-resources/types/accounts-pages';
// theme-entries-and-authoring STR-03: a sealed island (editor/registry.tsx), no longer the top-level
// Inertia page — read via usePage() instead of received as a direct component prop.
export default function VerifyEmail() {
    const messages = useBeamMessages();
    const { status } = usePage<AuthEntryPageData>().props;

    return (
        <>
            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-primary">
                    {messages.t('splicewire-beam-inertia::messages.auth_a_new_verification_link_has_been_sent_to_the_email_address_you_provided_during_registration')}</div>
            )}

            <Form
                action="/email/verification-notification"
                method="post"
                className="space-y-6 text-center"
            >
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            {messages.t('splicewire-beam-inertia::messages.auth_resend_verification_email')}</Button>

                        <TextLink
                            href="/logout"
                            method="post"
                            className="mx-auto block text-sm"
                        >
                            {messages.t('splicewire-beam-inertia::messages.auth_log_out')}</TextLink>
                    </>
                )}
            </Form>
        </>
    );
}
