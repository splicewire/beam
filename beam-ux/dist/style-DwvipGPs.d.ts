interface StyleLayerData {
    declarations: Record<string, string>;
    breakpoint?: string | null;
    state?: string | null;
}
interface BlockStyleData {
    layers: StyleLayerData[];
}

/** ADR-0228 d4. The PHP Data declaration owns this wire shape. */
type BlockStyle = BlockStyleData;

export type { BlockStyle as B };
