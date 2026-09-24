import type { ReactNode } from 'react';
import { Button, buttonVariants, cn } from '@schemastud/ui';
import { AuthError } from './auth-fields';

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

function roleLabel(role?: string | null): string {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member';
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
    const team = teamName ?? 'the team';
    const invitedLine = (
        <p className="text-sm text-muted-foreground">
            {inviterName ?? 'A teammate'} invited <b className="font-medium text-foreground">{email}</b> to join{' '}
            <b className="font-medium text-foreground">{team}</b> as <b className="font-medium text-foreground">{roleLabel(role)}</b>.
        </p>
    );

    return (
        <section className="w-full space-y-5" aria-labelledby="invitation-heading" data-invitation-state={state}>
            {state === 'ready' && (
                <>
                    <Heading>Join {team}</Heading>
                    {invitedLine}
                    <p className="text-sm text-muted-foreground">You're signed in as {viewerEmail ?? email}.</p>
                    <AuthError message={error} />
                    <Button className="w-full" onClick={onAccept} disabled={processing || !onAccept}>
                        {processing ? 'Joining…' : 'Accept invitation'}
                    </Button>
                </>
            )}

            {state === 'guest' && (
                <>
                    <Heading>Join {team}</Heading>
                    {invitedLine}
                    <p className="text-sm text-muted-foreground">
                        Create an account for {email}, or log in if you already have one. You'll come straight back
                        here to accept.
                    </p>
                    <div className="flex flex-col gap-2">
                        {props.registerHref ? (
                            <a href={props.registerHref} className={primaryLink}>
                                Create account
                            </a>
                        ) : null}
                        {props.loginHref ? (
                            <a href={props.loginHref} className={secondaryLink}>
                                Log in
                            </a>
                        ) : null}
                    </div>
                </>
            )}

            {state === 'wrong-account' && (
                <>
                    <Heading>This invitation is for someone else</Heading>
                    <p className="text-sm text-muted-foreground">
                        It was sent to <b className="font-medium text-foreground">{email}</b>, but you're signed in as{' '}
                        <b className="font-medium text-foreground">{viewerEmail}</b>. Log out, then open the link again and
                        sign in or register as {email}.
                    </p>
                    <AuthError message={error} />
                    {props.onLogout ? (
                        <Button variant="outline" className="w-full" onClick={props.onLogout}>
                            Log out
                        </Button>
                    ) : null}
                </>
            )}

            {state === 'expired' && (
                <>
                    <Heading>This invitation has expired</Heading>
                    <p className="text-sm text-muted-foreground">
                        {inviterName ? `Ask ${inviterName}` : 'Ask the team'} to send you a new invitation to {team}.
                    </p>
                    <Home href={props.homeHref} />
                </>
            )}

            {state === 'used' && (
                <>
                    <Heading>This invitation has already been used</Heading>
                    <p className="text-sm text-muted-foreground">
                        Each invitation link works once. If you accepted it, {team} is already in your account.
                    </p>
                    <Home href={props.homeHref} />
                </>
            )}

            {state === 'invalid' && (
                <>
                    <Heading>This invitation link isn't valid</Heading>
                    <p className="text-sm text-muted-foreground">
                        It may have been revoked, or replaced by a newer invitation. Check your email for the latest
                        link, or ask the team to invite you again.
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
    return href ? (
        <a href={href} className={secondaryLink}>
            Go to your dashboard
        </a>
    ) : null;
}
