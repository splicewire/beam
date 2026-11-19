/**
 * Binding other pages to config (config-sections ticket 10, shipped by 10b): `useConfigValue` reads one pointer of one
 * section, and `ConfigFields` renders a section's pointers as labelled values. Both read the `beam-config` resource
 * through frame (one row per section, its id the section root) and see the section as their realm may
 * ({@link sectionForRealm}): in the tenant realm, only keys whose ceiling admits the tenant tier, and no env name or path.
 *
 * Read-only here. Editing a field binds to the draft and publish ops, which the regenerated `config` slice types.
 */
import { useResourceRecord, type ResourceKey } from '@schemastud/frame';
import type { SchemaNode } from '@schemastud/seam';
import { cn } from '@schemastud/ui';
import {
    asConfigSection,
    keyLabel,
    resolveConfigValue,
    sectionForRealm,
    type ConfigRealm,
    type ConfigSectionData,
    type ConfigValue,
} from './model';
import { ReadValue, SecretValue } from './parts';
import { useBeamUxMessages } from '../messages.js';

export interface UseConfigValueResult extends ConfigValue {
    /** The section as the realm sees it, once read. */
    section: ConfigSectionData | null;
    isPending: boolean;
    /** True when the row was read but is not a `beam-config` section, or the read failed. */
    failed: boolean;
}

/**
 * One pointer of one section, as the realm sees it. A pointer the realm may not see (a key whose ceiling does not admit
 * the tenant tier, read in the tenant realm) resolves like a missing one: no value and no key.
 */
export function useConfigValue<K extends ResourceKey = ResourceKey>(
    resource: K,
    root: string,
    pointer: string,
    realm: ConfigRealm = 'operator',
): UseConfigValueResult {
    const record = useResourceRecord(resource, root);
    const row = asConfigSection(record.data);
    const section = row ? sectionForRealm(row, realm) : null;
    const empty: ConfigValue = { value: undefined, key: undefined, secret: false, set: false };
    if (!section) return { ...empty, section: null, isPending: record.isPending, failed: !record.isPending };
    const resolved = resolveConfigValue(section, pointer);
    // The row's `values` are not filtered by realm, so in the tenant realm a value is answered only through a visible key.
    const visible = realm === 'operator' || resolved.key !== undefined;
    return { ...(visible ? resolved : empty), section, isPending: false, failed: false };
}

export interface ConfigFieldsProps<K extends ResourceKey = ResourceKey> {
    resource: K;
    /** The section root, which is also its `beam-config` row id. */
    root: string;
    /** The JSON pointers to show, in order (RFC 6901, relative to the root). */
    pointers: readonly string[];
    realm?: ConfigRealm;
    className?: string;
}

/**
 * A section's pointers as labelled, read-only values: each label is the section schema's `title` (else the humanized
 * token), each value is read through the schema's declared widget, and a secret shows only whether it is set.
 */
export function ConfigFields<K extends ResourceKey = ResourceKey>({ resource, root, pointers, realm = 'operator', className }: ConfigFieldsProps<K>) {
    const m = useBeamUxMessages();
    const record = useResourceRecord(resource, root);
    const row = asConfigSection(record.data);
    if (record.isPending) return <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-ux::messages.config_loading_section')}</p>;
    if (!row) return <p className="text-sm text-destructive">{m.t('splicewire-beam-ux::messages.config_section_read_failed')}</p>;
    const section = sectionForRealm(row, realm);
    const schema = section.schema as SchemaNode;
    const fields = pointers
        .map((pointer) => ({ pointer, resolved: resolveConfigValue(section, pointer) }))
        // In the tenant realm, a pointer no visible key owns is not shown at all.
        .filter(({ resolved }) => realm === 'operator' || resolved.key !== undefined);
    return (
        <dl data-config-fields={section.root} className={cn('grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]', className)}>
            {fields.map(({ pointer, resolved }) => {
                const label = keyLabel(schema, pointer);
                return (
                    <div key={pointer} data-config-field={pointer} className="contents">
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="min-w-0 text-sm">
                            {resolved.secret ? (
                                <SecretValue set={resolved.set} />
                            ) : (
                                <ReadValue schema={schema} pointer={pointer} value={resolved.value} label={label} />
                            )}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}
