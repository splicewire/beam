import {
  Content
} from "./chunk-RJIJTUAE.js";

// src/editor/MdxDocumentEditor.tsx
import "@mdxeditor/editor/style.css";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  diffSourcePlugin,
  jsxPlugin,
  toolbarPlugin,
  DiffSourceToggleWrapper,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  ListsToggle
} from "@mdxeditor/editor";
import { useRef } from "react";

// src/editor/descriptors.tsx
import { GenericJsxEditor } from "@mdxeditor/editor";

// src/editor/kit-manifest.json
var kit_manifest_default = {
  profile: "beam-mdx-kit",
  version: 1,
  nodes: [
    {
      name: "Callout",
      group: "block",
      category: "block",
      admitsChildCategories: null,
      admitsText: true,
      attrsSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "note",
              "tip",
              "warning",
              "danger",
              "info"
            ],
            default: "note",
            title: "Kind"
          },
          title: {
            type: "string",
            title: "Title"
          }
        }
      },
      description: "An admonition (note / tip / warning / danger / info) with an optional title."
    },
    {
      name: "Steps",
      group: "block",
      category: "block",
      admitsChildCategories: [
        "step"
      ],
      admitsText: false,
      attrsSchema: {
        type: "object"
      },
      description: "A numbered procedure \u2014 a list of Step children.",
      "x-editable": {
        reorderable: true
      }
    },
    {
      name: "Step",
      group: "block",
      category: "step",
      admitsChildCategories: null,
      admitsText: true,
      attrsSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            title: "Title"
          }
        }
      },
      description: "One step in a Steps procedure; the title is the step heading."
    },
    {
      name: "Figure",
      group: "block",
      category: "block",
      admitsChildCategories: null,
      admitsText: true,
      attrsSchema: {
        type: "object",
        properties: {
          src: {
            type: "string",
            title: "Image URL"
          },
          alt: {
            type: "string",
            title: "Alt text"
          },
          caption: {
            type: "string",
            title: "Caption"
          }
        }
      },
      description: "A captioned image or inline diagram."
    },
    {
      name: "Terminal",
      group: "block",
      category: "block",
      admitsChildCategories: null,
      admitsText: true,
      attrsSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            title: "Title"
          }
        }
      },
      description: "A terminal / code window with chrome and an optional title."
    },
    {
      name: "SectionLanding",
      group: "block",
      category: "block",
      admitsChildCategories: [
        "card-grid",
        "block"
      ],
      admitsText: false,
      attrsSchema: {
        type: "object",
        properties: {
          eyebrow: {
            type: "string",
            title: "Eyebrow"
          },
          heading: {
            type: "string",
            title: "Heading"
          },
          lede: {
            type: "string",
            "x-expression": true
          }
        },
        required: [
          "heading"
        ]
      },
      description: "A landing hero: eyebrow + heading + lede over a CardGrid."
    },
    {
      name: "CardGrid",
      group: "block",
      category: "card-grid",
      admitsChildCategories: [
        "card"
      ],
      admitsText: false,
      attrsSchema: {
        type: "object"
      },
      description: "A responsive grid of Cards.",
      "x-editable": {
        reorderable: true
      }
    },
    {
      name: "Card",
      group: "block",
      category: "card",
      admitsChildCategories: [],
      admitsText: false,
      attrsSchema: {
        type: "object",
        properties: {
          href: {
            type: "string",
            title: "Link"
          },
          title: {
            type: "string",
            title: "Title"
          },
          blurb: {
            type: "string",
            title: "Blurb"
          },
          icon: {
            type: "string",
            "x-expression": true
          }
        }
      },
      description: "A linked card: href + title + blurb + icon."
    },
    {
      name: "DoctorOutput",
      group: "block",
      category: "block",
      admitsChildCategories: null,
      admitsText: true,
      attrsSchema: {
        type: "object",
        properties: {
          raw: {
            type: "string",
            title: "Raw output"
          }
        }
      },
      description: "A structured doctor / diagnostic report (raw text or children)."
    },
    {
      name: "FileTree",
      group: "block",
      category: "block",
      admitsChildCategories: null,
      admitsText: true,
      attrsSchema: {
        type: "object",
        properties: {
          tree: {
            type: "string",
            "x-expression": true
          }
        }
      },
      description: "A file-structure tree (a `tree` node array or children)."
    },
    {
      name: "Ref",
      group: "inline",
      category: "inline",
      admitsChildCategories: null,
      admitsText: true,
      attrsSchema: {
        type: "object",
        properties: {
          to: {
            type: "string",
            title: "Reference key"
          }
        },
        required: [
          "to"
        ]
      },
      description: 'An inline evidence citation: <Ref to="key">the claim</Ref>.'
    },
    {
      name: "Artifact",
      group: "block",
      category: "block",
      admitsChildCategories: [],
      admitsText: false,
      attrsSchema: {
        type: "object",
        properties: {
          file: {
            type: "string",
            title: "Artifact file"
          },
          title: {
            type: "string",
            title: "Title"
          }
        },
        required: [
          "file"
        ]
      },
      description: "Inline a committed, build-highlighted artifact file (opaque in the editor)."
    }
  ]
};

