import { Fragment, type ReactNode } from 'react';
import type { BeamEmbedMessages } from './messages';

/**
 * Render one complete translated sentence whose parameters are React nodes (`<b>`, `<code>`, links), so a translator
 * moves them as a whole. Each node is passed as an opaque scalar slot and swapped back in after translation; translated
 * text is never interpreted as markup. Same contract as beam-ux's richMessage (localization 31), copied per package
 * until it moves into @schemastud/messages/react. With `count`, the line is a plural chosen by `m.choice` (the count
 * itself, when shown, is one of the node parameters).
 */
export function richMessage(
    messages: BeamEmbedMessages,
    key: Parameters<BeamEmbedMessages['t']>[0],
    parts: Record<string, ReactNode>,
    count?: number,
): ReactNode {
    const values = Object.values(parts);
    const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `￼${index}￼`]));
    const occurrences = new Map<string, number>();
    const text = count === undefined ? messages.t(key, parameters) : messages.choice(key, count, parameters);

    return text.split(/(￼\d+￼)/u).map((part, index) => {
        const match = /^￼(\d+)￼$/u.exec(part);
        const occurrence = match ? (occurrences.get(match[1]) ?? 0) : 0;
        if (match) occurrences.set(match[1], occurrence + 1);

        return <Fragment key={match ? `slot-${match[1]}-${occurrence}` : `text-${index}`}>{match ? values[Number(match[1])] : part}</Fragment>;
    });
}
