import {
  englishBeamUxMessages
} from "./chunk-B33ESE55.js";

// src/message-descriptor.ts
var notice = (key, parameters) => ({ key, parameters });
var say = (m, value) => typeof value === "string" ? value : Array.isArray(value) ? value.map((part) => say(m, part)).join("") : m.t(value.key, value.parameters);
var NoticeError = class extends Error {
  constructor(notice2) {
    super(say(englishBeamUxMessages, notice2));
    this.notice = notice2;
  }
  notice;
};
var noticeOf = (failure, fallback) => failure instanceof NoticeError ? failure.notice : failure instanceof Error ? failure.message : fallback;

export {
  notice,
  say,
  NoticeError,
  noticeOf
};
//# sourceMappingURL=chunk-YARN53FB.js.map