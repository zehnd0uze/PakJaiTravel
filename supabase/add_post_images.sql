-- Multi-photo posts: store every photo of a post in order.
-- image_url keeps the first photo so older code (home hero, Picture of the Week,
-- profile grid) keeps working unchanged.

alter table posts add column if not exists images text[] default array[]::text[];

-- Backfill existing single-photo posts
update posts
set images = array[image_url]
where image_url is not null
  and (images is null or cardinality(images) = 0);
