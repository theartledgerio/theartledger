-- The Art Ledger (TAL) Database Schema Initialization
-- Reverse-engineered from backup file: bucket/art-ledger-scroll-showcase_260710.backup
-- Target: Supabase PostgreSQL Database

-- ==========================================
-- 1. DROP EXISTING TABLES, FUNCTIONS, AND TYPES
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_contributor ON auth.users;
DROP TRIGGER IF EXISTS contrib_invites_updated_at ON public.contributor_invites;
DROP TRIGGER IF EXISTS contributor_cap_trigger ON public.contributor_invites;
DROP TRIGGER IF EXISTS generate_blog_slug_on_approve ON public.blog_submissions;
DROP TRIGGER IF EXISTS generate_blog_slug_on_insert ON public.blog_submissions;
DROP TRIGGER IF EXISTS trg_share_slot_cap ON public.magazine_access_shares;
DROP TRIGGER IF EXISTS trg_shares_updated_at ON public.magazine_access_shares;
DROP TRIGGER IF EXISTS update_ad_enquiries_updated_at ON public.ad_enquiries;
DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON public.blog_comments;
DROP TRIGGER IF EXISTS update_blog_submissions_updated_at ON public.blog_submissions;
DROP TRIGGER IF EXISTS update_event_reviews_updated_at ON public.event_reviews;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_featured_profiles_updated_at ON public.featured_profiles;
DROP TRIGGER IF EXISTS update_magazines_updated_at ON public.magazines;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_shipping_settings_updated_at ON public.shipping_settings;
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
DROP TRIGGER IF EXISTS update_subscription_settings_updated_at ON public.subscription_settings;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_admin_role() CASCADE;
DROP FUNCTION IF EXISTS public.auto_grant_contributor_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.auto_activate_shares_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_contributor_cap() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_share_slot_cap() CASCADE;
DROP FUNCTION IF EXISTS public.generate_blog_slug() CASCADE;
DROP FUNCTION IF EXISTS public.has_magazine_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.shipping_settings CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.subscription_settings CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.ad_enquiries CASCADE;
DROP TABLE IF EXISTS public.event_reviews CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.blog_comments CASCADE;
DROP TABLE IF EXISTS public.blog_submissions CASCADE;
DROP TABLE IF EXISTS public.magazine_access_shares CASCADE;
DROP TABLE IF EXISTS public.magazine_purchases CASCADE;
DROP TABLE IF EXISTS public.magazines CASCADE;
DROP TABLE IF EXISTS public.featured_profiles CASCADE;
DROP TABLE IF EXISTS public.contributor_invites CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.blog_status CASCADE;
DROP TYPE IF EXISTS public.event_status CASCADE;
DROP TYPE IF EXISTS public.magazine_status CASCADE;
DROP TYPE IF EXISTS public.profile_type CASCADE;
DROP TYPE IF EXISTS public.share_status CASCADE;
DROP TYPE IF EXISTS public.ad_enquiry_status CASCADE;

-- ==========================================
-- 2. CREATE CUSTOM ENUMS
-- ==========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'contributor');
CREATE TYPE public.blog_status AS ENUM ('pending', 'approved', 'rejected', 'draft');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'completed');
CREATE TYPE public.magazine_status AS ENUM ('draft', 'published', 'coming_soon');
CREATE TYPE public.profile_type AS ENUM ('artist', 'curator');
CREATE TYPE public.share_status AS ENUM ('pending', 'active', 'revoked', 'expired');
CREATE TYPE public.ad_enquiry_status AS ENUM ('new', 'contacted', 'resolved');

-- ==========================================
-- 3. CREATE TABLES
-- ==========================================

-- A. Table: profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_email_length CHECK (((email IS NULL) OR (char_length(email) <= 255))),
    CONSTRAINT profiles_fullname_length CHECK (((full_name IS NULL) OR (char_length(full_name) <= 200)))
);

