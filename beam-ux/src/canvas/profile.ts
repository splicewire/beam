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

export function profileTemplatesAtParent(templates: BlockTemplate[], profile: BlockdocManifest, doc: JsonDoc, parentPath: string): BlockTemplate[] {
    const parent = parentPath ? getAt(doc, parentPath) : null;
    const declaration = parent && isJsonBlock(parent) ? profile.nodes.find(n => n.name === parent.name) : profile.doc;
    const categories = declaration?.admitsChildCategories;
    return templates.filter(template => {
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
