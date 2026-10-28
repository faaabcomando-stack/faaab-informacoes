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
