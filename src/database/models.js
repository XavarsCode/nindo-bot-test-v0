// src/database/models.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'nindo.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données SQLite :', err.message);
    } else {
        console.log('💾 Connecté à la base de données SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS whitelist_applications (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            status TEXT NOT NULL,
            staffId TEXT,
            timestamp INTEGER NOT NULL
        );`);
        db.run(`CREATE TABLE IF NOT EXISTS rp_applications (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            pseudoIG TEXT,
            clan TEXT,
            rang TEXT,
            histoire TEXT,
            status TEXT NOT NULL,
            staffId TEXT,
            timestamp INTEGER NOT NULL
        );`);
    }
});

function addWLApplication(userId) {
    return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const sql = `INSERT INTO whitelist_applications (id, userId, status, timestamp) VALUES (?, ?, ?, ?)`;
        db.run(sql, [id, userId, 'En attente', timestamp], function(err) {
            if (err) {
                console.error('Erreur lors de l\'ajout de la candidature WL:', err.message);
                reject(err);
            } else {
                console.log(`✅ Candidature WL #${id} ajoutée.`);
                resolve(id);
            }
        });
    });
}

function updateWLStatus(wlId, status, staffId) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE whitelist_applications SET status = ?, staffId = ? WHERE id = ?`;
        db.run(sql, [status, staffId, wlId], function(err) {
            if (err) {
                console.error('Erreur lors de la mise à jour de la candidature WL:', err.message);
                reject(err);
            } else {
                console.log(`✅ Statut de la candidature WL #${wlId} mis à jour vers "${status}".`);
                resolve();
            }
        });
    });
}

function getWLApplicationById(id) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM whitelist_applications WHERE id = ?`;
        db.get(sql, [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la récupération de la candidature WL:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function addRPApplication(userId, formData) {
    return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const sql = `INSERT INTO rp_applications (id, userId, pseudoIG, clan, rang, histoire, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [id, userId, formData.pseudoIG, formData.clan, formData.rang, formData.histoire, 'En attente', timestamp];
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Erreur lors de l\'ajout de la fiche RP:', err.message);
                reject(err);
            } else {
                console.log(`✅ Fiche RP #${id} ajoutée.`);
                resolve(id);
            }
        });
    });
}

function updateRPStatus(rpId, status, staffId) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE rp_applications SET status = ?, staffId = ? WHERE id = ?`;
        db.run(sql, [status, staffId, rpId], function(err) {
            if (err) {
                console.error('Erreur lors de la mise à jour de la fiche RP:', err.message);
                reject(err);
            } else {
                console.log(`✅ Statut de la fiche RP #${rpId} mis à jour vers "${status}".`);
                resolve();
            }
        });
    });
}

function getRPApplicationById(id) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM rp_applications WHERE id = ?`;
        db.get(sql, [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la récupération de la fiche RP:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = {
    db,
    addWLApplication,
    updateWLStatus,
    getWLApplicationById,
    addRPApplication,
    updateRPStatus,
    getRPApplicationById
};