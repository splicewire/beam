// src/ContentSectionNodeView.tsx
import { ChevronDown, ImageIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function ContentSectionNodeView({
  node,
  updateAttrs,
  contentRef
}) {
  const heading = String(node.attrs.heading ?? "");
  const imagePrompt = node.attrs.imagePrompt ?? "";
  const strategy = node.attrs.strategy;
  const groundingTokens = Array.isArray(node.attrs.groundingTokens) ? node.attrs.groundingTokens : [];
  const hasContext = Boolean(strategy) || Boolean(imagePrompt) || groundingTokens.length > 0;
  const [showContext, setShowContext] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "blockdoc-content-section rounded-lg border border-[var(--beam-ink-10)] bg-background", children: [
    /* @__PURE__ */ jsxs("div", { contentEditable: false, className: contentRef === null ? "pb-2.5" : void 0, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3.5 pt-2.5", children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] font-medium tracking-[0.14em] text-[var(--beam-ink-40)] uppercase", children: "Section" }),
        hasContext && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setShowContext((open) => !open),
            className: "ml-auto flex items-center gap-1 font-mono text-[9.5px] tracking-wide text-[var(--beam-ink-45)] uppercase transition-colors hover:text-foreground",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "size-3" }),
              " Context",
              /* @__PURE__ */ jsx(
                ChevronDown,
                {
                  className: `size-3 transition-transform ${showContext ? "rotate-180" : ""}`
                }
              )
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          value: heading,
          onChange: (event) => updateAttrs({ heading: event.target.value }),
          placeholder: "Section heading\u2026",
          "aria-label": "Section heading",
          className: "w-full bg-transparent px-3.5 py-1 text-[15px] font-semibold tracking-tight outline-none placeholder:text-[var(--beam-ink-30)]"
        }
      ),
      hasContext && showContext && /* @__PURE__ */ jsxs("div", { className: "mx-3.5 mb-2 space-y-2 rounded-md bg-[var(--beam-ink-04)] p-2.5", children: [
        strategy && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[11px]", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono tracking-wide text-[var(--beam-ink-45)] uppercase", children: "Strategy" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-[var(--beam-ink-70)]", children: strategy })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-[11px]", children: [
          /* @__PURE__ */ jsxs("span", { className: "inline-flex shrink-0 items-center gap-1 font-mono tracking-wide text-[var(--beam-ink-45)] uppercase", children: [
            /* @__PURE__ */ jsx(ImageIcon, { className: "size-3" }),
            " Image"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: imagePrompt,
              onChange: (event) => updateAttrs({ imagePrompt: event.target.value || null }),
              placeholder: "No image prompt",
              className: "min-w-0 flex-1 bg-transparent text-[var(--beam-ink-70)] outline-none placeholder:text-[var(--beam-ink-30)]"
            }
          )
        ] }),
        groundingTokens.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] tracking-wide text-[var(--beam-ink-45)] uppercase", children: "Grounding" }),
          groundingTokens.map((token, index) => /* @__PURE__ */ jsx(
            "span",
            {
              className: "rounded bg-[var(--beam-ink-08)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--beam-ink-60)]",
              children: token
            },
            `${token}-${index}`
          ))
        ] })
      ] })
    ] }),
    contentRef !== null && /* @__PURE__ */ jsx("div", { ref: contentRef, className: "px-3.5 pb-3" })
  ] });
}

