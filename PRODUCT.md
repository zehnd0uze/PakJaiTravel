# Product

<!-- impeccable:product-schema 1 -->

> Written 2026-10-31 from repository evidence. The owner skipped the init interview, so every fact below marked *(inferred)* still needs their confirmation.

## Platform

web

## Users

*(inferred)* Travelers planning a trip to Chiang Mai and Chiang Dao (confirmed by the owner): both Thai domestic visitors and international guests (the site ships English and Thai). Secondary users are local hosts who list and manage their properties, and the admins who verify them.

## Product Purpose

*(inferred)* PakJai Travel (พักใจ) is a local travel platform for Chiang Mai and Chiang Dao (area confirmed by the owner). It helps visitors find verified homestays, hotels, cafes and restaurants, and lets travelers share photos and journals with a community. Success means a visitor finds a place they trust and contacts or books it.

## Positioning

*(inferred)* Deep coverage of one region (Chiang Mai and Chiang Dao) instead of everywhere; properties checked against their real owners ("Real Owner Verified"); and a traveler community whose most-voted photos become the "Picture of the Week".

## Operating Context

- Visitors browse and search properties at `/hotels` and filter by type (Nature, Cafe, Restaurant).
- The community at `/community` holds posts with photos, location tags and likes. Posts opted in with `join_potw` compete for Picture of the Week, ranked by likes.
- Hosts claim properties, become hosts, and manage listings through a host dashboard. Admins review claims, hotels and users.
- Data lives in Supabase (`properties`, `posts`). Images go through Cloudinary.

## Capabilities and Constraints

- React 19 + Vite + TypeScript client, Express server, Supabase backend, deployed on Vercel.
- Bilingual via i18next (`client/src/locales/en`, `client/src/locales/th`). Every visible string needs both languages, and layouts must hold up with Thai script (tall tone and vowel marks).
- Desktop and mobile get separate home heroes. Mobile is an app-style search card with a bottom nav.

## Brand Commitments

- Name: PakJai / พักใจ ("rest the heart"). Footer tagline: "Curated nature retreats & heritage stays in Chiang Dao."
- Existing visual identity: deep forest green `#2C4C3B` with a terracotta accent `#C2704E`, Outfit for headings and Inter for body text. *(inferred as current; not confirmed as binding)*

## Evidence on Hand

- Real property listings and community posts in Supabase; seed data in `client/src/data/chiangDaoData.ts`.
- Photography: `client/public/doiluangbg.jpg` (Doi Luang Chiang Dao) and `client/public/assets/hero-bg.jpg`.
- No testimonials, press, booking volumes or review aggregates are verified beyond what the database holds. Do not invent them.

## Product Principles

*(inferred)*
1. Local and specific beats broad: everything is about Chiang Mai and Chiang Dao.
2. Trust is shown, not claimed: verification and real traveler photos do the persuading.
3. The community is content: travelers' pictures and journals are first-class material, not decoration.
4. Equal footing for Thai and English readers.
