import {
  CanvasProvider,
  PageEditor,
  useEditMode
} from "./chunk-HIBYCO63.js";

// src/editor/page-editor.tsx
import { useEffect, useState } from "react";

// src/editor/context.tsx
import { createContext, useContext } from "react";

// src/editor/mdx.tsx
import { jsx } from "react/jsx-runtime";
function MdxView({ md }) {
  if (typeof md === "string" && md.trim() !== "") {
    return /* @__PURE__ */ jsx("div", { style: { whiteSpace: "pre-wrap" }, children: md });
  }
  return null;
}
function MdxEdit({
  md,
  onChange
}) {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      value: typeof md === "string" ? md : "",
      onChange: (e) => onChange(e.target.value),
      style: {
        width: "100%",
        minHeight: 120,
        padding: 12,
        fontFamily: "ui-monospace, monospace",
        fontSize: 13
      },
      placeholder: "Markdown content \u2014 swap this stub for @splicewire/beam-mdx to get the rich editor."
    }
  );
}

// src/editor/islands.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function DemoHero() {
  return /* @__PURE__ */ jsxs(
    "section",
    {
      style: {
        padding: "clamp(40px,7vw,84px) clamp(18px,5vw,56px)",
        background: "linear-gradient(180deg,var(--st-hero-from, #f8fafc),var(--st-hero-to, #eef2ff))",
        borderRadius: 16,
        textAlign: "center"
      },
      children: [
        /* @__PURE__ */ jsx2(
          "h1",
          {
            style: {
              fontSize: "clamp(30px,5vw,46px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
              color: "var(--st-fg, #0f172a)"
            },
            children: "An editable hero, in place."
          }
        ),
        /* @__PURE__ */ jsx2(
          "p",
          {
            style: {
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--st-muted, #475569)",
              maxWidth: 520,
              margin: "0 auto"
            },
            children: "This hero is a ready-made block. Move it, remove it, or add your own blocks around it, then save."
          }
        )
      ]
    }
  );
}
function DemoFeatureRow() {
  const cells = [
    {
      title: "Edit in place",
      body: "Change text and layout right on the page."
    },
    {
      title: "Draft, then publish",
      body: "Visitors see the page when you publish it."
    },
    {
      title: "Your look, your colours",
      body: "Set the look in your theme; every block follows it."
    }
  ];
  return /* @__PURE__ */ jsx2(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: 16,
        padding: "24px 0"
      },
      children: cells.map((c) => /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            padding: 20,
            border: "1px solid var(--st-card-border, #e2e8f0)",
            borderRadius: 12,
            background: "var(--st-card, #fff)"
          },
          children: [
            /* @__PURE__ */ jsx2(
              "div",
              {
                style: {
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "var(--st-fg, #0f172a)"
                },
                children: c.title
              }
            ),
            /* @__PURE__ */ jsx2(
              "div",
              {
                style: {
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "var(--st-dim, #64748b)"
                },
                children: c.body
              }
            )
          ]
        },
        c.title
      ))
    }
  );
}

// src/editor/registry.tsx
function defaultComponents() {
  return { DemoHero, DemoFeatureRow };
}

// src/editor/canvas-config.tsx
var str = (name, value) => ({
  name,
  kind: "string",
  value
});
var el = (name, props, children = []) => ({
  kind: "block",
  name,
  isComponent: /^[A-Z]/.test(name),
  props,
  children,
  dynamic: false
});
var BLOCK_TEMPLATES = [
  {
    label: "Section",
    make: () => el(
      "section",
      [str("style", "padding:40px 0")],
      [el("p", [], [{ kind: "text", value: "New section" }])]
    )
  },
  {
    label: "Heading",
    make: () => el(
      "h2",
      [str("style", "font-size:28px;font-weight:700;color:var(--st-fg,#0f172a)")],
      [{ kind: "text", value: "New heading" }]
    )
  },
  {
    label: "Text",
    make: () => el(
      "p",
      [str("style", "color:var(--st-muted,#475569);line-height:1.6")],
      [{ kind: "text", value: "New paragraph." }]
    )
  },
  {
    label: "Button",
    make: () => el(
      "button",
      [
        str(
          "style",
          "background:var(--st-accent,#0f172a);color:var(--st-accent-fg,#fff);border:none;border-radius:10px;padding:11px 18px;cursor:pointer"
        )
      ],
      [{ kind: "text", value: "Button" }]
    )
  },
  {
    label: "Row",
    make: () => el("div", [str("style", "display:flex;gap:12px")])
  },
  {
    label: "Divider",
    make: () => el("hr", [
      str(
        "style",
        "border:none;border-top:1px solid var(--st-card-border,#e2e8f0);margin:24px 0"
      )
    ])
  }
];
var CLASS_SUGGESTIONS = [
  "flex",
  "grid",
  "items-center",
  "justify-between",
  "gap-4",
  "p-4",
  "p-8",
  "mt-4",
  "mb-6",
  "text-center",
  "text-lg",
  "text-2xl",
  "font-semibold",
  "rounded-lg",
  "rounded-xl",
  "shadow",
  "w-full",
  "max-w-2xl"
];
var VAR_SUGGESTIONS = [
  "var(--shell-accent)",
  "var(--shell-fg)",
  "var(--shell-surface)"
];
var canvasConfig = {
  get registry() {
    return defaultComponents();
  },
  MdxView,
  MdxEdit,
  blockTemplates: BLOCK_TEMPLATES,
  classSuggestions: CLASS_SUGGESTIONS,
  varSuggestions: VAR_SUGGESTIONS
};

