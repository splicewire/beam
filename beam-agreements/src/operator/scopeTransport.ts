import type { FrameTransport } from '@schemastud/frame';

/**
 * A transport whose reads of one resource carry `scope` as request parameters: the same transport, narrowed to (for
 * example) one party's entries. The parameter names and values are the host's, from the resource it declared; this only
 * passes them on.
 *
 * Scoped, for `resource` only: every read that takes request parameters, which are `list`, `get`, `summary`,
 * `getFormSchema` and `getActionSchema`. Not scoped: the reads that take none (`getManifest`, the facets reads
 * `getFilterSchema`, `getFilterVariants`, `getFilterOptions`, `getSavedFilters`), every write, and every other
 * resource.
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
    scoped.getFormSchema = (target, form, purpose, params) =>
        transport.getFormSchema(target, form, purpose, narrowed(target, params));
    const getActionSchema = transport.getActionSchema;
    if (getActionSchema) {
        scoped.getActionSchema = (target, action, params) =>
            getActionSchema.call(transport, target, action, narrowed(target, params));
    }

    return scoped;
}
