-- ================================================================
-- FASE DE GRUPOS — Copa do Mundo 2026
-- 72 jogos · Grupos A a L
-- Horários em UTC (BRT = UTC-3 · ex: 22h UTC = 19h BRT)
-- Jogos do Brasil com horários confirmados pela FIFA
-- ================================================================

INSERT INTO bolao_matches (phase, phase_label, home_team, away_team, home_flag, away_flag, is_brazil, match_date) VALUES

-- ── GRUPO A: México · África do Sul · Coreia do Sul · Tchéquia ──────────────
('groups','Grupo A','México','África do Sul','🇲🇽','🇿🇦',false,'2026-06-11T22:00:00+00'),
('groups','Grupo A','Coreia do Sul','Tchéquia','🇰🇷','🇨🇿',false,'2026-06-12T01:00:00+00'),
('groups','Grupo A','México','Coreia do Sul','🇲🇽','🇰🇷',false,'2026-06-18T22:00:00+00'),
('groups','Grupo A','África do Sul','Tchéquia','🇿🇦','🇨🇿',false,'2026-06-19T01:00:00+00'),
('groups','Grupo A','México','Tchéquia','🇲🇽','🇨🇿',false,'2026-06-25T22:00:00+00'),
('groups','Grupo A','Coreia do Sul','África do Sul','🇰🇷','🇿🇦',false,'2026-06-25T22:00:00+00'),

-- ── GRUPO B: Canadá · Bósnia · Qatar · Suíça ────────────────────────────────
('groups','Grupo B','Canadá','Qatar','🇨🇦','🇶🇦',false,'2026-06-12T19:00:00+00'),
('groups','Grupo B','Bósnia','Suíça','🇧🇦','🇨🇭',false,'2026-06-12T22:00:00+00'),
('groups','Grupo B','Canadá','Bósnia','🇨🇦','🇧🇦',false,'2026-06-19T19:00:00+00'),
('groups','Grupo B','Qatar','Suíça','🇶🇦','🇨🇭',false,'2026-06-19T22:00:00+00'),
('groups','Grupo B','Canadá','Suíça','🇨🇦','🇨🇭',false,'2026-06-25T19:00:00+00'),
('groups','Grupo B','Qatar','Bósnia','🇶🇦','🇧🇦',false,'2026-06-25T19:00:00+00'),

-- ── GRUPO C: Brasil · Marrocos · Haiti · Escócia ────────────────────────────
-- Horários confirmados pela FIFA (BRT → UTC)
-- Brasil x Marrocos: 13/06 às 19h BRT = 22h UTC
-- Haiti x Escócia:   13/06 às 16h BRT = 19h UTC
-- Marrocos x Escócia:19/06 às 16h BRT = 19h UTC
-- Brasil x Haiti:    19/06 às 22h BRT = 20/06 01h UTC
-- Brasil x Escócia:  24/06 às 19h BRT = 22h UTC  ← simultâneo com abaixo
-- Marrocos x Haiti:  24/06 às 19h BRT = 22h UTC
('groups','Grupo C','Brasil','Marrocos','🇧🇷','🇲🇦',true, '2026-06-13T22:00:00+00'),
('groups','Grupo C','Haiti','Escócia', '🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿',false,'2026-06-13T19:00:00+00'),
('groups','Grupo C','Brasil','Haiti',   '🇧🇷','🇭🇹', true, '2026-06-20T01:00:00+00'),
('groups','Grupo C','Marrocos','Escócia','🇲🇦','🏴󠁧󠁢󠁳󠁣󠁴󠁿',false,'2026-06-19T19:00:00+00'),
('groups','Grupo C','Brasil','Escócia', '🇧🇷','🏴󠁧󠁢󠁳󠁣󠁴󠁿',true, '2026-06-24T22:00:00+00'),
('groups','Grupo C','Marrocos','Haiti', '🇲🇦','🇭🇹', false,'2026-06-24T22:00:00+00'),

