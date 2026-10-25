import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
const root = resolve(import.meta.dirname, "..");
const read = (path) => JSON.parse(readFileSync(resolve(root, path)));
// `npm run build --workspaces` builds in the workspaces array's order, so a package whose build reads a sibling's
// dist (its types, its entries) must come after that sibling. EP-25a: beam-mdx imports beam-ux/jsondoc.
const workspaces = read("package.json").workspaces;
const manifests = Object.fromEntries(workspaces.map((dir) => [dir, read(`${dir}/package.json`)]));
const dirOf = Object.fromEntries(workspaces.map((dir) => [manifests[dir].name, dir]));
const siblingsOf = (dir) => {
  const pkg = manifests[dir];
  const specs = ["dependencies", "devDependencies", "peerDependencies"].flatMap((field) => Object.entries(pkg[field] ?? {}));
  return [...new Set(specs.flatMap(([name, spec]) => {
    const linked = /^file:\.\.\/([^/]+)$/.exec(spec)?.[1];
    return [dirOf[name], linked].filter((sibling) => sibling && sibling !== dir && workspaces.includes(sibling));
  }))];
};
test("every workspace builds after the sibling workspaces it depends on", () => {
  for (const [index, dir] of workspaces.entries()) {
    for (const sibling of siblingsOf(dir)) {
      assert.ok(workspaces.indexOf(sibling) < index, `${dir} depends on ${sibling}, so ${sibling} must come first in the root workspaces`);
    }
  }
});
test("the lockfile's workspaces are the root manifest's, in the same order", () => {
  assert.deepEqual(read("package-lock.json").packages[""].workspaces, workspaces);
});
