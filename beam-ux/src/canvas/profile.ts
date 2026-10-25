import type { BlockdocManifest } from '@schemastud/blockdoc';
import type { JsonBlock, JsonDoc } from '../blockdoc/json';
import { getAt, isJsonBlock, isLeafText, parentOf, setProp, removeProp } from '../blockdoc/json';
import type { BlockTemplate } from './context';

export function assertProfileRegistry(profile: BlockdocManifest, registry: Record<string, unknown>): void {
    const missing = profile.nodes.filter(node => /^[A-Z]/.test(node.name) && !Object.hasOwn(registry, node.name)).map(node => node.name);
    if (missing.length) throw new Error(`Manifest Profile components missing from the JS registry: ${missing.join(', ')}`);
}

/** The server owns the vocabulary. Templates supply presentation, never admission. */
export function profileTemplates(templates: BlockTemplate[], profile: BlockdocManifest, doc: JsonDoc, selected: string | null): BlockTemplate[] {
    const target = selected && getAt(doc, selected) ? selected : '0';
    const node = getAt(doc, target);
    const parentPath = node && isJsonBlock(node) && !isLeafText(node) && target === '0' ? target : parentOf(target);
    return profileTemplatesAtParent(templates, profile, doc, parentPath);
}

/** Resolve a default-child or named-slot container from the one manifest. */
export function profileParentDeclaration(profile: BlockdocManifest, doc: JsonDoc, parentPath: string) {
    const parent = parentPath ? getAt(doc, parentPath) : null;
    const slot = parentPath.match(/^(.*)\.slots\.([A-Za-z_$][A-Za-z0-9_$]*)$/);
    const owner = slot ? getAt(doc, slot[1]) : null;
    return slot && owner && isJsonBlock(owner)
        ? profile.nodes.find(node => node.name === owner.name)?.slots?.find(entry => entry.name === slot[2])
        : parent && isJsonBlock(parent) ? profile.nodes.find(n => n.name === parent.name) : profile.doc;
}

export function profileTemplatesAtParent(templates: BlockTemplate[], profile: BlockdocManifest, doc: JsonDoc, parentPath: string): BlockTemplate[] {
    const declaration = profileParentDeclaration(profile, doc, parentPath);
    const categories = declaration?.admitsChildCategories;
    // EP-07: a profile's components are placeable whether or not a template presents them; one without is offered empty.
    const presented = new Set(templates.map(template => template.make().name));
    const components = profile.nodes.filter(node => /^[A-Z]/.test(node.name) && !presented.has(node.name)).map(node => ({
        label: node.name.replace(/(?<=[a-z0-9])(?=[A-Z])/g, ' '),
        make: (): JsonBlock => ({ kind: 'block', name: node.name, isComponent: true, dynamic: false, props: [], children: [] }),
    }));
    return [...templates, ...components].filter(template => {
        const block = template.make();
        const candidate = profile.nodes.find(n => n.name === block.name);
        if ('x-admits-code' in profile && profile['x-admits-code'] === false && block.props.some(prop => prop.kind === 'expression')) return false;
        return candidate !== undefined && declaration !== undefined &&
            (categories === null || (candidate.category !== null && categories?.includes(candidate.category) === true));
    });
}

/** Unknown legacy nodes remain readable, but do not acquire an invented editing schema. */
export function profileAttrs(block: JsonBlock, profile: BlockdocManifest) {
    const declaration = profile.nodes.find(n => n.name === block.name);
    const source = declaration?.attrsSchema ?? { type: 'object', properties: {}, additionalProperties: false };
    const properties = { ...(source.properties as Record<string, unknown> | undefined) };
    if (source.additionalProperties !== false) {
        for (const prop of block.props) {
            if (prop.kind !== 'expression' && !Object.hasOwn(properties, prop.name)) properties[prop.name] = { type: prop.kind };
        }
    }
    const noCode = 'x-admits-code' in profile && profile['x-admits-code'] === false;
    if (noCode) {
        for (const prop of block.props) if (prop.kind === 'expression') delete properties[prop.name];
        for (const key of Object.keys(properties)) if (/^on[A-Z]/.test(key)) delete properties[key];
    }
    const attrs = Object.fromEntries(block.props.filter(prop => prop.kind !== 'expression' && Object.hasOwn(properties, prop.name)).map(prop => [prop.name, prop.value]));
    return { schema: { ...source, properties,
        ...(Array.isArray(source.required) ? { required: source.required.filter(key => typeof key === 'string' && Object.hasOwn(properties, key)) } : {}),
        ...(noCode ? { additionalProperties: false } : {}) }, attrs };
}

export function setProfileAttrs(block: JsonBlock, attrs: Record<string, unknown>, profile: BlockdocManifest): JsonBlock {
    const { schema } = profileAttrs(block, profile);
    const properties = schema.properties as Record<string, unknown>;
    let next = block;
    for (const key of Object.keys(properties)) {
        if (!Object.hasOwn(attrs, key)) { next = removeProp(next, key); continue; }
        const value = attrs[key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            next = setProp(next, key, value, typeof value as 'string' | 'number' | 'boolean');
        }
    }
    return next;
}
