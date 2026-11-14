import type { ReactNode } from 'react';
import { RichMessage } from '../rich-message';
import type { useBeamMessages } from '../messages';

/** Render a complete translated sentence while keeping authored values and rich nodes opaque. */
export function surfaceMessage(
    messages: ReturnType<typeof useBeamMessages>,
    key: Parameters<ReturnType<typeof useBeamMessages>['t']>[0],
    parts: Record<string, ReactNode>,
    emphasis?: (children: ReactNode) => ReactNode,
): ReactNode {
    const values = Object.values(parts);
    const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `\uFFFC${index}\uFFFC`]));
    return <RichMessage text={messages.t(key, { ...parameters, ...(emphasis ? { emphasis_start: '\uFFFC0:\uFFFC', emphasis_end: '\uFFFC0/\uFFFC' } : {}) })} parts={values} emphasis={emphasis} />;
}
