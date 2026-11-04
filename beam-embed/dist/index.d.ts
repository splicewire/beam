import * as react from 'react';
import { ReactNode } from 'react';
import { RetentionPostureData, PrunePreviewData, PruneResultData, EraseResultData } from '@splicewire/beam-resources/types/embed-retention';

/**
 * The single-pane privacy governance console. Renders inside the Settings meta-area (SectionBar sub-tab
 * strip owns nav) — no prototype chrome.
 */
declare function PrivacyRetentionPage({ canManage, title }: {
    canManage: boolean; /** Host-supplied page heading (UX03/C39); the package renders exactly one h1 from it. */
    title?: string;
}): react.JSX.Element;

type EraseSubjectKind = 'visitorId' | 'sessionId';
interface RetentionClient {
    posture(): Promise<RetentionPostureData>;
    preview(): Promise<PrunePreviewData>;
    prune(): Promise<PruneResultData>;
    erase(input: {
        kind: EraseSubjectKind;
        subjectId: string;
    }): Promise<EraseResultData>;
}
interface RetentionServices {
    client: RetentionClient;
    policyDescription?: ReactNode;
}
declare function RetentionProvider({ services, children }: {
    services: RetentionServices;
    children: ReactNode;
}): react.JSX.Element;

export { type EraseSubjectKind, PrivacyRetentionPage, type RetentionClient, RetentionProvider, type RetentionServices };
