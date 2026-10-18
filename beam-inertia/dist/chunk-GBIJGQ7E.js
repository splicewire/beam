// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function toUrl(url) {
  return typeof url === "string" ? url : url.url;
}

export {
  cn,
  toUrl
};
//# sourceMappingURL=chunk-GBIJGQ7E.js.map