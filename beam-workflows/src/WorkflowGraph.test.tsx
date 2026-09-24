import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { WorkflowGraph } from './WorkflowGraph';
import { emptyBlueprint, largeBlueprint } from './story-fixtures';
import { toDraft } from './blueprint';
import { graphCanvasSize, layoutBlueprint } from './workflowLayout';

// xyflow measures its container via ResizeObserver; jsdom lacks it (same polyfill as tests/mount).
beforeAll(() => {
    if (!('ResizeObserver' in globalThis)) {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
});

describe('WorkflowGraph', () => {
    it('says the workflow has no places instead of drawing an empty canvas', () => {
        const { container } = render(<WorkflowGraph blueprint={emptyBlueprint} />);

        expect(screen.getByText('No places yet')).toBeTruthy();
        expect(container.querySelector('.react-flow')).toBeNull();
    });

    it('renders a large graph on a canvas sized for the legible zoom, so it scrolls instead of shrinking', () => {
        const blueprint = toDraft(largeBlueprint);
        const { getByTestId } = render(<WorkflowGraph blueprint={blueprint} />);
        const pane = getByTestId('workflow-graph');
        const canvas = pane.firstElementChild as HTMLElement;
        const expected = graphCanvasSize(layoutBlueprint(blueprint).nodes);

        expect(pane.className).toContain('overflow-x-auto');
        expect(canvas.style.minWidth).toBe(`${expected.minWidth}px`);
        expect(canvas.style.height).toBe(`${expected.height}px`);
    });
});
