/**
 * ux-0233: an MDX page holds blocks, so the `Mdx` island retires as each host converts (EP-42). A host that still
 * supplies `MdxView`/`MdxEdit` keeps them; without one, an `Mdx` node shows its MDX text read-only, so nothing it
 * holds disappears from the page or the canvas.
 */
export function RetiredMdxIsland({ md }: { file?: string; md?: string }) {
    if (typeof md !== 'string' || md.trim() === '') {
        return null;
    }

    return <div data-beam-mdx-island="retired" style={{ whiteSpace: 'pre-wrap' }}>{md}</div>;
}
