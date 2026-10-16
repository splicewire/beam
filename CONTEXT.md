# Beam

The Beam app substrate: the npm workspace whose packages give every host the same editor, chrome and capability UI.

## Language

### Authoring editor

**Block Style**:
The look an author gives one block in the editor, held as layers of CSS declarations. It is what the style panels edit,
as distinct from a developer's classes on the same block (docs/adr/0003).
_Avoid_: inline style, style object, sx

**Style Layer**:
One slice of a Block Style that applies under a condition: the base layer always, a breakpoint layer from a minimum
width, a state layer while the element is hovered, focused or active.
_Avoid_: variant, modifier, override

**Working Head**:
The latest saved version of an entry: what its authors are editing. A draft is pending when it differs from the
Publication Pin.
_Avoid_: current version, latest, HEAD (alone)

**Publication Pin**:
The saved version of an entry that guests are served: its body and the fields a guest sees, such as its title and URL.
Only Publish moves it. Save and Restore never do (splicewire/laravel-beam-ux docs/adr/0225, docs/adr/0232).
_Avoid_: live version, published flag, workflow marking

**Local Session**:
One author's in-browser state for one entry: the undo stack and any unsaved changes, built on a Working Head. Undo
walks it, and only a Save sends it to the server (docs/adr/0004).
_Avoid_: undo history, autosave, cache

**Prose Run**:
Consecutive blocks of prose under one parent, such as paragraphs, headings, lists, quotes, code blocks and the
components allowed among them, edited together as one flow of text, the way a document is. A layout block ends a run,
and a block that holds only text, such as a button's label or a table cell, is a run of one (docs/adr/0006).
_Avoid_: rich text element, text block, Prose (a typographic-scale component)

**Source Mode**:
Editing a page as source text in its File Language, as a view of the author's Local Session. What's typed there becomes
one step when the author leaves it, and is saved, undone and published like any other edit (docs/adr/0006).
_Avoid_: code view, raw mode, source write (the server operation that stores text as a draft)

**Release**:
A named set of entries, each with the saved version it will publish or marked as a Take-down, that goes live together,
now or at a scheduled time. Publishing an entry on its own is a Release of one. A rollback is a new Release of the
earlier versions (splicewire/laravel-beam-ux docs/adr/0226).
_Avoid_: batch, changeset, commit, deployment

**Take-down**:
A member of a Release with no version, which hides its page and the pages under it when the Release publishes. It may
name a page their URLs redirect to (splicewire/laravel-beam-ux docs/adr/0236).
_Avoid_: unpublish (the workflow step it triggers), removal, deletion

