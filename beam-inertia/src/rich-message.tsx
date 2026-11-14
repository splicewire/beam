import { Fragment, type ReactNode } from 'react';

/** Private rich slots are opaque scalar runtime parameters; authored nodes retain their identity. */
export function RichMessage({ text, parts }: { text: string; parts: readonly ReactNode[] }) {
    const occurrences = new Map<string, number>();
    return text.split(/(\uFFFC\d+\uFFFC)/u).map((part, index) => {
        const match = /^\uFFFC(\d+)\uFFFC$/u.exec(part);
        const occurrence = match ? (occurrences.get(match[1]) ?? 0) : 0;
        if (match) occurrences.set(match[1], occurrence + 1);
        return <Fragment key={match ? `slot-${match[1]}-${occurrence}` : `text-${index}`}>{match ? parts[Number(match[1])] : part}</Fragment>;
    });
}
