-- ==========================================
-- LOSTLINK DATABASE SETUP FOR SUPABASE
-- Complete SQL Schema, Policies & RLS Rules
-- Idempotent Version: Safe to run multiple times
-- ==========================================

-- 1. PROFILES TABLE
-- Syncs automatically with Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE
);

-- Idempotent column check for existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- Enable Row Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies safely created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are visible to everyone') THEN
    CREATE POLICY "Public profiles are visible to everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END$$;


-- 2. ITEMS TABLE
-- Stores lost and found postings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_type_enum') THEN
    CREATE TYPE item_type_enum AS ENUM ('lost', 'found');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status_enum') THEN
    CREATE TYPE item_status_enum AS ENUM ('lost', 'found', 'claimed', 'resolved');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
  type item_type_enum NOT NULL,
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  status item_status_enum NOT NULL DEFAULT 'lost',
  reward TEXT,
  date_event DATE NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Items Policies safely created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active items list') THEN
    CREATE POLICY "Anyone can view active items list" ON public.items FOR SELECT USING (status != 'resolved' OR auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Logged in users can create item listings') THEN
    CREATE POLICY "Logged in users can create item listings" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can modify their own item listings') THEN
    CREATE POLICY "Owners can modify their own item listings" ON public.items FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners or administrators can delete items') THEN
    CREATE POLICY "Owners or administrators can delete items" ON public.items FOR DELETE USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
  END IF;
END$$;


-- 3. CLAIMS TABLE
-- Stores ownership claims submitted by claimants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status_enum') THEN
    CREATE TYPE claim_status_enum AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  claimant_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
  verification_answer TEXT NOT NULL,
  status claim_status_enum DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_claimant_item UNIQUE (item_id, claimant_id)
);

-- Enable RLS on Claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Claims Policies safely created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners of items and claimants can read claims') THEN
    CREATE POLICY "Owners of items and claimants can read claims" ON public.claims FOR SELECT USING (
      auth.uid() = claimant_id OR auth.uid() = (SELECT user_id FROM public.items WHERE id = item_id)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Logged in users can insert claim verification') THEN
    CREATE POLICY "Logged in users can insert claim verification" ON public.claims FOR INSERT WITH CHECK (
      auth.uid() = claimant_id AND auth.uid() != (SELECT user_id FROM public.items WHERE id = item_id)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Item owners can update claims state (accept/reject)') THEN
    CREATE POLICY "Item owners can update claims state (accept/reject)" ON public.claims FOR UPDATE USING (
      auth.uid() = (SELECT user_id FROM public.items WHERE id = item_id)
    );
  END IF;
END$$;


-- 4. MESSAGES TABLE
-- Encapsulates secure chat exchanges
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages Policies safely created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Senders and receivers can select messages') THEN
    CREATE POLICY "Senders and receivers can select messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'A participant can send messages in active conversations') THEN
    CREATE POLICY "A participant can send messages in active conversations" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
  END IF;
END$$;


-- 5. SUSPICIOUS CLAIMS REPORTS (Moderation Safeguard)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reports Policies safely created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only administrators can read reports') THEN
    CREATE POLICY "Only administrators can read reports" ON public.reports FOR SELECT USING (
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Logged in users can report claims') THEN
    CREATE POLICY "Logged in users can report claims" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  END IF;
END$$;


-- ==========================================
-- AUTOMATION: PROFILE GENERATOR TRIGGER (Auth sync)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, gender, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student User'),
    new.email,
    CASE 
      WHEN COALESCE(new.raw_user_meta_data->>'gender', 'Male') = 'Male' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || encode(new.id::text::bytea, 'hex') || '&top=shortHair'
      WHEN COALESCE(new.raw_user_meta_data->>'gender', 'Male') = 'Female' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || encode(new.id::text::bytea, 'hex') || '&top=longHair&facialHairProbability=0'
      ELSE 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || encode(new.id::text::bytea, 'hex') || '&top=shortHair'
    END,
    COALESCE(new.raw_user_meta_data->>'gender', 'Male'),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;


-- ==========================================
-- INSERT INITIAL SEED SAFE ZONES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.safe_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(100) NOT NULL
);

-- Seed data securely (prevent duplicate entries)
INSERT INTO public.safe_zones (name, description, location)
SELECT name, description, location FROM (
  VALUES 
    ('Main Cafeteria Lounge', 'Central canteen adjacent to security counters.', 'Building A, Floor 1'),
    ('Academic Plaza Bus Stand', 'Near heavily traversed student gates.', 'Central Campus Boulevard'),
    ('Central Library LobbyDesk', 'Supervised 24/7 by librarians and CCTV.', 'Dean Plaza Building B'),
    ('Student Hostel Guard Post', 'Primary warden reception area monitored constantly.', 'Girls Block Resident Entrance')
) AS seed(name, description, location)
WHERE NOT EXISTS (
  SELECT 1 FROM public.safe_zones WHERE safe_zones.name = seed.name
);


-- ==========================================
-- 6. NOTIFICATIONS TABLE
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
    CREATE TYPE notification_type_enum AS ENUM ('message', 'claim', 'claim_update', 'report', 'item_match');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type_enum NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications') THEN
    CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert notifications') THEN
    CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;
END$$;


-- ==========================================
-- 7. ACTIVITIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Activities are visible to everyone') THEN
    CREATE POLICY "Activities are visible to everyone" ON public.activities FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert activities') THEN
    CREATE POLICY "Anyone can insert activities" ON public.activities FOR INSERT WITH CHECK (true);
  END IF;
END$$;


-- ==========================================
-- 8. STORAGE CONFIGURATION
-- ==========================================
-- Create public bucket 'item-images' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow authenticated upload access') THEN
    CREATE POLICY "Allow authenticated upload access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');
  END IF;
END$$;

