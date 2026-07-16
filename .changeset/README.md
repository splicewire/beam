# Changesets

Independent versioning for the `beam` packages (published under the `@schemastud` npm scope). When
you change a package, run `npm run changeset`, pick the packages + bump levels, and write a one-line
summary. On merge to `main`, the release workflow opens/updates a "Version Packages" PR; merging it
publishes the bumped packages to the public npm registry.

- Independent mode — each package versions on its own.
- `access: public` — matches each package's `publishConfig`.
