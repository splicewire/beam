import { englishBeamMessages, useBeamMessages } from '../../messages';
import { setLayoutProps } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AppearanceTabs from '../../components/appearance-tabs';
import Heading from '../../components/heading';
export default function Appearance() {
    const messages = useBeamMessages();
    setLayoutProps({ breadcrumbs: [{ title: messages.t('splicewire-beam-inertia::messages.auth_appearance_settings'), href: { method: 'get', url: '/settings/appearance' } }] });
    return (
        <>
            <Head title={messages.t('splicewire-beam-inertia::messages.auth_appearance_settings')} />

            <h1 className="sr-only">{messages.t('splicewire-beam-inertia::messages.auth_appearance_settings')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={messages.t('splicewire-beam-inertia::messages.auth_appearance_settings')}
                    description={messages.t('splicewire-beam-inertia::messages.auth_update_the_appearance_settings_for_your_account')}
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: englishBeamMessages.t('splicewire-beam-inertia::messages.auth_appearance_settings'),
            href: { method: 'get', url: '/settings/appearance' },
        },
    ],
};
