import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkflowGraph } from './WorkflowGraph';
import { emptyBlueprint } from './story-fixtures';

describe('WorkflowGraph', () => {
    it('says the workflow has no places instead of drawing an empty canvas', () => {
        const { container } = render(<WorkflowGraph blueprint={emptyBlueprint} />);

        expect(screen.getByText('No places yet')).toBeTruthy();
        expect(container.querySelector('.react-flow')).toBeNull();
    });
});
