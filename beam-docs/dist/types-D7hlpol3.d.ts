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
type PhpApiAttributeData = {
    name: string;
    arguments: string[];
};
type PhpApiIndexData = {
    audience: string;
    packages: PhpApiPackageData[];
};
type PhpApiInheritedData = {
    kind: string;
    name: string;
    from: string;
    visibility: string | null;
    abstract: undefined | boolean;
    original: undefined | string;
    declaration: undefined | PhpApiMemberData;
};
type PhpApiLinkData = {
    fqn: string;
    published: boolean;
};
type PhpApiMemberData = {
    name: string;
    visibility: string;
    attributes: PhpApiAttributeData[];
    line: number;
    doc: string[];
    tags: PhpApiTagData[];
    static: undefined | boolean;
    readonly: undefined | boolean;
    abstract: undefined | boolean;
    final: undefined | boolean;
    byRef: undefined | boolean;
    promoted: undefined | boolean;
    type: undefined | string | null;
    value: undefined | string | null;
    default: undefined | string | null;
    params: undefined | PhpApiParamData[];
    returnType: undefined | string | null;
    templates: undefined | PhpApiTemplateData[];
    signature: undefined | string;
    comment: undefined | string;
};
type PhpApiPackageData = {
    name: string;
    version: string | null;
    published: number;
    symbols: PhpApiSymbolRowData[];
};
type PhpApiParamData = {
    name: string;
    type: string | null;
    default: string | null;
    byRef: boolean;
    variadic: boolean;
    promoted: boolean;
    attributes: PhpApiAttributeData[];
};
type PhpApiSeeData = {
    target: string;
    published: boolean;
};
type PhpApiSymbolData = {
    fqn: string;
    package: string;
    kind: string;
    modifiers: string[];
    templates: PhpApiTemplateData[];
    extends: PhpApiLinkData[];
    implements: PhpApiLinkData[];
    traits: PhpApiLinkData[];
    backingType: string | null;
    attributes: PhpApiAttributeData[];
    doc: string[];
    tags: PhpApiTagData[];
    file: string;
    line: number;
    constants: PhpApiMemberData[];
    cases: PhpApiMemberData[];
    properties: PhpApiMemberData[];
    methods: PhpApiMemberData[];
    see: PhpApiSeeData[];
    inherited: PhpApiInheritedData[];
    implementers: string[];
    comment: undefined | string;
};
type PhpApiSymbolRowData = {
    fqn: string;
    kind: string;
    summary: string | null;
};
type PhpApiTagData = {
    tag: string;
    type: undefined | string;
    name: undefined | string;
    description: undefined | string;
};
type PhpApiTemplateData = {
    name: string;
    bound: string | null;
    default: string | null;
    variance: string;
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
type RegistryIndexAvailability = 'served' | 'external' | 'not-available' | 'not-published' | 'not-documented' | 'exempt';
type RegistryIndexData = {
    groups: RegistryIndexGroupData[];
    total: number;
};
type RegistryIndexGroupData = {
    key: string;
    title: string;
    href: string | null;
    roots: RegistryIndexRootData[];
    groups: RegistryIndexGroupData[];
};
type RegistryIndexRootData = {
    root: string;
    href: string | null;
    availability: RegistryIndexAvailability;
    note: string | null;
};
type RegistryRegistrantData = {
    key: string;
    registrant: string;
};
type RegistryRegistrantsData = {
    root: string;
    describedHere: boolean | null;
    owner: string | null;
    describedBy: string | null;
    recordsRegistrants: boolean;
    entries: RegistryRegistrantData[] | null;
    unattributed: number | null;
    note: string | null;
};

export type { DocsChromeData as D, PublicationData as P, RegistryIndexData as R, PublishInputData as a, PhpApiIndexData as b, PhpApiSymbolData as c, DocsRelatedData as d, PhpApiInheritedData as e, PhpApiMemberData as f, PhpApiPackageData as g, PhpApiSymbolRowData as h, PublicationStatus as i, RegistryIndexAvailability as j, RegistryIndexGroupData as k, RegistryIndexRootData as l, RegistryRegistrantData as m, RegistryRegistrantsData as n, DocsPublishingPageData as o };
