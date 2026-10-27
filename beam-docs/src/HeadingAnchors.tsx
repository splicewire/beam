import { scanHeadings, type TocHeading } from '@schemastud/nav';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type AnchoredHeading = TocHeading & { host: HTMLElement };

/** One rendered-body scan drives both copy controls and the layout's table of contents. */
export function HeadingAnchors({
    main,
    routeKey,
    onScan,
}: {
    main: HTMLElement | null;
    routeKey?: string;
    onScan: (key: string) => void;
}) {
    const [headings, setHeadings] = useState<AnchoredHeading[]>([]);
    const [copied, setCopied] = useState('');
    const [status, setStatus] = useState('');
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);
    useEffect(() => {
        if (!main) return;
        const hosts = new Map<HTMLElement, HTMLElement>();
        const scan = () => {
            const items = scanHeadings({
                container: `#${main.id}`,
                doc: main.ownerDocument,
            });
            const nodes = Array.from(
                main.querySelectorAll<HTMLElement>('h2[id], h3[id]')
            );
            const next = items.flatMap((item, index) => {
                const heading = nodes[index];
                if (!heading) return [];
                let host = hosts.get(heading);
                if (!host || host.parentElement !== heading) {
                    host = main.ownerDocument.createElement('span');
                    host.dataset.beamHeadingControls = '';
                    heading.append(host);
                    hosts.set(heading, host);
                }
                return [{ ...item, host }];
            });
            for (const [heading, host] of hosts) {
                if (!nodes.includes(heading)) {
                    host.remove();
                    hosts.delete(heading);
                }
            }
            setHeadings((previous) =>
                previous.length === next.length &&
                previous.every(
                    (h, i) =>
                        h.id === next[i]?.id &&
                        h.text === next[i]?.text &&
                        h.host === next[i]?.host
                )
                    ? previous
                    : next
            );
            onScan(JSON.stringify(items));
        };
        const observer = new MutationObserver((records) => {
            // Ignore our portal mounts and button/status updates: controls never change the body headings.
            if (
                records.some((record) => {
                    const element =
                        record.target instanceof Element
                            ? record.target
                            : record.target.parentElement;
                    if (element?.closest('[data-beam-heading-controls]'))
                        return false;
                    const nodes = [
                        ...record.addedNodes,
                        ...record.removedNodes,
                    ];
                    return (
                        record.type !== 'childList' ||
                        !nodes.length ||
                        nodes.some(
                            (node) =>
                                !(
                                    node instanceof HTMLElement &&
                                    node.hasAttribute(
                                        'data-beam-heading-controls'
                                    )
                                )
                        )
                    );
                })
            )
                scan();
        });
        observer.observe(main, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['id'],
        });
        scan();
        return () => {
            observer.disconnect();
            hosts.forEach((host) => host.remove());
        };
    }, [main, routeKey, onScan]);

    const copy = async (heading: AnchoredHeading, markdown: boolean) => {
        clearTimeout(timer.current);
        setCopied('');
        if (!navigator.clipboard?.writeText) {
            setStatus('Copy unavailable');
            return;
        }
        const url = `${location.origin}${
            location.pathname
        }#${encodeURIComponent(heading.id)}`;
        const label = heading.text.replace(/([\\\[\]])/g, '\\$1');
        try {
            await navigator.clipboard.writeText(
                markdown ? `[${label}](${url})` : url
            );
            setCopied(`${heading.id}:${markdown}`);
            setStatus('Copied');
            timer.current = setTimeout(() => {
                setCopied('');
                setStatus('');
            }, 1500);
        } catch {
            setStatus('Copy unavailable');
        }
    };

    return (
        <>
            <style>{HEADING_ANCHORS_CSS}</style>
            <span className="beam-heading-copy-status" role="status">
                {status}
            </span>
            {headings.map((heading) =>
                createPortal(
                    <>
                        <button
                            type="button"
                            aria-label={`Copy link to ${heading.text}`}
                            title="Copy link"
                            data-copy-label={
                                copied === `${heading.id}:false`
                                    ? 'Copied'
                                    : undefined
                            }
                            onClick={() => void copy(heading, false)}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24">
                                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            aria-label={`Copy Markdown link to ${heading.text}`}
                            title="Copy Markdown link"
                            data-copy-label={
                                copied === `${heading.id}:true`
                                    ? 'Copied'
                                    : undefined
                            }
                            onClick={() => void copy(heading, true)}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24">
                                <path d="M3 6v12M3 6l5 6 5-6v12M17 12h5m-5 0 3-3m-3 3 3 3" />
                            </svg>
                        </button>
                    </>,
                    heading.host,
                    heading.id
                )
            )}
        </>
    );
}

const HEADING_ANCHORS_CSS = `
.beam-docs-main [data-beam-heading-controls]{display:inline-flex;gap:.25rem;margin-inline-start:.5rem;vertical-align:middle}
.beam-docs-main [data-beam-heading-controls] button{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:1.75rem;min-height:1.75rem;padding:.25rem;border:0;border-radius:.25rem;background:transparent;color:inherit;cursor:pointer;opacity:0}
.beam-docs-main :is(h2,h3):hover [data-beam-heading-controls] button,.beam-docs-main [data-beam-heading-controls]:focus-within button{opacity:1}
.beam-docs-main [data-beam-heading-controls] button:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.beam-docs-main [data-beam-heading-controls] svg{width:1rem;height:1rem;fill:none;stroke:currentColor;stroke-width:1.5}
.beam-docs-main [data-copy-label]::after{content:attr(data-copy-label);position:absolute;inset-block-end:100%;padding:.25rem;font-size:.75rem;background:var(--beam-paper);color:var(--beam-ink)}
.beam-heading-copy-status{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media(pointer:coarse){.beam-docs-main [data-beam-heading-controls] button{opacity:1;min-width:2.75rem;min-height:2.75rem}}
`;
