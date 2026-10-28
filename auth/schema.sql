-- FAAAB Auth — dados privados no Cloudflare D1, nunca no GitHub Pages.
CREATE TABLE IF NOT EXISTS oauth_states (
 state TEXT PRIMARY KEY,
 provider TEXT NOT NULL,
 verifier TEXT NOT NULL,
 nonce TEXT NOT NULL,
 link_user_key TEXT,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS identities (
 user_key TEXT PRIMARY KEY,
 provider TEXT NOT NULL CHECK(provider IN ('roblox','google')),
 subject TEXT NOT NULL,
 display_name TEXT,
 email TEXT,
 linked_roblox_id TEXT,
 created_at INTEGER NOT NULL,
 last_login_at INTEGER NOT NULL,
 UNIQUE(provider, subject)
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 user_key TEXT NOT NULL,
 csrf TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL,
 FOREIGN KEY(user_key) REFERENCES identities(user_key)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_key);
CREATE INDEX IF NOT EXISTS idx_identities_link ON identities(linked_roblox_id);

-- Reserva o ID Roblox ligado ao nick aprovado na primeira validação.
-- Evita que uma troca posterior de nickname transfira autorização a outra conta.
CREATE TABLE IF NOT EXISTS nickname_pins (
 username_key TEXT PRIMARY KEY,
 roblox_id TEXT NOT NULL,
 first_seen_at INTEGER NOT NULL
);

-- Aprovações privadas para contas Google e Roblox que tenham se registrado.
-- Nenhum e-mail precisa ser publicado na whitelist do GitHub.
CREATE TABLE IF NOT EXISTS private_grants (
 user_key TEXT PRIMARY KEY,
 role TEXT NOT NULL CHECK(role IN ('editor','revisor')),
 granted_at INTEGER NOT NULL,
 FOREIGN KEY(user_key) REFERENCES identities(user_key)
);

-- Aprovação é uma etapa separada da nomeação de cargos administrativos.
CREATE TABLE IF NOT EXISTS access_approvals (
 user_key TEXT PRIMARY KEY,
 approved_at INTEGER NOT NULL,
 approved_by TEXT NOT NULL,
 FOREIGN KEY(user_key) REFERENCES identities(user_key)
);
-- Só o proprietário atribui papéis, com escopo quando necessário.
CREATE TABLE IF NOT EXISTS staff_assignments (
 user_key TEXT NOT NULL,
 role_key TEXT NOT NULL,
 scope_json TEXT NOT NULL DEFAULT '{}',
 assigned_by TEXT NOT NULL,
 assigned_at INTEGER NOT NULL,
 PRIMARY KEY(user_key, role_key),
 FOREIGN KEY(user_key) REFERENCES identities(user_key)
);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_user ON staff_assignments(user_key);
