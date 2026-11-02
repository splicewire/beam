// src/blockdoc/bindings.ts
function assertFieldPath(value) {
  if (typeof value !== "string" || !/^[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z_][A-Za-z0-9_-]*)*$/.test(value) || value.split(".").some((part) => ["__proto__", "prototype", "constructor"].includes(part))) {
    throw new Error("A binding field path must name declared data properties");
  }
}
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("A binding requires a literal object");
}
function assertRepeat(value) {
  object(value);
  if (Object.keys(value).some((key) => !["collection", "relation", "query", "empty"].includes(key))) throw new Error("Unknown Repeat field");
  if (value.collection == null === (value.relation == null)) throw new Error("Repeat requires exactly one Collection or relation");
  if (value.collection != null && (typeof value.collection !== "string" || !/^[a-z][a-z0-9-]*$/.test(value.collection))) throw new Error("Invalid Collection name");
  if (value.relation != null) assertFieldPath(value.relation);
  if (value.query != null) {
    object(value.query);
    const query = value.query;
    if (Object.keys(query).some((key) => !["filter", "sort", "limit", "filterVariant"].includes(key))) throw new Error("Unknown Repeat query field");
    if (query.limit != null && (!Number.isInteger(query.limit) || Number(query.limit) < 1 || Number(query.limit) > 100)) throw new Error("Repeat limit must be 1\u2013100");
    if (query.sort != null && typeof query.sort !== "string") throw new Error("Repeat sort must be a string");
    if (query.filterVariant != null && typeof query.filterVariant !== "string") throw new Error("Repeat filterVariant must be a string");
    if (query.filter != null) object(query.filter);
  }
  if (value.empty != null && !Array.isArray(value.empty)) throw new Error("Repeat empty state must be a document");
}
function assertCondition(value) {
  object(value);
  if (Object.keys(value).some((key) => !["all", "any"].includes(key)) || value.all == null === (value.any == null)) throw new Error("Condition requires all or any");
  const rules = value.all ?? value.any;
  if (!Array.isArray(rules) || rules.length === 0) throw new Error("Condition requires a non-empty rule list");
  for (const rule of rules) {
    object(rule);
    assertFieldPath(rule.field);
    if (Object.keys(rule).some((key) => !["field", "operator", "value"].includes(key)) || !["is set", "is empty", "equals", "does not equal", "greater than", "less than", "contains"].includes(String(rule.operator))) throw new Error("Unknown Data Condition operator or field");
    if (rule.value != null && !["string", "number", "boolean"].includes(typeof rule.value)) throw new Error("Condition value must be a literal scalar");
  }
}

export {
  assertFieldPath,
  assertRepeat,
  assertCondition
};
//# sourceMappingURL=chunk-EMFVKUTK.js.map