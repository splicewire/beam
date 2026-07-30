/**
 * Dependency-free default class-name merge (rehome-ui injection contract).
 *
 * The prototyping chrome needs *a* `cn`, but the package must not force a clsx/tailwind-merge
 * dependency on every host — so this bundled default is a tiny clsx-shaped truthy-join with no
 * Tailwind conflict resolution. Hosts that want proper utility de-duplication pass their own
 * (e.g. `@schemastud/ui`'s `cn`) through the injection points; this is only the fallback.
 */
export type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean | null | undefined>;

export type Cn = (...inputs: ClassValue[]) => string;

function collect(input: ClassValue, out: string[]): void {
    if (!input) return;
    if (typeof input === 'string' || typeof input === 'number') {
        out.push(String(input));
        return;
    }
    if (Array.isArray(input)) {
        for (const item of input) collect(item, out);
        return;
    }
    for (const [key, active] of Object.entries(input)) {
        if (active) out.push(key);
    }
}

/** clsx-shaped, dependency-free. Joins truthy class values; no Tailwind conflict de-dup. */
export const cn: Cn = (...inputs) => {
    const out: string[] = [];
    for (const input of inputs) collect(input, out);
    return out.join(' ');
};
