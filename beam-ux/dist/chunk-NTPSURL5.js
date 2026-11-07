import {
  DEFAULT_CANVAS_THEME
} from "./chunk-IMARETAS.js";
import {
  richFieldComponents
} from "./chunk-YC5ZNKLO.js";

// src/editor/use-component-authoring.ts
import { useMemo, useRef as useRef2 } from "react";

// src/editor/ComponentSessionHost.tsx
import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { jsx, jsxs } from "react/jsx-runtime";
var ComponentEditor = lazy(() => import("./mount-NNUUY7QT.js"));
var Context = createContext(void 0);
var useComponentSession = () => useContext(Context);
function ComponentSessionHost({
  kit,
  children
}) {
  const [active, setActive] = useState(null);
  const sequence = useRef(0);
  const [error, setError] = useState(null);
  useEffect(() => {
    sequence.current++;
    setActive(null);
    setError(null);
    return () => {
      sequence.current++;
    };
  }, [kit.userId, kit.canAuthor]);
  const open = (entry, props, element) => {
    const request = ++sequence.current;
    const actor = kit.userId;
    if (!actor || !kit.canAuthor || !kit.transport.componentCapabilities)
      return;
    void kit.transport.componentCapabilities(entry.id).then(
      (admission) => {
        if (request !== sequence.current) return;
        if (!admission.canEdit || admission.id !== entry.id) {
          setError("Editing this component is unavailable.");
          return;
        }
        setError(null);
        setActive({
          entry,
          props,
          admission,
          target: element
        });
      },
      () => {
        if (request === sequence.current)
          setError("Editing this component was refused.");
      }
    );
  };
  const close = () => {
    sequence.current++;
    const target = active?.target;
    setActive(null);
    requestAnimationFrame(() => target?.focus());
  };
  const defaults = Object.fromEntries(
    (active?.entry.definition.props ?? []).filter((prop) => prop.default != null).map((prop) => [prop.name, prop.default])
  );
  const colors = { ...DEFAULT_CANVAS_THEME, ...kit.theme };
  return /* @__PURE__ */ jsxs(Context.Provider, { value: open, children: [
    error && /* @__PURE__ */ jsx("p", { role: "alert", children: error }),
    /* @__PURE__ */ jsx(
      "div",
      {
        inert: active ? true : void 0,
        style: active ? { opacity: 0.25, pointerEvents: "none" } : void 0,
        children
      }
    ),
    active && createPortal(
      /* @__PURE__ */ jsxs(
        "section",
        {
          className: "component-session",
          role: "dialog",
          "aria-label": `Edit component ${active.entry.definition.name}`,
          "aria-modal": "true",
          style: {
            "--component-panel": colors.panelBg,
            "--component-ink": colors.panelFg,
            "--component-muted": colors.muted,
            "--component-accent": colors.editAccent,
            "--stud-surface": colors.panelBg,
            "--stud-ink": colors.panelFg,
            "--stud-ink-muted": colors.muted,
            "--stud-line": "color-mix(in srgb, currentColor 25%, transparent)",
            fontFamily: colors.fontBody
          },
          onKeyDown: (event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          },
          children: [
            /* @__PURE__ */ jsx("style", { children: componentSessionCss }),
            /* @__PURE__ */ jsxs("header", { className: "component-session-heading", children: [
              /* @__PURE__ */ jsx("strong", { children: active.entry.definition.name }),
              " \u2014",
              " ",
              active.admission.reachEntries === null ? `direct reach unavailable (over ${active.admission.reachLimit} entries)` : `used directly by ${active.admission.reachEntries} ${active.admission.reachEntries === 1 ? "entry" : "entries"}`,
              /* @__PURE__ */ jsx("button", { type: "button", autoFocus: true, onClick: close, children: "Back to parent" })
            ] }),
            /* @__PURE__ */ jsx("p", { children: "Transitive page reach is not included." }),
            /* @__PURE__ */ jsx("p", { children: "Undo and Save belong to this component. The parent\u2019s unsaved work waits unchanged. Closing retains this component\u2019s Local Session." }),
            /* @__PURE__ */ jsx("div", { className: "component-session-editor", children: /* @__PURE__ */ jsx(
              EditorKitProvider,
              {
                ...kit,
                canvasConfig: {
                  ...kit.canvasConfig,
                  componentProps: { ...defaults, ...active.props }
                },
                children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("p", { role: "status", children: "Loading component editor\u2026" }), children: /* @__PURE__ */ jsx(
                  ComponentEditor,
                  {
                    entryRef: {
                      id: active.entry.id,
                      slug: active.entry.definition.name,
                      format: "tsx",
                      bodyKind: "blocks"
                    }
                  }
                ) })
              }
            ) })
          ]
        }
      ),
      document.body
    )
  ] });
}
var componentSessionCss = `
.component-session{position:fixed;inset:12px;margin:0;max-width:none;width:auto;height:auto;z-index:2147483300;box-sizing:border-box;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:var(--component-panel);color:var(--component-ink);border:1px solid var(--component-muted);border-radius:10px;box-shadow:0 16px 80px #0008;font-size:14px;line-height:1.5;isolation:isolate}
.component-session-heading{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--stud-line)}
.component-session-heading button{margin-left:auto}
.component-session>p{margin:6px 16px;flex:none}
.component-session-editor{position:relative;min-height:0;min-width:0;flex:1;overflow:auto;padding:12px;transform:translateZ(0)}
.component-session :is(button,input,select,textarea):not(.ve-canvas *){box-sizing:border-box;max-width:100%;min-height:32px;border:1px solid var(--stud-line);border-radius:5px;background:var(--component-panel);color:var(--component-ink);font:inherit;padding:4px 8px}
.component-session button:not(.ve-canvas *){cursor:pointer}
.component-session button:disabled{opacity:.45;cursor:not-allowed}
.component-session :focus-visible{outline:2px solid var(--component-accent);outline-offset:2px}
.component-session-editor :is([aria-label="Publication controls"],[data-frame-region="top-bar"]){display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
.component-session-editor fieldset{min-width:0;margin:12px 0;padding:12px;border:1px solid var(--stud-line)}
.component-session-editor [data-frame-shell="edit-five"]{min-width:0;height:auto!important}
.component-session-editor [data-frame-region="body"]{display:grid!important;grid-template-columns:minmax(140px,180px) minmax(0,1fr) minmax(220px,280px);gap:12px}
.component-session-editor [data-frame-region]{min-width:0}
.component-session-editor [data-frame-region="canvas"]{background:var(--stud-surface)}
.component-session-editor [data-frame-region="palette"] button{display:block;width:100%;margin-bottom:6px;text-align:left}
.component-session-editor [data-frame-region="inspector-region"]{padding:12px;overflow:auto}
@media(max-width:900px){.component-session{inset:6px}.component-session-editor [data-frame-region="body"]{grid-template-columns:minmax(0,1fr)}.component-session-editor [data-frame-region="palette"]{max-height:160px;overflow:auto}.component-session-heading{padding:8px}.component-session>p{margin:4px 8px}}
`;

