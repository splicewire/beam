import type { BeamCalendarMessageKey, BeamCalendarMessages } from './messages.js';

type MessageParameters = Parameters<BeamCalendarMessages['t']>[1];

/**
 * A message kept in React state: a catalog line with its data, translated when it renders (so a live locale switch
 * re-renders it), or a raw string the server or a failure supplied, which renders as it arrived. Never store `m.t(...)`.
 */
export type Notice = string | { readonly key: BeamCalendarMessageKey; readonly parameters?: MessageParameters };

export const notice = (key: BeamCalendarMessageKey, parameters?: MessageParameters): Notice => ({ key, parameters });

/** Render a stored notice in the reader's current locale. */
export const say = (m: BeamCalendarMessages, value: Notice): string =>
    typeof value === 'string' ? value : m.t(value.key, value.parameters);
