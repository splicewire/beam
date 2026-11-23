import { Popover, PopoverContent, PopoverTrigger, hitTargetFloor } from '@schemastud/ui';
import { Bell } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { type StoredNotification, useMarkNotificationsRead, useRecentNotifications, useUnreadNotificationCount } from './data';
import { useBeamNotificationsMessages } from './messages';

/** The optional "Needs you" slot a host fills (tower-ux fills it with Review): a count and one link, never rows. */
export interface NeedsYou {
    count: number;
    href: string;
}

export interface NotificationBellProps {
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
export interface BellLink {
    href: string;
    className?: string;
    children: ReactNode;
}

const plainLink = ({ href, className, children }: BellLink) => (
    <a href={href} className={className}>
        {children}
    </a>
);

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
export function NotificationBell({ needsYou, seeAllHref, recentLimit = 5, unreadPollMs, renderLink = plainLink }: NotificationBellProps) {
    const messages = useBeamNotificationsMessages();
    const [open, setOpen] = useState(false);
    const unread = useUnreadNotificationCount(unreadPollMs);
    const recent = useRecentNotifications(open, recentLimit);
    const marks = useMarkNotificationsRead(messages.t('splicewire-beam-notifications::messages.mark_read_failed'));
    const hasUnread = (unread.data ?? 0) > 0;
    const rows = recent.data ?? [];
    const label = messages.t('splicewire-beam-notifications::messages.bell_label');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={hasUnread ? `${label}, ${messages.t('splicewire-beam-notifications::messages.unread')}` : label}
                    data-unread={hasUnread ? 'true' : 'false'}
                    // hitTargetFloor (C40): the trigger clears the 44px mobile tap floor, as its top-bar neighbours do.
                    className={`${hitTargetFloor} inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium`}
                >
                    <Bell className="size-[13px]" aria-hidden />
                    {needsYou && needsYou.count > 0 ? (
                        <span data-testid="bell-count" className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                            {needsYou.count > 9 ? '9+' : needsYou.count}
                        </span>
                    ) : null}
                    {hasUnread ? <span data-testid="bell-unread-dot" aria-hidden className="absolute right-1 top-1 size-2 rounded-full bg-primary" /> : null}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                {needsYou ? (
                    <section aria-label={messages.t('splicewire-beam-notifications::messages.needs_you')} className="border-b p-3">
                        <h2 className="text-xs font-semibold">{messages.t('splicewire-beam-notifications::messages.needs_you')}</h2>
                        {renderLink({
                            href: needsYou.href,
                            className: 'mt-1 flex items-center justify-between text-sm',
                            children: (
                                <>
                                    <span>{messages.t('splicewire-beam-notifications::messages.needs_you_open')}</span>
                                    <span className="font-semibold tabular-nums">{needsYou.count}</span>
                                </>
                            ),
                        })}
                    </section>
                ) : null}
                {rows.length > 0 ? (
                    <section aria-label={messages.t('splicewire-beam-notifications::messages.recent')} className="p-3">
                        <h2 className="text-xs font-semibold">{messages.t('splicewire-beam-notifications::messages.recent')}</h2>
                        <ul className="mt-1 divide-y">
                            {rows.map((row) => (
                                <RecentRow
                                    key={row.id}
                                    row={row}
                                    locale={messages.locale}
                                    renderLink={renderLink}
                                    canMarkRead={marks.canMarkRead}
                                    onMarkRead={() => marks.markRead(row.id)}
                                    markReadLabel={messages.t('splicewire-beam-notifications::messages.mark_read')}
                                />
                            ))}
                        </ul>
                        <div className="mt-2 flex items-center justify-between text-xs">
                            {marks.canMarkAllRead ? (
                                <button type="button" onClick={marks.markAllRead} disabled={marks.pending}>
                                    {messages.t('splicewire-beam-notifications::messages.mark_all_read')}
                                </button>
                            ) : (
                                <span />
                            )}
                            {renderLink({ href: seeAllHref, children: messages.t('splicewire-beam-notifications::messages.see_all') })}
                        </div>
                    </section>
                ) : null}
            </PopoverContent>
        </Popover>
    );
}

function RecentRow({
    row,
    locale,
    renderLink,
    canMarkRead,
    onMarkRead,
    markReadLabel,
}: {
    row: StoredNotification;
    locale: string;
    renderLink: (link: BellLink) => ReactNode;
    canMarkRead: boolean;
    onMarkRead: () => void;
    markReadLabel: string;
}) {
    const text = row.text ?? '';

    return (
        <li data-unread={row.unread ? 'true' : 'false'} className="flex items-start gap-2 py-2 text-sm">
            {row.unread ? <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /> : <span aria-hidden className="mt-1.5 size-1.5 shrink-0" />}
            <div className="min-w-0 flex-1">
                {row.link ? renderLink({ href: row.link, className: 'line-clamp-2', children: text }) : <span className="line-clamp-2">{text}</span>}
                {row.createdAt ? <time dateTime={row.createdAt} className="block text-xs text-muted-foreground">{relativeTime(row.createdAt, locale)}</time> : null}
            </div>
            {row.unread && canMarkRead ? (
                <button type="button" onClick={onMarkRead} className="text-xs" aria-label={markReadLabel}>
                    {markReadLabel}
                </button>
            ) : null}
        </li>
    );
}

/** "5 minutes ago" in the READER's locale (the host's message catalog, not the browser's), from the stored ISO time. */
function relativeTime(iso: string, locale: string): string {
    const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [['second', 60], ['minute', 60], ['hour', 24], ['day', 7], ['week', 4.35], ['month', 12], ['year', Number.POSITIVE_INFINITY]];
    let value = seconds;
    for (const [unit, size] of steps) {
        if (Math.abs(value) < size) return format.format(Math.round(value), unit);
        value /= size;
    }

    return format.format(Math.round(value), 'year');
}
