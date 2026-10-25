import { afterEach, expect, it, vi } from "vitest";
import type { UxBuilderClient } from "@splicewire/beam-ux";
import { configureBeamInertia } from "../config";
import { bodyClient } from "./transport";

const envelope = {
  id: "e1",
  slug: "home",
  type: "page",
  format: "tsx",
  schema: null,
  body: {},
  source: null,
  compileError: null,
  authoredComponents: [],
};
const client: UxBuilderClient = {
  loadBody: async () => envelope,
  saveBody: async () => envelope,
};
afterEach(() => {
  configureBeamInertia({});
  vi.unstubAllGlobals();
});

it("loads and saves the default body through canonical ID routes with stateful request envelopes", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: envelope }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=csrf%20token" });
  configureBeamInertia({});

  expect(await bodyClient.loadBody("entry-uuid")).toEqual(envelope);
  expect(fetch).toHaveBeenNthCalledWith(1, "/beam-ux-entries/entry-uuid/body", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  fetch.mockResolvedValueOnce(Response.json({ data: envelope }));
  const body = { content: "Retain this draft" };
  expect(await bodyClient.saveBody("entry-uuid", body)).toEqual(envelope);
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "/beam-ux-entries/entry-uuid/save-body",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": "csrf token",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ body }),
    },
  );
});

it("preserves publication absence on an injected body-only client without using default HTTP", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  configureBeamInertia({ entryClient: client });

  expect(await bodyClient.loadBody("e1")).toBe(envelope);
  expect(bodyClient.saveDraft).toBeUndefined();
  expect(bodyClient.publish).toBeUndefined();
  expect(bodyClient.listVersions).toBeUndefined();
  expect(bodyClient.previewVersion).toBeUndefined();
  expect(bodyClient.restoreVersion).toBeUndefined();
  expect(bodyClient.createRelease).toBeUndefined();
  expect(bodyClient.releaseCommand).toBeUndefined();
  expect(bodyClient.listReleases).toBeUndefined();
  expect(bodyClient.componentCapabilities).toBeUndefined();
  expect(bodyClient.createComponent).toBeUndefined();
  expect(bodyClient.duplicateComponent).toBeUndefined();
  expect(fetch).not.toHaveBeenCalled();
});

it("uses addressed GET admission and CSRF-protected native component writes", async () => {
  const fetch = vi.fn().mockImplementation(async()=>Response.json({data:{id:"component"}}));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", {cookie:"XSRF-TOKEN=component%20token"});
  configureBeamInertia({});
  await bodyClient.componentCapabilities!("component");
  expect(fetch).toHaveBeenNthCalledWith(1,"/beam-ux-entries/component/component-capabilities",{credentials:"same-origin",headers:{Accept:"application/json"}});
  const input:Parameters<NonNullable<UxBuilderClient["createComponent"]>>[1]={title:"Card",body:[{kind:"block",name:"section",isComponent:false,dynamic:false,props:[],children:[],component:{name:"Card",props:[]}}]};
  await bodyClient.createComponent!("page",input);
  expect(fetch).toHaveBeenNthCalledWith(2,"/beam-ux-entries/page/create-component",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Accept:"application/json","X-XSRF-TOKEN":"component token"},body:JSON.stringify(input)});
  await bodyClient.duplicateComponent!("component");
  expect(fetch).toHaveBeenNthCalledWith(3,"/beam-ux-entries/component/duplicate-component",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Accept:"application/json","X-XSRF-TOKEN":"component token"},body:"{}"});
});

