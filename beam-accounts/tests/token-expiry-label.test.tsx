import { expect, it } from "vitest";
import { tokenScopeSchema } from "../src/tokens-roster";

// TOWER-05 shots-r5 (integrator, 2026-10-09): the new-token dialog's Expires select showed the raw value "0"
// instead of "Never expires". The schema labelled its options with a schema-level `enumNames`, which the
// SchemaForm renderer never reads: RJSF 6's optionsList() takes an `enum` option's label only from uiSchema
// `ui:enumNames`, else String(value) (@rjsf/utils 6.6.2 lib/optionsList.js). Labels must travel IN the schema
// as `oneOf` const/title pairs, which optionsList() labels by `title`.
//
// The real SchemaForm cannot render in this package's tests (its RJSF stack resolves a second React from the
// schemastud workspace; every roster test mocks it), so the contract is pinned on the schema it is given.
type Choice = { const: number; title: string };
const expires = (tokenScopeSchema.properties as Record<string, Record<string, unknown>>).expiresInDays;

it("labels every Expires choice through oneOf const/title, so 0 reads 'Never expires'", () => {
  const choices = expires.oneOf as Choice[] | undefined;
  expect(choices).toBeDefined();
  expect(choices?.find((c) => c.const === 0)?.title).toBe("Never expires");
  expect(choices?.map((c) => c.const)).toEqual([0, 7, 30, 60, 90]);
  expect(expires.default).toBe(0);
});

it("does not rely on enum/enumNames, which the renderer would show as raw values", () => {
  expect(expires).not.toHaveProperty("enum");
  expect(expires).not.toHaveProperty("enumNames");
});
