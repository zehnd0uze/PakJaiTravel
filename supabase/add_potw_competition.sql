-- Picture of the Week competition
-- Posts can opt in to compete for the weekly picture spotlight on the home page.
-- Run this in the Supabase SQL editor.

alter table posts add column if not exists join_potw boolean not null default false;