// src/editor/defaults.ts
var island = (name) => ({
  kind: "block",
  name,
  isComponent: true,
  props: [],
  children: [],
  dynamic: false
});
var str2 = (name, value) => ({
  name,
  kind: "string",
  value
});
var authPage = (heading, description, islandName) => [
  {
    kind: "block",
    name: "h1",
    isComponent: false,
    dynamic: false,
    props: [str2("className", "text-xl font-medium text-center")],
    children: [{ kind: "text", value: heading }]
  },
  {
    kind: "block",
    name: "p",
    isComponent: false,
    dynamic: false,
    props: [str2("className", "text-center text-sm text-muted-foreground")],
    children: [{ kind: "text", value: description }]
  },
  island(islandName)
];
var DEFAULT_TREES = {
  // The public site home — a demo hero island + a copy paragraph + a feature-row island.
  home: [
    {
      kind: "block",
      name: "div",
      isComponent: false,
      dynamic: false,
      props: [
        str2("className", "st-editable-home"),
        str2("style", "max-width:900px;margin:0 auto;padding:24px")
      ],
      children: [
        island("DemoHero"),
        {
          kind: "block",
          name: "p",
          isComponent: false,
          dynamic: false,
          props: [
            str2(
              "style",
              "font-size:16px;line-height:1.6;color:var(--st-muted,#475569);margin:28px 0"
            )
          ],
          children: [
            {
              kind: "text",
              value: "Edit this page right here: change the text and move blocks around. Save a draft as you go, and publish when it\u2019s ready."
            }
          ]
        },
        island("DemoFeatureRow")
      ]
    }
  ],
  // theme-entries-and-authoring STR-03: the 7 promoted auth pages — a heading + description (ordinary
  // editable text blocks, matching AuthPagesSeeder's DB-seeded shape exactly) followed by the sealed
  // island (the real Fortify-bound form). An author holding `ux.auth.author` can retext/reorder/add
  // content around the island via the visual editor; the form itself is never decomposed.
  // `two-factor-challenge` carries no heading/description — its title toggles on local session state
  // (authentication-code ⇄ recovery-code), not editorial copy; its own island sets it directly.
  login: authPage(
    "Log in to your account",
    "Enter your email and password below to log in",
    "AuthLogin"
  ),
  register: authPage(
    "Create an account",
    "Enter your details below to create your account",
    "AuthRegister"
  ),
  "forgot-password": authPage(
    "Forgot password",
    "Enter your email to receive a password reset link",
    "AuthForgotPassword"
  ),
  "reset-password": authPage(
    "Reset password",
    "Please enter your new password below",
    "AuthResetPassword"
  ),
  "confirm-password": authPage(
    "Confirm password",
    "This is a secure area of the application. Please confirm your password before continuing.",
    "AuthConfirmPassword"
  ),
  "two-factor-challenge": [island("AuthTwoFactorChallenge")],
  "verify-email": authPage(
    "Email verification",
    "Please verify your email address by clicking on the link we just emailed to you.",
    "AuthVerifyEmail"
  )
};
function defaultTreeFor(slug) {
  return DEFAULT_TREES[slug] ?? null;
}

// src/editor/context.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var noop = () => {
};
var KitContext = createContext(null);
function EditorKitProvider({
  children,
  ...inputs
}) {
  const {
    userId = "",
    theme = {},
    canvasConfig: canvasConfig2 = canvasConfig,
    defaultTreeFor: defaultTreeFor2 = defaultTreeFor,
    notify = { success: noop, error: noop }
  } = inputs;
  return /* @__PURE__ */ jsx3(
    KitContext.Provider,
    {
      value: {
        ...inputs,
        userId,
        theme,
        canvasConfig: canvasConfig2,
        defaultTreeFor: defaultTreeFor2,
        notify
      },
      children
    }
  );
}
function useEditorKit() {
  const kit = useContext(KitContext);
  if (!kit)
    throw new Error(
      "Mount EditorKitProvider with the host transport, theme and author admission."
    );
  return kit;
}

