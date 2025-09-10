const { SlashCommandBuilder, PermissionsBitField, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('disponibilites.db');

// IDs des icônes
const GREEN_ICON = "<:icons_green:1414318707575881838>";
const RED_ICON = "<:icons_red:1414318647236759573>";

// MAPPAGE DES IDs DE RÔLE : À REMPLIR PAR VOS SOINS !
const ROLE_IDS = {
    villages: {
        "Konoha": "1411471211984060537",
        "Iwa": "1411471227117109388",
        "Kiri": "1411471239725318184",
        "Kumo": "1411471251603591208",
        "Suna": "1411471265834733640"
    },
    clans: {
        "Uchiha": "1411471217210163312",
        "Nara": "1411471214123417700",
        "Senju": "1411471275041362090",
        "Akimichi": "1411471277449023488",
        "Uzumaki": "1411471279453769810",
        "Hyūga": "1411471282251370577",
        "Yamanaka": "1411471284331872397",
        "Aburame": "1411471287015964724",
        "Inuzuka": "1411471289406984262",
        "Hatake": "1411471292300918865",
        "Namikaze": "1411471294339350670",
        "Terumi": "1411471296759464046",
        "Iburi": "1411471299108405358",
        "Hozuki": "1411471300987457616",
        "Sarutobi": "1411471303147389110",
        "Kami": "1411471305944993864",
        "Chinoike": "1411471307513659393",
        "Raion": "1411471310625964042",
        "Sabaku": "1411471312693629080",
        "Sung": "1411471314891309066"
    }
};

async function getFormattedMessage(interaction, type) {
    return new Promise((resolve, reject) => {
        const title = type === 'village' ? 'Liste des Villages' : 'Liste des Clans';
        db.all(`SELECT name, statut, places FROM entities WHERE type = ?`, [type], async (err, rows) => {
            if (err) return reject(err);

            let message = `**${title}**\n\n`;
            for (const row of rows) {
                const icon = row.statut === "ouvert" ? GREEN_ICON : RED_ICON;
                const placesText = row.places > 0 ? `(${row.places} places disponibles)` : `(fermé)`;
                
                let memberCount = 0;
                const roleId = ROLE_IDS[type + 's'][row.name];
                if (roleId && interaction.guild) {
                    try {
                        const role = await interaction.guild.roles.fetch(roleId);
                        if (role) {
                            memberCount = role.members.size;
                        }
                    } catch (fetchError) {
                        console.error(`Erreur lors de la récupération du rôle ${row.name}:`, fetchError);
                    }
                }
                message += `${icon} **${row.name}** (${memberCount} membres) ${placesText}\n`;
            }
            message += `\n*Dernière mise à jour le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}.*`;
            resolve(message);
        });
    });
}

// Fonction pour initialiser la base de données
function initDb() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS entities (
            name TEXT,
            type TEXT NOT NULL,
            statut TEXT NOT NULL,
            places INTEGER NOT NULL,
            PRIMARY KEY (name, type)
        )`);

        const initialEntities = [
            ["Konoha", "village", "fermé", 0], ["Iwa", "village", "fermé", 0], ["Kiri", "village", "fermé", 0],
            ["Kumo", "village", "fermé", 0], ["Suna", "village", "fermé", 0],
            ["Uchiha", "clan", "fermé", 0], ["Nara", "clan", "fermé", 0], ["Senju", "clan", "fermé", 0],
            ["Akimichi", "clan", "fermé", 0], ["Uzumaki", "clan", "fermé", 0], ["Hyūga", "clan", "fermé", 0],
            ["Yamanaka", "clan", "fermé", 0], ["Aburame", "clan", "fermé", 0], ["Inuzuka", "clan", "fermé", 0],
            ["Hatake", "clan", "fermé", 0], ["Namikaze", "clan", "fermé", 0], ["Terumi", "clan", "fermé", 0],
            ["Iburi", "clan", "fermé", 0], ["Hozuki", "clan", "fermé", 0], ["Sarutobi", "clan", "fermé", 0],
            ["Kami", "clan", "fermé", 0], ["Chinoike", "clan", "fermé", 0], ["Raion", "clan", "fermé", 0],
            ["Sabaku", "clan", "fermé", 0], ["Sung", "clan", "fermé", 0],
        ];

        initialEntities.forEach(entity => {
            db.run(`INSERT OR IGNORE INTO entities (name, type, statut, places) VALUES (?, ?, ?, ?)`, entity);
        });
    });
}
initDb();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maj-dispo')
        .setDescription('[Staff] Met à jour une entité (village/clan) spécifique.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Le type d\'entité à mettre à jour (village ou clan).')
                .setRequired(true)
                .addChoices(
                    { name: 'village', value: 'village' },
                    { name: 'clan', value: 'clan' }
                ))
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Le nom de l\'entité à mettre à jour.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('statut')
                .setDescription('Le nouveau statut.')
                .setRequired(true)
                .addChoices(
                    { name: 'ouvert', value: 'ouvert' },
                    { name: 'fermé', value: 'fermé' }
                ))
        .addIntegerOption(option =>
            option.setName('places')
                .setDescription('Le nombre de places disponibles.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
    
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const nom = interaction.options.getString('nom');
        const statut = interaction.options.getString('statut');
        const places = interaction.options.getInteger('places');

        db.run(`UPDATE entities SET statut = ?, places = ? WHERE name = ? AND type = ?`, [statut, places, nom, type], async (err) => {
            if (err) {
                console.error(err);
                return await interaction.reply({ content: 'Erreur lors de la mise à jour de la base de données.', ephemeral: true });
            }

            // Répond avec le message mis à jour après la modification
            const updatedMessageContent = await getFormattedMessage(interaction, type);
            await interaction.reply({ content: updatedMessageContent, ephemeral: false });
        });
    }
};