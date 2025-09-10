// src/hubVocal/panel.js
const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const fs = require("fs").promises;

const defaultData = {
  channelOwners: {}, // channelId -> userId
  whitelist: {},     // channelId -> [userId,...]
  blacklist: {},     // channelId -> [userId,...]
  soundboard: {},    // channelId -> boolean
  incognito: {},     // channelId -> boolean
};

async function ensureData(path) {
  try {
    await fs.access(path);
    const raw = await fs.readFile(path, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    await fs.writeFile(path, JSON.stringify(defaultData, null, 2));
    return JSON.parse(JSON.stringify(defaultData));
  }
}
async function saveData(path, data) {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
}

module.exports = (client, cfg) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "vocal") return;

    // create voice channel
    const channel = await interaction.guild.channels.create({
      name: `🎙️┃${interaction.user.username}`,
      type: ChannelType.GuildVoice,
      parent: cfg.categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.Connect],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ManageChannels,
          ],
        },
      ],
    });

    // persist owner mapping
    const data = await ensureData(cfg.dataPath);
    data.channelOwners[channel.id] = interaction.user.id;
    data.whitelist[channel.id] = data.whitelist[channel.id] || [];
    data.blacklist[channel.id] = data.blacklist[channel.id] || [];
    data.soundboard[channel.id] = false;
    data.incognito[channel.id] = false;
    await saveData(cfg.dataPath, data);

    // embed style "carte"
    const embed = new EmbedBuilder()
      .setColor("#2f3136")
      .setTitle("🔊 Salon vocal personnalisé")
      .setDescription(
        `👋 Bienvenue <@${interaction.user.id}> dans ton propre salon !\n\n` +
          `➡️ Amuse-toi bien — utilise le menu ci-dessous pour gérer ton salon.`
      )
      // TODO: si tu veux mettre une image/thumbnail perso, mets l'URL ici
      // .setThumbnail("https://cdn.discordapp.com/emojis/TON_EMOJI.png")
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    // menu déroulant complet (placeholders d'emoji à remplacer par <:nom:id>)
    const menu = new StringSelectMenuBuilder()
      .setCustomId("vocal_manage")
      .setPlaceholder("⚙️ Sélectionner une option de gestion")
      .addOptions([
        { label: "Ouvrir le salon", value: "open", emoji: "🔓" },
        { label: "Fermer le salon", value: "close", emoji: "🔒" },
        { label: "Inviter quelqu'un dans le salon", value: "invite", emoji: "➕" },
        { label: "Autoriser un rôle à rejoindre le salon", value: "role", emoji: "🌿" },
        { label: "Renommer son salon", value: "rename", emoji: "✏️" },
        { label: "Définir une limite de membres", value: "limit", emoji: "👥" },
        { label: "Expulser quelqu'un de ton salon vocal", value: "kick", emoji: "❌" },
        { label: "Autoriser les soundboards", value: "soundboard_on", emoji: "🎵" },
        { label: "Interdire les soundboards", value: "soundboard_off", emoji: "🔇" },
        { label: "Activer le mode incognito", value: "incognito_on", emoji: "🕵️" },
        { label: "Désactiver le mode incognito", value: "incognito_off", emoji: "👀" },
        { label: "Transférer la propriété", value: "transfer", emoji: "👑" },
        { label: "Gérer la liste blanche", value: "whitelist", emoji: "✅" },
        { label: "Gérer la liste noire", value: "blacklist", emoji: "🚫" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false, // le panel visible dans le salon, pas éphemère
    });
  });
};