-- ── GRUPO D: EUA · Paraguai · Austrália · Turquia ───────────────────────────
('groups','Grupo D','EUA','Paraguai','🇺🇸','🇵🇾',false,'2026-06-12T23:00:00+00'),
('groups','Grupo D','Austrália','Turquia','🇦🇺','🇹🇷',false,'2026-06-13T02:00:00+00'),
('groups','Grupo D','EUA','Austrália','🇺🇸','🇦🇺',false,'2026-06-19T23:00:00+00'),
('groups','Grupo D','Paraguai','Turquia','🇵🇾','🇹🇷',false,'2026-06-20T02:00:00+00'),
('groups','Grupo D','EUA','Turquia','🇺🇸','🇹🇷',false,'2026-06-25T23:00:00+00'),
('groups','Grupo D','Paraguai','Austrália','🇵🇾','🇦🇺',false,'2026-06-25T23:00:00+00'),

-- ── GRUPO E: Alemanha · Curaçao · Costa do Marfim · Equador ─────────────────
('groups','Grupo E','Alemanha','Costa do Marfim','🇩🇪','🇨🇮',false,'2026-06-14T19:00:00+00'),
('groups','Grupo E','Curaçao','Equador','🇨🇼','🇪🇨',false,'2026-06-14T22:00:00+00'),
('groups','Grupo E','Alemanha','Curaçao','🇩🇪','🇨🇼',false,'2026-06-20T19:00:00+00'),
('groups','Grupo E','Costa do Marfim','Equador','🇨🇮','🇪🇨',false,'2026-06-20T22:00:00+00'),
('groups','Grupo E','Alemanha','Equador','🇩🇪','🇪🇨',false,'2026-06-26T19:00:00+00'),
('groups','Grupo E','Curaçao','Costa do Marfim','🇨🇼','🇨🇮',false,'2026-06-26T19:00:00+00'),

-- ── GRUPO F: Holanda · Japão · Suécia · Tunísia ─────────────────────────────
('groups','Grupo F','Holanda','Suécia','🇳🇱','🇸🇪',false,'2026-06-15T19:00:00+00'),
('groups','Grupo F','Japão','Tunísia','🇯🇵','🇹🇳',false,'2026-06-15T22:00:00+00'),
('groups','Grupo F','Holanda','Japão','🇳🇱','🇯🇵',false,'2026-06-21T19:00:00+00'),
('groups','Grupo F','Suécia','Tunísia','🇸🇪','🇹🇳',false,'2026-06-21T22:00:00+00'),
('groups','Grupo F','Holanda','Tunísia','🇳🇱','🇹🇳',false,'2026-06-26T22:00:00+00'),
('groups','Grupo F','Suécia','Japão','🇸🇪','🇯🇵',false,'2026-06-26T22:00:00+00'),

-- ── GRUPO G: Bélgica · Egito · Irã · Nova Zelândia ─────────────────────────
('groups','Grupo G','Bélgica','Irã','🇧🇪','🇮🇷',false,'2026-06-15T23:00:00+00'),
('groups','Grupo G','Egito','Nova Zelândia','🇪🇬','🇳🇿',false,'2026-06-16T02:00:00+00'),
('groups','Grupo G','Bélgica','Egito','🇧🇪','🇪🇬',false,'2026-06-21T23:00:00+00'),
('groups','Grupo G','Irã','Nova Zelândia','🇮🇷','🇳🇿',false,'2026-06-22T02:00:00+00'),
('groups','Grupo G','Bélgica','Nova Zelândia','🇧🇪','🇳🇿',false,'2026-06-26T23:00:00+00'),
('groups','Grupo G','Egito','Irã','🇪🇬','🇮🇷',false,'2026-06-26T23:00:00+00'),

-- ── GRUPO H: Espanha · Cabo Verde · Arábia Saudita · Uruguai ────────────────
('groups','Grupo H','Espanha','Arábia Saudita','🇪🇸','🇸🇦',false,'2026-06-16T19:00:00+00'),
('groups','Grupo H','Cabo Verde','Uruguai','🇨🇻','🇺🇾',false,'2026-06-16T22:00:00+00'),
('groups','Grupo H','Espanha','Cabo Verde','🇪🇸','🇨🇻',false,'2026-06-22T19:00:00+00'),
('groups','Grupo H','Arábia Saudita','Uruguai','🇸🇦','🇺🇾',false,'2026-06-22T22:00:00+00'),
('groups','Grupo H','Espanha','Uruguai','🇪🇸','🇺🇾',false,'2026-06-27T19:00:00+00'),
('groups','Grupo H','Cabo Verde','Arábia Saudita','🇨🇻','🇸🇦',false,'2026-06-27T19:00:00+00'),