// src/editor/manifest.ts
var kitManifest = kit_manifest_default;

// src/editor/schema-form.tsx
import { Form } from "@rjsf/shadcn";
import validator from "@rjsf/validator-ajv8";
import { useMemo } from "react";
import { jsx } from "react/jsx-runtime";
function prepare(attrsSchema) {
  const source = attrsSchema?.properties ?? {};
  const properties = {};
  const uiSchema = { "ui:submitButtonOptions": { norender: true } };
  for (const [key, prop] of Object.entries(source)) {
    const { "x-expression": isExpression, ...clean } = prop;
    properties[key] = clean;
    if (isExpression) {
      uiSchema[key] = { "ui:widget": "hidden" };
    }
  }
  return {
    schema: { type: "object", required: attrsSchema?.required, properties },
    uiSchema
  };
}
function SchemaFormPropertyEditor({ properties, title, onChange }) {
  const node = kitManifest.nodes.find((n) => n.name === title);
  const { schema, uiSchema } = useMemo(() => prepare(node?.attrsSchema), [node]);
  return /* @__PURE__ */ jsx("div", { className: "mdx-schema-form", children: /* @__PURE__ */ jsx(
    Form,
    {
      schema,
      uiSchema,
      formData: properties,
      validator,
      liveValidate: false,
      showErrorList: false,
      onChange: (e) => onChange(e.formData ?? {})
    }
  ) });
}

// src/editor/descriptors.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var SchemaDrivenJsxEditor = (props) => /* @__PURE__ */ jsx2(GenericJsxEditor, { ...props, PropertyEditor: SchemaFormPropertyEditor });
function nodeToJsxDescriptor(node) {
  const properties = node.attrsSchema?.properties ?? {};
  const props = Object.entries(properties).map(([name, schema]) => ({
    name,
    type: schema?.["x-expression"] ? "expression" : "string"
  }));
  const hasChildren = node.admitsText || node.admitsChildCategories === null || node.admitsChildCategories.length > 0;
  return {
    name: node.name,
    kind: node.group === "inline" ? "text" : "flow",
    // Ambient MDX components (provided via the components map, not imported), so no import source.
    source: "",
    props,
    hasChildren,
    Editor: SchemaDrivenJsxEditor
  };
}
var KIT_JSX_DESCRIPTORS = kitManifest.nodes.map(nodeToJsxDescriptor);

// src/editor/toolbar.tsx
import { Select, insertJsx$, usePublisher } from "@mdxeditor/editor";
import { jsx as jsx3 } from "react/jsx-runtime";
var STARTER_PROPS = {
  Callout: { type: "note" },
  Content: { name: "fragments/example" },
  Ref: { to: "key" },
  SectionLanding: { heading: "Heading" },
  Card: { href: "/", title: "Title" },
  Artifact: { file: "example.json" }
};
function InsertKitBlock() {
  const insertJsx = usePublisher(insertJsx$);
  return /* @__PURE__ */ jsx3(
    Select,
    {
      value: "",
      triggerTitle: "Insert component",
      placeholder: "Insert\u2026",
      onChange: (name) => {
        if (!name) return;
        const node = kitManifest.nodes.find((n) => n.name === name);
        const props = STARTER_PROPS[name] ?? {};
        if (node?.group === "inline") {
          insertJsx({ name, kind: "text", props, children: [{ type: "text", value: "" }] });
        } else {
          insertJsx({ name, kind: "flow", props, children: [] });
        }
      },
      items: kitManifest.nodes.map((n) => ({ label: n.name, value: n.name }))
    }
  );
}

