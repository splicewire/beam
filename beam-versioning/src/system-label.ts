import type { BeamVersioningMessages } from './messages';

/**
 * Known SYSTEM version labels, rendered through beam-versioning's catalog at read time. The stored label, the readable
 * slug and the restore ref are untouched: this only changes what a reader sees. Two labels are known:
 *
 * - `published`: laravel-beam-embed's EmbedPublisher stores it when an embed is published (a host label beam-versioning
 *   knows by name). It matches only as the exact, whole string.
 * - `restore of {handle}`: laravel-beam-versioning's VersionsController stores `restore of {readableVersion()}` when a
 *   restore carries no label. The handle is `v{n}`, or `v{n}-slug` for a labeled source version (e.g. restoring the
 *   published v1 stores `restore of v1-published`). The pattern follows Str::slug output (lowercase `[a-z0-9]` runs
 *   joined by `-`); anything else (trailing text, other casing) is not a system label.
 *
 * Every other label is the user's own text and passes through verbatim. A user who types exactly `published` or
 * `restore of v3` sees it localized, which has the same meaning.
 */
const RESTORE_OF = /^restore of (v\d+(?:-[a-z0-9]+)*)$/;

export function systemLabel(label: string, m: BeamVersioningMessages): string {
    if (label === 'published') {
        return m.t('splicewire-beam-versioning::messages.label_published');
    }
    const restore = RESTORE_OF.exec(label);
    if (restore) {
        return m.t('splicewire-beam-versioning::messages.label_restore_of', { version: restore[1] });
    }
    return label;
}
