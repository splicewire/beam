/** The optional docs namespace arrives through the normal resolved page theme. No theme is a no-op. */
export function ThemeDocsStyle({ theme }: { theme: unknown }) {
    if (!isRecord(theme) || !isRecord(theme.docs)) return null;
    const declarations = Object.entries(theme.docs)
        .filter(
            ([key, value]) =>
                /^[a-z][a-zA-Z0-9]*$/.test(key) &&
                typeof value === 'string' &&
                !/[\u0000-\u001f<>{};]/.test(value)
        )
        .map(
            ([key, value]) =>
                `--theme-docs-${key.replace(
                    /[A-Z]/g,
                    (letter) => `-${letter.toLowerCase()}`
                )}:${value};`
        )
        .join('');
    if (!declarations) return null;
    return <style data-beam-docs-theme>{`.beam-docs{${declarations}}`}</style>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
