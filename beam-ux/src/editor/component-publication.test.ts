import { it, expect } from "vitest";
import {
  canMountPublication,
  isAuthoredComponentEnvelope,
} from "./publication-state";
import type { EntryPublicationState } from "../types";
const state: EntryPublicationState = {
  id: "component",
  headVersion: "draft",
  headReadable: "v1",
  publishedVersion: null,
  publishedReadable: null,
  draftPending: true,
  compileError: null,
  versions: [
    {
      id: "draft",
      version: 1,
      readable: "v1",
      label: null,
      createdBy: null,
      createdAt: null,
      isHead: true,
      isPublished: false,
    },
  ],
};
it("admits the real unpublished Authored Working Head without relaxing a page or source entry pin check", () => {
  const envelope = {
    type: "component",
    body: [
      {
        kind: "block",
        name: "section",
        component: { name: "Card", props: [] },
      },
    ],
  };
  expect(isAuthoredComponentEnvelope(envelope)).toBe(true);
  expect(
    canMountPublication(state, isAuthoredComponentEnvelope(envelope))
  ).toBe(true);
  expect(canMountPublication(state)).toBe(false);
  expect(isAuthoredComponentEnvelope({ ...envelope, type: "page" })).toBe(
    false
  );
  expect(
    isAuthoredComponentEnvelope({
      ...envelope,
      body: { source: "export default()=>null" },
    })
  ).toBe(false);
  expect(canMountPublication({ ...state, versions: [] }, true)).toBe(false);
});
