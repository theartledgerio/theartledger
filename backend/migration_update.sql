-- The Art Ledger (TAL) Database Migration Update Script
-- Run this in your Supabase SQL Editor to add new USD, shipping, and currency columns to live production tables

ALTER TABLE public.magazines 
  ADD COLUMN IF NOT EXISTS single_issue_price_usd numeric(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS digital_pdf_price_usd numeric(10,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS shipping_inr numeric(10,2) DEFAULT 150.00,
  ADD COLUMN IF NOT EXISTS shipping_usd numeric(10,2) DEFAULT 15.00;

ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR'::text,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0;
