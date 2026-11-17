import { englishBeamAccountsMessages, type useBeamAccountsMessages } from './messages.js';

type Messages = ReturnType<typeof useBeamAccountsMessages>;
type Key = Parameters<Messages['t']>[0];
type MessageParameters = Parameters<Messages['t']>[1];

/**
 * A message kept in React state: a catalog line with its data, translated when it renders (so a live locale switch
 * re-renders it), or a raw string the server or a failure supplied, which renders as it arrived. Never store `m.t(...)`.
 */
export type Notice = string | { readonly key: Key; readonly parameters?: MessageParameters } | readonly Notice[];

export const notice = (key: Key, parameters?: MessageParameters): Notice => ({ key, parameters });

/** Render a stored notice in the reader's current locale. */
export const say = (m: Messages, value: Notice): string =>
    typeof value === 'string' ? value : Array.isArray(value) ? value.map((part) => say(m, part)).join('') : m.t((value as { key: Key }).key, (value as { parameters?: MessageParameters }).parameters);

/** A thrown catalog message: callers render `notice`; `message` stays English for logs and diagnostics. */
export class NoticeError extends Error {
    constructor(readonly notice: Notice) {
        super(say(englishBeamAccountsMessages, notice));
    }
}

/** What a caught failure shows: a NoticeError's catalog line, an Error's raw message, or the given fallback line. */
export const noticeOf = (failure: unknown, fallback: Notice): Notice =>
    failure instanceof NoticeError ? failure.notice : failure instanceof Error ? failure.message : fallback;