-- ── GRUPO I: França · Senegal · Iraque · Noruega ────────────────────────────
('groups','Grupo I','França','Iraque','🇫🇷','🇮🇶',false,'2026-06-16T23:00:00+00'),
('groups','Grupo I','Senegal','Noruega','🇸🇳','🇳🇴',false,'2026-06-17T02:00:00+00'),
('groups','Grupo I','França','Senegal','🇫🇷','🇸🇳',false,'2026-06-22T23:00:00+00'),
('groups','Grupo I','Iraque','Noruega','🇮🇶','🇳🇴',false,'2026-06-23T02:00:00+00'),
('groups','Grupo I','França','Noruega','🇫🇷','🇳🇴',false,'2026-06-27T22:00:00+00'),
('groups','Grupo I','Senegal','Iraque','🇸🇳','🇮🇶',false,'2026-06-27T22:00:00+00'),

-- ── GRUPO J: Argentina · Argélia · Áustria · Jordânia ───────────────────────
('groups','Grupo J','Argentina','Argélia','🇦🇷','🇩🇿',false,'2026-06-17T19:00:00+00'),
('groups','Grupo J','Áustria','Jordânia','🇦🇹','🇯🇴',false,'2026-06-17T22:00:00+00'),
('groups','Grupo J','Argentina','Áustria','🇦🇷','🇦🇹',false,'2026-06-23T19:00:00+00'),
('groups','Grupo J','Argélia','Jordânia','🇩🇿','🇯🇴',false,'2026-06-23T22:00:00+00'),
('groups','Grupo J','Argentina','Jordânia','🇦🇷','🇯🇴',false,'2026-06-27T23:00:00+00'),
('groups','Grupo J','Argélia','Áustria','🇩🇿','🇦🇹',false,'2026-06-27T23:00:00+00'),

-- ── GRUPO K: Portugal · RD Congo · Uzbequistão · Colômbia ───────────────────
('groups','Grupo K','Portugal','RD Congo','🇵🇹','🇨🇩',false,'2026-06-17T23:00:00+00'),
('groups','Grupo K','Uzbequistão','Colômbia','🇺🇿','🇨🇴',false,'2026-06-18T02:00:00+00'),
('groups','Grupo K','Portugal','Uzbequistão','🇵🇹','🇺🇿',false,'2026-06-23T23:00:00+00'),
('groups','Grupo K','RD Congo','Colômbia','🇨🇩','🇨🇴',false,'2026-06-24T02:00:00+00'),
('groups','Grupo K','Portugal','Colômbia','🇵🇹','🇨🇴',false,'2026-06-28T19:00:00+00'),
('groups','Grupo K','RD Congo','Uzbequistão','🇨🇩','🇺🇿',false,'2026-06-28T19:00:00+00'),

-- ── GRUPO L: Inglaterra · Croácia · Gana · Panamá ───────────────────────────
('groups','Grupo L','Inglaterra','Croácia','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷',false,'2026-06-18T19:00:00+00'),
('groups','Grupo L','Gana','Panamá','🇬🇭','🇵🇦',false,'2026-06-18T22:00:00+00'),
('groups','Grupo L','Inglaterra','Gana','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇬🇭',false,'2026-06-24T19:00:00+00'),
('groups','Grupo L','Croácia','Panamá','🇭🇷','🇵🇦',false,'2026-06-24T22:00:00+00'),
('groups','Grupo L','Inglaterra','Panamá','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇵🇦',false,'2026-06-28T22:00:00+00'),
('groups','Grupo L','Croácia','Gana','🇭🇷','🇬🇭',false,'2026-06-28T22:00:00+00');
