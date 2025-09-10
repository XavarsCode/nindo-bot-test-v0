-- database/migrations.sql - Structure des tables

-- Table des demandes de whitelist
CREATE TABLE IF NOT EXISTS whitelist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    roblox_pseudo TEXT,
    age INTEGER,
    availability TEXT,
    appointment_time TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
    staff_id TEXT,
    staff_username TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
);

-- Table des fiches RP
CREATE TABLE IF NOT EXISTS fiches_rp (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    prenom_nom TEXT NOT NULL,
    clan_origine TEXT NOT NULL,
    age INTEGER NOT NULL,
    genre TEXT NOT NULL,
    occupation TEXT NOT NULL,
    bloodline TEXT NOT NULL,
    elements TEXT NOT NULL,
    histoire TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
    staff_id TEXT,
    staff_username TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_whitelist_user_id ON whitelist(user_id);
CREATE INDEX IF NOT EXISTS idx_whitelist_status ON whitelist(status);
CREATE INDEX IF NOT EXISTS idx_whitelist_appointment ON whitelist(appointment_time);

CREATE INDEX IF NOT EXISTS idx_fiches_user_id ON fiches_rp(user_id);
CREATE INDEX IF NOT EXISTS idx_fiches_status ON fiches_rp(status);
CREATE INDEX IF NOT EXISTS idx_fiches_created_at ON fiches_rp(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER IF NOT EXISTS trigger_whitelist_updated_at
    AFTER UPDATE ON whitelist
    FOR EACH ROW
BEGIN
    UPDATE whitelist SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_fiches_updated_at
    AFTER UPDATE ON fiches_rp
    FOR EACH ROW
BEGIN
    UPDATE fiches_rp SET updated_at = datetime('now') WHERE id = NEW.id;
END;