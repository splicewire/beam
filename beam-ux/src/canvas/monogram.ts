/**
 * The mark drawn for a name when the host declares no logo (launch ticket 05 slice 4): its first letter or digit,
 * upper-cased, else nothing. A caller with nothing to draw draws no mark rather than an empty square.
 */
export function monogram(name: string): string {
    return name.match(/[\p{L}\p{N}]/u)?.[0].toUpperCase() ?? '';
}
