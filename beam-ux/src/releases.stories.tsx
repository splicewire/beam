import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReleasePanel, type ReleaseRecord } from "./releases";
const release: ReleaseRecord = {
  id: "review-1",
  title: "Publish Theme",
  realm: "site",
  status: "in_review",
  reviewedBy: null,
  members: [
    {
      entryId: "theme",
      versionId: "saved-2",
      observedPin: "saved-1",
      redirectTarget: null,
      stale: false,
    },
  ],
  workflow: {
    type: "beam-ux-release",
    places: ["draft", "in_review", "approved", "published"],
    current: "in_review",
    available: ["approve"],
    transitions: [],
  },
  canSchedule: false,
  reviewRequired: true,
};
const entries = [
  {
    id: "theme",
    title: "Theme tokens",
    versions: [
      { id: "saved-2", label: "Selected version 2" },
      { id: "saved-3", label: "Newer draft 3" },
    ],
  },
];
export default {
  title: "BeamUx/ReleasePanel",
  component: ReleasePanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ReleasePanel>;
export const Review: StoryObj = {
  render: () => {
    const [current, setCurrent] = useState(release);
    return (
      <ReleasePanel
        release={current}
        entries={entries}
        onCommand={async (command) => {
          if (command.action === "approve")
            setCurrent({
              ...current,
              status: "approved",
              reviewedBy: "reviewer",
              workflow: {
                ...release.workflow!,
                current: "approved",
                available: ["publish"],
              },
            });
          else if (command.action === "publish")
            setCurrent({
              ...current,
              status: "published",
              workflow: {
                ...release.workflow!,
                current: "published",
                available: [],
              },
            });
          else
            throw new Error("This fixture keeps the selected version fixed.");
        }}
      />
    );
  },
};
export const Refused: StoryObj = {
  render: () => (
    <ReleasePanel
      release={release}
      entries={entries}
      onCommand={async () => {
        throw new Error("Author permission was revoked.");
      }}
    />
  ),
};