-- B. Table: user_roles (RBAC Mapping)
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- C. Table: contributor_invites
CREATE TABLE public.contributor_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email text NOT NULL,
    full_name text NOT NULL,
    invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    invited_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    claimed_at timestamp with time zone,
    revoked_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- D. Table: featured_profiles (Artists/Curators showcase)
CREATE TABLE public.featured_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    profile_type public.profile_type DEFAULT 'artist'::public.profile_type NOT NULL,
    short_bio text,
    image_url text,
    article_url text,
    instagram_url text,
    twitter_url text,
    linkedin_url text,
    website_url text,
    display_order integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- E. Table: magazines
CREATE TABLE public.magazines (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    issue_number integer NOT NULL,
    issue_name text NOT NULL,
    slug text NOT NULL UNIQUE,
    release_date date NOT NULL,
    tagline text,
    short_summary text,
    long_description text,
    cover_image_url text,
    single_issue_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    single_issue_price_usd numeric(10,2) DEFAULT 0.00,
    digital_pdf_price numeric(10,2) DEFAULT 299.00,
    digital_pdf_price_usd numeric(10,2) DEFAULT 10.00,
    shipping_inr numeric(10,2) DEFAULT 150.00,
    shipping_usd numeric(10,2) DEFAULT 15.00,
    pdf_url text,
    preview_pages text[] DEFAULT '{}'::text[],
    status public.magazine_status DEFAULT 'draft'::public.magazine_status NOT NULL,
    featured_artists text[] DEFAULT '{}'::text[],
    highlights text[] DEFAULT '{}'::text[],
    editor_note text,
    editor_name text,
    editor_image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    preview_page_count integer DEFAULT 5,
    preview_pdf_url text,
    total_page_count integer DEFAULT 0,
    preview_ranges jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT magazines_editor_note_length CHECK (((editor_note IS NULL) OR (char_length(editor_note) <= 5000))),
    CONSTRAINT magazines_featured_artists_limit CHECK (((array_length(featured_artists, 1) IS NULL) OR (array_length(featured_artists, 1) <= 50))),
    CONSTRAINT magazines_highlights_limit CHECK (((array_length(highlights, 1) IS NULL) OR (array_length(highlights, 1) <= 50))),
    CONSTRAINT magazines_issue_name_length CHECK ((char_length(issue_name) <= 200)),
    CONSTRAINT magazines_issue_number_positive CHECK ((issue_number >= 1)),
    CONSTRAINT magazines_long_description_length CHECK (((long_description IS NULL) OR (char_length(long_description) <= 10000))),
    CONSTRAINT magazines_price_positive CHECK ((single_issue_price >= (0)::numeric)),
    CONSTRAINT magazines_short_summary_length CHECK (((short_summary IS NULL) OR (char_length(short_summary) <= 2000))),
    CONSTRAINT magazines_slug_length CHECK ((char_length(slug) <= 200)),
    CONSTRAINT magazines_tagline_length CHECK (((tagline IS NULL) OR (char_length(tagline) <= 500)))
);

-- F. Table: payments (Transaction ledger)
CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    plan text NOT NULL, -- 'quarterly', 'annual', or 'single'
    amount numeric NOT NULL,
    currency text DEFAULT 'INR'::text,
    razorpay_order_id text,
    razorpay_payment_id text UNIQUE,
    razorpay_signature text,
    status text DEFAULT 'created'::text NOT NULL,
    address text,
    city text,
    pincode text,
    country text DEFAULT 'India'::text,
    selected_issue text, -- ID of the issue
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    latitude numeric,
    longitude numeric,
    shipping_fee numeric DEFAULT 0 NOT NULL
);

-- G. Table: magazine_purchases
CREATE TABLE public.magazine_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    magazine_id uuid NOT NULL REFERENCES public.magazines(id) ON DELETE CASCADE,
    payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
    amount numeric DEFAULT 0 NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT magazine_purchases_user_id_magazine_id_key UNIQUE (user_id, magazine_id)
);