it("assembles and schedules Releases using the mounted package operations", async () => {
  const release = { id: "r1", status: "approved", title: "Launch" };
  const fetch = vi
    .fn()
    .mockImplementation(async () => Response.json({ data: release }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=token" });
  await bodyClient.createRelease!("e1", "Launch");
  expect(fetch.mock.calls[0][0]).toBe("/beam-ux-entries/e1/create-release");
  const command = {
    action: "schedule" as const,
    dueAt: "2030-01-01T12:00:00Z",
    timezone: "UTC",
  };
  expect(await bodyClient.releaseCommand!("r1", command)).toEqual(release);
  expect(fetch.mock.calls[1][0]).toBe("/beam-ux-releases/r1/command");
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(command);
  expect(fetch.mock.calls[1][1].headers["X-XSRF-TOKEN"]).toBe("token");
  fetch.mockResolvedValueOnce(
    Response.json({ data: [release, { id: "old", status: "published" }] }),
  );
  expect(await bodyClient.listReleases!()).toEqual([
    release,
    { id: "old", status: "published" },
  ]);
});

it("retains a supplied method receiver and switches back to starter defaults only without a custom client", async () => {
  const state = {
    id: "e1",
    draftPending: false,
    publishedVersion: null,
    publishedReadable: null,
    headVersion: null,
    headReadable: null,
    versions: [],
    compileError: null,
    authoredComponents: [],
  };
  const supplied: UxBuilderClient = {
    ...client,
    async publish(id) {
      await this.loadBody(id);
      return state;
    },
  };
  const load = vi.spyOn(supplied, "loadBody");
  configureBeamInertia({ entryClient: supplied });
  expect(await bodyClient.publish?.("e1", "v1")).toBe(state);
  expect(load).toHaveBeenCalledWith("e1");
  expect(bodyClient.saveDraft).toBeUndefined();

  configureBeamInertia({});
  expect(bodyClient.publish).toBeTypeOf("function");
  expect(bodyClient.saveDraft).toBeTypeOf("function");
  expect(bodyClient.listVersions).toBeTypeOf("function");
  expect(bodyClient.previewVersion).toBeTypeOf("function");
  expect(bodyClient.restoreVersion).toBeTypeOf("function");
});

it("requests an author preview URL for one saved version through the stateful preview operation", async () => {
  const fetch = vi.fn().mockResolvedValue(
    Response.json({ data: { url: "https://example.test/signed-preview" } }),
  );
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=csrf%20token" });
  configureBeamInertia({});

  await expect(bodyClient.previewVersion?.("entry-uuid", "version-uuid")).resolves.toEqual({
    url: "https://example.test/signed-preview",
  });
  expect(fetch).toHaveBeenCalledWith(
    "/beam-ux-entries/entry-uuid/preview",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": "csrf token",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ versionId: "version-uuid" }),
    },
  );
});

it("clears through the canonical clear-body route, and an injected client without it offers none", async () => {
  const state = {
    id: "e1",
    draftPending: false,
    publishedVersion: null,
    publishedReadable: null,
    headVersion: null,
    headReadable: null,
    versions: [],
    compileError: null,
    authoredComponents: [],
  };
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: state }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=csrf%20token" });
  configureBeamInertia({});

  expect(await bodyClient.clearBody?.("entry-uuid")).toEqual(state);
  expect(fetch).toHaveBeenCalledWith("/beam-ux-entries/entry-uuid/clear-body", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": "csrf token",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({}),
  });

  configureBeamInertia({ entryClient: client });
  expect(bodyClient.clearBody).toBeUndefined();
});

it("sends the draft base and named publish ref, and preserves a stale-base status", async () => {
  const fetch = vi
    .fn()
    .mockImplementation(async () =>
      Response.json({ data: { headVersion: "v2" } }),
    );
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "" });
  configureBeamInertia({});
  await bodyClient.saveDraft?.("e1", { content: "ours" }, "v1");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    body: { content: "ours" },
    baseVersion: "v1",
  });
  await bodyClient.publish?.("e1", "v2");
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ ref: "v2" });
  fetch.mockResolvedValueOnce(
    Response.json({ message: "Stale base" }, { status: 409 }),
  );
  await expect(bodyClient.saveDraft?.("e1", {}, "v1")).rejects.toMatchObject({
    status: 409,
  });
});

it("sends page settings with the body in the same versioned draft request", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ data: { headVersion: "v2" } }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "" });
  const settings = { title: "Draft title", segment: "draft-url" };
  await bodyClient.saveDraft!(
    "e1",
    { content: "Body" },
    "v1",
    undefined,
    settings,
  );
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    body: { content: "Body" },
    baseVersion: "v1",
    pageSettings: settings,
  });
});

it("prints and reads source without invoking any save operation", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: { source: "<p>Hello</p>" } }))
    .mockResolvedValueOnce(Response.json({ data: { body: [] } }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "" });
  configureBeamInertia({});
  expect(await bodyClient.printSource!("e", [])).toEqual({
    source: "<p>Hello</p>",
  });
  expect(await bodyClient.readSource!("e", "<p>Hello</p>", [])).toEqual({
    body: [],
  });
  expect(fetch.mock.calls.map((call) => call[0])).toEqual([
    "/beam-ux-entries/e/print-source",
    "/beam-ux-entries/e/read-source",
  ]);
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
    source: "<p>Hello</p>",
    body: [],
  });
  configureBeamInertia({ entryClient: client });
  expect(bodyClient.printSource).toBeUndefined();
  expect(bodyClient.readSource).toBeUndefined();
});

