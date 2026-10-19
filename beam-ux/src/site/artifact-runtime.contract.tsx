import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { componentFromArtifact } from './EntryBody.js';

// Run with BEAM_UX_PHP_ROOT pointing to the PHP candidate/current main. A missing compiler is a
// failed gate, not a skip. This generates both artifact formats afresh, so compiler changes cannot
// silently keep passing against an old committed fixture.
const phpRoot = process.env.BEAM_UX_PHP_ROOT;
if (!phpRoot) throw new Error('BEAM_UX_PHP_ROOT is required for the artifact runtime contract gate');
const compiler = resolve(phpRoot, 'resources/compile/compile.mjs');

it('renders a freshly compiled generation-3 styled artifact with the reader runtime', () => {
    expect(readFileSync(resolve(phpRoot, 'src/Compile/EntryArtifactStore.php'), 'utf8'))
        .toMatch(/GENERATION\s*=\s*'3'/);
    const source = `export default function Page({styleRegistry} = {}) {
        const styles = __beamBlockStyles([{layers:[{declarations:{color:'red'}},
            {breakpoint:'md',state:'hover',declarations:{color:'blue'}}]}], styleRegistry);
        return <><style data-beam-block-style="">{styles.css}</style>
            <h1 className={styles.classes[0]}>Fresh styled artifact</h1></>;
    }`;
    const { code } = JSON.parse(execFileSync(process.execPath, [compiler], {
        input: JSON.stringify({format:'tsx', source, slug:'contract', root:resolve('..')}),
        encoding:'utf8',
    })) as {code:string};
    // Test-only evaluation of our freshly compiled source; production loads an ES module normally.
    const factory = new Function(code.replace('export default ', 'return '))();
    const Body = componentFromArtifact({default: factory});
    expect(Body).not.toBeNull();
    const html = renderToStaticMarkup(Body ? <Body /> : <></>);
    expect(html).toContain('Fresh styled artifact');
    expect(html).toMatch(/<h1 class="bs-/);
    expect(html).toContain('<style data-beam-block-style="">');
    expect(html).toContain('color:red');
    expect(html).toContain('@media (min-width: 48rem)');
    expect(html).toContain(':hover{color:blue}');
});

it('pins the supplied export list to the real TSX and MDX compiler requirements', () => {
    let runtime: Record<string, unknown> = {};
    componentFromArtifact({default: supplied => { runtime = supplied; return {default: () => null}; }});
    const required = new Set<string>();
    for (const [format, source] of [
        ['tsx', 'export default function Page(){return <><p>one</p><p>two</p></>}'],
        ['mdx', '# One\n\nTwo **strong** words.'],
    ]) {
        const {code} = JSON.parse(execFileSync(process.execPath, [compiler], {
            input: JSON.stringify({format, source, slug:'contract', root:resolve('..')}), encoding:'utf8',
        })) as {code:string};
        const factory = new Function(code.replace('export default ', 'return '))();
        const tracked = new Proxy(runtime, {get(target, key) {
            if (typeof key === 'string') {
                required.add(key);
                expect(target[key], `compiler requires runtime.${key}`).toBeDefined();
            }
            return target[String(key)];
        }});
        const Body = factory(tracked).default;
        renderToStaticMarkup(<Body />);
    }
    expect([...required].sort()).toEqual(Object.keys(runtime).sort());
    expect([...required].sort()).toEqual(['Fragment','compileEntryStyles','createElement','jsx','jsxs']);
});
