import { useEffect, useId, useRef, useSyncExternalStore, type KeyboardEvent } from 'react';
import type { StepUpController } from './stepUp';

const BUTTON = {
    font: 'inherit',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.25,
    padding: '0.5rem 1rem',
    borderRadius: 6,
    cursor: 'pointer',
} as const;
/** The host's primary colours where it defines them (shadcn tokens), else a dark neutral. */
const PRIMARY = { ...BUTTON, border: '1px solid transparent', background: 'var(--primary, #111)', color: 'var(--primary-foreground, #fff)' } as const;
const SECONDARY = { ...BUTTON, border: '1px solid var(--border, #d4d4d4)', background: 'transparent', color: 'inherit' } as const;

/**
 * The step-up dialog (agreements 06): each outstanding Agreement with its title and full frozen text, and two answers.
 * Mount once, anywhere under the app (it renders nothing until asked).
 *
 * Accessible by construction: a modal `role="dialog"` named by its heading and described by the text; focus moves to
 * the (scrollable, focusable) text when it opens, Tab and Shift+Tab stay inside it, Escape declines, and focus returns to wherever it
 * was. Styling is inline only: a host's Tailwind doesn't scan `node_modules`.
 */
export function AgreementStepUp({ controller }: { controller: StepUpController }) {
    const agreements = useSyncExternalStore(controller.subscribe, controller.current, controller.current);
    const titleId = useId();
    const textId = useId();
    const dialog = useRef<HTMLDivElement | null>(null);
    const returnTo = useRef<Element | null>(null);
    const open = agreements !== null;

    useEffect(() => {
        if (!open) return;
        returnTo.current = document.activeElement;
        // The text first: it is what the person is being asked to read before either answer.
        dialog.current?.querySelector<HTMLElement>('[data-step-up-text]')?.focus();
        return () => {
            const back = returnTo.current;
            if (back instanceof HTMLElement) queueMicrotask(() => back.focus());
        };
    }, [open]);

    if (agreements === null) return null;

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            controller.answer(false);
            return;
        }
        if (event.key !== 'Tab') return;
        const buttons = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button, [tabindex="0"]') ?? []);
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const heading = agreements.length === 1 ? agreements[0].title : 'Before you continue';

    return (
        <div
            data-beam-agreements="step-up"
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', background: 'rgb(0 0 0 / 0.45)', padding: 16 }}
        >
            <div
                ref={dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={textId}
                onKeyDown={onKeyDown}
                style={{
                    background: 'var(--background, #fff)',
                    color: 'var(--foreground, #111)',
                    borderRadius: 8,
                    width: 'min(40rem, 100%)',
                    maxHeight: 'min(85vh, 48rem)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 20,
                    boxShadow: '0 10px 30px rgb(0 0 0 / 0.25)',
                }}
            >
                <h2 id={titleId} style={{ margin: 0, fontSize: '1.125rem' }}>
                    {heading}
                </h2>
                <p style={{ margin: 0 }}>
                    {agreements.length === 1
                        ? 'To continue, please read and accept this agreement.'
                        : 'To continue, please read and accept these agreements.'}
                </p>
                <div
                    id={textId}
                    data-step-up-text=""
                    tabIndex={0}
                    aria-label="Agreement text"
                    style={{ overflow: 'auto', border: '1px solid var(--border, #ddd)', borderRadius: 6, padding: 12, flex: 1 }}
                >
                    {agreements.map((agreement) => (
                        <section key={agreement.key} data-agreement={agreement.key} data-digest={agreement.digest}>
                            {agreements.length > 1 ? <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>{agreement.title}</h3> : null}
                            <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', opacity: 0.75 }}>Version {agreement.label}</p>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{agreement.content}</div>
                        </section>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" data-answer="decline" style={SECONDARY} onClick={() => controller.answer(false)}>
                        Not now
                    </button>
                    <button type="button" data-answer="accept" style={PRIMARY} onClick={() => controller.answer(true)}>
                        {agreements.length === 1 ? 'I agree' : 'I agree to all'}
                    </button>
                </div>
            </div>
        </div>
    );
}
