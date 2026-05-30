-- Bolão Copa VTP — Schema Supabase
-- Executar no SQL Editor: https://supabase.com/dashboard/project/wdfecydgdzwwxxrncdqx

-- Participantes
CREATE TABLE IF NOT EXISTS bolao_participants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  cpf          text UNIQUE NOT NULL,
  email        text,
  phone        text,
  total_points int  NOT NULL DEFAULT 0,
  exact_scores int  NOT NULL DEFAULT 0, -- contador de placares exatos (para calcular cupom progressivo)
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Jogos da Copa (admin cadastra)
CREATE TABLE IF NOT EXISTS bolao_matches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase       text NOT NULL, -- 'groups' | 'r16' | 'qf' | 'sf' | 'final'
  phase_label text NOT NULL, -- 'Fase de Grupos' | 'Oitavas' | 'Quartas' | 'Semi' | 'Final'
  home_team   text NOT NULL,
  away_team   text NOT NULL,
  home_flag   text, -- emoji da bandeira
  away_flag   text,
  is_brazil   boolean NOT NULL DEFAULT false, -- jogo do Brasil = pontos x3 e cupom R$30
  match_date  timestamptz NOT NULL,
  score_home  int,  -- null até encerrar
  score_away  int,
  status      text NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'live' | 'finished'
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Palpites
CREATE TABLE IF NOT EXISTS bolao_predictions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES bolao_participants(id) ON DELETE CASCADE,
  match_id       uuid NOT NULL REFERENCES bolao_matches(id) ON DELETE CASCADE,
  pred_home      int  NOT NULL,
  pred_away      int  NOT NULL,
  points_earned  int  NOT NULL DEFAULT 0,
  is_exact       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, match_id)
);

-- Cupons
CREATE TABLE IF NOT EXISTS bolao_coupons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES bolao_participants(id) ON DELETE CASCADE,
  match_id       uuid REFERENCES bolao_matches(id),
  code           text UNIQUE NOT NULL,
  type           text NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_pct   int,   -- preenchido quando type='percent'
  discount_brl   numeric(10,2), -- preenchido quando type='fixed'
  issued_at      timestamptz NOT NULL DEFAULT now(),
  redeemed_at    timestamptz,
  redeemed_by    text
);

-- ─── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE bolao_matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_predictions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_coupons       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_read"          ON bolao_matches      FOR SELECT USING (true);
CREATE POLICY "participants_insert"   ON bolao_participants  FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_read"     ON bolao_participants  FOR SELECT USING (true);
CREATE POLICY "participants_update"   ON bolao_participants  FOR UPDATE USING (true);
CREATE POLICY "predictions_insert"    ON bolao_predictions   FOR INSERT WITH CHECK (true);
CREATE POLICY "predictions_read"      ON bolao_predictions   FOR SELECT USING (true);
CREATE POLICY "predictions_update"    ON bolao_predictions   FOR UPDATE USING (true);
CREATE POLICY "coupons_insert"        ON bolao_coupons       FOR INSERT WITH CHECK (true);
CREATE POLICY "coupons_read"          ON bolao_coupons       FOR SELECT USING (true);
CREATE POLICY "coupons_update"        ON bolao_coupons       FOR UPDATE USING (true);

-- ─── FUNÇÕES ──────────────────────────────────────────────────────────────────

-- Calcula pontos de um palpite
CREATE OR REPLACE FUNCTION bolao_calc_points(
  p_pred_home int, p_pred_away int,
  p_score_home int, p_score_away int,
  p_is_brazil boolean
) RETURNS TABLE(pts int, is_exact boolean) LANGUAGE plpgsql AS $$
DECLARE
  base int := 0;
  exact bool := false;
BEGIN
  IF p_pred_home = p_score_home AND p_pred_away = p_score_away THEN
    base := 10; exact := true;
  ELSIF (p_pred_home - p_pred_away) = (p_score_home - p_score_away) THEN
    base := 7;
  ELSIF SIGN(p_pred_home - p_pred_away) = SIGN(p_score_home - p_score_away) THEN
    base := 5;
  END IF;
  IF p_is_brazil THEN base := base * 3; END IF;
  RETURN QUERY SELECT base, exact;
END;
$$;

-- Desconto progressivo baseado no contador de placares exatos
CREATE OR REPLACE FUNCTION bolao_coupon_pct(exact_count int) RETURNS int LANGUAGE sql AS $$
  SELECT CASE
    WHEN exact_count >= 5 THEN 50
    WHEN exact_count = 4  THEN 40
    WHEN exact_count = 3  THEN 30
    WHEN exact_count = 2  THEN 20
    ELSE 10
  END;
$$;

-- Encerra jogo, calcula pontos e emite cupons
CREATE OR REPLACE FUNCTION bolao_close_match(
  p_match_id   uuid,
  p_score_home int,
  p_score_away int
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec    record;
  calc   record;
  is_br  boolean;
  pct    int;
BEGIN
  -- Encerra o jogo
  UPDATE bolao_matches
  SET score_home = p_score_home, score_away = p_score_away, status = 'finished'
  WHERE id = p_match_id
  RETURNING is_brazil INTO is_br;

  -- Para cada palpite deste jogo
  FOR rec IN
    SELECT * FROM bolao_predictions WHERE match_id = p_match_id
  LOOP
    SELECT * INTO calc FROM bolao_calc_points(
      rec.pred_home, rec.pred_away,
      p_score_home, p_score_away,
      is_br
    );

    -- Atualiza pontos do palpite
    UPDATE bolao_predictions
    SET points_earned = calc.pts, is_exact = calc.is_exact
    WHERE id = rec.id;

    -- Se acertou algo, atualiza total do participante
    IF calc.pts > 0 THEN
      UPDATE bolao_participants
      SET total_points = total_points + calc.pts
      WHERE id = rec.participant_id;
    END IF;

    -- Cupom por placar exato em jogo normal (% progressivo)
    IF calc.is_exact AND NOT is_br THEN
      -- Incrementa contador de exatos
      UPDATE bolao_participants
      SET exact_scores = exact_scores + 1
      WHERE id = rec.participant_id
      RETURNING exact_scores INTO pct;

      pct := bolao_coupon_pct(pct);

      INSERT INTO bolao_coupons (participant_id, match_id, code, type, discount_pct)
      VALUES (
        rec.participant_id, p_match_id,
        'VTP-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
        'percent', pct
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Cupom fixo R$30 por placar exato em jogo do Brasil
    IF calc.is_exact AND is_br THEN
      INSERT INTO bolao_coupons (participant_id, match_id, code, type, discount_brl)
      VALUES (
        rec.participant_id, p_match_id,
        'VTP-BR-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6)),
        'fixed', 30.00
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