-- H. Table: magazine_access_shares
CREATE TABLE public.magazine_access_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    purchase_id uuid NOT NULL REFERENCES public.magazine_purchases(id) ON DELETE CASCADE,
    magazine_id uuid NOT NULL REFERENCES public.magazines(id) ON DELETE CASCADE,
    owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email text NOT NULL,
    recipient_name text,
    recipient_phone text,
    recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    invite_token text NOT NULL,
    status public.share_status DEFAULT 'pending'::public.share_status NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    claimed_at timestamp with time zone,
    revoked_at timestamp with time zone,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- I. Table: blog_submissions (Journal articles)
CREATE TABLE public.blog_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    image_url text NOT NULL,
    slug text UNIQUE,
    status public.blog_status DEFAULT 'pending'::public.blog_status NOT NULL,
    admin_notes text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at timestamp with time zone,
    author_role text,
    short_description text,
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- J. Table: blog_comments
CREATE TABLE public.blog_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    blog_id uuid NOT NULL REFERENCES public.blog_submissions(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL,
    comment_text text NOT NULL,
    is_approved boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- K. Table: events
CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    short_description text,
    long_description text,
    featured_image_url text NOT NULL,
    gallery_images text[] DEFAULT '{}'::text[],
    video_url text,
    event_date date NOT NULL,
    location text NOT NULL,
    status public.event_status DEFAULT 'draft'::public.event_status NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- L. Table: event_reviews
CREATE TABLE public.event_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL,
    rating integer NOT NULL CONSTRAINT event_reviews_rating_check CHECK ((rating >= 1) AND (rating <= 5)),
    comment text,
    is_approved boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- M. Table: ad_enquiries (Advertising Inquiries)
CREATE TABLE public.ad_enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    brand text,
    email text NOT NULL,
    phone text,
    budget text,
    ad_type text,
    message text NOT NULL,
    status public.ad_enquiry_status DEFAULT 'new'::public.ad_enquiry_status NOT NULL,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- N. Table: newsletter_subscribers
CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email text NOT NULL UNIQUE,
    source text DEFAULT 'homepage'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- O. Table: shipping_settings
CREATE TABLE public.shipping_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    india_fee numeric DEFAULT 150 NOT NULL,
    international_fee numeric DEFAULT 2500 NOT NULL,
    india_free_threshold numeric DEFAULT 2000 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- P. Table: site_settings
CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    maintenance_mode boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Q. Table: subscription_settings
CREATE TABLE public.subscription_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    annual_price numeric(10,2) DEFAULT 199.00 NOT NULL,
    validity_text text DEFAULT '12 months from subscription date'::text,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    quarterly_price numeric DEFAULT 59.00 NOT NULL,
    single_issue_price numeric DEFAULT 25.00 NOT NULL,
    blog_max_words integer DEFAULT 100 NOT NULL,
    blog_min_words integer DEFAULT 75 NOT NULL,
    CONSTRAINT subscription_price_max CHECK ((annual_price <= (999999)::numeric)),
    CONSTRAINT subscription_price_positive CHECK ((annual_price >= (0)::numeric)),
    CONSTRAINT subscription_settings_quarterly_price_positive CHECK ((quarterly_price > (0)::numeric)),
    CONSTRAINT subscription_settings_single_issue_price_positive CHECK ((single_issue_price > (0)::numeric)),
    CONSTRAINT subscription_validity_length CHECK (((validity_text IS NULL) OR (char_length(validity_text) <= 500)))
);

