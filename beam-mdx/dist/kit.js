// src/kit/figure.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Figure({
  src,
  alt,
  caption,
  children
}) {
  return /* @__PURE__ */ jsxs("figure", { className: "bkit-figure", children: [
    children ? /* @__PURE__ */ jsx("div", { className: "bkit-figure-body", children }) : src ? /* @__PURE__ */ jsx("img", { src, alt: alt ?? "", loading: "lazy" }) : null,
    caption && /* @__PURE__ */ jsx("figcaption", { className: "bkit-figcaption", children: caption })
  ] });
}

// src/kit/file-tree.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function renderNodes(nodes) {
  return /* @__PURE__ */ jsx2("ul", { className: "bkit-filetree-list", children: nodes.map((node, i) => /* @__PURE__ */ jsxs2("li", { className: "bkit-filetree-item", children: [
    /* @__PURE__ */ jsx2("span", { className: "bkit-filetree-name", children: node.name }),
    node.children && node.children.length > 0 ? renderNodes(node.children) : null
  ] }, `${node.name}-${i}`)) });
}
function FileTree({
  tree,
  children
}) {
  return /* @__PURE__ */ jsx2("div", { className: "bkit-filetree", children: tree ? renderNodes(tree) : children });
}

// src/kit/terminal.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Terminal({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs3("div", { className: "bkit-terminal", children: [
    /* @__PURE__ */ jsxs3("div", { className: "bkit-terminal-bar", children: [
      /* @__PURE__ */ jsxs3("span", { className: "bkit-terminal-dots", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsx3("span", { className: "bkit-terminal-dot" }),
        /* @__PURE__ */ jsx3("span", { className: "bkit-terminal-dot" }),
        /* @__PURE__ */ jsx3("span", { className: "bkit-terminal-dot" })
      ] }),
      title && /* @__PURE__ */ jsx3("span", { className: "bkit-terminal-title", children: title })
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "bkit-terminal-body", children })
  ] });
}

// src/kit/callout.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function Callout({
  type = "note",
  title,
  children
}) {
  return /* @__PURE__ */ jsxs4("div", { className: `bkit-callout bkit-callout--${type}`, children: [
    title && /* @__PURE__ */ jsx4("p", { className: "bkit-callout-title", children: title }),
    /* @__PURE__ */ jsx4("div", { className: "bkit-callout-body", children })
  ] });
}

// src/kit/steps.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function Steps({ children }) {
  return /* @__PURE__ */ jsx5("div", { className: "bkit-steps", children });
}
function Step({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs5("div", { className: "bkit-step", children: [
    /* @__PURE__ */ jsx5("div", { className: "bkit-step-marker", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs5("div", { className: "bkit-step-content", children: [
      title && /* @__PURE__ */ jsx5("p", { className: "bkit-step-title", children: title }),
      /* @__PURE__ */ jsx5("div", { className: "bkit-step-body", children })
    ] })
  ] });
}

// src/kit/doctor-output.tsx
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var LEVEL_RE = /^\s*(INFO|PASS|WARN|ERROR|FAIL)\b\s*/i;
var LEVEL_STATUS = {
  INFO: "pass",
  PASS: "pass",
  WARN: "warn",
  ERROR: "fail",
  FAIL: "fail"
};
var STATUS_LABEL = {
  pass: "Pass",
  warn: "Warn",
  fail: "Fail"
};
function parseDoctorOutput(raw) {
  const findings = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    let rest = line;
    let status = "pass";
    const match = LEVEL_RE.exec(rest);
    if (match) {
      status = LEVEL_STATUS[match[1].toUpperCase()];
      rest = rest.slice(match[0].length);
    } else {
      rest = rest.trim();
    }
    const sep = rest.indexOf(": ");
    const check = sep === -1 ? rest.trim() : rest.slice(0, sep).trim();
    const detail = sep === -1 ? "" : rest.slice(sep + 2).trim();
    findings.push({ status, check, detail });
  }
  return findings;
}
function DoctorOutput({
  raw,
  children
}) {
  const text = raw ?? (typeof children === "string" ? children : String(children ?? ""));
  const findings = parseDoctorOutput(text);
  const passed = findings.filter((f) => f.status === "pass").length;
  const warned = findings.filter((f) => f.status === "warn").length;
  const failed = findings.filter((f) => f.status === "fail").length;
  return /* @__PURE__ */ jsxs6("div", { className: "bkit-doctoroutput", children: [
    /* @__PURE__ */ jsx6("ul", { className: "bkit-doctoroutput-list", children: findings.map((finding, i) => /* @__PURE__ */ jsxs6(
      "li",
      {
        className: `bkit-doctoroutput-row bkit-doctoroutput-row--${finding.status}`,
        children: [
          /* @__PURE__ */ jsx6("span", { className: "bkit-doctoroutput-pip", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx6("span", { className: "bkit-doctoroutput-label", children: STATUS_LABEL[finding.status] }),
          /* @__PURE__ */ jsx6("span", { className: "bkit-doctoroutput-check", children: finding.check }),
          finding.detail && /* @__PURE__ */ jsx6("span", { className: "bkit-doctoroutput-detail", children: finding.detail })
        ]
      },
      `${finding.check}-${i}`
    )) }),
    /* @__PURE__ */ jsxs6("p", { className: "bkit-doctoroutput-summary", children: [
      passed,
      " passed / ",
      warned,
      " warn / ",
      failed,
      " failed"
    ] })
  ] });
}

// src/kit/section-landing.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function SectionLanding({
  eyebrow,
  heading,
  lede,
  children
}) {
  return /* @__PURE__ */ jsxs7("section", { className: "bkit-landing", children: [
    /* @__PURE__ */ jsxs7("header", { className: "bkit-landing-hero", children: [
      eyebrow && /* @__PURE__ */ jsx7("p", { className: "bkit-landing-eyebrow", children: eyebrow }),
      /* @__PURE__ */ jsx7("h1", { className: "bkit-landing-heading", children: heading }),
      lede && /* @__PURE__ */ jsx7("p", { className: "bkit-landing-lede", children: lede })
    ] }),
    children
  ] });
}
function CardGrid({ children }) {
  return /* @__PURE__ */ jsx7("div", { className: "bkit-card-grid", children });
}
function Card({
  href,
  title,
  blurb,
  icon
}) {
  return /* @__PURE__ */ jsxs7("a", { href, className: "bkit-card", children: [
    icon && /* @__PURE__ */ jsx7("span", { className: "bkit-card-icon", children: icon }),
    /* @__PURE__ */ jsx7("span", { className: "bkit-card-title", children: title }),
    blurb && /* @__PURE__ */ jsx7("span", { className: "bkit-card-blurb", children: blurb })
  ] });
}
export {
  Callout,
  Card,
  CardGrid,
  DoctorOutput,
  Figure,
  FileTree,
  SectionLanding,
  Step,
  Steps,
  Terminal,
  parseDoctorOutput
};
//# sourceMappingURL=kit.js.map