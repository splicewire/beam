import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
const root = resolve(import.meta.dirname, "..");
test("the UX editor is public without the retired lens aliases", () => {
  const pkg = JSON.parse(readFileSync(resolve(root, "beam-ux/package.json")));
  for (const key of ["./editor", "./tsx-lens", "./jsondoc"])
    assert.ok(pkg.exports[key], key);
  for (const key of ["./blockdoc", "./blockdoc/json"])
    assert.equal(pkg.exports[key], undefined, key);
});
test("the kit has no Inertia or Beam Inertia runtime dependency", () => {
  const dir = resolve(root, "beam-ux/src/editor");
  for (const file of readdirSync(dir)) {
    if (!/\.(ts|tsx)$/.test(file) || file.includes(".test.")) continue;
    const source = readFileSync(resolve(dir, file), "utf8");
    assert.doesNotMatch(
      source,
      /from ['"](?:@inertiajs\/|@splicewire\/beam-inertia)/,
      file
    );
  }
});
