import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";
import {ReleasePanel, type ReleaseRecord, type ReleaseRecording} from "./releases";
import {VersionRecordingReferences} from "./recording";

afterEach(cleanup);
const failed: ReleaseRecording = {releaseId:"release-one",status:"failed",sha:null,noChange:false,canRetry:true,
  message:"Publication succeeded. Local recording failed; check hooks before retrying."};
it("keeps publication successful and directs recovery to Files", () => {
  const release: ReleaseRecord = {id:"release-one",title:"Brand",realm:"site",status:"published",
    reviewedBy:null,members:[],workflow:null,canSchedule:false,reviewRequired:false,
    recording:failed,filesHref:"/files/member-one"};
  render(<ReleasePanel release={release} entries={[]} onCommand={vi.fn()} />);
  expect(screen.getByText("Status: published")).toBeTruthy();
  expect(screen.getByText(failed.message!)).toBeTruthy();
  expect(screen.getByRole("link",{name:"Open Files recording"}).getAttribute("href")).toBe("/files/member-one");
  expect(screen.queryByRole("button",{name:"Commit now"})).toBeNull();
});
it("retains multiple Release references for one version and states the no-change exception", () => {
  render(<VersionRecordingReferences recordings={[failed,
    {...failed,releaseId:"release-two",status:"recorded",sha:"123456789abcdef",noChange:true,canRetry:false}]} />);
  expect(screen.getByText(/Not committed.*release-one/)).toBeTruthy();
  expect(screen.getByText(/Git 1234567.*No new commit.*release-two/)).toBeTruthy();
});