**Redirect**:
An old URL of a site that sends a guest on to where its page is now, or to an address an author chose. A Release leaves
one at each URL it moves a page away from, and a page that later takes the URL replaces it
(splicewire/laravel-beam-ux docs/adr/0236).
_Avoid_: alias, forward, rewrite (serving another URL's content in place), 301 (one of its answers)

**Preview**:
The site as it will look once a Release publishes, or with one entry at one saved version, seen before it goes live.
Everything else in it is at its Publication Pin (splicewire/laravel-beam-ux docs/adr/0232).
_Avoid_: staging, draft mode, sandbox, perspective

**Preview Link**:
A link that opens a Release's Preview for someone without an account, until it expires, is revoked or the Release
publishes.
_Avoid_: share link, public link, guest link

**Reach**:
The pages a component, layout, template or theme changes when it publishes, other than those published with it: every
page that uses it, or every page for a theme.
_Avoid_: impact, blast radius, usages

### Block documents

**Body Kind**:
What an entry's body is made of: blocks, source text, or a form of fields. The entry declares it; it is never guessed
from the data (splicewire/laravel-beam-ux docs/adr/0228).
_Avoid_: format (that is the file language), body shape

**File Language**:
The language an entry's source is written in, TSX or MDX: the language of its file and of its Source Mode. It doesn't
change what the entry holds, how the canvas edits it or how it looks, and an author can change it. A Hosted site's pages
have none (splicewire/laravel-beam-ux docs/adr/0233).
_Avoid_: format, Body Kind (what a body is made of)

**JsonDoc**:
A page body as declared blocks: a tree of block, text and opaque nodes, where each block keeps its identity across
edits and carries its own Block Style. It is what a page stores, whether its file is TSX or MDX, and what the canvas
edits, and the server writes it back as source in the page's File Language.
_Avoid_: BlockDoc, BlockDoc JSON, body tree

**TSX Lens**:
The reading of a page's TSX source as a tree of blocks, lossless enough that an edit can be written back as source.
Source becomes a JsonDoc through it.
_Avoid_: BlockDoc (its retired name), blockdoc (that is a `@schemastud/blockdoc` document), parser

**MDX Lens**:
The reading of a page's MDX source as a JsonDoc, with Markdown read as the HTML profile's own blocks and JSX as
components, and the printing of those blocks back as canonical MDX. It is the TSX Lens's sibling: MDX names a page's
file language, not what the page holds (splicewire/laravel-beam-ux docs/adr/0233).
_Avoid_: MDX editor (an editing surface), MDX parser

**Opaque Island**:
A piece of page source a lens can't break into blocks, such as a loop, a condition, an expression or a comment. It is
carried verbatim and edited only as source. A tenant's page has none.
_Avoid_: raw block, code block

**Block Manifest**:
The declared vocabulary of a block document: each node's name, its category, what it may contain and the schema of its
attributes (splicewire/splicewire-app docs/adr/0112). It is the one vocabulary for the canvas, the MDX component kit
and `@schemastud/blockdoc` documents. A component an author can place is a node in it.
_Avoid_: block schema, node registry, kit, component map

**Manifest Profile**:
The Block Manifest one kind of entry is edited against: the nodes an author may place there, and whether code is
admitted. The host declares one per realm, the realm's own Authored Components join it, and the editor's palette, its
inspector and a save all read the same one.
_Avoid_: palette, allow-list, kit

### Binding

**Collection**:
A set of Records an author may bind blocks to, as the Manifest Profile offers it: an entry's child pages, a resource,
or, on a Hosted site, the Records of a registered schema its tenant marks as a Collection (splicewire/laravel-beam-ux
docs/adr/0229 and 0238).
_Avoid_: data source, dataset, query, content type, custom collection, Silo (a grouping of fragments), a Laravel
`Collection` or `CollectionBacking` (no class is named bare `Collection`)

**Record**:
One item of a Collection as a binding reads it: the fields its Collection lets that reader see.
_Avoid_: row, item, model, Entity (Tower's intake subject)

**Page Field**:
A field a page carries beyond its settings and SEO, such as an essay's topic or reading time. A page's parent declares
the fields its child pages carry, on a Hosted site by naming one of its tenant's registered schemas, and they are the
Record fields a Collection of those pages offers. A page's file writes them as frontmatter (splicewire/laravel-beam-ux
docs/adr/0233 and 0238).
_Avoid_: frontmatter (how a file writes them), meta, custom field

**Repeat**:
A binding on a block that renders the block once for each Record its Collection's query returns.
_Avoid_: loop, query loop, collection list, repeater

**Field Binding**:
A prop or a piece of text whose value is a field of the Record in scope (the Repeat's current Record, or the Record
Page's Record) instead of a literal.
_Avoid_: dynamic data, data tag, expression (an expression is code)

**Data Condition**:
A rule on a block that shows the block only while fields of the Record in scope match, or, inside an Authored
Component, while its props do. It shapes what a reader sees and never decides what they may read.
_Avoid_: conditional, visibility rule, access condition (that is the View or Edit gate)

**Record Page**:
A page entry whose URL segment is a parameter, so that it renders each Record of one Collection at that Record's own
URL.
_Avoid_: collection template, template page (a template is the slot-bearing scaffold of splicewire/laravel-beam-ux
docs/adr/0213), detail page

**Public Read**:
What a resource lets a guest receive: which of its Records, and which of their fields. A guest reads nothing from a
resource that has none (splicewire/laravel-beam docs/adr/0230). A registered Collection's author declares its Public Read
in the Collection's schema (splicewire/laravel-beam docs/adr/0235).
_Avoid_: public resource, guest policy, anonymous access

### Components

**Code Component**:
A component shipped as code by the host or a package and declared to the Block Manifest. An author places and
configures it but never edits its inside.
_Avoid_: registered component, island, widget

**Authored Component**:
A component built in the editor from blocks and kept as an entry, with the props and slots it offers declared beside its
blocks. Publishing it changes every page that uses it (splicewire/laravel-beam-ux docs/adr/0231).
_Avoid_: symbol, global block, synced pattern, reusable block, partial, Fragment (a corpus unit)

**Instance**:
One placement of a component in a body. It holds its prop values, its slot content and its own block fields, and
nothing from inside the component.
_Avoid_: copy, usage, override

**Slot**:
A hole a component, layout or template declares for something else to fill: an instance's content for a component, the
page for a layout or template. A component's unnamed slot takes an instance's children.
_Avoid_: region, outlet, placeholder, a Composition Cell's `slots` (typed payload fields)

**Prop Reference**:
A prop or a piece of text inside an Authored Component whose value is one of that component's own props.
_Avoid_: variable, binding (a Field Binding reads a Record), expression (an expression is code)

**Detach**:
Replacing an instance with a plain copy of its component's blocks, with its props and slots filled in, so later changes
to the component no longer reach it.
_Avoid_: unlink, eject (audiostud's deferred eject copies a Code Component's source)

### Search and measurement

**Page Head**:
What a page puts in its document head for search engines, link previews and browsers: its title, description, canonical
URL, social tags and Structured Data. The server makes it for every request, so it is in the page's HTML before any
script runs (splicewire/laravel-beam-ux docs/adr/0234).
_Avoid_: meta tags, SEO tags, `<Head>` (Inertia's component)

**SEO Fields**:
The page settings that describe a page to search engines and link previews: its description, social image, Page Type
and published date. A version holds them, beside the title.
_Avoid_: meta, metadata, frontmatter (how a file writes them)

**Page Type**:
The kind of page an author says a page is, for its Structured Data: a web page unless the author picks an article, a
collection page or a profile page.
_Avoid_: schema type (a schema is a JSON Schema), entry type (page, layout, template, component, theme), template

**Structured Data**:
A page's description in schema.org's vocabulary, emitted as JSON-LD in its Page Head. It is built from what the site
already holds: the page's SEO Fields, its place in the tree, the site's brand and, on a Record Page, its Record.
_Avoid_: schema (a JSON Schema), rich snippets, microdata

**Analytics Tag**:
The analytics provider's script a site loads once in every page, keyed by the site's own id. It loads only in the
environments a site allows and never in a Preview (splicewire/laravel-beam-analytics docs/adr/0237).
_Avoid_: tracking code, pixel, snippet

**Analytics Event**:
A named moment a site reports to its analytics provider through the Analytics Tag: one a packaged surface reports, such
as a sign-up, or a block's Click Event.
_Avoid_: event (alone; activity log entries, workflow events and hook events are other things), tracking event,
conversion

**Event Vocabulary**:
The declared list of Analytics Event names a site may report, with their parameters: the package's names and the
host's.
_Avoid_: taxonomy, event schema, tracking plan

**Click Event**:
The Analytics Event a block reports when a visitor clicks it, chosen in the inspector from the Event Vocabulary.
_Avoid_: tracking attribute, `data-track`, interaction (Webflow's interactions animate)

**Site Settings**:
What belongs to a whole site rather than one page: its brand and its analytics id. A Hosted site holds its own, edited
in its Site section and never copied by a Scaffold Pack; the central site's and a Connected site's are configuration.
_Avoid_: page settings (a version's), theme, Workspace settings
