// Terminal — window chrome (three dots + optional title) around already-highlighted
// fenced code. It does NO highlighting (the host's rehype pipeline does upstream); the
// story supplies pre-styled `<pre>` content to catalogue the frame. Axis: titled vs
// untitled; output states (command / multi-line output). Ambient light⊗dark.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Terminal } from './terminal';
import { withSiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Kit/Terminal',
    component: Terminal,
    decorators: [withSiteProse],
    parameters: { layout: 'centered' },
} satisfies Meta<typeof Terminal>;

export default meta;
type Story = StoryObj<typeof meta>;

// A command with a title bar.
export const TitledCommand: Story = {
    render: () => (
        <Terminal title="bash">
            <pre>
                <code>$ npm install @splicewire/beam-mdx</code>
            </pre>
        </Terminal>
    ),
};

// No title — just the dots + framed body.
export const Untitled: Story = {
    render: () => (
        <Terminal>
            <pre>
                <code>$ npm run build</code>
            </pre>
        </Terminal>
    ),
};

// Multi-line captured output — the framed body scrolls if wide.
export const WithOutput: Story = {
    render: () => (
        <Terminal title="splicewire beam doctor">
            <pre>
                <code>
                    {`$ php artisan splicewire:beam:doctor
PASS  Vite preset: registered
PASS  Content map: 42 files
WARN  Draftable prefixes: broadcasts/ has 3 undated entries
Done in 0.4s`}
                </code>
            </pre>
        </Terminal>
    ),
};
