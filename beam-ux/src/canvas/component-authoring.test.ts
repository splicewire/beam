import { describe, it, expect } from "vitest";
import type { JsonBlock } from "../blockdoc/json";
import type { ComponentCanvasData } from "@splicewire/beam-resources/types/beam-ux";
import {
  detachComponent,
  extractComponent,
  makeComponentProp,
} from "./component-authoring";
const block = (
  name: string,
  children: JsonBlock["children"] = []
): JsonBlock => ({
  kind: "block",
  id: `old-${name}`,
  name,
  isComponent: /^[A-Z]/.test(name),
  dynamic: false,
  props: [],
  children,
});
const card: ComponentCanvasData = {
  id: "card",
  definition: {
    name: "Card",
    props: [
      {
        name: "title",
        type: "text",
        required: true,
        default: "Default",
        choices: [],
      },
    ],
  },
  body: [
    {
      ...block("section"),
      component: { name: "Card", props: [] },
      style: { layers: [{ declarations: { color: "red", padding: "10px" } }] },
      children: [
        { kind: "text", value: "", prop: "title" },
        block("Slot"),
        {
          ...block("Slot"),
          props: [{ kind: "string", name: "name", value: "media" }],
          children: [block("img")],
        },
        block("Nested"),
      ],
    },
  ],
  bindings: {},
  headVersion: "head",
  publishedVersion: "pin",
};
describe("component authoring transforms", () => {
  it("detaches the shown Working Head one level with caller bindings, slots, fresh ids and root precedence", () => {
    const instance = {
      ...block("Card", [block("p")]),
      props: [{ kind: "field" as const, name: "title", value: "fields.title" }],
      slots: { media: [block("video")] },
      style: { layers: [{ declarations: { color: "blue" } }] },
      repeat: { collection: "posts" },
      when: { all: [{ field: "fields.visible", operator: "is set" as const }] },
    };
    const before = structuredClone(card);
    const out = detachComponent(instance, card);
    expect(out.name).toBe("section");
    expect(out.component).toBeUndefined();
    expect(out.children[0]).toEqual({
      kind: "text",
      value: "",
      field: "fields.title",
    });
    expect(out.children[1]).toMatchObject({ name: "p" });
    expect(out.children[2]).toMatchObject({ name: "video" });
    expect(out.children[3]).toMatchObject({
      name: "Nested",
      isComponent: true,
    });
    expect(out.id).not.toBe("old-section");
    expect(out.children[1]).not.toHaveProperty("id", "old-p");
    expect(out.repeat).toEqual(instance.repeat);
    expect(out.when).toEqual(instance.when);
    expect(out.style?.layers).toEqual([
      { declarations: { color: "blue", padding: "10px" } },
    ]);
    expect(card).toEqual(before);
  });
  it("uses defaults and fallback slots while explicit empty slots stay empty", () => {
    const out = detachComponent(
      { ...block("Card"), slots: { media: [] } },
      card
    );
    expect(out.children[0]).toEqual({ kind: "text", value: "Default" });
    expect(
      out.children.some((n) => n.kind === "block" && n.name === "img")
    ).toBe(false);
  });
  it("refuses Code/source, wrong-name and missing required values instead of guessing", () => {
    expect(() => detachComponent(block("Code"), undefined)).toThrow(/Authored/);
    expect(() => detachComponent(block("Other"), card)).toThrow(/match/);
    const required = {
      ...card,
      definition: {
        ...card.definition,
        props: [{ ...card.definition.props[0], default: null }],
      },
    };
    expect(() => detachComponent(block("Card"), required)).toThrow(/required/);
  });
  it("moves style and caller bindings into a definition, retaining Repeat/when/gates on the instance", () => {
    const selection = {
      ...block("section", [
        { kind: "text", value: "Placeholder", field: "fields.title" },
        block("ul", [
          {
            ...block("li", [
              { kind: "text", value: "Item", field: "fields.item" },
            ]),
            repeat: { collection: "items" },
          },
        ]),
      ]),
      style: { layers: [{ declarations: { color: "red" } }] },
      repeat: { collection: "posts" },
      when: { all: [{ field: "fields.visible", operator: "is set" as const }] },
      props: [
        {
          kind: "string" as const,
          name: "data-edit-gate",
          value: "edit.section",
        },
      ],
    };
    const out = extractComponent(selection, "Card", { "fields.title": "text" });
    expect(out.body.style).toEqual(selection.style);
    expect(out.body.repeat).toBeUndefined();
    expect(out.body.when).toBeUndefined();
    expect(out.body.props).toEqual([]);
    expect(out.instance.style).toBeUndefined();
    expect(out.instance.repeat).toEqual(selection.repeat);
    expect(out.instance.when).toEqual(selection.when);
    expect(out.instance.props).toContainEqual(selection.props[0]);
    expect(out.body.component?.props).toHaveLength(1);
    const name = out.body.component!.props[0].name;
    expect(out.body.children[0]).toEqual({
      kind: "text",
      value: "Placeholder",
      prop: name,
    });
    expect(out.instance.props).toContainEqual({
      kind: "field",
      name,
      value: "fields.title",
    });
    expect(out.body.children[1]).toMatchObject({
      children: [{ children: [{ field: "fields.item" }] }],
    });
  });
  it("refuses an interior caller Record condition with guidance rather than silently changing scope", () => {
    const root = block("section", [
      {
        ...block("p"),
        when: { all: [{ field: "fields.visible", operator: "is set" }] },
      },
    ]);
    expect(() => extractComponent(root, "Card", {})).toThrow(/selected root/);
  });
  it("refuses numeric text lifting before creation rather than emitting an interface the native text guard rejects", () => {
    const root = block("p", [
      { kind: "text", value: "0", field: "fields.count" },
    ]);
    expect(() =>
      extractComponent(root, "Card", { "fields.count": "number" })
    ).toThrow(/string prop/);
    expect(root.children[0]).toHaveProperty("field", "fields.count");
  });
  it("makes a literal prop without changing its displayed default and rejects duplicate names", () => {
    const root = {
      ...block("section", [{ kind: "text", value: "Hello" }]),
      component: { name: "Card", props: [] },
    };
    const out = makeComponentProp(root, "0.0", null, {
      name: "title",
      type: "text",
      required: false,
      default: null,
      choices: [],
    });
    expect(out.component?.props[0].default).toBe("Hello");
    expect(out.children[0]).toEqual({
      kind: "text",
      value: "Hello",
      prop: "title",
    });
    expect(root.children[0]).not.toHaveProperty("prop");
    expect(() =>
      makeComponentProp(out, "0.0", null, {
        name: "title",
        type: "text",
        required: false,
        default: null,
        choices: [],
      })
    ).toThrow();
  });
});

