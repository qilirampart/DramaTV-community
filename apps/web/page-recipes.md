# DramaTV Community Page Recipes

## 1. Purpose

This file turns [style.md](/E:/点众/DramaTV社区搭建/apps/web/style.md) into page-building recipes.

Use it when creating or extending a page and you want a concrete composition template instead of broad visual guidance.

## 2. Common Recipe

Every page should have a clear answer for these:

1. What is the page mainly for: discover, watch, read, publish, or manage identity?
2. What is the first-screen focal point?
3. What content can stay below the fold?
4. What should be visible immediately on mobile?

## 3. Home Page Recipe

### Goal

- establish atmosphere
- surface high-value content quickly
- route users into discovery and creation

### Composition

1. immersive hero or lead showcase
2. curated content strip or carousel
3. featured discovery sections
4. creator or topic entry
5. secondary modules

### Rules

- first screen should feel editorial, not mechanical
- avoid making home look like a pure archive page
- one or two strong content focal points are better than many equal shelves

## 4. Featured Archive Recipe

### Goal

- maximize browse efficiency
- support category/facet switching
- let the user keep exploring without losing rhythm

### Composition

1. compact heading / context band
2. filter and sort rail
3. masonry or archive content field
4. incremental load continuation

### Rules

- the archive field is the product, not just one section inside the product
- card density should stay high
- summary text should not consume card space
- filter state must remain legible and stable during rapid switching
- infinite continuation should feel natural; do not force the user through loud pagination UI unless necessary

## 5. Creator Page Recipe

### Goal

- present creator identity
- show a body of work
- support deeper browsing without losing orientation

### Composition

1. creator hero
2. stat/action row
3. content tabs
4. media-led archive area

### Rules

- creator background follows the theme, not avatar fallback
- content area should feel like a curated archive
- if density is high, cards should stay media-first and title-only

## 6. Detail Page Recipe

### Goal

- focus on one item
- explain it just enough
- route the user to related content and author context

### Composition

1. primary media or content header
2. title and essential identity
3. summary / tags / metadata
4. related content
5. discussion

### Rules

- detail pages can carry more text than archive pages
- keep the primary media area visually dominant
- related content should visually feel connected, not like an inserted ad rail

## 7. Discussion / Community Reading Page Recipe

### Goal

- support reading and response
- preserve community tone without breaking the product style

### Composition

1. post header
2. post body
3. support metadata
4. comment stack
5. related or surrounding discovery if needed

### Rules

- reading comfort matters more than media density here
- use the same materials and tone as the rest of the product
- do not let discussion pages drift into generic forum styling

## 8. Publish Page Recipe

### Goal

- make creation feel structured and clear
- reduce friction
- keep high-risk media and attachment states understandable

### Composition

1. page introduction
2. grouped form sections
3. media/reference upload zones
4. taxonomy / binding / metadata controls
5. action footer

### Rules

- each section should map to one user decision
- upload states must feel robust and visible
- avoid over-decorating forms; clarity beats drama here

## 9. Login / Account Recipe

### Goal

- get the user into the product with minimal friction

### Composition

1. quiet identity frame
2. minimal form
3. only essential helper actions

### Rules

- no filler demo credentials in the UI
- no unnecessary side panels
- keep the page obviously part of DramaTV, but restrained

## 10. Mobile Recipe

### Rules

- protect the focal media first
- reduce non-essential metadata
- preserve touch targets and spacing
- do not let text overlays become too tall on cards
- card grids should still feel intentional, not collapsed leftovers

## 11. AI Usage Template

Use this when asking AI to build a new page:

```md
Build this page using the DramaTV frontend documentation set:

- `apps/web/style.md`
- `apps/web/component-patterns.md`
- `apps/web/page-recipes.md`

Requirements:
- keep the page inside the existing cinematic / editorial / media-first product language
- reuse existing surface, chip, card, and typography patterns
- choose the closest recipe first, then adapt only where the product need is different
- if the page is dense and browse-oriented, keep cards title-first and cover-first
- if the page is detail-oriented, move summary and metadata into the detail layer instead of the card layer
```
