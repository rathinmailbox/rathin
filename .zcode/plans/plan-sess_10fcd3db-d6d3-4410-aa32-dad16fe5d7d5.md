## Goal
1. Add a new ad placement — **"Homepage — below the logo"** (`home-top`) — so ads can sit right under the masthead in addition to the existing bottom-of-home slot.
2. Kill the large extra gap around ads, especially making the **top-of-article ad touch the bottom of the hero** (seamless).

No DB migration is needed — `placement` is a plain `String` column (`prisma/schema.prisma:55`).

## Part A — New "below the logo" placement

**1. `src/lib/types.ts:27`** — extend the union:
```ts
export type AdPlacement = 'home' | 'home-top' | 'inline'
```

**2. API layer — recognize `home-top` in all 3 route files** (serialize + normalize):
- `src/app/api/advertisements/route.ts` — `toAd` (l.28) and the GET handler's placement normalization (l.49-58). Default param stays `'home'`; the handler accepts `home` | `home-top` | `inline` and passes through to the Prisma `where`.
- `src/app/api/admin/advertisements/route.ts` — `toAd` (l.29) and POST normalize (l.74).
- `src/app/api/admin/advertisements/[id]/route.ts` — `toAd` (l.29) and PUT normalize (l.103-104). The `inline`-only `postId`/`paragraphNum` logic stays keyed off `=== 'inline'`, so `home-top` needs no extra fields.

**3. Admin editor — `src/components/admin/ads-editor.tsx`** (l.266-278):
- `onValueChange`: map the selected value to one of the three valid placements (currently coerces everything non-`inline` to `home`).
- Add a third `<SelectItem>`:
  - `home` → "Homepage — stacked at bottom"
  - `home-top` → **"Homepage — below the logo"**
  - `inline` → "Inline — inside an article"
- The inline-only fields panel (l.281) already gates on `=== 'inline'`, and the save payload (l.125-127) already nulls `postId`/`paragraphNum` for non-inline — no change needed there.

**4. Admin table badge — `src/components/admin/ads-manager.tsx`** (l.201-205): add a distinct badge for `home-top` (e.g. "Homepage · top"), keep "Homepage" for bottom and "Inline".

**5. Render the top ad on the homepage, right below the logo:**
- **Generalize `src/components/blog/home-ads.tsx`**: add an optional `placement` prop (default `'home'`) used in the fetch URL. Backward compatible — the existing `<HomeAds />` call is unchanged.
- **`src/components/blog/home-view.tsx`**: add `<HomeAds placement="home-top" />` as the **first child** of the fragment (before the post-list `<div … py-8>` on l.27). Because `<main>` has no padding and `MarqueeAd` has no top margin, the banner sits **flush against the masthead**. The existing bottom `<HomeAds />` (l.46) stays.

## Part B — Seamless / less extra space

**6. Make the top-of-article ad touch the hero** — `src/components/blog/article-body.tsx` (l.71): change the top-ad wrapper from `className="inline-ad-fullbleed"` to `className="inline-ad-fullbleed inline-ad-top"`.

**7. CSS — `src/app/globals.css`:**
- Add a modifier that negates the `.article-body` top padding so the banner is flush with the hero:
```css
/* Top-of-article ad butts flush against the bottom of the hero: negate the
   .article-body top padding (3rem) and drop the default full-bleed top margin. */
.inline-ad-top {
  margin-top: -3rem;
}
```
- Lightly reduce the default `.inline-ad-fullbleed` vertical margins from `2rem` → `1rem` (l.659-660) so mid-article inline ads aren't as gappy either. The horizontal full-bleed (`calc(50% - 50vw)`) is untouched.

## Files touched (7)
- `src/lib/types.ts`
- `src/app/api/advertisements/route.ts`
- `src/app/api/admin/advertisements/route.ts`
- `src/app/api/admin/advertisements/[id]/route.ts`
- `src/components/admin/ads-editor.tsx`
- `src/components/admin/ads-manager.tsx`
- `src/components/blog/home-ads.tsx`
- `src/components/blog/home-view.tsx`
- `src/components/blog/article-body.tsx`
- `src/app/globals.css`

## Notes / defaults chosen
- The "below the logo" slot is **home-page only** (it lives in `HomeView`), matching your "home" framing — it won't appear on the About page even though About also shows the masthead.
- It's an **additional** slot (per "also / as well"), not a replacement of the bottom slot — each ad picks bottom, top, or inline.
- Top-of-article ad: zero gap above (touching the hero), ~1rem below before the first paragraph so it doesn't crash into the text.