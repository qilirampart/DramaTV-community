# DramaTV Community Style MD

## 1. Purpose

This file is the visual constraint for DramaTV community frontend work.

It exists to solve one specific problem: do not optimize one button or one card in isolation. Make the whole product feel like it belongs to the same system.

When building or extending pages in `apps/web`, default to this file unless the existing page already has a stronger local pattern that should be preserved.

Companion docs:

- [component-patterns.md](/E:/点众/DramaTV社区搭建/apps/web/component-patterns.md)
- [page-recipes.md](/E:/点众/DramaTV社区搭建/apps/web/page-recipes.md)

## 2. Product Thesis

DramaTV is not a bright SaaS dashboard and not a generic short-video app.

The current product language is:

- cinematic
- editorial
- media-first
- restrained
- premium, but not flashy

The interface should feel like a screening room, archive, or studio console. Content is the lead actor. UI chrome should support it, not fight it.

## 3. Core Principles

1. Build atmosphere before decoration. Use depth, contrast, spacing, and surface layering first.
2. Let media lead. Covers, posters, previews, and masonry rhythm matter more than ornamental UI.
3. Keep text hierarchy strict. Dense lists should show less text, not more.
4. Dark mode is the primary mood. Light mode must feel intentional, not like an unstyled fallback.
5. Motion should clarify focus, not show off.
6. Prefer a few strong materials repeated consistently over many unrelated effects.
7. If a new screen looks like a template marketplace page, it is off-style.

## 4. Theme System

Use the existing tokens in [globals.css](/E:/点众/DramaTV社区搭建/apps/web/src/app/globals.css).

### Dark theme

- Base background: `--projection-black: #06070b`
- Stage background: `--ink-stage: #0d1117`
- Main text: `--screen-white: #f4f7fb`
- Secondary text: `--soft-silver`, `--fog-blue`
- Accent 1: `--signal-cyan: #86e7f8`
- Accent 2: `--tungsten-gold: #f2bb67`
- Warning / heat: `--studio-coral: #ff7a6b`
- Positive state: `--success-mint: #6fd8a8`

### Light theme

- Do not use stark pure white.
- Keep the light theme warm, paper-like, and editorial.
- Preserve the same accent system. Only the base surfaces and text contrast should invert.

### Color behavior

- Cyan is for signal, focus, active state, and precise interaction.
- Gold is for warmth, curation, premium emphasis, and editorial markers.
- Coral is for destructive, warning, or hot-status emphasis only.
- Mint is for success and ready states only.
- Do not introduce new brand colors casually.

## 5. Typography

Typography is already split into three roles. Keep that split.

### UI sans

Default body and interface text:

- `"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`

Use for:

- body copy
- buttons
- tabs
- filters
- form labels
- utility text

### Editorial serif

Display and hero text:

- `"Noto Serif SC", "Source Han Serif SC", "Songti SC", serif`

Use for:

- hero headlines
- section headlines that need mood
- creator-page emphasis
- curated editorial callouts

Do not use serif for dense utility UI or long control clusters.

### Mono / meta

Technical and compact meta text:

- `"IBM Plex Mono", "Cascadia Code", "Consolas", monospace`

Use for:

- chips
- counters
- category markers
- subtle status labels
- timestamps when a technical tone is useful

### Type hierarchy rules

- Headlines should feel tight, deliberate, and slightly compressed in spirit.
- Dense cards should prefer one strong title line over multiple weak text blocks.
- In high-density media lists, keep only the title by default.
- Summary, author, and stats should not compete with the cover unless the page explicitly needs them.

## 6. Spacing, Radius, Border, Shadow, Motion

### Spacing

The product should feel spacious, not cramped.

Preferred spacing rhythm:

- micro: `4`, `8`
- control spacing: `10`, `12`, `14`, `16`
- card spacing: `18`, `20`, `24`
- section spacing: `32`, `40`, `48`, `64`

### Radius

Use these bands repeatedly:

- small controls: `10px`
- chips / compact surfaces: `14px`
- standard cards: `18px`
- large panels: `24px`
- hero surfaces / oversized media frames: `28px`

Do not switch between sharp rectangles and oversized pill shapes without a reason.

### Borders

- Prefer soft translucent borders over hard outlines.
- In dark mode, borders should read as edge light, not as grey boxes.
- In light mode, borders should be warm and quiet.

### Shadows

- Use layered shadows to create depth between page, panel, and card.
- Shadows should be soft and long, not harsh.
- Hover can slightly deepen the shadow, but avoid dramatic jumps.

### Motion

- Standard UI hover / press: `160ms` to `220ms`
- Larger hero / carousel transforms: slightly slower is acceptable
- Motion types: subtle lift, opacity shift, border glow, media scale
- Avoid bouncy, rubbery, or playful motion curves

## 7. Layout Rules

The product is wide and cinematic.

- Keep primary page shells centered and generous.
- Use wide max widths similar to the current codebase, not cramped blog widths.
- Hero areas should feel immersive.
- Archive and discovery pages should prioritize media density over explanatory copy.
- Left and right spacing must be visually symmetrical. If a layout feels shifted, it is wrong.

