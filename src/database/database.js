// database/database.js - Gestionnaire de base de données
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', 'bot_data.sqlite');
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    logger.error('❌ Erreur ouverture BDD:', err);
                    reject(err);
                } else {
                    logger.info('✅ Base de données SQLite connectée');
                    this.runMigrations().then(resolve).catch(reject);
                }
            });
        });
    }

    async runMigrations() {
        const migrationsPath = path.join(__dirname, 'migrations.sql');
        const migrations = fs.readFileSync(migrationsPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(migrations, (err) => {
                if (err) {
                    logger.error('❌ Erreur migrations:', err);
                    reject(err);
                } else {
                    logger.info('✅ Migrations appliquées');
                    resolve();
                }
            });
        });
    }

    // =================== WHITELIST METHODS ===================
    
    async createWL(data) {
        const id = generateId();
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO whitelist (id, user_id, username, roblox_pseudo, age, availability, appointment_time, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
            `);
            
            stmt.run([id, data.userId, data.username, data.robloxPseudo, data.age, data.availability, data.appointmentTime], function(err) {
                if (err) {
                    logger.error('❌ Erreur création WL:', err);
                    reject(err);
                } else {
                    logger.info(`✅ WL créée: ${id}`);
                    resolve(id);
                }
            });
            stmt.finalize();
        });
    }

    async getWL(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM whitelist WHERE id = ?", [id], (err, row) => {
                if (err) {
                    logger.error('❌ Erreur lecture WL:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateWLStatus(id, status, staffId = null, staffUsername = null, notes = null) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE whitelist 
                SET status = ?, staff_id = ?, staff_username = ?, notes = ?, updated_at = datetime('now')
                WHERE id = ?
            `);
            
            stmt.run([status, staffId, staffUsername, notes, id], function(err) {
                if (err) {
                    logger.error('❌ Erreur update WL:', err);
                    reject(err);
                } else {
                    logger.info(`✅ WL mise à jour: ${id} -> ${status}`);
                    resolve(this.changes);
                }
            });
            stmt.finalize();
        });
    }

    async getPendingAppointments() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM whitelist 
                WHERE status = 'pending' AND appointment_time IS NOT NULL
                ORDER BY appointment_time ASC
            `, (err, rows) => {
                if (err) {
                    logger.error('❌ Erreur lecture RDV:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // =================== FICHE RP METHODS ===================
    
    async createFicheRP(data) {
        const id = generateId();
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO fiches_rp (
                    id, user_id, username, prenom_nom, clan_origine, age, genre, 
                    occupation, bloodline, elements, histoire, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
            `);
            
            stmt.run([
                id, data.userId, data.username, data.prenomNom, data.clanOrigine, 
                data.age, data.genre, data.occupation, data.bloodline, 
                data.elements, data.histoire
            ], function(err) {
                if (err) {
                    logger.error('❌ Erreur création fiche:', err);
                    reject(err);
                } else {
                    logger.info(`✅ Fiche créée: ${id}`);
                    resolve(id);
                }
            });
            stmt.finalize();
        });
    }

    async getFicheRP(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM fiches_rp WHERE id = ?", [id], (err, row) => {
                if (err) {
                    logger.error('❌ Erreur lecture fiche:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getFichesByUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM fiches_rp 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `, [userId], (err, rows) => {
                if (err) {
                    logger.error('❌ Erreur lecture fiches utilisateur:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    async updateFicheRPStatus(id, status, staffId = null, staffUsername = null, notes = null) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE fiches_rp 
                SET status = ?, staff_id = ?, staff_username = ?, notes = ?, updated_at = datetime('now')
                WHERE id = ?
            `);
            
            stmt.run([status, staffId, staffUsername, notes, id], function(err) {
                if (err) {
                    logger.error('❌ Erreur update fiche:', err);
                    reject(err);
                } else {
                    logger.info(`✅ Fiche mise à jour: ${id} -> ${status}`);
                    resolve(this.changes);
                }
            });
            stmt.finalize();
        });
    }

    async getAllValidatedFiches() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM fiches_rp 
                WHERE status = 'accepted' 
                ORDER BY updated_at DESC
            `, (err, rows) => {
                if (err) {
                    logger.error('❌ Erreur lecture fiches validées:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // =================== STATS METHODS ===================
    
    async getWLStats() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM whitelist 
                GROUP BY status
            `, (err, rows) => {
                if (err) {
                    logger.error('❌ Erreur stats WL:', err);
                    reject(err);
                } else {
                    const stats = {
                        pending: 0,
                        accepted: 0,
                        refused: 0,
                        total: 0
                    };
                    
                    rows.forEach(row => {
                        stats[row.status] = row.count;
                        stats.total += row.count;
                    });
                    
                    resolve(stats);
                }
            });
        });
    }

    async getFicheStats() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM fiches_rp 
                GROUP BY status
            `, (err, rows) => {
                if (err) {
                    logger.error('❌ Erreur stats fiches:', err);
                    reject(err);
                } else {
                    const stats = {
                        pending: 0,
                        accepted: 0,
                        refused: 0,
                        total: 0
                    };
                    
                    rows.forEach(row => {
                        stats[row.status] = row.count;
                        stats.total += row.count;
                    });
                    
                    resolve(stats);
                }
            });
        });
    }

    // =================== UTILITY METHODS ===================
    
    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        logger.error('❌ Erreur fermeture BDD:', err);
                    } else {
                        logger.info('✅ Base de données fermée');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;