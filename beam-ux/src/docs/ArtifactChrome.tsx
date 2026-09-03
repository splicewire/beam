import type { ComponentType } from 'react';
import { useEntryArtifact } from '../site/EntryBody.js';
import type { ChromeProps, EntryArtifactPayload } from './types.js';

/**
 * A layout or template that is **another entry** — the second half of ADR-0213 §7's resolution order
 * (*registered component first, then another entry's slug*), which the registry alone could never
 * satisfy: "the client imports the page artifact and its layout artifact and nests them."
 *
 * The named entry's body compiled to its own artifact exactly like a page's, and it frames whatever it
 * receives as `children` — an MDX layout is a body that writes `{props.children}` where the page goes.
 * It gets the same {@link ChromeProps} a registered component gets, plus the host's component map, so a
 * shell authored as an entry can place `<SiteNav />` the way a page body can.
 *
 * **The body is never held hostage by its chrome.** While the artifact is in flight, and if it never
 * arrives, the children render unframed — the same posture as a registered name nothing resolves. A
 * shell that fails to load must degrade to the page it was framing, not to a blank; the doctor
 * (`BeamUxChromeAudit`) is what names the missing artifact, and the page is what the reader came for.
 */
export type ArtifactChromeProps = ChromeProps & {
    artifact: EntryArtifactPayload;
    /** The host's contribution map, so an entry-authored shell can reach the same components a body can. */
    components?: Record<string, ComponentType<never>>;
};

export function ArtifactChrome({ artifact, components, children, ...chrome }: ArtifactChromeProps) {
    const { Body } = useEntryArtifact(artifact.url, artifact.version);

    if (Body === null) {
        return <>{children}</>;
    }

    return (
        <Body {...chrome} components={components ?? {}}>
            {children}
        </Body>
    );
}
