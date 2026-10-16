type BrandData = {
    readonly name: string;
    readonly logo: string | null;
    readonly titleTemplate: string | null;
    readonly legalEntity: string | null;
    readonly passkeyCopy: string;
    readonly contact: {
        sales: string | null;
    };
    readonly home: string | null;
    readonly tagline: string | null;
};
type DocsChromeData = {
    brand: BrandData;
    home: string;
    back: string;
    surfaces: DocsSurfaceData[];
    related: DocsRelatedData[];
};
type DocsPublishingPageData = {
    publicationsEndpoint: string;
    docsUrl: string | null;
};
type DocsRelatedData = {
    key: string;
    name: string;
    tagline: string | null;
    href: string;
    docs: string | null;
};
type DocsSurfaceData = {
    label: string;
    href: string;
};
type PublicationData = {
    id: string;
    version: string;
    status: PublicationStatus;
    sha256: string;
    namespace: string;
    slug: string;
    isPrivate: boolean;
    registryUrl: string | null;
    error: string | null;
    createdAt: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    retryOf: string | null;
};
type PublicationStatus = 'queued' | 'running' | 'succeeded' | 'failed';
type PublishInputData = {
    version: string;
};

export type { DocsChromeData as D, PublicationData as P, PublishInputData as a, DocsRelatedData as b, PublicationStatus as c, DocsPublishingPageData as d };
