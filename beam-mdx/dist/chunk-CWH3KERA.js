// src/frontmatter-keys.ts
function camelKeys(frontmatter) {
  const out = { ...frontmatter };
  for (const [key, value] of Object.entries(frontmatter)) {
    const camel = key.replace(/_([a-z0-9])/g, (_, next) => next.toUpperCase());
    if (camel !== key && !Object.prototype.hasOwnProperty.call(frontmatter, camel)) {
      Object.defineProperty(out, camel, { value, enumerable: true, writable: true, configurable: true });
    }
  }
  return out;
}

export {
  camelKeys
};
//# sourceMappingURL=chunk-CWH3KERA.js.map