import { englishBeamVersioningMessages, type BeamVersioningMessages } from './messages';

/**
 * Compact relative time — "just now", "2m ago", "3h ago", "5d ago", then an absolute short date
 * past a week. Extracted verbatim from the composition VersionsDrawer so every version surface
 * reads timestamps identically.
 *
 * `messages` is the reader's beam-versioning messages (a render passes `useBeamVersioningMessages()`); without it the
 * relative lines are English. The absolute date past a week keeps the runtime's locale (`toLocaleDateString(undefined, …)`).
 */
export function relativeTime(
    iso: string | null | undefined,
    messages: BeamVersioningMessages = englishBeamVersioningMessages,
): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const secs = Math.round((Date.now() - then) / 1000);
    if (secs < 60) return messages.t('splicewire-beam-versioning::messages.time_just_now');
    const mins = Math.round(secs / 60);
    if (mins < 60) return messages.t('splicewire-beam-versioning::messages.time_minutes_ago', { count: mins });
    const hours = Math.round(mins / 60);
    if (hours < 24) return messages.t('splicewire-beam-versioning::messages.time_hours_ago', { count: hours });
    const days = Math.round(hours / 24);
    if (days < 7) return messages.t('splicewire-beam-versioning::messages.time_days_ago', { count: days });
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