// src/editor/MdxDocumentEditor.tsx
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
var CODE_LANGS = { "": "text", text: "Text", ts: "TypeScript", tsx: "TSX", js: "JavaScript", json: "JSON", bash: "Shell", php: "PHP", mdx: "MDX", md: "Markdown", html: "HTML", css: "CSS" };
function MdxDocumentEditor({
  value,
  onChange,
  jsxDescriptors = KIT_JSX_DESCRIPTORS,
  defaultViewMode = "source",
  className
}) {
  const ref = useRef(null);
  return /* @__PURE__ */ jsx4(
    MDXEditor,
    {
      ref,
      markdown: value,
      onChange,
      className,
      contentEditableClassName: "site-prose mdx-editor-prose",
      plugins: [
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
        codeMirrorPlugin({ codeBlockLanguages: CODE_LANGS }),
        markdownShortcutPlugin(),
        frontmatterPlugin(),
        // Register the kit's custom JSX components so rich mode can parse the guides
        // (unregistered JSX makes mdxeditor refuse rich mode). Derived from the kit manifest.
        jsxPlugin({ jsxComponentDescriptors: jsxDescriptors }),
        // Caller-chosen initial view — `'source'` by default (reliable for every guide incl.
        // custom JSX + Artifact); an in-place WYSIWYG host passes `'rich'`.
        diffSourcePlugin({ viewMode: defaultViewMode }),
        toolbarPlugin({
          toolbarContents: () => /* @__PURE__ */ jsxs(DiffSourceToggleWrapper, { children: [
            /* @__PURE__ */ jsx4(UndoRedo, {}),
            /* @__PURE__ */ jsx4(BoldItalicUnderlineToggles, {}),
            /* @__PURE__ */ jsx4(BlockTypeSelect, {}),
            /* @__PURE__ */ jsx4(CreateLink, {}),
            /* @__PURE__ */ jsx4(ListsToggle, {}),
            /* @__PURE__ */ jsx4(InsertTable, {}),
            /* @__PURE__ */ jsx4(InsertThematicBreak, {}),
            /* @__PURE__ */ jsx4(InsertKitBlock, {})
          ] })
        })
      ]
    }
  );
}

// src/editor/content-descriptor.tsx
import { useMdastNodeUpdater } from "@mdxeditor/editor";
import { jsx as jsx5, jsxs as jsxs2 } from "react/jsx-runtime";
var attrValue = (node, key) => {
  const a = node.attributes?.find((x) => x.type === "mdxJsxAttribute" && x.name === key);
  return typeof a?.value === "string" ? a.value : "";
};
function contentJsxDescriptor(options = []) {
  const ContentRefEditor = ({ mdastNode }) => {
    const update = useMdastNodeUpdater();
    const name = attrValue(mdastNode, "name");
    return /* @__PURE__ */ jsxs2("div", { className: "beam-content-ref", contentEditable: false, children: [
      /* @__PURE__ */ jsxs2("div", { className: "beam-content-ref-bar", children: [
        /* @__PURE__ */ jsx5("span", { className: "beam-content-ref-tag", children: "\u25A4 shared content" }),
        /* @__PURE__ */ jsxs2(
          "select",
          {
            className: "beam-content-ref-pick",
            value: name,
            onChange: (e) => update({
              attributes: [{ type: "mdxJsxAttribute", name: "name", value: e.target.value }]
            }),
            children: [
              name && !options.includes(name) && /* @__PURE__ */ jsx5("option", { value: name, children: name }),
              options.map((n) => /* @__PURE__ */ jsx5("option", { value: n, children: n }, n))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx5("div", { className: "beam-content-ref-body", children: /* @__PURE__ */ jsx5(Content, { name }) })
    ] });
  };
  return {
    name: "Content",
    kind: "flow",
    source: "",
    props: [{ name: "name", type: "string" }],
    hasChildren: false,
    Editor: ContentRefEditor
  };
}
function withContentDescriptor(descriptors = KIT_JSX_DESCRIPTORS, { options = [] } = {}) {
  return [...descriptors.filter((d) => d.name !== "Content"), contentJsxDescriptor(options)];
}
export {
  InsertKitBlock,
  KIT_JSX_DESCRIPTORS,
  MdxDocumentEditor,
  SchemaFormPropertyEditor,
  contentJsxDescriptor,
  nodeToJsxDescriptor,
  withContentDescriptor
};
//# sourceMappingURL=editor.js.map