-- ==========================================
-- 4. CREATE DATABASE INDEXES
-- ==========================================
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE UNIQUE INDEX contributor_invites_email_active_uniq ON public.contributor_invites (lower(email)) WHERE (status <> 'revoked'::text);
CREATE INDEX idx_ad_enquiries_status_created ON public.ad_enquiries (status, created_at DESC);
CREATE INDEX idx_blog_comments_blog_id ON public.blog_comments (blog_id);
CREATE INDEX idx_blog_comments_parent_id ON public.blog_comments (parent_id);
CREATE INDEX idx_event_reviews_event ON public.event_reviews (event_id, is_approved);
CREATE INDEX idx_events_status_date ON public.events (status, event_date DESC);
CREATE INDEX idx_featured_profiles_type_order ON public.featured_profiles (profile_type, display_order, created_at DESC);
CREATE INDEX idx_magazine_purchases_magazine ON public.magazine_purchases (magazine_id);
CREATE INDEX idx_magazine_purchases_user ON public.magazine_purchases (user_id);
CREATE INDEX idx_newsletter_subscribers_created_at ON public.newsletter_subscribers (created_at DESC);
CREATE INDEX idx_shares_magazine ON public.magazine_access_shares (magazine_id);
CREATE INDEX idx_shares_owner ON public.magazine_access_shares (owner_user_id);
CREATE INDEX idx_shares_purchase ON public.magazine_access_shares (purchase_id);
CREATE INDEX idx_shares_recipient_email ON public.magazine_access_shares (lower(recipient_email));
CREATE INDEX idx_shares_recipient_user ON public.magazine_access_shares (recipient_user_id);
CREATE UNIQUE INDEX uq_shares_purchase_email_active ON public.magazine_access_shares (purchase_id, lower(recipient_email)) WHERE (status <> 'revoked'::public.share_status);

-- ==========================================
-- 5. TRIGGER FUNCTIONS AND LOGIC
-- ==========================================

-- Function: Global updated_at Updater
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: Sync Profiles on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Function: Auto Assign Admin Roles
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-assign admin role to approved admin emails
  IF NEW.email IN ('karthikpbaburaj@gmail.com', 'shivam@infoartledger.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Function: Auto Grant Contributor Role on Invitation match
CREATE OR REPLACE FUNCTION public.auto_grant_contributor_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv_id uuid;
BEGIN
  SELECT id INTO inv_id FROM public.contributor_invites
  WHERE lower(email) = lower(NEW.email) AND status = 'pending'
  LIMIT 1;

  IF inv_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'contributor'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.contributor_invites
    SET status = 'active',
        invited_user_id = NEW.id,
        claimed_at = COALESCE(claimed_at, now())
    WHERE id = inv_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Function: Auto Activate Shares on Signup
CREATE OR REPLACE FUNCTION public.auto_activate_shares_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.magazine_access_shares
  SET recipient_user_id = NEW.id,
      status = 'active',
      claimed_at = COALESCE(claimed_at, now())
  WHERE lower(recipient_email) = lower(NEW.email)
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now());
  RETURN NEW;
END;
$$;

-- Function: Enforce max 5 active contributors constraint
CREATE OR REPLACE FUNCTION public.enforce_contributor_cap()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_invites int;
  active_roles int;
BEGIN
  SELECT COUNT(*) INTO active_invites
    FROM public.contributor_invites
    WHERE status IN ('pending','active')
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  SELECT COUNT(*) INTO active_roles
    FROM public.user_roles WHERE role = 'contributor'::app_role;
  IF (active_invites + active_roles) >= 5 THEN
    RAISE EXCEPTION 'Contributor limit reached: maximum 5 active contributors';
  END IF;
  RETURN NEW;
END;
$$;

-- Function: Enforce max 5 shares per purchase constraint
CREATE OR REPLACE FUNCTION public.enforce_share_slot_cap()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_count int;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM public.magazine_access_shares
  WHERE purchase_id = NEW.purchase_id
    AND status <> 'revoked'
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF active_count >= 5 THEN
    RAISE EXCEPTION 'Share limit reached: max 5 recipients per purchase';
  END IF;
  RETURN NEW;
END;
$$;

-- Function: Generate Blog Slug on approval
CREATE OR REPLACE FUNCTION public.generate_blog_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  -- Check for uniqueness and add suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.blog_submissions WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Function: Resolve User ID by Email (Definer Context)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_to_lookup text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE lower(email) = lower(email_to_lookup);
  RETURN target_id;
