-- Migration 002: Add end_date, end_time, notes to events table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS notes text;
