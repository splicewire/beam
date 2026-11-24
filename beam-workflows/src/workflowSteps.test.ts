import { describe, expect, it } from 'vitest';
import { projection } from './story-fixtures';
import { workflowProjectionToSteps } from './workflowSteps';

// Owner-review-20261112 ticket 30: the adapter over the generated WorkflowProjectionData fixture (marking in_review).
describe('workflowProjectionToSteps', () => {
    it('maps the places to keyed steps: before the marking done, the marking current, the rest upcoming', () => {
        const steps = workflowProjectionToSteps(projection);

        expect(steps.map((s) => [s.key, s.label, s.status])).toEqual([
            ['draft', 'Draft', 'done'],
            ['in_review', 'In review', 'current'],
            ['published', 'Published', 'upcoming'],
            ['archived', 'Archived', 'upcoming'],
        ]);
    });

    it('takes per-place label, summary, body and wire', () => {
        const [first] = workflowProjectionToSteps(projection, {
            label: (p) => p.toUpperCase(),
            summary: (p) => `s:${p}`,
            body: (p) => `b:${p}`,
            wire: (p) => `w:${p}`,
        });

        expect(first).toEqual({ key: 'draft', label: 'DRAFT', summary: 's:draft', status: 'done', body: 'b:draft', wire: 'w:draft' });
    });

    it('marks nothing current or done when the marking is not one of the places', () => {
        const steps = workflowProjectionToSteps({ ...projection, current: 'elsewhere' });

        expect(steps.every((s) => s.status === 'upcoming')).toBe(true);
    });
});
