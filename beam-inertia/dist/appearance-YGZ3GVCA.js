import {
  useAppearance
} from "./chunk-6C5PVJOV.js";
import {
  Heading
} from "./chunk-C5OGDGGA.js";
import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/pages/settings/appearance.tsx
import { Head } from "@inertiajs/react";

// src/components/appearance-tabs.tsx
import { Monitor, Moon, Sun } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
function AppearanceToggleTab({
  className = "",
  ...props
}) {
  const { appearance, updateAppearance } = useAppearance();
  const tabs = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" }
  ];
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800",
        className
      ),
      ...props,
      children: tabs.map(({ value, icon: Icon, label }) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => updateAppearance(value),
          className: cn(
            "flex items-center rounded-md px-3.5 py-1.5 transition-colors",
            appearance === value ? "bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100" : "text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60"
          ),
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "-ml-1 h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "ml-1.5 text-sm", children: label })
          ]
        },
        value
      ))
    }
  );
}

// src/pages/settings/appearance.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Appearance() {
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2(Head, { title: "Appearance settings" }),
    /* @__PURE__ */ jsx2("h1", { className: "sr-only", children: "Appearance settings" }),
    /* @__PURE__ */ jsxs2("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx2(
        Heading,
        {
          variant: "small",
          title: "Appearance settings",
          description: "Update the appearance settings for your account"
        }
      ),
      /* @__PURE__ */ jsx2(AppearanceToggleTab, {})
    ] })
  ] });
}
Appearance.layout = {
  breadcrumbs: [
    {
      title: "Appearance settings",
      href: { method: "get", url: "/settings/appearance" }
    }
  ]
};
export {
  Appearance as default
};
//# sourceMappingURL=appearance-YGZ3GVCA.js.map