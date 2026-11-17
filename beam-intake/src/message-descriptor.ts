import type { BeamIntakeMessageKey, BeamIntakeMessages } from './messages.js';

type MessageParameters = Parameters<BeamIntakeMessages['t']>[1];

/**
 * A message kept in React state: a catalog line with its data, translated when it renders (so a live locale switch
 * re-renders it), or a raw string the server or a failure supplied, which renders as it arrived. Never store `m.t(...)`.
 */
export type Notice = string | { readonly key: BeamIntakeMessageKey; readonly parameters?: MessageParameters };

export const notice = (key: BeamIntakeMessageKey, parameters?: MessageParameters): Notice => ({ key, parameters });

/** Render a stored notice in the reader's current locale. */
export const say = (m: BeamIntakeMessages, value: Notice): string =>
    typeof value === 'string' ? value : m.t(value.key, value.parameters);
