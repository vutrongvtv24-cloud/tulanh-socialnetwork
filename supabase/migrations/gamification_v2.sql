-- =============================================
-- GAMIFICATION V2 - COMPLETE OVERHAUL
-- New XP System, Level Bonuses, Image Limits, Daily Check-in
-- =============================================

-- ============================================
-- 1. CREATE NEW TABLES
-- ============================================

-- 1.1 Daily Check-ins Table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    checkin_date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, checkin_date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkins" ON public.daily_checkins 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkins" ON public.daily_checkins 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 1.2 Shares Table (for tracking share XP)
CREATE TABLE IF NOT EXISTS public.shares (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    platform text, -- 'facebook', 'twitter', 'copy_link', etc
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id) -- One share per user per post
);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shares" ON public.shares FOR SELECT USING (true);
CREATE POLICY "Auth users can share" ON public.shares 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. DAILY CHECK-IN FUNCTION (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION public.perform_daily_checkin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today date := CURRENT_DATE;
    already_checked boolean;
BEGIN
    -- Check if already checked in today
    SELECT EXISTS(
        SELECT 1 FROM public.daily_checkins 
        WHERE user_id = auth.uid() AND checkin_date = today
    ) INTO already_checked;

    IF already_checked THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Bạn đã điểm danh hôm nay rồi!',
            'xp_gained', 0
        );
    END IF;

    -- Insert check-in record
    INSERT INTO public.daily_checkins (user_id, checkin_date) 
    VALUES (auth.uid(), today);

    -- Award +3 XP
    UPDATE public.profiles SET xp = xp + 3 WHERE id = auth.uid();

    RETURN json_build_object(
        'success', true, 
        'message', 'Điểm danh thành công! +3 XP',
        'xp_gained', 3
    );
END;
$$;

-- Function to check if user has checked in today
CREATE OR REPLACE FUNCTION public.has_checked_in_today()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.daily_checkins 
        WHERE user_id = auth.uid() AND checkin_date = CURRENT_DATE
    );
END;
$$;

-- ============================================
-- 3. IMAGE POST LIMIT ENFORCER
-- ============================================
CREATE OR REPLACE FUNCTION public.check_image_post_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_level int;
    post_count int;
    start_time timestamptz;
    limit_count int;
    limit_period text;
BEGIN
    -- Only check if post has image
    IF NEW.image_url IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user level
    SELECT level INTO user_level FROM public.profiles WHERE id = NEW.user_id;
    IF user_level IS NULL THEN user_level := 1; END IF;

    -- Define limits based on level
    IF user_level = 1 THEN
        limit_count := 3;
        start_time := now() - interval '7 days';
        limit_period := '7 ngày';
    ELSIF user_level = 2 THEN
        limit_count := 5;
        start_time := now() - interval '7 days';
        limit_period := '7 ngày';
    ELSIF user_level IN (3, 4) THEN
        limit_count := 2;
        start_time := now() - interval '1 day';
        limit_period := 'ngày';
    ELSE
        -- Level 5: Unlimited
        RETURN NEW;
    END IF;

    -- Count image posts in time window
    SELECT count(*) INTO post_count
    FROM public.posts
    WHERE user_id = NEW.user_id
      AND image_url IS NOT NULL
      AND created_at > start_time;

    IF post_count >= limit_count THEN
        RAISE EXCEPTION 'Bạn đã đạt giới hạn đăng ảnh (% bài/%). Hãy nâng cấp Level để được đăng nhiều hơn!', limit_count, limit_period;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_image_limit ON public.posts;
CREATE TRIGGER tr_check_image_limit
    BEFORE INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_image_post_limit();

-- ============================================
-- 4. XP AWARD TRIGGERS
-- ============================================

-- 4.1 Award XP when creating a post (+5 XP)
CREATE OR REPLACE FUNCTION public.award_xp_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles SET xp = xp + 5 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_award_xp_post ON public.posts;
CREATE TRIGGER tr_award_xp_post
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.award_xp_post();

-- 4.2 Award XP when receiving a like (+1 XP to post owner)
CREATE OR REPLACE FUNCTION public.award_xp_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id uuid;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
    
    -- Don't award self-likes
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        UPDATE public.profiles SET xp = xp + 1 WHERE id = post_owner_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_award_xp_like ON public.likes;
CREATE TRIGGER tr_award_xp_like
    AFTER INSERT ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.award_xp_like();

