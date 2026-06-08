# Mazah — Shopify (Liquid) Theme

A native Shopify theme ported from the Mazah Next.js storefront. Dossier-style
perfume shop: floating-pill header, colorful "drops" carousels, designer-inspired
product cards, scent-note PDP, Ajax cart drawer, scent quiz, and discovery kit.

Built per `../NEXTJS-TO-SHOPIFY-MIGRATION-GUIDE.md`. No build step required — plain
CSS + vanilla JS, served from the Shopify CDN.

---

## Quick start

```bash
# 1. Install the CLI
npm install -g @shopify/cli @shopify/theme

# 2. Preview against your dev store (hot reload)
shopify theme dev --store your-store.myshopify.com

# 3. Push as an UNPUBLISHED theme (safe)
shopify theme push --unpublished --store your-store.myshopify.com
```

Then **Admin → Online Store → Themes → Customize** to edit content, **Preview**,
and **Publish** when ready.

---

## Folder structure

```
layout/      theme.liquid, password.liquid       — the <html> shell
templates/   *.json (+ customers/, password, gift_card) — page types → URLs
sections/    header, footer, hero, carousels, main-product, main-collection … — building blocks
snippets/    product-card, scent-notes, icon, star-rating, family-tag, cart-drawer …
assets/      base.css, theme.js, product images
config/      settings_schema.json, settings_data.json — global theme settings
locales/     en.default.json
```

Template → URL map:

| Template | URL | Section |
|---|---|---|
| `index.json` | `/` | hero + carousels + banners |
| `product.json` | `/products/:handle` | `main-product`, `related-products`, `product-reviews` |
| `collection.json` | `/collections/:handle` | `main-collection` |
| `list-collections.json` | `/collections` | `main-list-collections` |
| `cart.json` | `/cart` | `main-cart` |
| `page.about.json` | `/pages/about` | rich-hero + image-text + value-cards + cta-banner |
| `page.discovery-kit.json` | `/pages/discovery-kit` | `discovery-kit` |
| `page.quiz.json` | `/pages/quiz` | `scent-quiz` |
| `page.contact.json` | `/pages/contact` | `contact-form` |
| `search.json` | `/search` | `main-search` |
| `blog.json` / `article.json` | `/blogs/*` | `main-blog` / `main-article` |
| `404.json` | any 404 | `main-404` |

---

## Required setup in the Shopify Admin

The theme renders from real Shopify data. To match the original site:

### 1. Navigation menus (Admin → Content → Menus)
- **`main-menu`** — used as the Perfumes mega-menu. Top-level items become the
  three columns (e.g. *Shop*, *By Gender*, *By Family*); their nested links become
  the column links.
- **`footer`** — used for footer columns and the About dropdown.
- Create a **legal/policy** menu for the footer bottom bar.
- Set the menu handles in the header/footer section settings (Customize).

### 2. Collections (Admin → Products → Collections)
Create collections with these **handles** (the homepage/nav reference them):
`all` (automatic), `latest-drops`, `impressions`, `originals`, `bestsellers`,
`new-arrivals`, `women`, `men`, `unisex`, `gift-sets`.
Use automated conditions (by tag/metafield) where it helps.

### 3. Storefront filters (Search & Discovery app)
Install Shopify's free **Search & Discovery** app and add filters for Gender,
Scent family, Inspired-by brand, and Collection. The PLP renders
`collection.filters` automatically as dropdown facets.

### 4. Product metafields (Admin → Settings → Custom data → Products)
Create these metafields under namespace **`custom`** so cards/PDP render fully.
All are optional — the theme degrades gracefully if absent.

| Key | Type | Drives |
|---|---|---|
| `inspired_by_brand` | Single line text | "Inspired by **Chanel**" |
| `inspired_by_scent` | Single line text | "…'s Coco Mademoiselle" |
| `family` | Single line text (`warm`/`flowery`/`fresh`/`woody`/`gourmand`/`earthy`) | colored scent-family pill |
| `gender` | Single line text (`women`/`men`/`unisex`) | grid gender tag |
| `category` | Single line text (`floral`/`woody`/`oriental`/`fresh`/`citrus`) | scent-quiz matching |
| `tint` | Color | soft card background |
| `card_color` | Color | saturated "drop" card |
| `card_text_dark` | Boolean | dark text on a light drop card |
| `retail_price` | Decimal | struck "Retail $145" on PDP |
| `note_descriptor` | Single line text | "This perfume is **…**" |
| `main_notes` | Multi-line text — one `Name\|emoji` per line | 4 note glyphs |
| `top_desc` / `middle_desc` / `base_desc` | Single line text | scent pyramid |
| `ingredients` | Multi-line text | full ingredient list |
| `story` | Multi-line text / rich text | About accordion |
| `longevity` / `sillage` / `concentration` / `season` / `best_for` | Single line text | Details accordion / FAQ |
| `vegan` / `cruelty_free` / `clean` | Boolean | attribute checks |
| `collection_label` | Single line text | breadcrumb label |

**Sizes / pricing:** model each bottle size (e.g. `50ML`, `100ML`) as a **product
variant** with its own price — that becomes the size selector + guest price. The
**member price** is derived automatically (guest − member discount, set in theme
settings, default 10%).

### 5. Reviews
Two options (set on the *Product reviews* section):
- **Review metaobjects** — create a `review` metaobject (fields: `author`,
  `rating`, `date`, `title`, `body`, `reply`, `verified`) and a product metafield
  `custom.reviews` (list of those metaobjects). Also set `reviews.rating` /
  `reviews.rating_count` metafields for the summary.
- **App embed** — install Judge.me / Loox / Yotpo and paste its product widget
  Liquid into the section's "App embed code" setting.

### 6. Discovery Kit
Create a **"Mazah Discovery Kit"** product and select it in the
*Discovery kit* section so "Add Discovery Kit" works; pick a collection for the
"What's inside" samples.

---

## How interactivity works (no React)

- **Cart** — `assets/theme.js` uses Shopify's Ajax Cart API
  (`/cart/add.js`, `/cart/change.js`, `/cart.js`). The slide-in drawer
  (`snippets/cart-drawer.liquid`) re-renders after every change. Replaces the old
  Zustand cart store.
- **Wishlist** — stored in `localStorage` (`mazah-wishlist`), same as before.
- **Quiz** — `sections/scent-quiz.liquid` scores categories client-side and
  renders the top 3 matches from a product pool serialized to JSON.
- **Carousels, dropdowns, accordions, gallery, size/qty selectors** — vanilla JS
  delegated handlers in `theme.js` (+ CSS hover for desktop menus).

## Theme settings (Customize → Theme settings)
Brand wordmark/logo, full color palette, fonts, **member discount %**,
**free-shipping threshold**, and social links — all editable without code.

---

## What does NOT carry over (by design)
- **Checkout** — owned by Shopify; the cart "Checkout" button hands off to it.
- **`/api` routes, Stripe, server secrets** — not part of a theme.
- **Arbitrary routes** — use pages + alternate templates (as done for quiz /
  discovery-kit / about).

## Launch checklist
- [ ] Menus, collections, filters, metafields configured (above)
- [ ] Import products with variants + metafields (CSV / Matrixify / API)
- [ ] Set up **301 redirects** from old Next.js URLs (Admin → Navigation → URL Redirects)
- [ ] QA in Theme Editor + mobile, check Web Vitals
- [ ] `shopify theme push --unpublished` → Preview → **Publish**
