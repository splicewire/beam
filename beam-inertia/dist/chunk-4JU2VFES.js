// src/frame/team-change.ts
async function resetFrameAfterTeamChange(client) {
  await Promise.all([
    ["frame"],
    // Frame's facet queries live outside its resource/manifest prefix.
    ["filter-schema"],
    ["filter-variants"],
    ["filter-options"],
    ["saved-filters"]
  ].map((queryKey) => client.resetQueries({ queryKey })));
}

export {
  resetFrameAfterTeamChange
};
//# sourceMappingURL=chunk-4JU2VFES.js.map