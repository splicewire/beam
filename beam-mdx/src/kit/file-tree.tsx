import type { ReactNode } from 'react';

// A directory-tree node for the `tree` prop form.
export interface FileTreeNode {
    name: string;
    children?: FileTreeNode[];
}

// Recursively render a `tree`-prop node array as a nested, mono list.
function renderNodes(nodes: FileTreeNode[]): ReactNode {
    return (
        <ul className="bkit-filetree-list">
            {nodes.map((node, i) => (
                <li key={`${node.name}-${i}`} className="bkit-filetree-item">
                    <span className="bkit-filetree-name">{node.name}</span>
                    {node.children && node.children.length > 0
                        ? renderNodes(node.children)
                        : null}
                </li>
            ))}
        </ul>
    );
}

// A directory tree in a framed, monospace box. Two authoring shapes:
//  - `<FileTree>` with MDX children (a code fence or a nested list) — rendered as-is.
//  - `<FileTree tree={[{ name, children? }]} />` — a structured node array.
// Kept deliberately presentational: the frame + mono type are the value; nesting rides
// the children (or the recursive `tree`), never a parser.
export function FileTree({
    tree,
    children,
}: {
    tree?: FileTreeNode[];
    children?: ReactNode;
}) {
    return (
        <div className="bkit-filetree">
            {tree ? renderNodes(tree) : children}
        </div>
    );
}
