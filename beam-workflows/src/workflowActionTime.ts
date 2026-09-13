/**
 * Resolve a minute-precision wall time without assuming the browser's timezone. Return zero
 * instants for a gap/invalid date and both instants for a fold; the form never chooses a fold
 * implicitly. Invalid IANA identifiers throw RangeError for the field-level error boundary.
 */
export function workflowActionInstants(local: string, timezone: string): string[] {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return [];
    const wall = Date.parse(`${local}:00Z`);
    if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== local) return [];
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    const wallAt = (instant: number): number => {
        const fields = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
        return Date.parse(`${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}Z`);
    };
    // Observe the offsets on both sides of nearby transitions, including non-hour changes.
    // The final round-trip verifies each candidate, so skipped dates never normalize silently.
    const offsets = new Set<number>();
    for (let hours = -36; hours <= 36; hours += 6) {
        const sample = wall + hours * 3_600_000;
        offsets.add(wallAt(sample) - sample);
    }
    return [...offsets].map((offset) => wall - offset)
        .filter((instant) => wallAt(instant) === wall)
        .sort((a, b) => a - b).map((instant) => new Date(instant).toISOString());
}
