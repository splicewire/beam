import type { FrameTransport } from '@schemastud/frame';

/**
 * A transport whose reads of one resource carry `scope` as request parameters: the same transport, narrowed to (for
 * example) one party's entries. The parameter names and values are the host's, from the resource it declared; this only
 * passes them on. Every other resource, and every write, goes through untouched.
 *
 * The result delegates to `transport` by prototype, so a transport of any shape keeps its methods. It is a new object,
 * so frame's query cache scopes it apart from the transport it wraps (`resourceQueryKey` keys on the transport).
 */
export function scopeTransport(transport: FrameTransport, resource: string, scope: Readonly<Record<string, string>>): FrameTransport {
    const narrowed = (target: string, params?: Record<string, string>) =>
        target === resource ? { ...params, ...scope } : params;
    const scoped: FrameTransport = Object.create(transport);

    scoped.list = <Result,>(target: string, params: Record<string, string>) =>
        transport.list<Result>(target, narrowed(target, params) ?? {});
    scoped.get = (target, id, params) => transport.get(target, id, narrowed(target, params));
    scoped.summary = (target, params) => transport.summary(target, narrowed(target, params) ?? {});

    return scoped;
}
