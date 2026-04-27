-- Migration: add match_minute column to matches table
-- Purpose: store the real match minute from API-Football (fixture.status.elapsed)
--          so the live tracker shows an accurate minute instead of a client-side estimate.
-- Nullable: NULL when match hasn't started or has finished.

ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_minute INTEGER;
