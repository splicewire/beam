import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataExample } from './DataExample';

/**
 * Catalog story for {@link DataExample}, a registry page's captured example: the PHP that ran beside the JSON it
 * returned. On a page both blocks come from the package's `docs:examples` script; here they are written inline.
 */
const meta = {
    title: 'BeamDocs/DataExample',
    component: DataExample,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DataExample>;

export default meta;

export const Captured: StoryObj = {
    render: () => (
        <DataExample source="docs/registries/examples/jsonref.dereferencers/follow-a-reference.php">
            <pre><code>{`$registry = app(DereferencerRegistry::class)->register($articles);

return [
    'keys' => array_map('strval', $registry->keys()),
    'handles' => $registry->handles(),
];`}</code></pre>
            <pre><code>{`{
    "keys": [
        "jsonref.dereferencers.articles"
    ],
    "handles": [
        "articles"
    ]
}`}</code></pre>
        </DataExample>
    ),
};
