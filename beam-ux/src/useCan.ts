import { useFrameInjection, type FrameAction } from '@schemastud/frame';

const CRUD_OPERATIONS = new Set<string>([
    'viewAny',
    'view',
    'create',
    'update',
    'delete',
]);

/**
 * Whether the current manifest admits one resource operation for this actor.
 *
 * CRUD stays on Frame's injected `can` seam, which a host wires from the manifest and may enrich.
 * Declared custom operations read their server-projected `can.actions` value directly. Both paths
 * deny while the manifest is absent, so a loading or older host never flashes a control that 403s.
 */
export function useCan(resource: string, operation: string): boolean {
    const frame = useFrameInjection();

    if (CRUD_OPERATIONS.has(operation)) {
        return frame.can(operation as FrameAction, resource);
    }

    return frame.manifestFor?.(resource)?.can?.actions?.[operation] === true;
}
