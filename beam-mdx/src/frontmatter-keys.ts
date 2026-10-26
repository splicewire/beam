/**
 * Frontmatter in either key spelling (ux-0233 d9). A converted file can carry snake_case keys (laravel-beam-ux prints a
 * page's unclaimed keys as the PHP reader folds them: `date_published`), an unconverted one camelCase (`datePublished`).
 * Each snake_case key is also given under its camelCase name; a camelCase key the file writes itself wins.
 */
export function camelKeys<T>(frontmatter: Record<string, T>): Record<string, T> {
    const out: Record<string, T> = { ...frontmatter };

    for (const [key, value] of Object.entries(frontmatter)) {
        const camel = key.replace(/_([a-z0-9])/g, (_, next: string) => next.toUpperCase());

        if (camel !== key && !Object.prototype.hasOwnProperty.call(frontmatter, camel)) {
            // Defined, not assigned: a key can never reach a setter on the object's prototype.
            Object.defineProperty(out, camel, { value, enumerable: true, writable: true, configurable: true });
        }
    }

    return out;
}
