/** ux-0231 d8–10: identifiers are data only inside a declared component interface. */
export interface ComponentDeclaration {
    name: string;
    attrsSchema?: {properties?: Record<string, unknown>};
    admitsChildCategories: string[] | null;
    slots?: {name: string; admitsChildCategories: string[] | null}[];
}
export interface LensContext {
    profile?: {nodes: ComponentDeclaration[]};
    component?: string;
}
export function assertReferenceName(value: unknown): asserts value is string {
    if (typeof value !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)
        || ['__proto__', 'prototype', 'constructor', 'this', 'super', 'null', 'true', 'false'].includes(value)) {
        throw new Error('A component reference must be a declared identifier');
    }
}
export function declaredProp(context: LensContext, name: string): boolean {
    const entry = context.profile?.nodes.find(node => node.name === context.component);
    return !!entry?.attrsSchema?.properties && Object.hasOwn(entry.attrsSchema.properties, name);
}
export function declaredSlot(context: LensContext, name: string): boolean {
    const entry = context.profile?.nodes.find(node => node.name === context.component);
    return !!entry && (name === 'children' ? entry.admitsChildCategories === null || entry.admitsChildCategories.length > 0 : !!entry.slots?.some(slot => slot.name === name));
}
