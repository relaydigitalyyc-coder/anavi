# F23: Real Estate Module Data-Backing — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Real Estate Module Data-Backing  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.7

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Add `real_estate_listings` (or extend schema). CRUD. Link to deals. Replace placeholder photos with upload or placeholder service. Filters. Image CDN; search index.

### Architecture

`real_estate_listings` table. tRPC `realEstate.list`, `realEstate.create`, `realEstate.update`, `realEstate.delete`, `realEstate.get`. S3 for images. Optional: full-text search on address, description. Link: deal can reference listing.

### Tech Stack

Drizzle ORM, tRPC v11, S3, React 19, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | Check for real_estate or similar |
| `anavi/client/src/pages` | RealEstate.tsx if exists |
| S3 setup | From PRD-2 document storage |

### Phase 1: Schema + CRUD

**Task 1 — Schema**  
- `real_estate_listings`: id, ownerId, title, address, city, state, country, description, propertyType, listingType (sale/lease), price, currency, areaSqFt, bedrooms, bathrooms, status (draft/published/archived), imageKeys (JSON array), dealId (nullable), createdAt, updatedAt  
- Index: ownerId, status, createdAt  
- TDD: schema export test  

**Task 2 — DB helpers**  
- createListing, getListing, listListings (with filters), updateListing, deleteListing  
- Filters: status, propertyType, listingType, priceMin, priceMax, city  
- Pagination  

**Task 3 — tRPC router**  
- realEstate.list, get, create, update, delete  
- create: upload images first (presigned); store keys in listing  
- Link to deal: realEstate.linkToDeal(listingId, dealId)  

### Phase 2: Images

**Task 4 — Image upload**  
- Presigned upload for listing images (reuse PRD-2 pattern)  
- Max 10 images per listing; 5MB each  
- confirmUpload → add key to listing  
- Placeholder: placeholder.com or default "No image" SVG  

**Task 5 — Image display**  
- Presigned GET URL or public CDN URL  
- Carousel or grid in listing card  
- Lazy load  

### Phase 3: UI

**Task 6 — Listings page**  
- /real-estate route  
- Grid of listing cards  
- Filters: type, price range, status  
- Create button → form  

**Task 7 — Listing form**  
- Create/edit: title, address, description, type, price, area, bedrooms, bathrooms, images  
- Image upload dropzone  
- Save → create/update  

**Task 8 — Listing detail**  
- /real-estate/:id  
- Full details; image gallery  
- Link to deal (if linked)  
- Edit (owner only)  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5
Task 6 → Task 7 → Task 8
```

### Verification

- [ ] Create listing with images
- [ ] List with filters
- [ ] Link to deal
- [ ] Placeholder for no image

---

## UI PRD

### User Story

As a user, I want the Real Estate module to use real data so I can list and browse properties.

### Entry Points

- Nav: "Real Estate"  
- Dashboard: "List a property" CTA  
- Deal room: "Link listing" (optional)  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `ListingCard` | Card: image, title, price, location | — |
| `ListingGrid` | Responsive grid of cards | loading, rows, empty |
| `ListingForm` | Create/edit form | — |
| `ListingDetail` | Full listing view | — |
| `ImageUploadZone` | Multi-image upload | — |
| `ListingFilters` | Type, price, status | — |

### Design Tokens

- Card: `card-elevated`  
- Price: `font-data-hud font-semibold`  
- Image aspect: 16/10 or 4/3  
- Placeholder: gray gradient + icon  
- Badge: draft `bg-[#F59E0B]/15`, published `bg-[#059669]/15`  

### Empty States

- No listings: "No properties yet. List your first property."  
- No image: Placeholder SVG  
- Filters empty: "No listings match your filters."  

### Trust Signals

- "Verified listing" if linked to verified deal (optional)  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/drizzle/schema.ts` | real_estate_listings |
| `anavi/server/db.ts` | CRUD |
| `anavi/server/routers.ts` | realEstate router |
| `anavi/client/src/pages/RealEstate.tsx` | List |
| `anavi/client/src/pages/RealEstateDetail.tsx` | Detail |
| `anavi/client/src/components/ListingCard.tsx` | — |
| `anavi/client/src/components/ListingForm.tsx` | — |
| `anavi/client/src/App.tsx` | Routes |
