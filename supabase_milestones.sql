-- ============================================================
-- BOLÃO VTP — Milestone Coupons + image_url in banners
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Add image_url column to bolao_banners (safe if already exists)
ALTER TABLE bolao_banners
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- 2. Drop old per-exact coupon function (replaced by milestone system)
DROP FUNCTION IF EXISTS bolao_coupon_code(integer, boolean);
DROP FUNCTION IF EXISTS bolao_coupon_pct(integer);

-- 3. Milestone discount function (mirrors COUPON_MILESTONES in utils.js)
CREATE OR REPLACE FUNCTION bolao_milestone_pct(exact_count integer)
RETURNS integer LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF exact_count >= 45 THEN RETURN 50;
  ELSIF exact_count >= 30 THEN RETURN 40;
  ELSIF exact_count >= 20 THEN RETURN 30;
  ELSIF exact_count >= 12 THEN RETURN 20;
  ELSIF exact_count >=  5 THEN RETURN 10;
  ELSE RETURN 0;
  END IF;
END;
$$;

-- 4. Milestone name function
CREATE OR REPLACE FUNCTION bolao_milestone_level(exact_count integer)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF exact_count >= 45 THEN RETURN 'Campeão';
  ELSIF exact_count >= 30 THEN RETURN 'Lendário';
  ELSIF exact_count >= 20 THEN RETURN 'Fera';
  ELSIF exact_count >= 12 THEN RETURN 'Craque';
  ELSIF exact_count >=  5 THEN RETURN 'Estreante';
  ELSE RETURN NULL;
  END IF;
END;
$$;

-- 5. Updated bolao_close_match using milestone system
--    Called by admin when entering final score for a match
CREATE OR REPLACE FUNCTION bolao_close_match(
  p_match_id   uuid,
  p_score_home integer,
  p_score_away integer
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pred RECORD;
  pts  integer;
  is_ex boolean;
  prev_exact integer;
  new_exact  integer;
  prev_pct   integer;
  new_pct    integer;
  home_wins  boolean := p_score_home > p_score_away;
  draw       boolean := p_score_home = p_score_away;
  is_brazil  boolean;
BEGIN
  -- Mark match as finished
  UPDATE bolao_matches
  SET status = 'finished', score_home = p_score_home, score_away = p_score_away
  WHERE id = p_match_id;

  SELECT is_brazil INTO is_brazil FROM bolao_matches WHERE id = p_match_id;

  -- Score each prediction
  FOR pred IN
    SELECT * FROM bolao_predictions WHERE match_id = p_match_id
  LOOP
    is_ex := (pred.pred_home = p_score_home AND pred.pred_away = p_score_away);

    IF is_ex THEN
      pts := CASE WHEN is_brazil THEN 30 ELSE 10 END;
    ELSIF (pred.pred_home > pred.pred_away) = home_wins AND NOT draw AND NOT (pred.pred_home = pred.pred_away) THEN
      pts := 5;
    ELSIF draw AND pred.pred_home = pred.pred_away THEN
      pts := 5;
    ELSE
      pts := 0;
    END IF;

    UPDATE bolao_predictions
    SET points_earned = pts, is_exact = is_ex
    WHERE id = pred.id;

    -- Update participant totals
    SELECT exact_scores INTO prev_exact FROM bolao_participants WHERE id = pred.participant_id;
    new_exact := prev_exact + (CASE WHEN is_ex THEN 1 ELSE 0 END);

    UPDATE bolao_participants
    SET total_points = total_points + pts,
        exact_scores = new_exact
    WHERE id = pred.participant_id;

    -- Brazil exact: fixed R$30 coupon (one per match per participant)
    IF is_ex AND is_brazil THEN
      INSERT INTO bolao_coupons (participant_id, match_id, type, discount_brl, discount_pct, code)
      VALUES (pred.participant_id, p_match_id, 'fixed', 30, 0,
              'VAIBRASIL-' || upper(substr(pred.participant_id::text, 1, 6)))
      ON CONFLICT (participant_id, match_id) DO NOTHING;
    END IF;

    -- Milestone: issue pct coupon when crossing a new threshold
    prev_pct := bolao_milestone_pct(prev_exact);
    new_pct  := bolao_milestone_pct(new_exact);

    IF new_pct > prev_pct THEN
      INSERT INTO bolao_coupons (participant_id, match_id, type, discount_brl, discount_pct, code)
      VALUES (pred.participant_id, p_match_id, 'pct', 0, new_pct,
              bolao_milestone_level(new_exact) || '-' || upper(substr(pred.participant_id::text, 1, 6)))
      ON CONFLICT DO NOTHING;
    END IF;

  END LOOP;
END;
$$;