// src/ContentOutlineNodeView.tsx
import { ListTree, Plus, X } from "lucide-react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function ContentOutlineNodeView({ node, updateAttrs }) {
  const title = String(node.attrs.title ?? "");
  const excerpt = String(node.attrs.excerpt ?? "");
  const headings = Array.isArray(node.attrs.sectionHeadings) ? node.attrs.sectionHeadings : [];
  const setHeadings = (next) => updateAttrs({ sectionHeadings: next });
  return /* @__PURE__ */ jsxs2("div", { className: "blockdoc-content-outline rounded-lg border border-[var(--beam-ink-10)] bg-background", contentEditable: false, children: [
    /* @__PURE__ */ jsx2("div", { className: "flex items-center gap-2 px-3.5 pt-2.5", children: /* @__PURE__ */ jsxs2("span", { className: "inline-flex items-center gap-1 font-mono text-[9px] font-medium tracking-[0.14em] text-[var(--beam-ink-40)] uppercase", children: [
      /* @__PURE__ */ jsx2(ListTree, { className: "size-3" }),
      " Outline"
    ] }) }),
    /* @__PURE__ */ jsx2(
      "input",
      {
        value: title,
        onChange: (event) => updateAttrs({ title: event.target.value }),
        placeholder: "Article title\u2026",
        "aria-label": "Article title",
        className: "w-full bg-transparent px-3.5 py-1 text-[15px] font-semibold tracking-tight outline-none placeholder:text-[var(--beam-ink-30)]"
      }
    ),
    /* @__PURE__ */ jsx2(
      "input",
      {
        value: excerpt,
        onChange: (event) => updateAttrs({ excerpt: event.target.value }),
        placeholder: "A one-line excerpt\u2026",
        "aria-label": "Excerpt",
        className: "w-full bg-transparent px-3.5 pb-1.5 text-[13px] text-[var(--beam-ink-60)] outline-none placeholder:text-[var(--beam-ink-30)]"
      }
    ),
    /* @__PURE__ */ jsxs2("ol", { className: "space-y-1 px-3.5 pb-3", children: [
      headings.length === 0 && /* @__PURE__ */ jsx2("li", { className: "ml-7 text-[12px] text-[var(--beam-ink-45)]", children: "No sections planned yet. Add the headings this article will expand into." }),
      headings.map((heading, index) => /* @__PURE__ */ jsxs2("li", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs2("span", { className: "w-5 shrink-0 text-right font-mono text-[11px] text-[var(--beam-ink-35)]", children: [
          index + 1,
          "."
        ] }),
        /* @__PURE__ */ jsx2(
          "input",
          {
            value: heading,
            onChange: (event) => {
              const next = [...headings];
              next[index] = event.target.value;
              setHeadings(next);
            },
            placeholder: "Section heading\u2026",
            "aria-label": `Section heading ${index + 1}`,
            className: "min-w-0 flex-1 rounded border border-transparent bg-[var(--beam-ink-04)] px-2 py-1 text-[13px] outline-none focus:border-[var(--beam-ink-15)] placeholder:text-[var(--beam-ink-30)]"
          }
        ),
        /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            onClick: () => setHeadings(headings.filter((_, i) => i !== index)),
            "aria-label": `Remove section ${index + 1}`,
            className: "shrink-0 rounded p-1 text-[var(--beam-ink-40)] transition-colors hover:bg-[var(--beam-ink-08)] hover:text-foreground",
            children: /* @__PURE__ */ jsx2(X, { className: "size-3.5" })
          }
        )
      ] }, index)),
      /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsxs2(
        "button",
        {
          type: "button",
          onClick: () => setHeadings([...headings, ""]),
          className: "ml-7 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--beam-green)] transition-colors hover:underline",
          children: [
            /* @__PURE__ */ jsx2(Plus, { className: "size-3.5" }),
            " Add section"
          ]
        }
      ) })
    ] })
  ] });
}

// src/registry.ts
function registerContentNodeViews(registry) {
  registry.registerNodeView("ContentSection", ContentSectionNodeView);
  registry.registerNodeView("ContentOutline", ContentOutlineNodeView);
  registry.registerNodeView("content_section", ContentSectionNodeView);
  registry.registerNodeView("content_outline", ContentOutlineNodeView);
}
export {
  ContentOutlineNodeView,
  ContentSectionNodeView,
  registerContentNodeViews
};
//# sourceMappingURL=index.js.map