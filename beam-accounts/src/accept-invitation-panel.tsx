import type { ReactNode } from 'react';
import { Button, buttonVariants, cn } from '@schemastud/ui';
import { AuthError } from './auth-fields';
import { useBeamAccountsMessages, type BeamAccountsMessages } from './messages';
import { richMessage } from './rich-message';

/**
 * The server's verdict on an invitation link for the current viewer — `InvitationRedemption` in
 * `splicewire/laravel-beam-accounts`, carried as the `state` prop of the `invitations.accept` page.
 */
export type InvitationState = 'ready' | 'guest' | 'wrong-account' | 'expired' | 'used' | 'invalid';

export interface AcceptInvitationPanelProps {
    state: InvitationState;
    /** Null when the link resolved to no live invitation (`invalid`): a bad link names nothing. */
    teamName?: string | null;
    /** The invited address. */
    email?: string | null;
    role?: string | null;
    inviterName?: string | null;
    /** Who is signed in, for the `wrong-account` explanation. */
    viewerEmail?: string | null;
    /** Take the seat. Offered only in the `ready` state. */
    onAccept?: () => void;
    processing?: boolean;
    /** Why the last accept was refused (the redeem operation's `invitation` error). */
    error?: string | null;
    registerHref?: string | null;
    loginHref?: string | null;
    /** Sign out so the invited address can sign in. Offered in the `wrong-account` state. */
    onLogout?: () => void;
    /** Where "Go to your dashboard" leads, for states with nothing left to do. */
    homeHref?: string | null;
}

/** A role is a machine name, shown capitalised; with none, the invitation is for a member. */
function roleLabel(role: string | null | undefined, m: BeamAccountsMessages): string {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : m.t('splicewire-beam-accounts::messages.invite_member_role');
}

const primaryLink = cn(buttonVariants({ variant: 'default' }), 'w-full');
const secondaryLink = cn(buttonVariants({ variant: 'outline' }), 'w-full');

/**
 * What an invitee sees when they open the emailed link: the invitation, and the ONE next step their
 * situation allows — accept it, register or log in first, sign out of the wrong account, or nothing
 * (expired, used, invalid) with the reason.
 *
 * Transport-free: the host supplies `onAccept` / `onLogout` and the hrefs, and renders the page chrome.
 */
export function AcceptInvitationPanel(props: AcceptInvitationPanelProps) {
    const { state, teamName, email, role, inviterName, viewerEmail, onAccept, processing = false, error } = props;
    const m = useBeamAccountsMessages();
    const team = teamName ?? m.t('splicewire-beam-accounts::messages.invite_the_team');
    const invitedLine = (
        <p className="text-sm text-muted-foreground">
            {richMessage(m, 'splicewire-beam-accounts::messages.invite_invited_line', { inviter: inviterName ?? m.t('splicewire-beam-accounts::messages.invite_a_teammate'), email: <b className="font-medium text-foreground">{email}</b>, team: <b className="font-medium text-foreground">{team}</b>, role: <b className="font-medium text-foreground">{roleLabel(role, m)}</b> })}
        </p>
    );

    return (
        <section className="w-full space-y-5" aria-labelledby="invitation-heading" data-invitation-state={state}>
            {state === 'ready' && (
                <>
                    <Heading>{m.t('splicewire-beam-accounts::messages.invite_join', { team })}</Heading>
                    {invitedLine}
                    <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-accounts::messages.invite_signed_in_as', { email: viewerEmail ?? email ?? "" })}</p>
                    <AuthError message={error} />
                    <Button className="w-full" onClick={onAccept} disabled={processing || !onAccept}>
                        {processing ? m.t('splicewire-beam-accounts::messages.invite_joining') : m.t('splicewire-beam-accounts::messages.invite_accept')}
                    </Button>
                </>
            )}

            {state === 'guest' && (
                <>
                    <Heading>{m.t('splicewire-beam-accounts::messages.invite_join', { team })}</Heading>
                    {invitedLine}
                    <p className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-accounts::messages.invite_create_or_login', { email: email ?? "" })}
                    </p>
                    <div className="flex flex-col gap-2">
                        {props.registerHref ? (
                            <a href={props.registerHref} className={primaryLink}>
                                {m.t('splicewire-beam-accounts::messages.invite_create_account')}
                            </a>
                        ) : null}
                        {props.loginHref ? (
                            <a href={props.loginHref} className={secondaryLink}>
                                {m.t('splicewire-beam-accounts::messages.invite_log_in')}
                            </a>
                        ) : null}
                    </div>
                </>
            )}

            {state === 'wrong-account' && (
                <>
                    <Heading>{m.t('splicewire-beam-accounts::messages.invite_wrong_account')}</Heading>
                    <p className="text-sm text-muted-foreground">
                        {richMessage(m, 'splicewire-beam-accounts::messages.invite_wrong_account_body', { email: <b className="font-medium text-foreground">{email}</b>, viewer: <b className="font-medium text-foreground">{viewerEmail}</b>, again: email })}
                    </p>
                    <AuthError message={error} />
                    {props.onLogout ? (
                        <Button variant="outline" className="w-full" onClick={props.onLogout}>
                            {m.t('splicewire-beam-accounts::messages.invite_log_out')}
                        </Button>
                    ) : null}
                </>
            )}

            {state === 'expired' && (
                <>
                    <Heading>{m.t('splicewire-beam-accounts::messages.invite_expired')}</Heading>
                    <p className="text-sm text-muted-foreground">
                        {inviterName ? m.t('splicewire-beam-accounts::messages.invite_expired_ask_named', { name: inviterName, team }) : m.t('splicewire-beam-accounts::messages.invite_expired_ask_team', { team })}
                    </p>
                    <Home href={props.homeHref} />
                </>
            )}

            {state === 'used' && (
                <>
                    <Heading>{m.t('splicewire-beam-accounts::messages.invite_used')}</Heading>
                    <p className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-accounts::messages.invite_used_body', { team })}
                    </p>
                    <Home href={props.homeHref} />
                </>
            )}

            {state === 'invalid' && (
                <>
                    <Heading>{m.t('splicewire-beam-accounts::messages.invite_invalid')}</Heading>
                    <p className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-accounts::messages.invite_invalid_body')}
                    </p>
                    <Home href={props.homeHref} />
                </>
            )}
        </section>
    );
}

function Heading({ children }: { children: ReactNode }) {
    return (
        <h1 id="invitation-heading" className="text-lg font-semibold">
            {children}
        </h1>
    );
}

function Home({ href }: { href?: string | null }) {
    const m = useBeamAccountsMessages();
    return href ? (
        <a href={href} className={secondaryLink}>
            {m.t('splicewire-beam-accounts::messages.invite_dashboard')}
        </a>
    ) : null;
}
