// The workflow board's own entry, `@splicewire/beam-workflows/workflow-board` (owner-review-20261112 ticket 47). It
// stays off the root entry because the card board it builds on drags with `@dnd-kit/core`, an optional peer that only a
// host using the board installs, and needs `@schemastud/ui` at c6b98762 or later (its `./card-board` subpath).
export {
    WorkflowBoard,
    type WorkflowBoardProps,
    type WorkflowBoardPlainProps,
    type WorkflowBoardWorkflowProps,
} from './WorkflowBoard';
export { transitionIntoPlace, type PlaceMove } from './transitionIntoPlace';
