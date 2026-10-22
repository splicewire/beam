import type {Meta, StoryObj} from "@storybook/react-vite";
import {expect, within} from "storybook/test";
import {ReleaseRecordingSummary, VersionRecordingReferences} from "./recording";
import type {ReleaseRecording} from "./releases";

export default {title:"BeamUx/Recording", parameters:{layout:"padded"}} satisfies Meta;
type Story = StoryObj;
const recorded: ReleaseRecording = {releaseId:"release-brand",status:"recorded",
  sha:"21e12247c44c5e866b3f2399ee59929364de77c4",noChange:false,canRetry:false,message:"Recorded locally."};
export const Recorded: Story = {
  render: () => <ReleaseRecordingSummary recording={recorded} filesHref="/release-files/member-brand" />,
  play: async ({canvasElement}) => {
    const canvas=within(canvasElement);
    await expect(canvas.getByText("Git 21e1224")).toBeVisible();
    await expect(canvas.getByRole("link",{name:"Open Files recording"})).toBeVisible();
  },
};
export const Failed: Story = {
  render: () => <ReleaseRecordingSummary recording={{...recorded,status:"failed",sha:null,canRetry:true,
    message:"Publication succeeded. Local recording failed; check hooks before retrying."}} filesHref="/release-files/member-brand" />,
};
export const NoChange: Story = {
  render: () => <ReleaseRecordingSummary recording={{...recorded,noChange:true,
    message:"Files already matched the parent commit; no new commit was created."}} />,
};
export const History: Story = {
  render: () => <section aria-label="History"><h2>Version 12 · Published</h2>
    <VersionRecordingReferences recordings={[recorded,{...recorded,releaseId:"release-again",noChange:true}]} /></section>,
  play: async ({canvasElement}) => {
    await expect(within(canvasElement).getByText(/No new commit/)).toBeVisible();
  },
};
