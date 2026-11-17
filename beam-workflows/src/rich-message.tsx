import { Fragment, type ReactNode } from 'react';
import type { BeamWorkflowsMessages } from './messages';

/**
 * Render one complete translated sentence whose parameters are React nodes (`<b>`, `<code>`, links), so a translator
 * moves them as a whole. Each node is passed as an opaque scalar slot and swapped back in after translation; translated
 * text is never interpreted as markup. Same contract as beam-ux's richMessage (localization 31); copied per package until it moves into @schemastud/messages/react.
 */
export function richMessage(messages: BeamWorkflowsMessages, key: Parameters<BeamWorkflowsMessages['t']>[0], parts: Record<string, ReactNode>): ReactNode {
    const values = Object.values(parts);
    const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `￼${index}￼`]));
    const occurrences = new Map<string, number>();

    return messages.t(key, parameters).split(/(￼\d+￼)/u).map((part, index) => {
        const match = /^￼(\d+)￼$/u.exec(part);
        const occurrence = match ? (occurrences.get(match[1]) ?? 0) : 0;
        if (match) occurrences.set(match[1], occurrence + 1);

        return <Fragment key={match ? `slot-${match[1]}-${occurrence}` : `text-${index}`}>{match ? values[Number(match[1])] : part}</Fragment>;
    });
}
