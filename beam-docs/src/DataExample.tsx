import { Children, isValidElement, type ReactNode } from 'react';

export type DataExampleProps = {
    /** The example's package-relative path (`docs/registries/examples/<page>/<name>.php`), shown as the PHP pane's label. */
    source?: string;
    /** The two fenced code blocks, PHP then JSON, as the package's `docs:examples` script writes them. */
    children?: ReactNode;
    className?: string;
};

export const DATA_EXAMPLE_CSS = `
.beam-docs-data-example { margin-block: 1.5rem; border: 1px solid var(--border, currentColor); border-radius: var(--radius, 0.5rem); overflow: hidden; }
.beam-docs-data-example-panes { display: grid; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 64rem) { .beam-docs-data-example-panes { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .beam-docs-data-example-pane + .beam-docs-data-example-pane { border-left: 1px solid var(--border, currentColor); border-top: 0; } }
.beam-docs-data-example-pane { min-width: 0; display: flex; flex-direction: column; }
.beam-docs-data-example-pane + .beam-docs-data-example-pane { border-top: 1px solid var(--border, currentColor); }
.beam-docs-data-example-label { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 0.75rem; padding: 0.5rem 0.875rem; border-bottom: 1px solid var(--border, currentColor); background: var(--muted, transparent); font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.01em; }
.beam-docs-data-example-label code { font-weight: 400; color: var(--muted-foreground, GrayText); overflow-wrap: anywhere; background: none; padding: 0; }
.beam-docs-data-example-body { min-width: 0; max-height: 32rem; overflow: auto; }
.beam-docs-data-example-body pre { margin: 0 !important; border: 0 !important; border-radius: 0 !important; min-height: 100%; }
.beam-docs-data-example-note { margin: 0; padding: 0.5rem 0.875rem; border-top: 1px solid var(--border, currentColor); color: var(--muted-foreground, GrayText); font-size: 0.8125rem; }
`;

/** The panes: everything that is not whitespace between the two code blocks. */
function panes(children: ReactNode): ReactNode[] {
    return Children.toArray(children).filter((child) => isValidElement(child) || (typeof child === 'string' && child.trim() !== ''));
}

/**
 * A registry page's data example: the PHP that ran, beside the JSON it returned. Both are generated. The package's
 * `docs:examples` script captures the output and writes them between the page's `data-example` markers, and the
 * package's test suite re-runs the example, so the page can't drift from the code.
 *
 * The two panes sit side by side on a wide screen and stack on a narrow one. Anything other than exactly two children
 * renders as given, inside the frame, so a hand-placed tag still shows its content.
 */
export function DataExample({ source, children, className }: DataExampleProps) {
    const [code, result, ...rest] = panes(children);
    const classes = ['beam-docs-data-example', className].filter(Boolean).join(' ');

    if (code === undefined || result === undefined || rest.length > 0) {
        return (
            <figure className={classes} data-source={source}>
                <style>{DATA_EXAMPLE_CSS}</style>
                {children}
            </figure>
        );
    }

    return (
        <figure className={classes} data-source={source} aria-label="Data example">
            <style>{DATA_EXAMPLE_CSS}</style>
            <div className="beam-docs-data-example-panes">
                <section className="beam-docs-data-example-pane" aria-label="PHP">
                    <div className="beam-docs-data-example-label">
                        <span>PHP</span>
                        {source && <code>{source}</code>}
                    </div>
                    <div className="beam-docs-data-example-body">{code}</div>
                </section>
                <section className="beam-docs-data-example-pane" aria-label="Captured output">
                    <div className="beam-docs-data-example-label">
                        <span>Captured output</span>
                        <code>JSON</code>
                    </div>
                    <div className="beam-docs-data-example-body">{result}</div>
                </section>
            </div>
            <figcaption className="beam-docs-data-example-note">
                Captured from the PHP beside it, and re-checked by the package's test suite.
            </figcaption>
        </figure>
    );
}
