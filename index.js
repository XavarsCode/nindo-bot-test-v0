// index.js

const { request } = require('undici');
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const { clientId, clientSecret, port } = require('./config.json');
const { Client, Collection, GatewayIntentBits, IntentsBitField, InteractionType } = require('discord.js');
const { addBalance, loadBalances } = require('./utils/currency.js');
const { handleRPModalSubmit, handleButtons } = require('./src/utils/interactionHandler.js');
const OpenAI = require('openai');
const recrutement = require('./src/modules/recrutement.js');
const musicSystem = require('./src/music/system');
const autoStaffList = require('./src/list-staff/auto-staff-list');
const { sendStaffMessage, createCategoryEmbed } = require('./src/list-staff/auto-staff-list');
const hubVocal = require('./src/hubVocal'); // ou le chemin vers le fichier index.js


require('dotenv').config();

const app = express();

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

// Créer le client avant tout usage
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        // Ajout des intents pour le chat IA
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

// ✅ Initialiser Distube après avoir créé le client
musicSystem.init(client);

client.commandes = new Collection();

const connectedUsers = new Map();
const serverStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalCommands: 0,
    dailyLogins: new Set(),
    startTime: Date.now()
};

app.use(session({
    secret: 'nindo-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static('public'));
app.use(express.json());

// --------------------- ROUTES --------------------- //

app.get('/', async (req, res) => {
    const { code } = req.query;
    if (code) {
        try {
            const tokenResponse = await request('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `http://localhost:${port}`,
                    scope: 'identify',
                }).toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (tokenResponse.statusCode === 200) {
                const oauthData = await tokenResponse.body.json();
                const userResponse = await request('https://discord.com/api/users/@me', {
                    headers: { authorization: `${oauthData.token_type} ${oauthData.access_token}` },
                });

                if (userResponse.statusCode === 200) {
                    const userData = await userResponse.body.json();
                    req.session.user = userData;
                    connectedUsers.set(userData.id, {
                        ...userData,
                        connectedAt: new Date(),
                        sessionId: req.sessionID,
                        lastActivity: Date.now()
                    });

                    serverStats.dailyLogins.add(userData.id);
                    serverStats.totalUsers = Math.max(serverStats.totalUsers, connectedUsers.size);
                }
            }
        } catch (error) {
            console.error('OAuth error:', error);
        }
        return res.redirect('/dashboard');
    }
    return res.sendFile('index.html', { root: '.' });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const user = connectedUsers.get(req.session.user.id);
    if (user) user.lastActivity = Date.now();
    res.sendFile('dashboard.html', { root: '.' });
});

app.get('/api/user', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });

    const userId = req.session.user.id;
    const userBalances = loadBalances();
    const userBalance = userBalances[userId] || 0;

    const userStats = {
        level: Math.floor(userBalance / 100) + 1,
        xp: userBalance % 100,
        xpNeeded: 100,
        totalCommands: Math.floor(Math.random() * 200) + 50,
        activeDays: Math.floor((Date.now() - new Date(req.session.user.id / 4194304 + 1420070400000).getTime()) / (1000 * 60 * 60 * 24)),
        serversCount: client.guilds.cache.filter(guild => guild.members.cache.has(userId)).size || 1,
        completedMissions: Math.floor(userBalance / 50),
        ongoingMissions: Math.floor(Math.random() * 5) + 1
    };

    res.json({
        ...req.session.user,
        balance: userBalance,
        stats: userStats
    });
});

app.get('/api/stats', (req, res) => {
    const now = Date.now();
    serverStats.activeUsers = Array.from(connectedUsers.values())
        .filter(user => now - user.lastActivity < 5 * 60 * 1000).length;

    res.json({
        connectedUsers: connectedUsers.size,
        activeUsers: serverStats.activeUsers,
        totalUsers: serverStats.totalUsers,
        dailyLogins: serverStats.dailyLogins.size,
        botGuilds: client.guilds.cache.size,
        botUsers: client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0),
        totalCommands: serverStats.totalCommands,
        uptime: Math.floor((now - serverStats.startTime) / 1000),
        serverLoad: process.memoryUsage()
    });
});

