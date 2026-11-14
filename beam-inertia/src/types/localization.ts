/**
 * The client catalog shapes laravel-beam serves (localization 16; ruling 02 §4): the TS mirror of its declared Data
 * classes, `Splicewire\Beam\Localization\Client\Data\*`.
 *
 * `localization.schema.json` (sibling) is exported from those PHP classes, and `localization.conformance.test.ts` fails
 * when this file drifts from it.
 *
 * `ClientCatalogData` is schemastud's `ClientCatalog` (@schemastud/messages), so a host passes `initial` to its
 * `MessageProvider` as is.
 */

/** One resolved line: its text, and the locale whose rung ANSWERED (used to select a plural; never re-laddered). */
export interface ClientMessageLineData {
    text: string;
    sourceLocale: string;
}

/** The flattened, laddered catalog for one host, locale and realm. */
export interface ClientCatalogData {
    version: 1;
    locale: string;
    realm: string | null;
    direction: 'ltr' | 'rtl';
    messages: Record<string, ClientMessageLineData>;
}

/** Where a catalog is fetched, and its content hash (opaque identity, never re-verified on the client). */
export interface ClientCatalogAddressData {
    url: string;
    hash: string;
    version: 1;
    locale: string;
    realm: string | null;
}

/** The `localization` shared prop: the address, and the initial catalog (a once-prop; null without a valid catalog). */
export interface ClientLocalizationData {
    address: ClientCatalogAddressData;
    initial: ClientCatalogData | null;
}
