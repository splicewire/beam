import { Plugin } from 'vite';
import { PluggableList } from 'unified';

interface BeamMdxContentOptions {
    /** Absolute path to the content root (e.g. resources/js/content). */
    contentDir: string;
    /**
     * Content-name prefixes whose files are gated by a published date. Anything outside
     * these (the root pages) is always bundled. Defaults to `['essays/', 'broadcasts/']`.
     */
    draftablePrefixes?: string[];
    /** Env names permitted to see drafts (the comma-separated allowlist, already split). */
    previewEnvs?: string[];
    /** The resolved current environment (APP_ENV). */
    currentEnv?: string;
    /** Explicit override — the dev server passes true so local always previews. */
    includeDrafts?: boolean;
}
declare function beamMdxContent(options: BeamMdxContentOptions): Plugin;

interface BeamMdxPresetOptions {
    /** Extra remark plugins to run after the frontmatter pair. */
    remarkPlugins?: PluggableList;
    /** Rehype plugins to run on the HAST (e.g. syntax highlighting for fenced code). */
    rehypePlugins?: PluggableList;
}
/**
 * The MDX compile step for the content plane, previously inlined per-satellite in
 * `vite.config.ts`. MDX must compile *before* `@vitejs/plugin-react` sees the file, so it
 * runs in the `pre` slot. `remark-mdx-frontmatter` surfaces each file's YAML as a
 * `frontmatter` named export (title, layout, …) the content resolver reads.
 *
 * Returns a single Vite plugin — spread it into the `plugins` array ahead of `react()`.
 */
declare function beamMdxPreset(options?: BeamMdxPresetOptions): Plugin;

export { type BeamMdxContentOptions, type BeamMdxPresetOptions, beamMdxContent, beamMdxPreset };
