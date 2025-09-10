// src/staffMessage.js
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");

const MESSAGE_FILE = "./staffMessage.json";

// Rôles par catégories
const staffCategories = [
    {
        id: "fondateurs",
        label: "🟢 Fondateurs",
        description: "Fondateurs et co-fondateur",
        roles: [
            { name: "Fondateur", id: "1411471172045901954" },
            { name: "Co-Fondateur", id: "1411471172855529472" },
        ],
        color: "#FF0000",
    },
    {
        id: "devs",
        label: "🔧 Développement & Administration",
        description: "Dévs et admins",
        roles: [
            { name: "Développeur", id: "1411471173631479859" },
            { name: "Administrateur", id: "1411471174600495276" },
        ],
        color: "#FF8C00",
    },
    {
        id: "moderation",
        label: "🛡️ Modération",
        description: "Modérateurs du serveur",
        roles: [
            { name: "Resp. Modération", id: "1411471175468585051" },
            { name: "Super Modérateur", id: "1411471180623380560" },
            { name: "Modérateur RP", id: "1411471181395132540" },
            { name: "Modérateur", id: "1411471182519209984" },
            { name: "Modérateur Test", id: "1411471183416787174" },
        ],
        color: "#1E90FF",
    },
    {
        id: "animation",
        label: "🎨 Animation",
        description: "Equipe animation",
        roles: [
            { name: "Resp. Animation", id: "1411471176366031135" },
            { name: "Super Animateur", id: "1411471186507857990" },
            { name: "Animateur", id: "1411471187665748090" },
            { name: "Animateur Test", id: "1411471188735168665" },
        ],
        color: "#32CD32",
    },
    {
        id: "support",
        label: "💼 Support & Gestion",
        description: "Support et gestion",
        roles: [
            { name: "Resp. Support", id: "1411471177548955739" },
            { name: "Équipe de Gestion", id: "1411471178358591579" },
        ],
        color: "#FFD700",
    },
    {
        id: "historique",
        label: "📜 Staff Historique",
        description: "Staff passé",
        roles: [
            { name: "Staff", id: "1411471195072630935" },
            { name: "Ancien Staff", id: "1411471196503146557" },
        ],
        color: "#C0C0C0",
    },
];

// Embed principal
function createMainEmbed() {
    return new EmbedBuilder()
        .setTitle("🛡️ Équipe du serveur")
        .setDescription("Bienvenue ! Voici le staff du serveur. Sélectionne un pôle dans le menu ci-dessous pour voir les membres correspondants.")
        .setColor("#ff5a5f")
        .setTimestamp();
}

// Embed pour chaque catégorie
function createCategoryEmbed(categoryId) {
    const cat = staffCategories.find(c => c.id === categoryId);
    if (!cat) return null;

    const embed = new EmbedBuilder()
        .setTitle(`${cat.label}`)
        .setDescription(cat.roles.map(r => `<@&${r.id}>`).join("\n") || "Aucun")
        .setColor(cat.color)
        .setTimestamp();

    return embed;
}

// Select menu pour choisir un pôle
function createSelectMenu() {
    const menu = new StringSelectMenuBuilder()
        .setCustomId("staff_select")
        .setPlaceholder("Sélectionne un pôle du staff")
        .addOptions(
            staffCategories.map(c => ({
                label: c.label,
                value: c.id,
                description: c.description,
            }))
        );

    return new ActionRowBuilder().addComponents(menu);
}

// Envoi du message principal avec menu
async function sendStaffMessage(client, channelId) {
    if (!fs.existsSync(MESSAGE_FILE)) {
        const channel = await client.channels.fetch(channelId);
        const embed = createMainEmbed();
        const row = createSelectMenu();
        const message = await channel.send({ embeds: [embed], components: [row] });

        fs.writeFileSync(MESSAGE_FILE, JSON.stringify({ messageId: message.id, channelId: channel.id }));
        console.log("Message staff principal envoyé et sauvegardé !");
    }
}

module.exports = { sendStaffMessage, createMainEmbed, createCategoryEmbed };
