import { Fragment, type ReactNode } from 'react';

/** Private rich slots are opaque scalar runtime parameters; authored nodes retain their identity. */
export function RichMessage({ text, parts, wrapText, emphasis }: { text: string; parts: readonly ReactNode[]; wrapText?: (text: string) => ReactNode; emphasis?: (children: ReactNode) => ReactNode }) {
    // Numeric punctuation-only delimiters stay opaque through every runtime case alias.
    // Only the caller supplies markup; translated text is never interpreted as HTML.
    if (emphasis) {
        return text.split(/(\uFFFC0:\uFFFC[\s\S]*?\uFFFC0\/\uFFFC)/u).map((section, index) => {
            const marked = /^\uFFFC0:\uFFFC([\s\S]*?)\uFFFC0\/\uFFFC$/u.exec(section);
            const content = <RichMessage text={marked ? marked[1] : section} parts={parts} wrapText={wrapText} />;
            return <Fragment key={marked ? `emphasis-${index}` : `section-${index}`}>{marked ? emphasis(content) : content}</Fragment>;
        });
    }
    const occurrences = new Map<string, number>();
    return text.split(/(\uFFFC\d+\uFFFC)/u).map((part, index) => {
        const match = /^\uFFFC(\d+)\uFFFC$/u.exec(part);
        const occurrence = match ? (occurrences.get(match[1]) ?? 0) : 0;
        if (match) occurrences.set(match[1], occurrence + 1);
        return <Fragment key={match ? `slot-${match[1]}-${occurrence}` : `text-${index}`}>{match ? parts[Number(match[1])] : part && wrapText ? wrapText(part) : part}</Fragment>;
    });
}
