import {
  patchText
} from "./chunk-7RDOFS6I.js";

// src/leaf/registry.ts
var REGISTRY = /* @__PURE__ */ new Map();
function registerLeafEngine(engine) {
  REGISTRY.set(engine.engine, engine);
  return engine;
}
function getLeafEngine(engine) {
  return REGISTRY.get(engine);
}
function resolveLeafEngine(engine) {
  const found = REGISTRY.get(engine);
  if (!found) {
    const known = [...REGISTRY.keys()];
    throw new Error(
      `No inline leaf engine registered for '${engine}'. ` + (known.length ? `Registered engines: ${known.map((k) => `'${k}'`).join(", ")}. ` : "No engines are registered. ") + `Register one with registerLeafEngine() before the leaf field mounts.`
    );
  }
  return found;
}
function registeredLeafEngines() {
  return [...REGISTRY.keys()];
}

// src/leaf/bind.ts
function bindTextNode(textNode, engineName) {
  const engine = resolveLeafEngine(engineName);
  return {
    engine,
    textNode,
    read: () => engine.toDoc(textNode.value),
    write: (doc) => {
      const text = engine.fromDoc(doc);
      patchText(textNode, text);
      return text;
    }
  };
}

// src/leaf/mdx-engine.ts
var DELIMS = [
  { open: "`", close: "`", mark: "inlineCode", opaque: true },
  { open: "**", close: "**", mark: "strong" },
  { open: "__", close: "__", mark: "strong" },
  { open: "*", close: "*", mark: "em" },
  { open: "_", close: "_", mark: "em" }
];
function parseInline(text) {
  const runs = parseSpan(text, []);
  return coalesce(runs);
}
function parseSpan(text, marks) {
  const out = [];
  let i = 0;
  let literal = "";
  const flush = () => {
    if (literal) {
      out.push({ text: literal, marks: [...marks] });
      literal = "";
    }
  };
  while (i < text.length) {
    if (text[i] === "\\" && i + 1 < text.length) {
      literal += text[i] + text[i + 1];
      i += 2;
      continue;
    }
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i) {
        flush();
        out.push({ text: text.slice(i + 1, end), marks: [...marks, "inlineCode"] });
        i = end + 1;
        continue;
      }
    }
    if (text[i] === "[") {
      const link = matchLink(text, i);
      if (link) {
        flush();
        const inner = parseSpan(link.label, [...marks, "link"]);
        for (const run of inner) run.href = link.href;
        const linkFallback = { text: "", marks: [...marks, "link"], href: link.href };
        out.push(...inner.length ? inner : [linkFallback]);
        i = link.end;
        continue;
      }
    }
    let matched = false;
    for (const d of DELIMS) {
      if (d.mark === "inlineCode") continue;
      if (text.startsWith(d.open, i)) {
        const close = findClose(text, i + d.open.length, d.close);
        if (close !== -1) {
          flush();
          out.push(...parseSpan(text.slice(i + d.open.length, close), [...marks, d.mark]));
          i = close + d.close.length;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;
    literal += text[i];
    i += 1;
  }
  flush();
  return out;
}
function findClose(text, from, close) {
  let i = from;
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i) {
        i = end + 1;
        continue;
      }
    }
    if (text.startsWith(close, i)) {
      if (i === from) return -1;
      return i;
    }
    i += 1;
  }
  return -1;
}
function matchLink(text, at) {
  if (text[at] !== "[") return null;
  let i = at + 1;
  let label = "";
  while (i < text.length && text[i] !== "]") {
    if (text[i] === "\\" && i + 1 < text.length) {
      label += text[i + 1];
      i += 2;
      continue;
    }
    label += text[i];
    i += 1;
  }
  if (text[i] !== "]" || text[i + 1] !== "(") return null;
  let j = i + 2;
  let href = "";
  while (j < text.length && text[j] !== ")") {
    href += text[j];
    j += 1;
  }
  if (text[j] !== ")") return null;
  return { label, href, end: j + 1 };
}
function coalesce(runs) {
  const out = [];
  for (const run of runs) {
    const prev = out[out.length - 1];
    if (prev && sameMarks(prev, run)) {
      prev.text += run.text;
    } else {
      out.push({ ...run, marks: [...run.marks] });
    }
  }
  return out;
}
function sameMarks(a, b) {
  return a.href === b.href && a.marks.length === b.marks.length && a.marks.every((m, k) => m === b.marks[k]);
}
var SYNTAX = {
  strong: { open: "**", close: "**" },
  em: { open: "*", close: "*" },
  inlineCode: { open: "`", close: "`", opaque: true }
};
function serializeInline(doc) {
  let out = "";
  const open = [];
  const closeDownTo = (depth) => {
    while (open.length > depth) {
      out += open.pop().close;
    }
  };
  for (const run of doc) {
    let shared = 0;
    while (shared < open.length && shared < run.marks.length && open[shared].mark === run.marks[shared] && open[shared].href === (run.marks[shared] === "link" ? run.href : void 0)) {
      shared++;
    }
    closeDownTo(shared);
    for (let k = shared; k < run.marks.length; k++) {
      const mark = run.marks[k];
      if (mark === "link") {
        out += "[";
        open.push({ mark, href: run.href, close: `](${run.href ?? ""})` });
      } else {
        const s = SYNTAX[mark];
        out += s.open;
        open.push({ mark, close: s.close });
      }
    }
    out += run.text;
  }
  closeDownTo(0);
  return out;
}
var mdxLeafEngine = {
  engine: "mdx",
  toDoc: parseInline,
  fromDoc: serializeInline
};
export {
  bindTextNode,
  getLeafEngine,
  mdxLeafEngine,
  parseInline,
  registerLeafEngine,
  registeredLeafEngines,
  resolveLeafEngine,
  serializeInline
};
//# sourceMappingURL=leaf.js.map