app.post('/api/daily', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const userId = req.session.user.id;
        const dailyAmount = 50;
        addBalance(userId, dailyAmount);
        res.json({ success: true, amount: dailyAmount, message: 'Récompense quotidienne récupérée !' });
    } catch (error) {
        console.error('Erreur daily:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/mission/:missionId', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const userId = req.session.user.id;
        const { missionId } = req.params;
        const rewards = {
            'defend': { xp: 200, ryos: 100, name: 'Défenseur du serveur' },
            'active': { xp: 150, ryos: 75, name: 'Membre actif' },
            'helper': { xp: 300, ryos: 150, name: 'Aide communautaire' }
        };
        const reward = rewards[missionId];
        if (!reward) return res.status(404).json({ error: 'Mission introuvable' });
        addBalance(userId, reward.ryos);
        serverStats.totalCommands++;
        res.json({ success: true, reward, message: `Mission "${reward.name}" terminée !` });
    } catch (error) {
        console.error('Erreur mission:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/leaderboard', (req, res) => {
    try {
        const userBalances = loadBalances();
        const leaderboard = Object.entries(userBalances)
            .map(([id, balance]) => {
                const user = connectedUsers.get(id);
                return {
                    id,
                    name: user ? (user.global_name || user.username) : `Utilisateur ${id.slice(-4)}`,
                    avatar: user ? user.avatar : null,
                    balance,
                    level: Math.floor(balance / 100) + 1,
                    isOnline: user && (Date.now() - user.lastActivity < 5 * 60 * 1000)
                };
            })
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);
        res.json(leaderboard);
    } catch (error) {
        console.error('Erreur leaderboard:', error);
        res.json([]);
    }
});

app.get('/api/server-info', (req, res) => {
    const uptime = Math.floor((Date.now() - serverStats.startTime) / 1000);
    const memUsage = process.memoryUsage();
    res.json({
        name: 'Nindo Server',
        version: '1.0.0',
        uptime: { seconds: uptime, formatted: formatUptime(uptime) },
        memory: { used: Math.round(memUsage.heapUsed / 1024 / 1024), total: Math.round(memUsage.heapTotal / 1024 / 1024) },
        users: { connected: connectedUsers.size, active: serverStats.activeUsers, total: serverStats.totalUsers, dailyLogins: serverStats.dailyLogins.size },
        bot: { guilds: client.guilds.cache.size, users: client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0), commands: serverStats.totalCommands }
    });
});

app.get('/logout', (req, res) => {
    if (req.session.user) connectedUsers.delete(req.session.user.id);
    req.session.destroy();
    res.redirect('/');
});

// --------------------- UTILITAIRES --------------------- //

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function chargerCommandes(dossier) {
    if (!fs.existsSync(dossier)) return;
    const fichiers = fs.readdirSync(dossier);
    for (const fichier of fichiers) {
        const chemin = path.join(dossier, fichier);
        if (fs.statSync(chemin).isDirectory()) chargerCommandes(chemin);
        else if (fichier.endsWith('.js')) {
            const cmd = require(chemin);
            if ('data' in cmd && 'execute' in cmd) {
                client.commandes.set(cmd.data.name, cmd);
                console.log(`✅ Commande chargée: ${cmd.data.name}`);
            }
        }
    }
}

chargerCommandes(path.join(__dirname, 'src/commands'));

// --------------------- EVENTS --------------------- //

