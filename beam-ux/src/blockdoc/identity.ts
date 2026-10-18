/** UUIDv7 for newly authored blocks (ux-0228 d3). Existing/moved blocks keep their ids. */
export function blockId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let time = Date.now();
    for (let i = 5; i >= 0; i--) { bytes[i] = time % 256; time = Math.floor(time / 256); }
    bytes[6] = (bytes[6] & 15) | 0x70;
    bytes[8] = (bytes[8] & 63) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function freshBlockIds<T extends {kind: string}>(node: T): T {
    const copy = structuredClone(node);
    type Node = {kind:string; id?:string; children?:Node[]};
    const visit = (value: Node) => {
        if (value.kind !== 'block') return;
        value.id = blockId();
        value.children?.forEach(visit);
    };
    visit(copy);
    return copy;
}
