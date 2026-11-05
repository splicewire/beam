import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { entryPageConfig, resetEntryPageConfig } from '@splicewire/beam-ux/docs';
import { configureDocs } from './configure.js';
import { DataExample } from './DataExample.js';

/**
 * docs-feedback ticket 09: a registry page's data example puts the PHP that ran beside the JSON it returned. The
 * package's `docs:examples` script writes both as fenced code blocks between the page's markers; the component only
 * frames them, labelling the source path and the captured output.
 */
const php = <pre data-language="php"><code>return app(Registry::class)-&gt;keys();</code></pre>;
const json = <pre data-language="json"><code>["things.a"]</code></pre>;

afterEach(() => resetEntryPageConfig());

describe('DataExample', () => {
    it('labels the PHP with its source and the JSON as captured output', () => {
        render(
            <DataExample source="docs/registries/examples/things/resolved.php">
                {'\n'}
                {php}
                {'\n'}
                {json}
                {'\n'}
            </DataExample>,
        );

        const code = screen.getByRole('region', { name: 'PHP' });
        const result = screen.getByRole('region', { name: 'Captured output' });
        expect(within(code).getByText('docs/registries/examples/things/resolved.php')).toBeTruthy();
        expect(within(code).getByText('return app(Registry::class)->keys();')).toBeTruthy();
        expect(within(result).getByText('["things.a"]')).toBeTruthy();
        expect(screen.getByText(/re-checked by the package's test suite/)).toBeTruthy();
    });

    it('renders anything other than two code blocks as given, inside the frame', () => {
        const { container } = render(<DataExample source="x.php">{php}</DataExample>);

        expect(screen.queryByRole('region', { name: 'PHP' })).toBeNull();
        expect(container.querySelector('figure.beam-docs-data-example pre')).not.toBeNull();
    });

    it('is registered for MDX pages by configureDocs', () => {
        configureDocs();
        expect(entryPageConfig().components?.DataExample).toBe(DataExample);
    });
});
