// FileTree — a framed, monospace directory tree. Two authoring shapes are its axis:
// the structured `tree` node array vs. MDX `children` (a nested list). Ambient light⊗dark;
// the frame + rails ride `--sr-*`/`--beam-*` tokens.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileTree, type FileTreeNode } from './file-tree';
import { withSiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Kit/FileTree',
    component: FileTree,
    decorators: [withSiteProse],
    parameters: { layout: 'centered' },
} satisfies Meta<typeof FileTree>;

export default meta;
type Story = StoryObj<typeof meta>;

const tree: FileTreeNode[] = [
    {
        name: 'src/',
        children: [
            { name: 'kit/', children: [{ name: 'callout.tsx' }, { name: 'steps.tsx' }, { name: 'kit.css' }] },
            { name: 'components/', children: [{ name: 'content.tsx' }, { name: 'reference.tsx' }] },
            { name: 'index.ts' },
        ],
    },
    { name: 'package.json' },
];

// The structured `tree` prop — a recursive node array, nested rails per depth.
export const StructuredTree: Story = { args: { tree } };

// The MDX-children shape — a nested list authored inline, rendered as-is.
export const ChildrenList: Story = {
    render: () => (
        <FileTree>
            <ul>
                <li>content/</li>
                <li>
                    guides/
                    <ul>
                        <li>getting-started.mdx</li>
                        <li>deploying.mdx</li>
                    </ul>
                </li>
                <li>essays/</li>
            </ul>
        </FileTree>
    ),
};

// A shallow single-level tree.
export const Flat: Story = {
    args: { tree: [{ name: 'README.md' }, { name: 'tsconfig.json' }, { name: 'vite.config.ts' }] },
};
