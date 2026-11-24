import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';
import { projection, publishBlueprintV2 } from './story-fixtures';
import { WorkflowBoard } from './WorkflowBoard';

/**
 * Catalog stories for the workflow board (owner-review-20261112 ticket 47), on the card board of
 * `@schemastud/ui/card-board`. Without an adapter it takes plain lanes and cards; with the workflow adapter the lanes
 * are the fixture's places and every move is a transition. Stateful renders: a move or a transition sticks only when
 * the story's own state moves the card, the way a host's would.
 */
const meta = {
    title: 'Workflows/WorkflowBoard',
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Task = { id: string; title: string; lane: string };

function PlainBoard() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: 't1', title: 'Draft the welcome email', lane: 'todo' },
        { id: 't2', title: 'Pick the launch date', lane: 'doing' },
        { id: 't3', title: 'Book the venue', lane: 'done' },
    ]);
    return (
        <WorkflowBoard
            lanes={[
                { key: 'todo', title: 'To do' },
                { key: 'doing', title: 'Doing' },
                { key: 'done', title: 'Done' },
            ]}
            cards={tasks}
            getCardKey={(task) => task.id}
            getCardLane={(task) => task.lane}
            getCardLabel={(task) => task.title}
            renderCard={(task) => <span className="text-sm">{task.title}</span>}
            onMove={(task, toLane) => {
                if (toLane === 'done' && task.lane === 'todo') return { refused: 'Start it before you finish it.' };
                setTasks((ts) => ts.map((x) => (x.id === task.id ? { ...x, lane: toLane } : x)));
                return true;
            }}
        />
    );
}

/** Without an adapter: the caller's lanes, cards and onMove (To do → Done is refused). */
export const WithoutAdapter: Story = { render: () => <PlainBoard /> };

type Post = { id: string; title: string; projection: WorkflowProjectionData };

/** The fixture's projection at a place: the transitions out of it are available. */
const at = (current: string): WorkflowProjectionData => ({
    ...projection,
    current,
    available: publishBlueprintV2.transitions.filter((t) => t.from.includes(current)).map((t) => t.name),
});

/** One post whose approval is guarded: the backend withholds approve and says why. */
const guarded: WorkflowProjectionData = {
    ...at('in_review'),
    available: ['revise'],
    transitions: projection.transitions.map((t) => (t.name === 'approve' ? { ...t, reason: 'An editor must sign off first.' } : t)),
};

function AdapterBoard() {
    const [posts, setPosts] = useState<Post[]>([
        { id: 'p1', title: 'Spring menu', projection: at('draft') },
        { id: 'p2', title: 'Hiring post', projection: at('in_review') },
        { id: 'p3', title: 'Opening hours', projection: guarded },
        { id: 'p4', title: 'Holiday notice', projection: at('published') },
    ]);
    return (
        <WorkflowBoard
            cards={posts}
            getCardKey={(post) => post.id}
            getCardLabel={(post) => post.title}
            renderCard={(post) => <span className="text-sm">{post.title}</span>}
            getProjection={(post) => post.projection}
            onTransition={async (post, transition) => {
                await new Promise((resolve) => setTimeout(resolve, 400));
                const to = publishBlueprintV2.transitions.find((t) => t.name === transition)?.to[0];
                if (to) setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, projection: at(to) } : p)));
            }}
        />
    );
}

/**
 * With the workflow adapter: lanes are the fixture's places, each card offers its available transitions, and a move
 * applies the one transition into the lane. Opening hours cannot be approved (the backend's reason shows on a move to
 * Published); a move to a place no transition reaches is refused.
 */
export const WithWorkflowAdapter: Story = { render: () => <AdapterBoard /> };
