const fs = require('fs');
const path = require('path');

const XP_FILE = path.join(__dirname, '..', 'data', 'xp.json');
const MISSIONS_FILE = path.join(__dirname, '..', 'data', 'missions.json');

// Assurer que le dossier data existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Structure des données XP
let xpData = {};
let missionsData = {};
let dailyClaims = {};

// Charger les données
function loadXPData() {
    try {
        if (fs.existsSync(XP_FILE)) {
            xpData = JSON.parse(fs.readFileSync(XP_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Erreur chargement XP:', error);
        xpData = {};
    }
}

function loadMissionsData() {
    try {
        if (fs.existsSync(MISSIONS_FILE)) {
            missionsData = JSON.parse(fs.readFileSync(MISSIONS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Erreur chargement missions:', error);
        missionsData = {};
    }
}

// Sauvegarder les données
function saveXPData() {
    try {
        fs.writeFileSync(XP_FILE, JSON.stringify(xpData, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde XP:', error);
    }
}

function saveMissionsData() {
    try {
        fs.writeFileSync(MISSIONS_FILE, JSON.stringify(missionsData, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde missions:', error);
    }
}

// Initialiser un utilisateur
function initUser(userId) {
    if (!xpData[userId]) {
        xpData[userId] = {
            xp: 0,
            level: 1,
            totalXP: 0,
            lastDaily: null,
            commandsUsed: 0,
            missionsCompleted: 0,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        saveXPData();
    }
    return xpData[userId];
}

// Calculer le niveau basé sur l'XP
function calculateLevel(totalXP) {
    // Formule: niveau = sqrt(totalXP / 100) + 1
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

// Calculer l'XP nécessaire pour le prochain niveau
function getXPForNextLevel(level) {
    return Math.pow(level, 2) * 100;
}

// Calculer l'XP actuelle dans le niveau
function getCurrentLevelXP(totalXP, level) {
    const prevLevelXP = getXPForNextLevel(level - 1);
    return totalXP - prevLevelXP;
}

// Ajouter de l'XP
function addXP(userId, amount, reason = 'Action') {
    const user = initUser(userId);
    const oldLevel = user.level;
    
    user.xp += amount;
    user.totalXP += amount;
    user.lastActivity = Date.now();
    
    const newLevel = calculateLevel(user.totalXP);
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
        user.level = newLevel;
        console.log(`🎉 ${userId} a atteint le niveau ${newLevel}!`);
    }
    
    saveXPData();
    
    return {
        xpGained: amount,
        totalXP: user.totalXP,
        currentLevel: user.level,
        leveledUp,
        reason,
        nextLevelXP: getXPForNextLevel(user.level + 1),
        currentLevelXP: getCurrentLevelXP(user.totalXP, user.level)
    };
}

// Obtenir les stats d'un utilisateur
function getUserStats(userId) {
    const user = initUser(userId);
    const nextLevelXP = getXPForNextLevel(user.level + 1);
    const currentLevelXP = getCurrentLevelXP(user.totalXP, user.level);
    const xpNeededForNext = nextLevelXP - user.totalXP;
    
    return {
        xp: currentLevelXP,
        totalXP: user.totalXP,
        level: user.level,
        xpNeeded: getXPForNextLevel(user.level + 1) - getXPForNextLevel(user.level),
        xpProgress: currentLevelXP,
        xpToNext: xpNeededForNext,
        commandsUsed: user.commandsUsed,
        missionsCompleted: user.missionsCompleted,
        rank: getRankName(user.level),
        activeDays: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
        lastActivity: user.lastActivity
    };
}

// Obtenir le nom du rang
function getRankName(level) {
    if (level < 5) return 'Étudiant';
    if (level < 10) return 'Genin';
    if (level < 20) return 'Chunin';
    if (level < 35) return 'Jonin';
    if (level < 50) return 'Sannin';
    return 'Kage';
}

// Système de récompense quotidienne
function claimDaily(userId) {
    const user = initUser(userId);
    const today = new Date().toDateString();
    
    if (user.lastDaily === today) {
        return {
            success: false,
            message: 'Récompense déjà récupérée aujourd\'hui !',
            nextClaim: getNextDailyTime()
        };
    }
    
    const baseReward = 50;
    const levelBonus = user.level * 5;
    const totalReward = baseReward + levelBonus;
    
    user.lastDaily = today;
    const xpResult = addXP(userId, totalReward, 'Récompense quotidienne');
    
    return {
        success: true,
        xpGained: totalReward,
        levelBonus,
        message: `Récompense quotidienne récupérée ! +${totalReward} XP`,
        ...xpResult,
        nextClaim: getNextDailyTime()
    };
}

// Obtenir le temps jusqu'à la prochaine récompense
function getNextDailyTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
}

// Système de missions
const MISSIONS = {
    daily_commands: {
        name: 'Utilisateur actif',
        description: 'Utiliser 10 commandes',
        target: 10,
        reward: 100,
        type: 'daily'
    },
    helper: {
        name: 'Aide communautaire',
        description: 'Aider d\'autres membres',
        target: 1,
        reward: 150,
        type: 'repeatable'
    },
    defender: {
        name: 'Défenseur du serveur',
        description: 'Protéger le serveur',
        target: 1,
        reward: 120,
        type: 'repeatable'
    },
    explorer: {
        name: 'Explorateur',
        description: 'Découvrir de nouvelles fonctionnalités',
        target: 5,
        reward: 200,
        type: 'weekly'
    }
};

// Compléter une mission
function completeMission(userId, missionId) {
    const mission = MISSIONS[missionId];
    if (!mission) {
        return { success: false, message: 'Mission introuvable' };
    }
    
    const user = initUser(userId);
    const userMissions = missionsData[userId] || {};
    const today = new Date().toDateString();
    
    // Vérifier si la mission peut être complétée
    if (mission.type === 'daily' && userMissions[missionId] === today) {
        return { success: false, message: 'Mission déjà complétée aujourd\'hui' };
    }
    
    const cooldownTime = getCooldownTime(mission.type);
    const lastCompleted = userMissions[missionId + '_last'];
    
    if (lastCompleted && Date.now() - lastCompleted < cooldownTime) {
        const timeLeft = cooldownTime - (Date.now() - lastCompleted);
        return { 
            success: false, 
            message: 'Mission en cooldown',
            timeLeft: Math.ceil(timeLeft / 1000)
        };
    }
    
    // Compléter la mission
    if (!missionsData[userId]) {
        missionsData[userId] = {};
    }
    
    missionsData[userId][missionId] = today;
    missionsData[userId][missionId + '_last'] = Date.now();
    user.missionsCompleted++;
    
    saveMissionsData();
    
    const xpResult = addXP(userId, mission.reward, `Mission: ${mission.name}`);
    
    return {
        success: true,
        mission: mission.name,
        xpGained: mission.reward,
        message: `Mission "${mission.name}" terminée ! +${mission.reward} XP`,
        ...xpResult
    };
}

// Obtenir le temps de cooldown pour un type de mission
function getCooldownTime(type) {
    switch (type) {
        case 'daily': return 24 * 60 * 60 * 1000; // 24h
        case 'weekly': return 7 * 24 * 60 * 60 * 1000; // 7 jours
        case 'repeatable': return 30 * 60 * 1000; // 30 minutes
        default: return 0;
    }
}

// Obtenir les missions disponibles pour un utilisateur
function getAvailableMissions(userId) {
    const userMissions = missionsData[userId] || {};
    const today = new Date().toDateString();
    const available = [];
    
    for (const [id, mission] of Object.entries(MISSIONS)) {
        const lastCompleted = userMissions[id + '_last'];
        const cooldownTime = getCooldownTime(mission.type);
        const isOnCooldown = lastCompleted && (Date.now() - lastCompleted) < cooldownTime;
        
        available.push({
            id,
            ...mission,
            isAvailable: !isOnCooldown,
            cooldownLeft: isOnCooldown ? cooldownTime - (Date.now() - lastCompleted) : 0
        });
    }
    
    return available;
}

// Obtenir le classement
function getLeaderboard(limit = 10) {
    const users = Object.entries(xpData)
        .map(([id, data]) => ({
            id,
            level: data.level,
            totalXP: data.totalXP,
            rank: getRankName(data.level),
            lastActivity: data.lastActivity
        }))
        .sort((a, b) => b.totalXP - a.totalXP)
        .slice(0, limit);
    
    return users;
}

// Incrémenter le compteur de commandes
function incrementCommandCount(userId) {
    const user = initUser(userId);
    user.commandsUsed++;
    user.lastActivity = Date.now();
    
    // Récompense pour l'activité (1 XP par commande)
    addXP(userId, 1, 'Utilisation de commande');
    
    saveXPData();
}

// Charger les données au démarrage
loadXPData();
loadMissionsData();

module.exports = {
    addXP,
    getUserStats,
    claimDaily,
    completeMission,
    getAvailableMissions,
    getLeaderboard,
    incrementCommandCount,
    initUser,
    getRankName,
    MISSIONS
};