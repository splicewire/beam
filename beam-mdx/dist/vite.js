// src/vite/content-plugin.ts
import fs from "fs";
import path from "path";
var VIRTUAL_ID = "virtual:beam-mdx/content";
var RESOLVED_ID = "\0" + VIRTUAL_ID;
function readFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return {};
  }
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) {
      continue;
    }
    fields[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return fields;
}
var TRUTHY = /* @__PURE__ */ new Set(["true", "yes", "1"]);
function isDraft(name, fm, draftablePrefixes) {
  if (TRUTHY.has(fm.draft?.toLowerCase() ?? "")) {
    return true;
  }
  if (!draftablePrefixes.some((prefix) => name.startsWith(prefix))) {
    return false;
  }
  return !fm.datePublished;
}
function isGated(fm) {
  return fm.access !== void 0;
}
function collectMdx(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectMdx(abs));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      out.push(abs);
    }
  }
  return out;
}
function beamMdxContent(options) {
  const {
    contentDir,
    draftablePrefixes = ["essays/", "broadcasts/"],
    previewEnvs = [],
    currentEnv,
    includeDrafts
  } = options;
  const allowDrafts = includeDrafts ?? (currentEnv ? previewEnvs.includes(currentEnv) : false);
  const nameOf = (abs) => path.relative(contentDir, abs).replace(/\\/g, "/").replace(/\.mdx$/, "");
  return {
    name: "beam-mdx:content",
    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_ID;
      }
      return null;
    },
    load(id) {
      if (id !== RESOLVED_ID) {
        return null;
      }
      const included = collectMdx(contentDir).map((abs) => ({ abs, name: nameOf(abs) })).filter(({ abs, name }) => {
        const fm = readFrontmatter(fs.readFileSync(abs, "utf8"));
        if (isGated(fm)) {
          return false;
        }
        if (allowDrafts) {
          return true;
        }
        return !isDraft(name, fm, draftablePrefixes);
      }).sort((a, b) => a.name.localeCompare(b.name));
      const imports = included.map(
        (entry, i) => `import * as m${i} from ${JSON.stringify(entry.abs)};`
      ).join("\n");
      const map = included.map((entry, i) => `  ${JSON.stringify(entry.name)}: m${i},`).join("\n");
      return `${imports}

export const MODULES = {
${map}
};
`;
    },
    // Adding, removing, or retitling a content file changes the generated map, so
    // invalidate the virtual module when any file under the content root changes.
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(contentDir)) {
        return;
      }
      const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (mod) {
        server.moduleGraph.invalidateModule(mod);
      }
    }
  };
}

// src/vite/preset.ts
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
function beamMdxPreset(options = {}) {
  return {
    enforce: "pre",
    ...mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        ...options.remarkPlugins ?? []
      ],
      rehypePlugins: [...options.rehypePlugins ?? []]
    })
  };
}
export {
  beamMdxContent,
  beamMdxPreset
};
//# sourceMappingURL=vite.js.map