// src/editor/context.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";

// src/editor/islands.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function DemoHero() {
  return /* @__PURE__ */ jsxs2(
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
      children: cells.map((c) => /* @__PURE__ */ jsxs2(
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
  return { DemoHero, DemoFeatureRow, ...richFieldComponents };
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
  blockTemplates: BLOCK_TEMPLATES,
  classSuggestions: CLASS_SUGGESTIONS,
  varSuggestions: VAR_SUGGESTIONS
};

// src/editor/default-trees.json
var default_trees_default = {
  home: [
    {
      kind: "block",
      name: "div",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "st-editable-home"
        },
        {
          name: "style",
          kind: "string",
          value: "max-width:900px;margin:0 auto;padding:24px"
        }
      ],
      children: [
        {
          kind: "block",
          name: "DemoHero",
          isComponent: true,
          props: [],
          children: [],
          dynamic: false
        },
        {
          kind: "block",
          name: "p",
          isComponent: false,
          dynamic: false,
          props: [
            {
              name: "style",
              kind: "string",
              value: "font-size:16px;line-height:1.6;color:var(--st-muted,#475569);margin:28px 0"
            }
          ],
          children: [
            {
              kind: "text",
              value: "Edit this page right here: change the text and move blocks around. Save a draft as you go, and publish when it\u2019s ready."
            }
          ]
        },
        {
          kind: "block",
          name: "DemoFeatureRow",
          isComponent: true,
          props: [],
          children: [],
          dynamic: false
        }
      ]
    }
  ],
  login: [
    {
      kind: "block",
      name: "h1",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-xl font-medium text-center"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Log in to your account"
        }
      ]
    },
    {
      kind: "block",
      name: "p",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-center text-sm text-muted-foreground"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Enter your email and password below to log in"
        }
      ]
    },
    {
      kind: "block",
      name: "AuthLogin",
      isComponent: true,
      props: [],
      children: [],
      dynamic: false
    }
  ],
  register: [
    {
      kind: "block",
      name: "h1",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-xl font-medium text-center"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Create an account"
        }
      ]
    },
    {
      kind: "block",
      name: "p",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-center text-sm text-muted-foreground"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Enter your details below to create your account"
        }
      ]
    },
    {
      kind: "block",
      name: "AuthRegister",
      isComponent: true,
      props: [],
      children: [],
      dynamic: false
    }
  ],
  "forgot-password": [
    {
      kind: "block",
      name: "h1",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-xl font-medium text-center"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Forgot password"
        }
      ]
    },
    {
      kind: "block",
      name: "p",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-center text-sm text-muted-foreground"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Enter your email to receive a password reset link"
        }
      ]
    },
    {
      kind: "block",
      name: "AuthForgotPassword",
      isComponent: true,
      props: [],
      children: [],
      dynamic: false
    }
  ],
  "reset-password": [
    {
      kind: "block",
      name: "h1",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-xl font-medium text-center"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Reset password"
        }
      ]
    },
    {
      kind: "block",
      name: "p",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-center text-sm text-muted-foreground"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Please enter your new password below"
        }
      ]
    },
    {
      kind: "block",
      name: "AuthResetPassword",
      isComponent: true,
      props: [],
      children: [],
      dynamic: false
    }
  ],
  "confirm-password": [
    {
      kind: "block",
      name: "h1",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-xl font-medium text-center"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Confirm password"
        }
      ]
    },
    {
      kind: "block",
      name: "p",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-center text-sm text-muted-foreground"
        }
      ],
      children: [
        {
          kind: "text",
          value: "This is a secure area of the application. Please confirm your password before continuing."
        }
      ]
    },
    {
      kind: "block",
      name: "AuthConfirmPassword",
      isComponent: true,
      props: [],
      children: [],
      dynamic: false
    }
  ],
  "two-factor-challenge": [
    {
      kind: "block",
      name: "AuthTwoFactorChallenge",
      isComponent: true,
      props: [],
      children: [],
      dynamic: false
    }
  ],
  "verify-email": [
    {
      kind: "block",
      name: "h1",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-xl font-medium text-center"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Email verification"
        }
      ]
    },
    {
      kind: "block",
      name: "p",
      isComponent: false,
      dynamic: false,
      props: [
        {
          name: "className",
          kind: "string",
          value: "text-center text-sm text-muted-foreground"
        }
      ],
      children: [
        {
          kind: "text",
          value: "Please verify your email address by clicking on the link we just emailed to you."
        }
      ]
    },
    {
      kind: "block",
      name: "AuthVerifyEmail",
      isComponent: true,
      props: [],
      children: [],
      dynamic: false
    }
  ]
};

