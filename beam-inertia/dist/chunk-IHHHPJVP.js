// src/hooks/use-brand.ts
import { usePage } from "@inertiajs/react";
function useBrand() {
  const { brand, name } = usePage().props;
  return brand ?? { name: name ?? "", logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: "" };
}
function brandTitle(title, brand) {
  if (!title) return brand.name;
  if (brand.titleTemplate) return brand.titleTemplate.replace(":title", title).replace(":name", brand.name);
  return brand.name ? `${title} - ${brand.name}` : title;
}

export {
  useBrand,
  brandTitle
};
//# sourceMappingURL=chunk-IHHHPJVP.js.map