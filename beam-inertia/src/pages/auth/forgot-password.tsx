import { AuthMessage } from '../../components/auth-message';
import { useBeamMessages } from '../../messages';
// Components
import { Form, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '../../components/input-error';
import TextLink from '../../components/text-link';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { AuthEntryPageData } from '@splicewire/beam-resources/types/accounts-pages';
// theme-entries-and-authoring STR-03: a sealed island (editor/registry.tsx), no longer the top-level
// Inertia page — read via usePage() instead of received as a direct component prop.
export default function ForgotPassword() {
    const messages = useBeamMessages();
    const { status } = usePage<AuthEntryPageData>().props;

    return (
        <>
            {status && (
                <div className="mb-4 text-center text-sm font-medium text-primary">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form action="/forgot-password" method="post">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">{messages.t('splicewire-beam-inertia::messages.auth_email_address')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder={messages.t('splicewire-beam-inertia::messages.auth_email_example_com_lowercase')}
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    {messages.t('splicewire-beam-inertia::messages.auth_email_password_reset_link')}</Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <AuthMessage wrapText={(text) => <span>{text}</span>} text={messages.t('splicewire-beam-inertia::messages.auth_return_to_login', { action: '\uFFFC0\uFFFC' })} parts={[<TextLink href="/login">{messages.t('splicewire-beam-inertia::messages.auth_log_in_lowercase')}</TextLink>]} />
                </div>
            </div>
        </>
    );
}
