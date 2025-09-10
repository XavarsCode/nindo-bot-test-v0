const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./candidatures.db");

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS candidatures (
        id TEXT PRIMARY KEY,
        userId TEXT,
        pseudo TEXT,
        age TEXT,
        motivation TEXT,
        dispos TEXT,
        idea TEXT,
        status TEXT DEFAULT 'pending'
    )`);
});

module.exports = {
    addCandidature(c) {
        db.run(`INSERT INTO candidatures (id, userId, pseudo, age, motivation, dispos, idea) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.userId, c.pseudo, c.age, c.motivation, c.dispos, c.idea]);
    },

    updateStatus(id, status) {
        db.run(`UPDATE candidatures SET status = ? WHERE id = ?`, [status, id]);
    },

    getCandidature(id, callback) {
        db.get(`SELECT * FROM candidatures WHERE id = ?`, [id], (err, row) => {
            callback(row);
        });
    }
};