// src/editor/defaults.ts
var DEFAULT_TREES = default_trees_default;
function defaultTreeFor(slug) {
  return DEFAULT_TREES[slug] ?? null;
}

// src/editor/context.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var noop = () => {
};
var KitContext = createContext2(null);
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
      children: /* @__PURE__ */ jsx3(ComponentSessionHost, { kit: { ...inputs, userId, theme, canvasConfig: canvasConfig2, defaultTreeFor: defaultTreeFor2, notify }, children })
    }
  );
}
function useEditorKit() {
  const kit = useContext2(KitContext);
  if (!kit)
    throw new Error(
      "Mount EditorKitProvider with the host transport, theme and author admission."
    );
  return kit;
}

// src/editor/use-component-authoring.ts
function useComponentAuthoring(id, enabled, refresh) {
  const kit = useEditorKit();
  const open = useComponentSession();
  const latest = useRef2({ kit, refresh, open });
  latest.current = { kit, refresh, open };
  const available = enabled && !!id && kit.canAuthor;
  const check = !!kit.transport.componentCapabilities, create = !!kit.transport.createComponent, duplicate = !!kit.transport.duplicateComponent;
  return useMemo(() => {
    if (!available) return void 0;
    const cache = /* @__PURE__ */ new Map();
    return {
      entryId: id,
      refresh: async () => {
        cache.clear();
        await latest.current.refresh();
      },
      open: (...args) => latest.current.open?.(...args),
      client: {
        componentCapabilities: check ? (entry) => {
          let promise = cache.get(entry);
          if (!promise) {
            promise = latest.current.kit.transport.componentCapabilities(entry);
            cache.set(entry, promise);
          }
          return promise;
        } : void 0,
        createComponent: create ? (context, input) => latest.current.kit.transport.createComponent(context, input) : void 0,
        duplicateComponent: duplicate ? (entry) => latest.current.kit.transport.duplicateComponent(entry) : void 0
      }
    };
  }, [id, kit.userId, available, check, create, duplicate]);
}

// src/editor/use-binding-preview-port.ts
import { useMemo as useMemo2, useRef as useRef3 } from "react";
function useBindingPreviewPort(client, id, userId, enabled, collection) {
  const latest = useRef3(client);
  latest.current = client;
  const available = enabled && !!id && !!client.canvasBindings;
  return useMemo2(() => ({
    entryId: id ?? "",
    recordCollection: collection ?? null,
    resolve: available ? (entry, body, value, options) => {
      const read = latest.current.canvasBindings;
      if (!read) return Promise.reject(new Error("Live binding preview unavailable"));
      return read.call(latest.current, entry, body, value, options);
    } : void 0
  }), [id, userId, available, collection]);
}

export {
  useComponentAuthoring,
  useBindingPreviewPort,
  DemoHero,
  DemoFeatureRow,
  canvasConfig,
  DEFAULT_TREES,
  defaultTreeFor,
  EditorKitProvider,
  useEditorKit
};
//# sourceMappingURL=chunk-NTPSURL5.js.map