// config.js - Configuration avec IDs uniquement
module.exports = {
    // ===================  IDs DES SALONS ===================
    WL_REQUEST_CHANNEL: process.env.WL_REQUEST_CHANNEL || '1411639104965443595',
    WL_WAITING_ROOM: process.env.WL_WAITING_ROOM || '1411684759238742048',
    
    // IDs des 5 salons vocaux WL (séparés par des virgules dans .env)
    WL_VOCAL_CHANNELS: process.env.WL_VOCAL_CHANNELS ? 
        process.env.WL_VOCAL_CHANNELS.split(',') : 
        [
            '1411684000000000001', // Vocal WL 1
            '1411684000000000002', // Vocal WL 2
            '1411684000000000003', // Vocal WL 3
            '1411684000000000004', // Vocal WL 4
            '1411684000000000005'  // Vocal WL 5
        ],
    
    // ID du salon des logs whitelist
    WL_LOGS_CHANNEL: process.env.WL_LOGS_CHANNEL || '1411639200000000000',
    
    // ID du salon fiches en attente (pour le staff)
    FICHES_PENDING_CHANNEL: process.env.FICHES_PENDING_CHANNEL || '1411639300000000000',
    
    // ID du salon fiches validées
    FICHES_VALIDATED_CHANNEL: process.env.FICHES_VALIDATED_CHANNEL || '1411639400000000000',
    
    // ===================  ID DU RÔLE STAFF ===================
    STAFF_ROLE_ID: process.env.STAFF_ROLE_ID || '1411639500000000000',
    
    // ===================  COULEURS ===================
    COLORS: {
        SUCCESS: '#00ff00',   // Vert
        ERROR: '#ff0000',     // Rouge
        WARNING: '#ffaa00',   // Orange
        INFO: '#0099ff',      // Bleu
        PENDING: '#ffaa00'    // Orange
    },

    // ===================  LIMITES ===================
    LIMITS: {
        HISTOIRE_MIN_LINES: 5,      // Minimum 5 lignes pour l'histoire
        EMBED_MAX_LENGTH: 1024,     // Limite Discord pour les champs
        DM_TIMEOUT: 300000,         // 5 minutes pour répondre en DM
        FICHE_TIMEOUT: 600000       // 10 minutes pour créer une fiche
    }
};