-- Adds a placement-test flag so new users get an initial level assessment
-- instead of always starting at A1.
alter table profiles
  add column if not exists placement_completed boolean not null default false;