// src/editor/page-editor.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function asDoc(body) {
  return Array.isArray(body) && body.length > 0 && body.every((n) => !!n && typeof n === "object" && "kind" in n) ? body : null;
}
function addressed(entryId) {
  if (entryId === null) {
    throw new Error("no entry id \u2014 nothing to save against");
  }
  return entryId;
}
var asBody = (doc) => doc;
function PageEditor2({ slug, body = null, entryId: suppliedId = null }) {
  const { transport: bodyClient, theme, canAuthor, userId, canvasConfig: canvasConfig2, defaultTreeFor: defaultTreeFor2, notify: toast } = useEditorKit();
  const [created, setCreated] = useState(null);
  const [creating, setCreating] = useState(false);
  const entryId = suppliedId ?? (created?.slug === slug ? created.id : null);
  const seed = defaultTreeFor2(slug);
  const makeEditable = async () => {
    if (!canAuthor || !bodyClient.makeEditable || !seed || creating) return;
    setCreating(true);
    try {
      const result = await bodyClient.makeEditable(slug, asBody(seed));
      if (!result.id) throw new Error("The server did not return an entry.");
      setCreated({ slug, id: result.id });
      if (result.compileError) toast.error(result.compileError);
      else toast.success("This page is now editable");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not make this page editable");
    } finally {
      setCreating(false);
    }
  };
  const editing = useEditMode();
  const [loaded, setLoaded] = useState(null);
  const current = loaded?.entryId === entryId ? loaded : null;
  useEffect(() => {
    if (!editing || entryId === null || current !== null) {
      return;
    }
    let live = true;
    bodyClient.loadBody(entryId).then(
      (env) => live && setLoaded({ entryId, body: env?.body ?? null })
    ).catch(() => {
      if (live) {
        toast.error("Could not load this page\u2019s saved content");
        setLoaded({ entryId, body: null, failed: true });
      }
    });
    return () => {
      live = false;
    };
  }, [editing, entryId, current]);
  if (editing && entryId !== null && current === null) {
    return /* @__PURE__ */ jsx4("div", { style: { padding: 24, color: "#64748b", fontSize: 13 }, children: "Loading editor\u2026" });
  }
  if (editing && current?.failed) {
    return /* @__PURE__ */ jsx4("div", { role: "alert", children: "Could not load this page\u2019s saved content." });
  }
  const { saveDraft, publish, listVersions, restoreVersion, clearBody } = bodyClient;
  const canClear = entryId !== null && !!clearBody && canAuthor;
  return /* @__PURE__ */ jsxs2(CanvasProvider, { config: canvasConfig2, children: [
    entryId === null && canAuthor && bodyClient.makeEditable && seed && /* @__PURE__ */ jsx4("button", { type: "button", disabled: creating, onClick: makeEditable, children: "Make this page editable" }),
    /* @__PURE__ */ jsx4(
      PageEditor,
      {
        slug,
        entryId: entryId ?? void 0,
        userId,
        body: asDoc(current?.body) ?? asDoc(body),
        transport: {
          // CanvasPageEditor's transport seam is keyed by its `slug` prop, which stays a slug
          // — it is the editor's display label and `defaultTreeFor()` key. The BODY transport
          // underneath is addressed by the entry ID (ADR-0214 §2). So the incoming `s` is
          // deliberately unused: it names the page, not the row.
          saveBody: (_s, doc) => bodyClient.saveBody(addressed(entryId), asBody(doc)),
          // The publication seam (G2-BEAM-DRAFT-PUBLISH), spread in only when there is a row
          // to address and the client supplies all four operations. A page whose entry is absent
          // (a database that was never seeded) keeps
          // the plain Save dock and the honest error it already gives, rather than growing
          // buttons that cannot resolve an id.
          ...entryId === null || !saveDraft || !publish || !listVersions || !restoreVersion ? {} : {
            saveDraft: (_s, doc, baseVersion) => saveDraft(entryId, asBody(doc), baseVersion),
            publish: (_s, ref) => publish(entryId, ref),
            listVersions: () => listVersions(entryId),
            restoreVersion: (_s, ref) => restoreVersion(entryId, ref),
            // The canvas re-seeds itself from this after a restore; without it an
            // author would keep editing the pre-restore document and Save it back
            // over the version they just restored.
            loadBody: () => bodyClient.loadBody(entryId)
          },
          ...canClear && entryId !== null ? { clearBody: () => clearBody(entryId) } : {}
        },
        notify: {
          success: (m) => toast.success(m),
          error: (m) => toast.error(m)
        },
        fallbackDoc: defaultTreeFor2,
        theme,
        brand: "beam-starter \xB7 editor"
      },
      entryId ?? slug
    )
  ] });
}
var page_editor_default = PageEditor2;

export {
  MdxView,
  MdxEdit,
  DemoHero,
  DemoFeatureRow,
  canvasConfig,
  DEFAULT_TREES,
  defaultTreeFor,
  EditorKitProvider,
  useEditorKit,
  asDoc,
  PageEditor2 as PageEditor,
  page_editor_default
};
//# sourceMappingURL=chunk-2SN7FLVF.js.map