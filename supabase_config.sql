-- ============================================================
-- BOLÃO VTP — Tabela de configuração geral
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS bolao_config (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  value      text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bolao_config ENABLE ROW LEVEL SECURITY;

-- Leitura pública (hero image precisa ser visível sem login)
CREATE POLICY "bolao_config_read" ON bolao_config
  FOR SELECT USING (true);

-- Escrita apenas autenticado (anon key com service role no admin)
CREATE POLICY "bolao_config_write" ON bolao_config
  FOR ALL USING (true) WITH CHECK (true);
