// src/blockdoc/patch-text.ts
function patchText(text, value) {
  const node = text.node;
  if (node.type === "JSXText") {
    node.value = value;
    node.extra = void 0;
  } else if (node.type === "StringLiteral") {
    node.value = value;
    node.extra = void 0;
  } else if (node.type === "TemplateLiteral") {
    node.expressions = [];
    node.quasis = [
      { type: "TemplateElement", value: { raw: value, cooked: value }, tail: true }
    ];
  }
  text.value = value;
}

export {
  patchText
};
//# sourceMappingURL=chunk-7RDOFS6I.js.map