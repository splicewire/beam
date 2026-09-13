import { describe, expect, it } from 'vitest';
import { workflowActionInstants } from './workflowActionTime';

describe('scheduled workflow wall time', () => {
    it('resolves a named zone independently of the browser zone', () => {
        expect(workflowActionInstants('2026-09-15T09:30', 'Asia/Kathmandu')).toEqual(['2026-09-15T03:45:00.000Z']);
    });
    it('refuses the missing hour instead of silently moving the action', () => {
        expect(workflowActionInstants('2026-03-08T02:30', 'America/New_York')).toEqual([]);
    });
    it('returns both instants in a repeated hour so the user must choose', () => {
        expect(workflowActionInstants('2026-11-01T01:30', 'America/New_York')).toEqual([
            '2026-11-01T05:30:00.000Z', '2026-11-01T06:30:00.000Z',
        ]);
    });
    it('handles a half-hour clock change', () => {
        expect(workflowActionInstants('2026-04-05T01:45', 'Australia/Lord_Howe')).toEqual([
            '2026-04-04T14:45:00.000Z', '2026-04-04T15:15:00.000Z',
        ]);
    });
    it('rejects malformed dates and unsupported zones', () => {
        expect(workflowActionInstants('2026-02-30T12:00', 'UTC')).toEqual([]);
        expect(workflowActionInstants('', 'UTC')).toEqual([]);
        expect(() => workflowActionInstants('2026-09-15T12:00', 'Imaginary/Zone')).toThrow(RangeError);
    });
});
