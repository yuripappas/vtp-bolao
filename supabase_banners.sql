-- ================================================================
-- Bolão Copa VTP — Migração: Banners + Cupons com códigos fixos
-- Executar no SQL Editor do Supabase
-- ================================================================

-- 1. Tabela de banners editáveis pelo admin
CREATE TABLE IF NOT EXISTS bolao_banners (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  subtitle      text,
  cta_text      text,
  bg_gradient   text NOT NULL DEFAULT 'linear-gradient(135deg, #6B21D4 0%, #9333EA 100%)',
  emoji         text DEFAULT '⚽',
  is_active     boolean NOT NULL DEFAULT true,
  display_order int     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bolao_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners_read"   ON bolao_banners FOR SELECT USING (true);
CREATE POLICY "banners_insert" ON bolao_banners FOR INSERT WITH CHECK (true);
CREATE POLICY "banners_update" ON bolao_banners FOR UPDATE USING (true);
CREATE POLICY "banners_delete" ON bolao_banners FOR DELETE USING (true);

-- 2. Banners padrão (identidade VTP + regras do bolão)
INSERT INTO bolao_banners (title, subtitle, cta_text, bg_gradient, emoji, display_order) VALUES
(
  'Crave o placar, ganhe desconto!',
  'A cada placar exato você sobe de nível: 10%, 20%, 30%, 40% até 50% off na pizza',
  'Ver jogos',
  'linear-gradient(135deg, #6B21D4 0%, #9333EA 60%, #F5A800 100%)',
  '⚽',
  0
),
(
  'Jogo do Brasil vale R$30!',
  'Crave o placar de qualquer jogo da Seleção e ganhe R$30 de desconto na sua pizza',
  'Palpitar agora',
  'linear-gradient(135deg, #166534 0%, #16A34A 100%)',
  '🇧🇷',
  1
),
(
  '5 placares exatos = 50% de desconto!',
  'O desconto cresce a cada acerto: use seu cupom e volte pra cravar mais',
  'Ver ranking',
  'linear-gradient(135deg, #D97706 0%, #F5A800 100%)',
  '🏆',
  2
),
(
  '1º lugar ganha 1 ano de pizza grátis!',
  '12 meses, 1 pizza por mês, retirada no local — seja o campeão do bolão',
  'Ver ranking',
  'linear-gradient(135deg, #1A0A2E 0%, #4C1D95 50%, #6B21D4 100%)',
  '🍕',
  3
);

-- 3. Remover unicidade do código do cupom (múltiplos participantes podem ter o mesmo código de desconto)
ALTER TABLE bolao_coupons DROP CONSTRAINT IF EXISTS bolao_coupons_code_key;

-- Garantir unicidade por participante + jogo (não por código)
ALTER TABLE bolao_coupons DROP CONSTRAINT IF EXISTS bolao_coupons_participant_match_unique;
ALTER TABLE bolao_coupons ADD CONSTRAINT bolao_coupons_participant_match_unique
  UNIQUE (participant_id, match_id);

-- 4. Função: retorna código de cupom baseado no nível de acertos
CREATE OR REPLACE FUNCTION bolao_coupon_code(exact_count int) RETURNS text LANGUAGE sql AS $$
  SELECT CASE
    WHEN exact_count >= 5 THEN 'VAITERSORTE50'
    WHEN exact_count = 4  THEN 'VAITERTIME40'
    WHEN exact_count = 3  THEN 'VAITERJOGO30'
    WHEN exact_count = 2  THEN 'VAITERGOL20'
    ELSE 'VAITERCOPA10'
  END;
$$;

-- 5. Atualiza bolao_close_match para usar códigos fixos
CREATE OR REPLACE FUNCTION bolao_close_match(
  p_match_id   uuid,
  p_score_home int,
  p_score_away int
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec          record;
  calc         record;
  is_br        boolean;
  new_exact    int;
  pct          int;
  code_text    text;
BEGIN
  UPDATE bolao_matches
  SET score_home = p_score_home, score_away = p_score_away, status = 'finished'
  WHERE id = p_match_id
  RETURNING is_brazil INTO is_br;

  FOR rec IN
    SELECT * FROM bolao_predictions WHERE match_id = p_match_id
  LOOP
    SELECT * INTO calc FROM bolao_calc_points(
      rec.pred_home, rec.pred_away,
      p_score_home, p_score_away,
      is_br
    );

    UPDATE bolao_predictions
    SET points_earned = calc.pts, is_exact = calc.is_exact
    WHERE id = rec.id;

    IF calc.pts > 0 THEN
      UPDATE bolao_participants
      SET total_points = total_points + calc.pts
      WHERE id = rec.participant_id;
    END IF;

    -- Cupom % progressivo para jogo normal
    IF calc.is_exact AND NOT is_br THEN
      UPDATE bolao_participants
      SET exact_scores = exact_scores + 1
      WHERE id = rec.participant_id
      RETURNING exact_scores INTO new_exact;

      pct       := bolao_coupon_pct(new_exact);
      code_text := bolao_coupon_code(new_exact);

      INSERT INTO bolao_coupons (participant_id, match_id, code, type, discount_pct)
      VALUES (rec.participant_id, p_match_id, code_text, 'percent', pct)
      ON CONFLICT (participant_id, match_id) DO NOTHING;
    END IF;

    -- Cupom R$30 fixo para jogo do Brasil
    IF calc.is_exact AND is_br THEN
      INSERT INTO bolao_coupons (participant_id, match_id, code, type, discount_brl)
      VALUES (rec.participant_id, p_match_id, 'VAIBRASIL', 'fixed', 30.00)
      ON CONFLICT (participant_id, match_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
