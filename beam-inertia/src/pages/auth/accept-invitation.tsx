import { Head, router, usePage } from '@inertiajs/react';
import { AcceptInvitationPanel, type InvitationState } from '@splicewire/beam-accounts';
import { useState } from 'react';

/**
 * `invitations.accept` — the page the invitation email links to
 * (`splicewire/laravel-beam-accounts` `InvitationAcceptController::show`). Open to guests; the server
 * judges the signed link for this viewer and says which of six states it is in.
 *
 * The body is `@splicewire/beam-accounts`' <AcceptInvitationPanel>. This page wires its two actions:
 *  - Accept posts to the `invitations.redeem` operation (`acceptUrl`); on success the server redirects
 *    to the dashboard of the team just joined, and a refusal comes back as the `invitation` error.
 *  - Log out (wrong account) posts to Fortify's logout and then reopens this same signed link, now as a
 *    guest, so the invitee can sign in or register as the invited address.
 *
 * A guest's register/login links need no wiring: the server stored this link as the intended URL, and
 * Fortify returns them here after either.
 *
 * Props mirror `Splicewire\Beam\Accounts\Data\Pages\AcceptInvitationPageData`.
 */
type AcceptInvitationPageProps = {
    state: InvitationState;
    teamName: string | null;
    email: string | null;
    role: string | null;
    inviterName: string | null;
    expiresAt: string | null;
    viewerEmail: string | null;
    acceptUrl: string | null;
    registerUrl: string | null;
    loginUrl: string | null;
    logoutUrl: string | null;
    errors?: Record<string, string>;
};

const TITLES: Record<InvitationState, string> = {
    ready: 'Accept invitation',
    guest: 'Accept invitation',
    'wrong-account': 'Invitation',
    expired: 'Invitation expired',
    used: 'Invitation used',
    invalid: 'Invitation',
};

export default function AcceptInvitation() {
    const props = usePage<AcceptInvitationPageProps>().props;
    const [processing, setProcessing] = useState(false);

    const accept = props.acceptUrl
        ? () =>
              router.post(
                  props.acceptUrl!,
                  {},
                  {
                      onStart: () => setProcessing(true),
                      onFinish: () => setProcessing(false),
                  },
              )
        : undefined;

    const logout = props.logoutUrl
        ? () => {
              const here = window.location.href;
              router.post(props.logoutUrl!, {}, { onFinish: () => window.location.assign(here) });
          }
        : undefined;

    return (
        <>
            <Head title={TITLES[props.state] ?? 'Invitation'} />
            <AcceptInvitationPanel
                state={props.state}
                teamName={props.teamName}
                email={props.email}
                role={props.role}
                inviterName={props.inviterName}
                viewerEmail={props.viewerEmail}
                onAccept={accept}
                processing={processing}
                error={props.errors?.invitation}
                registerHref={props.registerUrl}
                loginHref={props.loginUrl}
                onLogout={logout}
                homeHref={props.viewerEmail ? '/dashboard' : null}
            />
        </>
    );
}
