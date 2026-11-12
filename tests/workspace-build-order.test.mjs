import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { workspaces as workspaceList } from "../scripts/workspaces.mjs";
const root = resolve(import.meta.dirname, "..");
const read = (path) => JSON.parse(readFileSync(resolve(root, path)));
// The root `build` (scripts/workspaces.mjs run build) builds in pnpm-workspace.yaml's order, so a package whose build
// reads a sibling's dist (its types, its entries) must come after that sibling. EP-25a: beam-mdx imports beam-ux/jsondoc.
const workspaces = workspaceList();
const manifests = Object.fromEntries(workspaces.map((dir) => [dir, read(`${dir}/package.json`)]));
const dirOf = Object.fromEntries(workspaces.map((dir) => [manifests[dir].name, dir]));
const specsOf = (pkg) => ["dependencies", "devDependencies", "peerDependencies"].flatMap((field) => Object.entries(pkg[field] ?? {}));
const siblingsOf = (dir) => {
  return [...new Set(specsOf(manifests[dir]).flatMap(([name, spec]) => {
    const linked = /^file:\.\.\/([^/]+)$/.exec(spec)?.[1];
    return [dirOf[name], linked].filter((sibling) => sibling && sibling !== dir && workspaces.includes(sibling));
  }))];
};
test("every workspace builds after the sibling workspaces it depends on", () => {
  for (const [index, dir] of workspaces.entries()) {
    for (const sibling of siblingsOf(dir)) {
      assert.ok(workspaces.indexOf(sibling) < index, `${dir} depends on ${sibling}, so ${sibling} must come first in pnpm-workspace.yaml`);
    }
  }
});
test("the lockfile's importers are the workspace's packages", () => {
  const lock = readFileSync(resolve(root, "pnpm-lock.yaml"), "utf8").split("\n");
  const start = lock.indexOf("importers:");
  assert.ok(start >= 0, "pnpm-lock.yaml has no importers section");
  const importers = [];
  for (const line of lock.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const match = /^  ([^\s:]+):$/.exec(line);
    if (match) importers.push(match[1]);
  }
  assert.deepEqual(importers.filter((name) => name !== ".").sort(), [...workspaces].sort());
});
test("every first-party dependency resolves to its checkout, as the npm workspace linked it", () => {
  const overrides = read("package.json").pnpm?.overrides ?? {};
  const names = new Set(workspaces.flatMap((dir) => specsOf(manifests[dir]).map(([name]) => name)).filter((name) => /^@(splicewire|schemastud)\//.test(name)));
  for (const name of names) {
    assert.match(overrides[name] ?? "", /^link:/, `${name} has no link: override in the root package.json`);
  }
  for (const dir of workspaces) assert.equal(overrides[manifests[dir].name], `link:${dir}`);
});
