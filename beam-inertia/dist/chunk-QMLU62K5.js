// src/frame/xsrf.ts
function xsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
function jsonHeaders() {
  const token = xsrfToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...token ? { "X-XSRF-TOKEN": token } : {}
  };
}

export {
  jsonHeaders
};
//# sourceMappingURL=chunk-QMLU62K5.js.map