it("uses the declared Release routes with cookie CSRF and retains absence on custom transports", async () => {
  const release = {
    id: "r1",
    title: "Theme",
    realm: "site",
    status: "in_review",
    reviewedBy: null,
    members: [],
    workflow: null,
    canSchedule: false,
    reviewRequired: true,
  };
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: release }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=release%20csrf" });
  expect(await bodyClient.releaseCommand!("r1", { action: "approve" })).toEqual(
    release,
  );
  expect(fetch).toHaveBeenCalledWith(
    "/beam-ux-releases/r1/command",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      headers: expect.objectContaining({ "X-XSRF-TOKEN": "release csrf" }),
      body: JSON.stringify({ action: "approve" }),
    }),
  );
  fetch.mockResolvedValueOnce(Response.json({ data: [release] }));
  expect(await bodyClient.listReleases!()).toEqual([release]);
  configureBeamInertia({ entryClient: client });
  expect(bodyClient.releaseCommand).toBeUndefined();
  expect(bodyClient.listReleases).toBeUndefined();
});

it("records only the explicitly selected Release through the addressed Files operation and retains refusal", async () => {
  const recording = {
    releaseId: "r1",
    status: "recorded",
    sha: "abc",
    noChange: false,
    canRetry: false,
    message: "Recorded locally.",
  };
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: recording }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=recording%20csrf" });
  expect(await bodyClient.recordReleaseFile!("member/id", "r1")).toEqual(
    recording,
  );
  expect(fetch).toHaveBeenCalledWith(
    "/beam-ux-release-files/member%2Fid/commit-now",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      headers: expect.objectContaining({ "X-XSRF-TOKEN": "recording csrf" }),
      body: JSON.stringify({ releaseId: "r1" }),
    }),
  );
  fetch.mockResolvedValueOnce(
    Response.json(
      {
        message: "The branch moved",
        errors: { releaseId: ["The branch moved"] },
      },
      { status: 422 },
    ),
  );
  await expect(
    bodyClient.recordReleaseFile!("member", "r1"),
  ).rejects.toMatchObject({ status: 422 });
  configureBeamInertia({ entryClient: client });
  expect(bodyClient.recordReleaseFile).toBeUndefined();
});

it("uses captured file preconditions, declared routes and CSRF without silent retries", async () => {
  const fetch = vi
    .fn()
    .mockImplementation(async () =>
      Response.json({ data: { status: "drafted" } }),
    );
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=file%20csrf" });
  const input = {
    expectedHeadVersion: "head",
    expectedPublishedVersion: "pin",
    expectedFileExists: false,
    expectedFileSha256: null,
    fingerprint: "placement",
    confirmed: true,
  };
  await bodyClient.inspectReleaseFile!("member/id");
  await bodyClient.takeReleaseFile!("member/id", input);
  await bodyClient.restoreMissingReleaseFile!("member/id", input);
  expect(fetch).toHaveBeenNthCalledWith(
    1,
    "/beam-ux-release-files/member%2Fid/inspect-file",
    { credentials: "same-origin", headers: { Accept: "application/json" } },
  );
  for (const [position, op] of [
    [2, "take-file-draft"],
    [3, "restore-missing-file"],
  ] as const) {
    expect(fetch).toHaveBeenNthCalledWith(
      position,
      `/beam-ux-release-files/member%2Fid/${op}`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": "file csrf",
        },
        body: JSON.stringify(input),
      },
    );
  }
  fetch.mockResolvedValueOnce(
    Response.json({ message: "Published pin moved" }, { status: 409 }),
  );
  await expect(bodyClient.takeReleaseFile!("member/id", input)).rejects.toThrow(
    "Published pin moved",
  );
  expect(fetch).toHaveBeenCalledTimes(4);
  configureBeamInertia({ entryClient: client });
  expect(bodyClient.inspectReleaseFile).toBeUndefined();
  expect(bodyClient.takeReleaseFile).toBeUndefined();
  expect(bodyClient.restoreMissingReleaseFile).toBeUndefined();
});

