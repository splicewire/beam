import { u as useBeamUxMessages } from './messages-BdyXoTNM.js';

type Messages = ReturnType<typeof useBeamUxMessages>;
type Key = Parameters<Messages['t']>[0];
type MessageParameters = Parameters<Messages['t']>[1];
/**
 * A message kept in React state: a catalog line with its data, translated when it renders (so a live locale switch
 * re-renders it), or a raw string the server or a failure supplied, which renders as it arrived. Never store `m.t(...)`.
 */
type Notice = string | {
    readonly key: Key;
    readonly parameters?: MessageParameters;
} | readonly Notice[];
/** A thrown catalog message: callers render `notice`; `message` stays English for logs and diagnostics. */
declare class NoticeError extends Error {
    readonly notice: Notice;
    constructor(notice: Notice);
}

export { NoticeError as N, type Notice as a };