it.each(["root", "child", "attribute"])(
  "refuses moving a caller field into an internal %s Repeat on Detach",
  (where) => {
    const text = { kind: "text" as const, value: "", prop: "title" };
    const repeated = { ...block("p", [text]), repeat: { collection: "posts" } };
    const body =
      where === "root"
        ? { ...block("section", [text]), repeat: { collection: "posts" } }
        : where === "attribute"
        ? block("section", [
            {
              ...block("img"),
              repeat: { collection: "posts" },
              props: [{ name: "alt", kind: "prop" as const, value: "title" }],
            },
          ])
        : block("section", [repeated]);
    const entry = { ...card, body: [body] };
    const instance = {
      ...block("Card"),
      props: [{ name: "title", kind: "field" as const, value: "fields.title" }],
    };
    const before = JSON.stringify({ entry, instance });
    expect(() => detachComponent(instance, entry)).toThrow(/Repeat/);
    expect(JSON.stringify({ entry, instance })).toBe(before);
  }
);
it.each(["children", "media"])(
  "refuses moving filled caller %s Slot content into a component Repeat",
  (name) => {
    const slot = {
      ...block("Slot"),
      props:
        name === "children"
          ? []
          : [{ name: "name", kind: "string" as const, value: name }],
    };
    const entry = {
      ...card,
      body: [
        block("section", [
          { ...block("div", [slot]), repeat: { collection: "posts" } },
        ]),
      ],
    };
    const content = [
      block("p", [
        { kind: "text" as const, value: "Fallback", field: "fields.title" },
      ]),
    ];
    const instance = {
      ...block("Card", name === "children" ? content : []),
      ...(name === "children" ? {} : { slots: { media: content } }),
    };
    expect(() => detachComponent(instance, entry)).toThrow(/Repeat/);
  }
);
it("refuses collapsing simultaneous instance and component root Repeats", () => {
  const entry = {
    ...card,
    body: [{ ...block("section"), repeat: { collection: "posts" } }],
  };
  expect(() =>
    detachComponent(
      { ...block("Card"), repeat: { collection: "pages" } },
      entry
    )
  ).toThrow(/Repeat/);
});

it("keeps literal substitutions inside Repeats and caller fields in a Repeat empty branch valid", () => {
  const entry = {
    ...card,
    body: [
      {
        ...block("section", [
          { kind: "text" as const, value: "", prop: "title" },
        ]),
        repeat: {
          collection: "posts",
          empty: [
            block("p", [{ kind: "text" as const, value: "", prop: "title" }]),
          ],
        },
      },
    ],
  };
  const literal = detachComponent(
    {
      ...block("Card"),
      props: [{ name: "title", kind: "string", value: "Same for each post" }],
    },
    entry
  );
  expect(literal.children[0]).toEqual({
    kind: "text",
    value: "Same for each post",
  });
  const emptyOnly = {
    ...card,
    body: [
      {
        ...block("section"),
        repeat: {
          collection: "posts",
          empty: [
            block("p", [{ kind: "text" as const, value: "", prop: "title" }]),
          ],
        },
      },
    ],
  };
  const bound = detachComponent(
    {
      ...block("Card"),
      props: [{ name: "title", kind: "field", value: "fields.title" }],
    },
    emptyOnly
  );
  expect(bound.repeat?.empty?.[0]).toMatchObject({
    children: [{ kind: "text", value: "", field: "fields.title" }],
  });
});