## 8. Surface Rules

There are three core surface types.

### Stage surface

Use for page background and immersive sections.

- deep gradient
- dark atmospheric fill
- low visual noise

### Glass / deck surface

Use for top bars, floating panels, and overlay containers.

- blur allowed
- subtle border
- soft elevation
- restrained transparency

### Media surface

Use for cards, posters, covers, and video frames.

- media should own the shape
- text should sit on top of a controlled gradient or footer band
- avoid adding multiple nested frames around the same media

## 9. Component Patterns

### Top bar

- Floating or sticky feel is correct.
- Use blur, thin border, and compact height.
- It should feel like a premium control rail, not a website header.

### Buttons

- Primary buttons may use warm gold or strong light contrast depending on context.
- Secondary buttons should feel quiet but solid.
- Avoid default browser-like button styling.

### Chips and filters

- Inactive: transparent or low-contrast filled
- Active: solid, confident, and obvious
- Mono labels are preferred for filter chips and taxonomy-like controls

### Media cards

This is the most important pattern in the product.

- Let the media preview dominate the card.
- Keep the resource-type badge in the top-left when needed.
- In dense grids, default visible text should be minimal.
- Featured/community waterfall cards should default to media-first presentation.
- Title can appear on hover or in a fixed bottom zone depending on page density.
- Do not show summary text in dense media grids.
- Do not show author and browse stats in dense grid cards unless the page explicitly needs them.

### Creator hero

- Large identity block
- Strong name treatment
- Compact stats
- Quiet action buttons
- Background should follow theme mood, not fall back to avatar or random content cover

### Empty states

- Keep them quiet and composed
- bordered panel
- short copy
- no playful illustrations

## 10. Content Density Rules

Content density is a product decision, not just a visual one.

### Dense list pages

Examples:

- featured archive
- community content grids
- creator work lists

Rules:

- default to title-first
- hide summary by default
- hide author and stats by default when media density is the goal
- preserve cover visibility above text verbosity

### Detail pages

Use the extra space to show:

- summary
- tags
- author
- related content
- discussion

Do not push all detail-page information back into list cards.

## 11. Page-Level Guidance

### Home

- cinematic first screen
- stronger editorial composition
- broader atmosphere
- fewer but stronger focal points

### Featured

- media inventory page first
- filtering and sorting must stay usable, compact, and precise
- masonry rhythm should feel tight and intentional
- cards should not feel like generic ecommerce tiles

### Creator page

- identity first, archive second
- works and workflows should feel like a curated body of output
- background is theme-driven, not content-driven

### Discussions / community text pages

- still belong to the same world
- use the same spacing, panel, and typography logic
- keep reading comfort high
- do not make discussion UI look like a separate forum product

### Login and account pages

- minimal
- calm
- no demo-account clutter in the UI
- the style should still feel like DramaTV, not a default auth template

## 12. Do / Don't

### Do

- use the existing global tokens first
- keep the dark theme rich and layered
- use serif selectively for drama and editorial gravity
- keep dense cards visually clean
- let hover reveal secondary information when useful
- reuse existing card, chip, topbar, and panel patterns

### Don't

- do not introduce purple-heavy gradients
- do not use flat white SaaS cards on white backgrounds
- do not expose too much text under media thumbnails
- do not mix too many accent colors on one screen
- do not add decorative blobs, random glows, or trendy AI ornamentation
- do not make list pages look like admin tables
- do not make every page start with oversized marketing copy

## 13. Source Of Truth

When this document is too abstract for a specific implementation, inspect these files first:

- [globals.css](/E:/点众/DramaTV社区搭建/apps/web/src/app/globals.css)
- [CommunityHomePage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/home/CommunityHomePage.module.css)
- [FeaturedArchivePage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.module.css)
- [CreatorPage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/creator/CreatorPage.module.css)

If this file and the actual shipped UI disagree, align to the current shipped UI first, then update this file.

## 14. Prompt Template

Use this block when asking AI to build or extend a page in this repo:

```md
Follow `apps/web/style.md`.

Stay inside the existing DramaTV community visual language:
- cinematic, editorial, media-first, restrained
- dark studio mood by default, intentional warm light mode
- use existing global color tokens and typography roles
- preserve wide centered layouts and layered glass/panel surfaces
- dense media lists should be title-first and cover-first
- do not add generic SaaS styling, purple gradients, or over-explained cards

When in doubt, match the style direction already present in:
- `apps/web/src/app/globals.css`
- `apps/web/src/features/home/CommunityHomePage.module.css`
- `apps/web/src/features/featured/FeaturedArchivePage.module.css`
- `apps/web/src/features/creator/CreatorPage.module.css`
```

## 15. Usage Rule

Before making a new page, answer these three questions:

1. Is this page stage-led, panel-led, or media-led?
2. What text is truly necessary at list density?
3. Which existing page is the closest visual sibling?

If those three answers are clear, the UI usually stays coherent.