it("remirrors one file and takes all release files through the declared routes", async () => {
  const remirrorResult = {
    status: "remirrored",
    message: "Published file restored.",
    entryId: "entry-1",
    headVersion: "head-2",
    publishedVersion: "release-1",
  };
  const batchResult = { count: 1, entries: [remirrorResult] };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ data: remirrorResult }))
    .mockResolvedValueOnce(Response.json({ data: batchResult }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=files%20csrf" });
  configureBeamInertia({});

  const input = {
    expectedHeadVersion: "head-2",
    expectedPublishedVersion: "release-1",
    expectedFileExists: true,
    expectedFileSha256: "abc123",
    fingerprint: "entry-1:path/to/file",
    confirmed: true,
  };
  const batchInput = {
    items: [
      {
        memberId: "member/id",
        expectedHeadVersion: "head-2",
        expectedPublishedVersion: "release-1",
        expectedFileExists: true,
        expectedFileSha256: "abc123",
        fingerprint: "entry-1:path/to/file",
      },
    ],
    confirmed: true,
  };

  expect(
    await bodyClient.remirrorReleaseFile!("member/id", input),
  ).toEqual(remirrorResult);
  expect(
    await bodyClient.takeAllReleaseFiles!("member/id", batchInput),
  ).toEqual(batchResult);
  for (const [position, op, payload] of [
    [1, "remirror-file", input],
    [2, "take-all-drafts", batchInput],
  ] as const) {
    expect(fetch).toHaveBeenNthCalledWith(
      position,
      `/beam-ux-release-files/member%2Fid/${op}`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": "files csrf",
        },
        body: JSON.stringify(payload),
      },
    );
  }

  configureBeamInertia({ entryClient: client });
  expect(bodyClient.remirrorReleaseFile).toBeUndefined();
  expect(bodyClient.takeAllReleaseFiles).toBeUndefined();
});

it('uses entry-addressed image routes with FormData and session CSRF, preserving a missing injected seam', async () => {
  const image={id:'m1',name:'photo.png',url:'/storage/m1/photo.png'};
  const fetch=vi.fn().mockResolvedValue(Response.json({data:{items:[image]}}));
  vi.stubGlobal('fetch',fetch);vi.stubGlobal('document',{cookie:'XSRF-TOKEN=csrf%20token'});
  configureBeamInertia({});
  expect(await bodyClient.listImages?.('entry-uuid')).toEqual({items:[image]});
  expect(fetch.mock.calls[0][0]).toBe('/beam-ux-entries/entry-uuid/media');
  fetch.mockResolvedValueOnce(Response.json({data:image}));
  const file=new File(['png'],'photo.png',{type:'image/png'});
  expect(await bodyClient.uploadImage?.('entry-uuid',file)).toEqual(image);
  const [url,options]=fetch.mock.calls[1];
  expect(url).toBe('/beam-ux-entries/entry-uuid/upload-image');
  expect(options.method).toBe('POST');expect(options.credentials).toBe('same-origin');
  expect(options.headers).toEqual({Accept:'application/json','X-XSRF-TOKEN':'csrf token'});
  expect(options.body.get('file')).toBe(file);
  configureBeamInertia({entryClient:client});
  expect(bodyClient.listImages).toBeUndefined();expect(bodyClient.uploadImage).toBeUndefined();
});

it('reads live canvas bindings via one addressed stateful POST, with no refusal fallback',async()=>{
 const payload={bindings:{},record:null,choices:[],hasMore:false,recordPage:false,selectedValue:null};
 const fetch=vi.fn().mockResolvedValue(Response.json({data:payload}));vi.stubGlobal('fetch',fetch);
 vi.stubGlobal('document',{cookie:'XSRF-TOKEN=author%20csrf'});
 expect(await bodyClient.canvasBindings?.('entry-id',[],null)).toEqual(payload);
 expect(fetch).toHaveBeenCalledWith('/beam-ux-entries/entry-id/canvas-bindings',{
  method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-XSRF-TOKEN':'author csrf'},body:JSON.stringify({body:[],recordValue:null}),
 });
 fetch.mockResolvedValueOnce(Response.json({data:payload}));
 const controller=new AbortController();
 await bodyClient.canvasBindings?.('entry-id',[],null,{signal:controller.signal});
 expect(fetch.mock.calls[1]?.[1].signal).toBe(controller.signal);
 fetch.mockResolvedValueOnce(Response.json({message:'denied'},{status:403}));
 await expect(bodyClient.canvasBindings?.('entry-id',[])).rejects.toMatchObject({status:403});expect(fetch).toHaveBeenCalledTimes(3);
 configureBeamInertia({entryClient:client});expect(bodyClient.canvasBindings).toBeUndefined();
});
