import type { BlockdocManifest } from '@schemastud/blockdoc';
import type { JsonBlock, JsonDoc } from '../blockdoc/json';
import { getAt, isJsonBlock, isLeafText, parentOf, setProp, removeProp } from '../blockdoc/json';
import type { BlockTemplate } from './context';

/**
 * Ticket 15 shape C: a document may only USE components this client can render. Every PascalCase block the document
 * holds, in children and named slots, must be in the JS registry; one that is not fails loudly, by name.
 *
 * A component the profile merely DECLARES is not checked here. One profile drives palette, inspector and save for every
 * client, so it may declare nodes a given client cannot render (a host's Auth* pages, which only beam-inertia
 * registers). Those are left out of this client's insert palette instead ({@link profileTemplatesAtParent}).
 */
export function assertDocRegistry(doc: JsonDoc, registry: Record<string, unknown>): void {
    const missing = [...new Set(usedComponentNames(doc))].filter(name => !Object.hasOwn(registry, name));
    if (missing.length) throw new Error(`Components used in this document are missing from the JS registry: ${missing.join(', ')}`);
}

/** The PascalCase (component) block names a document uses, in children and named slots, in document order. */
function usedComponentNames(nodes: JsonDoc): string[] {
    const names: string[] = [];
    for (const node of nodes) {
        if (!isJsonBlock(node)) continue;
        if (node.name !== null && /^[A-Z]/.test(node.name)) names.push(node.name);
        names.push(...usedComponentNames(node.children));
        for (const slot of Object.values(node.slots ?? {})) names.push(...usedComponentNames(slot));
    }
    return names;
}

/**
 * The server owns the vocabulary. Templates supply presentation, never admission. Given the client's registry, a component
 * it cannot render is not offered (ticket 15 shape C); without one, the palette is the profile's, as before.
 */
export function profileTemplates(templates: BlockTemplate[], profile: BlockdocManifest, doc: JsonDoc, selected: string | null, registry?: Record<string, unknown>): BlockTemplate[] {
    const target = selected && getAt(doc, selected) ? selected : '0';
    const node = getAt(doc, target);
    const parentPath = node && isJsonBlock(node) && !isLeafText(node) && target === '0' ? target : parentOf(target);
    return profileTemplatesAtParent(templates, profile, doc, parentPath, registry);
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

export function profileTemplatesAtParent(templates: BlockTemplate[], profile: BlockdocManifest, doc: JsonDoc, parentPath: string, registry?: Record<string, unknown>): BlockTemplate[] {
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
        if (registry && block.name !== null && /^[A-Z]/.test(block.name) && !Object.hasOwn(registry, block.name)) return false;
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
    // Bound values are edited by BindingInspector, not normalized into literal props by SchemaForm.
    for (const prop of block.props) if (prop.kind === 'field') delete properties[prop.name];
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
