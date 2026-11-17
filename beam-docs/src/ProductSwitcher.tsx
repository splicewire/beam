import { useEffect, useRef, useState } from 'react';
import type { DocsRelatedData } from './generated/types.js';
import { useBeamDocsMessages } from './messages.js';

/**
 * The docs product switcher (docs-walkthrough DOC-16, C-6): one packaged control, fed by `DocsChromeData.related`, that
 * replaces each host's hand "Beam" pill.
 *
 * One disclosure contract. A click toggles; a hover only PREVIEWS, and the preview never flips the state a click will
 * flip, so the click that follows a hover leaves it open (the hand pill closed there, shots 40/41). Escape and a pointer
 * landing outside dismiss it. Each product shows its brand tagline, its site and its docs.
 */
export function ProductSwitcher({ related, className }: { related: DocsRelatedData[]; className?: string }) {
    const m = useBeamDocsMessages();
    const [clicked, setClicked] = useState(false);
    const [hovered, setHovered] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const open = clicked || hovered;

    useEffect(() => {
        if (!open) return;
        const close = () => {
            setClicked(false);
            setHovered(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        const onPointer = (e: PointerEvent) => {
            if (!root.current?.contains(e.target as Node)) close();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
        };
    }, [open]);

    if (related.length === 0) {
        return null;
    }

    // A single product's name is the server's; the plural heading is ours.
    const label = related.length === 1 ? related[0].name : m.t('splicewire-beam-docs::messages.switcher_products');

    return (
        <div
            ref={root}
            className={['beam-docs-switcher', className].filter(Boolean).join(' ')}
            data-docs-switcher=""
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <button type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setClicked((v) => !v)}>
                {label}
            </button>
            {open && (
                <div role="dialog" aria-label={m.t('splicewire-beam-docs::messages.switcher_other_products')} className="beam-docs-switcher-panel">
                    {related.map((product) => (
                        <div key={product.key} className="beam-docs-switcher-item">
                            <strong>{product.name}</strong>
                            {product.tagline && <p>{product.tagline}</p>}
                            <a href={product.href}>{m.t('splicewire-beam-docs::messages.switcher_visit', { name: product.name })}</a>
                            {product.docs && <a href={product.docs}>{m.t('splicewire-beam-docs::messages.switcher_docs', { name: product.name })}</a>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
