import * as react from 'react';
import { ReactNode } from 'react';

declare function Figure({ src, alt, caption, children, }: {
    src?: string;
    alt?: string;
    caption?: string;
    children?: ReactNode;
}): react.JSX.Element;

interface FileTreeNode {
    name: string;
    children?: FileTreeNode[];
}
declare function FileTree({ tree, children, }: {
    tree?: FileTreeNode[];
    children?: ReactNode;
}): react.JSX.Element;

declare function Terminal({ title, children, }: {
    title?: string;
    children?: ReactNode;
}): react.JSX.Element;

type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'info';
declare function Callout({ type, title, children, }: {
    type?: CalloutType;
    title?: string;
    children?: ReactNode;
}): react.JSX.Element;

declare function Steps({ children }: {
    children?: ReactNode;
}): react.JSX.Element;
declare function Step({ title, children, }: {
    title?: string;
    children?: ReactNode;
}): react.JSX.Element;

interface DoctorFinding {
    status: 'pass' | 'warn' | 'fail';
    check: string;
    detail: string;
}
declare function parseDoctorOutput(raw: string): DoctorFinding[];
declare function DoctorOutput({ raw, children, }: {
    raw?: string;
    children?: ReactNode;
}): react.JSX.Element;

/** The hero atop a landing: an optional eyebrow, a heading, and an optional lede. */
declare function SectionLanding({ eyebrow, heading, lede, children, }: {
    eyebrow?: string;
    heading: string;
    lede?: ReactNode;
    children?: ReactNode;
}): react.JSX.Element;
/** A responsive 1 → 2 → 3 column grid of cards; reflows to one column when narrow. */
declare function CardGrid({ children }: {
    children?: ReactNode;
}): react.JSX.Element;
/**
 * A single full-card link: an `<a>` wrapping an optional SVG icon, a title, and a
 * blurb. Hover raises the border to the signal green with a subtle lift; the whole
 * card is the click target, keyboard-focusable with a visible ring. `icon` is a
 * ReactNode — pass an inline `<svg>`, never an emoji.
 */
declare function Card({ href, title, blurb, icon, }: {
    href: string;
    title: string;
    blurb?: ReactNode;
    icon?: ReactNode;
}): react.JSX.Element;

export { Callout, type CalloutType, Card, CardGrid, type DoctorFinding, DoctorOutput, Figure, FileTree, type FileTreeNode, SectionLanding, Step, Steps, Terminal, parseDoctorOutput };