END;
$$;

-- Function: Check Role Utility
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function: Check Magazine Access
CREATE OR REPLACE FUNCTION public.has_magazine_access(_user_id uuid, _magazine_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
BEGIN
  IF _user_id IS NULL THEN RETURN FALSE; END IF;

  -- Direct purchase check
  IF EXISTS (
    SELECT 1 FROM public.magazine_purchases
    WHERE user_id = _user_id AND magazine_id = _magazine_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Active share check by recipient user_id
  IF EXISTS (
    SELECT 1 FROM public.magazine_access_shares
    WHERE recipient_user_id = _user_id
      AND magazine_id = _magazine_id
      AND status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Email-matched share check
  SELECT email INTO user_email FROM auth.users WHERE id = _user_id;
  IF user_email IS NULL THEN RETURN FALSE; END IF;

  IF EXISTS (
    SELECT 1 FROM public.magazine_access_shares
    WHERE lower(recipient_email) = lower(user_email)
      AND magazine_id = _magazine_id
      AND status IN ('active', 'pending')
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN TRUE;
  END IF;

  -- Active subscription check via payments table
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE email = user_email
      AND status = 'paid'
      AND plan IN ('quarterly', 'annual', 'Quarterly', 'Annual')
      AND created_at > now() - INTERVAL '1 year'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ==========================================
-- 6. TRIGGERS ASSIGNMENT
-- ==========================================
CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_admin 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();

CREATE TRIGGER on_auth_user_created_contributor
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.auto_grant_contributor_on_signup();

CREATE TRIGGER on_auth_user_created_shares
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.auto_activate_shares_on_signup();

CREATE TRIGGER contrib_invites_updated_at 
    BEFORE UPDATE ON public.contributor_invites 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER contributor_cap_trigger 
    BEFORE INSERT ON public.contributor_invites 
    FOR EACH ROW WHEN ((new.status = ANY (ARRAY['pending'::text, 'active'::text]))) 
    EXECUTE FUNCTION public.enforce_contributor_cap();

CREATE TRIGGER generate_blog_slug_on_approve 
    BEFORE UPDATE ON public.blog_submissions 
    FOR EACH ROW WHEN (((new.status = 'approved'::public.blog_status) AND ((old.status <> 'approved'::public.blog_status) OR (old.slug IS NULL)))) 
    EXECUTE FUNCTION public.generate_blog_slug();

CREATE TRIGGER generate_blog_slug_on_insert 
    BEFORE INSERT ON public.blog_submissions 
    FOR EACH ROW WHEN (((new.status = 'approved'::public.blog_status) AND (new.slug IS NULL))) 
    EXECUTE FUNCTION public.generate_blog_slug();

CREATE TRIGGER trg_share_slot_cap 
    BEFORE INSERT ON public.magazine_access_shares 
    FOR EACH ROW EXECUTE FUNCTION public.enforce_share_slot_cap();

CREATE TRIGGER trg_shares_updated_at 
    BEFORE UPDATE ON public.magazine_access_shares 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_enquiries_updated_at 
    BEFORE UPDATE ON public.ad_enquiries 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at 
    BEFORE UPDATE ON public.blog_comments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_submissions_updated_at 
    BEFORE UPDATE ON public.blog_submissions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_reviews_updated_at 
    BEFORE UPDATE ON public.event_reviews 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_featured_profiles_updated_at 
    BEFORE UPDATE ON public.featured_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_magazines_updated_at 
    BEFORE UPDATE ON public.magazines 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_settings_updated_at 
    BEFORE UPDATE ON public.shipping_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON public.site_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_settings_updated_at 
    BEFORE UPDATE ON public.subscription_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_access_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. DEFINE ROW LEVEL SECURITY POLICIES
-- ==========================================

-- profiles: Users view/update own; admins manage all; denys anonymous SELECT
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Deny anonymous profile access" ON public.profiles FOR SELECT TO anon USING (false);
CREATE POLICY "Deny profile deletion" ON public.profiles FOR DELETE USING (false);

-- user_roles: Users view own; admins manage all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- contributor_invites: Admins manage; users can select if email matches
CREATE POLICY "Admins manage contributor invites" ON public.contributor_invites TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- featured_profiles: Public view approved; admins write
CREATE POLICY "Public can view published profiles" ON public.featured_profiles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage profiles" ON public.featured_profiles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- magazines: Public select published/coming_soon; admins write
CREATE POLICY "Public can view published magazines" ON public.magazines FOR SELECT USING (((status = 'published'::public.magazine_status) OR (status = 'coming_soon'::public.magazine_status)));
CREATE POLICY "Admins can manage magazines" ON public.magazines TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- magazine_purchases: User view own; admins write
CREATE POLICY "Users can view own purchases" ON public.magazine_purchases FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage purchases" ON public.magazine_purchases TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- magazine_access_shares: Owner and recipient can view their shares; admins manage
CREATE POLICY "Owner can view own shares" ON public.magazine_access_shares FOR SELECT TO authenticated USING ((owner_user_id = auth.uid()));
CREATE POLICY "Recipient can view own shares" ON public.magazine_access_shares FOR SELECT TO authenticated USING ((recipient_user_id = auth.uid()));
CREATE POLICY "Admins manage shares" ON public.magazine_access_shares TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- blog_submissions: Public views approved; contributors submit, edit, and view own; admins manage all
CREATE POLICY "Public can view approved blogs" ON public.blog_submissions FOR SELECT USING ((status = 'approved'::public.blog_status));
CREATE POLICY "Contributors can submit blogs" ON public.blog_submissions FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'contributor'::public.app_role) AND (lower(email) = lower((auth.jwt() ->> 'email'::text)))));
CREATE POLICY "Contributors update own blogs" ON public.blog_submissions FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'contributor'::public.app_role) AND (lower(email) = lower((auth.jwt() ->> 'email'::text))))) WITH CHECK ((public.has_role(auth.uid(), 'contributor'::public.app_role) AND (lower(email) = lower((auth.jwt() ->> 'email'::text)))));
CREATE POLICY "Contributors view own blogs" ON public.blog_submissions FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'contributor'::public.app_role) AND (lower(email) = lower((auth.jwt() ->> 'email'::text)))));
CREATE POLICY "Anyone can submit blogs" ON public.blog_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage blog submissions" ON public.blog_submissions USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- blog_comments: Public views approved; anyone submits; admins manage
CREATE POLICY "Public can view approved comments" ON public.blog_comments FOR SELECT USING ((is_approved = true));
CREATE POLICY "Anyone can submit comments" ON public.blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage comments" ON public.blog_comments USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- events: Public views published; admins manage
CREATE POLICY "Public can view published events" ON public.events FOR SELECT USING ((status = 'published'::public.event_status));
CREATE POLICY "Admins can manage events" ON public.events TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- event_reviews: Public views approved; anyone submits; admins manage
CREATE POLICY "Public can view approved reviews" ON public.event_reviews FOR SELECT USING ((is_approved = true));
CREATE POLICY "Anyone can submit reviews" ON public.event_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage reviews" ON public.event_reviews TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ad_enquiries: Anyone submits; admins manage
CREATE POLICY "Anyone can submit enquiries" ON public.ad_enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage enquiries" ON public.ad_enquiries TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- newsletter_subscribers: Anyone submits; admins manage
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- shipping_settings: Anyone views; admins manage
CREATE POLICY "Anyone can view active shipping settings" ON public.shipping_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping settings" ON public.shipping_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- site_settings: Public views; admins manage
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.site_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- subscription_settings: Public views active; admins manage
CREATE POLICY "Public can view active subscription settings" ON public.subscription_settings FOR SELECT USING ((is_active = true));
CREATE POLICY "Admins can manage subscription settings" ON public.subscription_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- payments: Public can insert; admins manage
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage payments" ON public.payments TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
