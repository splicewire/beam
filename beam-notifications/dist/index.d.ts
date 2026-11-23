import * as react from 'react';
import { ReactNode } from 'react';
import * as _tanstack_react_query from '@tanstack/react-query';
import * as _schemastud_messages from '@schemastud/messages';

/** The optional "Needs you" slot a host fills (tower-ux fills it with Review): a count and one link, never rows. */
interface NeedsYou {
    count: number;
    href: string;
}
interface NotificationBellProps {
    /** The decisions waiting on this person. Absent: the bell shows "Recent" alone (a beam-only site). */
    needsYou?: NeedsYou;
    /** The Frame list page for the notifications resource ("See all"). */
    seeAllHref: string;
    /** How many recent rows the popover lists (ticket 11: five). */
    recentLimit?: number;
    /** The unread figure's poll interval (ruling 8: 60 seconds). */
    unreadPollMs?: number;
    /**
     * How the bell draws a link. Default: a plain anchor. A single-page host passes its router's link here (with the
     * href it already minted) so following "Needs you", a Recent row or "See all" stays in the app instead of reloading it.
     */
    renderLink?: (link: BellLink) => ReactNode;
}
/** One link the bell draws: the href as given, the bell's class, and its content. */
interface BellLink {
    href: string;
    className?: string;
    children: ReactNode;
}
/**
 * The one bell (attention-surfaces 11; decision 02, rulings 6, 7, 8 and 13). It renders inside the host realm's Frame
 * kit and owns no provider (02-1/02-5): every read and write goes through that kit's transport (48-1).
 *
 * - The badge NUMBER keeps its meaning, things waiting on me: it is `needsYou.count`, and nothing else ever adds to it.
 *   It keeps the existing badge rule (tower's ReviewCountBadge): nothing at zero, capped at 9+. The "Needs you" section
 *   shows the exact count and its link even at zero, so the worklist stays one click away. Unread notifications are a
 *   DOT with no number, read from the resource's `unread` summary figure (ruling 7).
 * - The popover has two sections that never share a list (ruling 13): "Needs you" is the count and one link to the
 *   worklist; "Recent" is the newest rows, each with its text, relative time, unread mark and link, and "Mark all read"
 *   and "See all" at its foot. "Recent" is absent when there are no stored rows; "Needs you" is absent with no slot.
 * - "Recent" refreshes on open; the unread figure on its poll; never from a broadcast (ruling 8).
 */
declare function NotificationBell({ needsYou, seeAllHref, recentLimit, unreadPollMs, renderLink }: NotificationBellProps): react.JSX.Element;

/** The `notifications` resource (laravel-beam-notifications, attention-surfaces 09): the signed-in reader's own rows. */
declare const NOTIFICATIONS_RESOURCE = "notifications";
/**
 * One stored notification as the resource serves it (laravel-beam-notifications `StoredNotificationData`; its generated
 * type is `Splicewire.Beam.Notifications.Data.StoredNotificationData` in a host's tree). Text is already rendered for the
 * reader by the server; the link is shown exactly as stored.
 */
interface StoredNotification {
    id: string;
    text: string | null;
    kind: string | null;
    link: string | null;
    unread: boolean;
    createdAt: string | null;
}
/** Ruling 8: the unread figure on a 60 second poll; no broadcast. */
declare const UNREAD_POLL_MS = 60000;
/** The reader's unread count: the resource's summary figure `unread`, through the realm kit's transport (48-1). */
declare function useUnreadNotificationCount(pollMs?: number): _tanstack_react_query.UseQueryResult<number, Error>;
/** Ruling 8: "Recent" refreshes on open. The newest `limit` rows (the resource lists newest first). */
declare function useRecentNotifications(open: boolean, limit: number): _tanstack_react_query.UseQueryResult<NoInfer<StoredNotification[]>, Error>;
/**
 * Mark one read (`read`, with its id) or all read (`read-all`): the resource's DECLARED actions (attention-surfaces 10),
 * taken from the realm manifest and run by the kit transport's `invoke`, never a hand-written request. Afterwards every
 * cached notifications read refreshes, so the unread dot and the rows agree.
 */
declare function useMarkNotificationsRead(failedMessage: string): {
    markRead: (id: string) => void;
    markAllRead: () => void;
    canMarkRead: boolean;
    canMarkAllRead: boolean;
    pending: boolean;
};

/** English defaults, for copy read outside a render. */
declare const englishBeamNotificationsMessages: _schemastud_messages.Messages<"splicewire-beam-notifications::messages.bell_label" | "splicewire-beam-notifications::messages.mark_all_read" | "splicewire-beam-notifications::messages.mark_read" | "splicewire-beam-notifications::messages.mark_read_failed" | "splicewire-beam-notifications::messages.needs_you" | "splicewire-beam-notifications::messages.needs_you_open" | "splicewire-beam-notifications::messages.recent" | "splicewire-beam-notifications::messages.see_all" | "splicewire-beam-notifications::messages.unread">;
type BeamNotificationsMessages = typeof englishBeamNotificationsMessages;
/** beam-notifications's package defaults on the host's one message provider (no second provider); English without one. */
declare const useBeamNotificationsMessages: () => BeamNotificationsMessages;

export { type BeamNotificationsMessages, type BellLink, NOTIFICATIONS_RESOURCE, type NeedsYou, NotificationBell, type NotificationBellProps, type StoredNotification, UNREAD_POLL_MS, englishBeamNotificationsMessages, useBeamNotificationsMessages, useMarkNotificationsRead, useRecentNotifications, useUnreadNotificationCount };