const eventFiles = fs.readdirSync('./src/events').filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./src/events/${file}`);
    if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
    else client.on(event.name, (...args) => event.execute(...args, client));
    console.log(`🎯 Événement chargé: ${event.name}`);
}

client.on('ready', () => {
    console.log(`🤖 Bot connecté: ${client.user.tag}`);
    console.log(`🌍 Serveurs: ${client.guilds.cache.size}`);
    console.log(`👥 Utilisateurs: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}`);
    console.log('🧠 Système de chat IA activé !');
    
});


// --------------------- CHAT IA --------------------- //

client.on('messageCreate', async (message) => {
    // Ignorer les messages des bots
    if (message.author.bot) return;
    
    // Vérifier si c'est le bon canal (si CHANNEL_ID est défini)
    if (process.env.CHANNEL_ID && message.channel.id !== process.env.CHANNEL_ID) return;
    
    // Ignorer les commandes (messages commençant par !)
    if (message.content.startsWith('!')) return;
    
    let conversationLog = [
        { role: 'system', content: 'You are a friendly chatbot for the Nindo server. You help users and answer their questions in a helpful and engaging way.' },
    ];

    try {
        await message.channel.sendTyping();
        
        let prevMessages = await message.channel.messages.fetch({ limit: 15 });
        prevMessages.reverse();
        
        prevMessages.forEach((msg) => {
            if (msg.content.startsWith('!')) return;
            if (msg.author.id !== client.user.id && msg.author.bot) return;
            
            if (msg.author.id == client.user.id) {
                conversationLog.push({
                    role: 'assistant',
                    content: msg.content,
                    name: msg.author.username
                        .replace(/\s+/g, '_')
                        .replace(/[^\w\s]/gi, ''),
                });
            }
            
            if (msg.author.id == message.author.id) {
                conversationLog.push({
                    role: 'user',
                    content: msg.content,
                    name: message.author.username
                        .replace(/\s+/g, '_')
                        .replace(/[^\w\s]/gi, ''),
                });
            }
        });

        const result = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
            max_tokens: 512, // Limitation des tokens pour éviter les réponses trop longues
        }).catch((error) => {
            console.log(`OPENAI ERR: ${error}`);
            return null;
        });

        if (result && result.choices && result.choices[0]) {
            await message.reply(result.choices[0].message.content);
            serverStats.totalCommands++; // Compter les réponses IA comme des commandes
        }
    } catch (error) {
        console.log(`ERR: ${error}`);
    }
});

// --------------------- INTERACTIONS --------------------- //

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const cmd = client.commandes.get(interaction.commandName);
        if (!cmd) return;
        serverStats.totalCommands++;
        try { 
            await cmd.execute(interaction); 
        } catch (err) {
            console.error(`❌ Erreur commande ${interaction.commandName}:`, err);
            if (interaction.replied || interaction.deferred) 
                await interaction.followUp({ content: 'Erreur lors de l\'exécution de la commande.', ephemeral: true });
            else 
                await interaction.reply({ content: 'Erreur lors de l\'exécution de la commande.', ephemeral: true });
        }
    }
    
    // Gérer les soumissions de modales
    if (interaction.type === InteractionType.ModalSubmit) {
        if (recrutement.isRecruitmentModal(interaction)) {
            await recrutement.handleModal(interaction, client);
        } else {
            await handleRPModalSubmit(interaction, client);
        }
    }
    
    // Gérer les clics sur les boutons
    if (interaction.isButton()) {
        if (interaction.customId.startsWith("postuler_staff")) {
            recrutement.handleButton(interaction);
        } else if (interaction.customId.startsWith("accept_") || interaction.customId.startsWith("refuse_")) {
            recrutement.handleDecision(interaction);
        } else {
            await handleButtons(interaction, client);
        }
    }
});

client.on('guildCreate', guild => console.log(`🎉 Ajouté au serveur: ${guild.name} (${guild.memberCount} membres)`));
client.on('guildDelete', guild => console.log(`👋 Retiré du serveur: ${guild.name}`));

hubVocal(client);


// --------------------- CLEANUP --------------------- //

setInterval(() => {
    const now = Date.now();
    for (const [id, user] of connectedUsers.entries()) {
        if (now - user.lastActivity > 30 * 60 * 1000) connectedUsers.delete(id);
    }
    if (new Date().getHours() === 0 && new Date().getMinutes() === 0) serverStats.dailyLogins.clear();
}, 60 * 1000);

app.listen(port, () => console.log(`🥷 Nindo Server démarré sur http://localhost:${port}`));

client.login(process.env.DISCORD_TOKEN);

module.exports = { client, connectedUsers, serverStats };