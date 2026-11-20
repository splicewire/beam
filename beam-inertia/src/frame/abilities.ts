/**
 * The page's flat ability map (`page.props.can`, beam's CanMapBuilder), as the last rendered page held it. A realm's
 * frame kit is built once at module scope, so what it binds (agreements 06's action lock) reads the map through this
 * rather than through a hook. `TenantFrameProvider` records it on every render.
 */
let current: Record<string, boolean> | undefined;

export function pageAbilities(): Record<string, boolean> | undefined {
    return current;
}

export function recordPageAbilities(can: unknown): void {
    current = can && typeof can === 'object' ? (can as Record<string, boolean>) : undefined;
}