-- 4.3 Award XP for comments (+2 XP to post owner, +1 XP to commenter)
CREATE OR REPLACE FUNCTION public.award_xp_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id uuid;
    is_first_comment boolean;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
    
    -- Award commenter +1 XP for activity
    UPDATE public.profiles SET xp = xp + 1 WHERE id = NEW.user_id;

    -- Award post owner +2 XP (only for FIRST comment from each unique user)
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        SELECT NOT EXISTS (
            SELECT 1 FROM public.comments 
            WHERE post_id = NEW.post_id 
              AND user_id = NEW.user_id 
              AND id != NEW.id
        ) INTO is_first_comment;
        
        IF is_first_comment THEN
            UPDATE public.profiles SET xp = xp + 2 WHERE id = post_owner_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_award_xp_comment ON public.comments;
CREATE TRIGGER tr_award_xp_comment
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.award_xp_comment();

-- 4.4 Award XP when receiving a share (+3 XP to post owner)
CREATE OR REPLACE FUNCTION public.award_xp_share()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id uuid;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
    
    -- Don't award self-shares
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        UPDATE public.profiles SET xp = xp + 3 WHERE id = post_owner_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_award_xp_share ON public.shares;
CREATE TRIGGER tr_award_xp_share
    AFTER INSERT ON public.shares
    FOR EACH ROW
    EXECUTE FUNCTION public.award_xp_share();

-- ============================================
-- 5. AUTO LEVEL CALCULATION WITH BONUS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_level_from_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_level int;
    bonus_xp int := 0;
BEGIN
    -- Calculate level based on NEW XP
    -- Thresholds: Lv2=500, Lv3=1000, Lv4=2500, Lv5=5000
    IF NEW.xp >= 5000 THEN new_level := 5;
    ELSIF NEW.xp >= 2500 THEN new_level := 4;
    ELSIF NEW.xp >= 1000 THEN new_level := 3;
    ELSIF NEW.xp >= 500 THEN new_level := 2;
    ELSE new_level := 1;
    END IF;

    -- Check if leveled up
    IF new_level > OLD.level THEN
        -- Determine bonus XP for the new level reached
        IF new_level = 2 THEN bonus_xp := 50;
        ELSIF new_level = 3 THEN bonus_xp := 80;
        ELSIF new_level = 4 THEN bonus_xp := 150;
        ELSIF new_level = 5 THEN bonus_xp := 300;
        END IF;
        
        -- Add bonus to XP
        IF bonus_xp > 0 THEN
            NEW.xp := NEW.xp + bonus_xp;
        END IF;

        -- Recalculate level in case bonus pushes to next tier
        IF NEW.xp >= 5000 THEN new_level := 5;
        ELSIF NEW.xp >= 2500 THEN new_level := 4;
        ELSIF NEW.xp >= 1000 THEN new_level := 3;
        ELSIF NEW.xp >= 500 THEN new_level := 2;
        ELSE new_level := 1;
        END IF;
    END IF;

    -- Update level
    NEW.level := new_level;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_update_level ON public.profiles;
CREATE TRIGGER tr_update_level
    BEFORE UPDATE OF xp ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_level_from_xp();

-- ============================================
-- 6. RECALCULATE EXISTING USERS' LEVELS
-- ============================================
-- Run this to sync all existing users to new level thresholds
UPDATE public.profiles SET level = 
    CASE 
        WHEN xp >= 5000 THEN 5
        WHEN xp >= 2500 THEN 4
        WHEN xp >= 1000 THEN 3
        WHEN xp >= 500 THEN 2
        ELSE 1
    END;

-- ============================================
-- DONE! Summary:
-- - Daily check-in: +3 XP
-- - Post: +5 XP
-- - Receive Like: +1 XP
-- - Receive Comment: +2 XP (first per user)
-- - Give Comment: +1 XP
-- - Receive Share: +3 XP
-- - Level Up Bonus: 50/80/150/300 XP
-- - Image Limits: L1=3/week, L2=5/week, L3-4=2/day, L5=unlimited
-- ============================================
