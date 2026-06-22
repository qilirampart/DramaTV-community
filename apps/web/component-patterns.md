# DramaTV Community Component Patterns

## 1. Purpose

This file is the component-level companion to [style.md](/E:/点众/DramaTV社区搭建/apps/web/style.md).

Use it when the page direction is already clear, but the local component behavior still needs concrete rules.

## 2. Shared Rule

Every component should answer one question clearly:

- Is it carrying identity?
- Is it carrying navigation?
- Is it carrying media?
- Is it carrying interaction?
- Is it carrying supporting metadata?

If one component tries to do all five, it usually becomes noisy.

## 3. Top Bar

### Role

- global navigation
- account/session entry
- lightweight utility actions

### Visual rules

- floating or sticky shell
- blurred background
- thin border highlight
- compact vertical height
- strong horizontal rhythm

### Content rules

- keep primary nav labels short
- avoid stacking too many badges, counts, and helper text in the top bar
- account area should stay compact and stable in width

### Interaction rules

- hover is subtle
- active state should be clear through contrast, not size inflation
- dropdowns should feel like glass panels, not system menus

## 4. Hero Blocks

### Role

- establish atmosphere
- define the page thesis quickly
- surface one primary entry path

### Visual rules

- large visual area
- layered background
- strong focal media or editorial text
- avoid cramming many equal-weight cards into the hero

### Content rules

- one main headline
- one supporting paragraph at most
- one or two actions max

## 5. Filter Chips

### Role

- change scope
- change sort
- change taxonomy facet

### Visual rules

- compact
- mono is preferred for small utility chips
- inactive chips should not look dead
- active chips should look confidently selected

### Behavior rules

- active, hover, loading, and disabled states must be visually distinct
- rapid repeated clicks should still preserve the final intended state
- chip groups should wrap cleanly instead of creating broken spacing

## 6. Section Headers

### Role

- separate content groups
- communicate hierarchy without shouting

### Visual rules

- usually one heading plus one small supporting line or action
- can use serif when the section is editorial or identity-led
- can use mono micro-label above the title when curation matters

### Content rules

- keep labels short
- avoid marketing slogans

## 7. Media Cards

This is the core product pattern.

### Role

- represent prompt, work, workflow, or community media in a dense browse surface

### Visual rules

- media dominates the card
- badge can sit on the top-left
- text sits in a controlled bottom zone or hover reveal
- no thick nested borders around media

### Content rules

Default dense-grid priority:

1. cover / poster / preview
2. type badge
3. title

Usually do not show by default:

- summary
- long author line
- browse/play/like counts

### Hover rules

- reveal title or metadata only if that page benefits from it
- scale media slightly, do not dramatically zoom
- lift the card slightly, do not re-layout the grid

## 8. Waterfall / Masonry Cards

### Role

- maximize media density while respecting original aspect ratios

### Layout rules

- preserve real media proportions as much as possible
- avoid empty gaps caused by hard uniform cropping
- cards should feel tightly packed
- loading new items should extend the flow naturally, not visually reset earlier columns

### Overlay rules

- keep overlays light
- text should not cover the entire image surface
- hover-only title is preferred when the page is highly visual

## 9. Carousel Cards

### Role

- first-screen feature presentation
- curated highlight sequence

### Visual rules

- center card is the hero
- side cards can angle or recede slightly
- no heavy title stack on top of the media if the area is supposed to be cinematic

### Content rules

- first screen can hide titles if the media already carries the mood
- use titles outside the visual field or in supporting sections if needed

## 10. Creator Identity Block

### Role

- present a creator as a body of work, not as a social profile card clone

### Visual rules

- clear avatar anchor
- strong name treatment
- clean stat row
- quiet surrounding actions

### Content rules

- name first
- short bio if useful
- stats stay compact
- avoid turning the hero into a paragraph wall

## 11. Tabs

### Role

- switch between work groups such as works, workflows, posts

### Visual rules

- stable baseline
- active tab clear through contrast and underline/surface change
- avoid oversized segmented-control aesthetics unless already used nearby

### Behavior rules

- tab switch should feel instant
- loading state should not make the whole page jitter

## 12. Detail Metadata Blocks

### Role

- expose summary, tags, author, related work, and support actions

### Visual rules

- panelized, readable, and layered
- keep line lengths moderate
- tags and metadata should create rhythm, not clutter

### Content rules

- this is where summary belongs
- do not duplicate the same summary text from the card layer

## 13. Form Sections

### Role

- publishing
- profile editing
- operations input

### Visual rules

- grouped into clear sections
- one section should represent one mental step
- labels and helper text should be calm and readable

### Content rules

- short labels
- precise helper text
- error messages should be direct, never verbose

## 14. Empty / Loading / Error States

### Empty

- quiet
- compact
- border or soft surface
- one explanation plus one next action if needed

### Loading

- should preserve layout expectation
- do not flash between unrelated states
- if possible, let loading happen inside the existing page rhythm

### Error

- short message
- actionable retry if available
- keep technical detail secondary

## 15. Pattern Checklist

Before shipping a new component, check:

1. Is the component carrying too much text for its density?
2. Is media still dominant where it should be?
3. Does hover add clarity instead of noise?
4. Does dark mode look native rather than inverted?
5. Does the component feel like it already belongs beside home, featured, and creator pages?
