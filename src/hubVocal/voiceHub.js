// src/hubVocal/voiceHub.js
const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const fs = require("fs").promises;

async function readData(pathToFile) {
  try {
    const raw = await fs.readFile(pathToFile, "utf8");
    const data = JSON.parse(raw || "{}");
    return {
      channelOwners: data.channelOwners || {},
      whitelist: data.whitelist || {},
      blacklist: data.blacklist || {},
      soundboard: data.soundboard || {},
      incognito: data.incognito || {},
    };
  } catch {
    return {
      channelOwners: {},
      whitelist: {},
      blacklist: {},
      soundboard: {},
      incognito: {},
    };
  }
}

async function writeData(pathToFile, data) {
  await fs.writeFile(pathToFile, JSON.stringify(data, null, 2));
}

async function sendPanel(member, channel) {
  const embed = new EmbedBuilder()
    .setColor("#2f3136")
    .setTitle("🔊 Salon vocal personnalisé")
    .setDescription(
      `👋 Bienvenue <@${member.user.id}> dans ton propre salon !\n\n` +
      `➡️ Amuse-toi bien — utilise le menu ci-dessous pour gérer ton salon.`
    )
    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
    .setTimestamp();

  const menu = new StringSelectMenuBuilder()
    .setCustomId("vocal_manage")
    .setPlaceholder("⚙️ Sélectionner une option de gestion")
    .addOptions([
      { label: "Ouvrir le salon", value: "open", emoji: "🔓" },
      { label: "Fermer le salon", value: "close", emoji: "🔒" },
      { label: "Inviter quelqu'un", value: "invite", emoji: "➕" },
      { label: "Autoriser un rôle", value: "role", emoji: "🌿" },
      { label: "Renommer le salon", value: "rename", emoji: "✏️" },
      { label: "Définir une limite", value: "limit", emoji: "👥" },
      { label: "Expulser quelqu'un", value: "kick", emoji: "❌" },
      { label: "Activer les soundboards", value: "soundboard_on", emoji: "🎵" },
      { label: "Désactiver les soundboards", value: "soundboard_off", emoji: "🔇" },
      { label: "Activer le mode incognito", value: "incognito_on", emoji: "🕵️" },
      { label: "Désactiver le mode incognito", value: "incognito_off", emoji: "👀" },
      { label: "Transférer la propriété", value: "transfer", emoji: "👑" },
      { label: "Gérer la liste blanche", value: "whitelist", emoji: "✅" },
      { label: "Gérer la liste noire", value: "blacklist", emoji: "🚫" },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  await channel.send({
    embeds: [embed],
    components: [row],
  });
}

module.exports = (client, cfg) => {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    const hubChannelId = "1414346800709500998";
    const panelChannelId = "1414348701027008643";

    if (newState.channelId === hubChannelId && oldState.channelId !== hubChannelId) {
      const member = newState.member;
      const guild = newState.guild;

      const newChannel = await guild.channels.create({
        name: `🎙️┃${member.user.username}`,
        type: ChannelType.GuildVoice,
        parent: cfg.categoryId,
        permissionOverwrites: [{
          id: guild.id,
          deny: [PermissionsBitField.Flags.Connect],
        }, {
          id: member.user.id,
          allow: [
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ManageChannels,
          ],
        }, ],
      });

      const data = await readData(cfg.dataPath);
      data.channelOwners[newChannel.id] = member.user.id;
      data.whitelist[newChannel.id] = [];
      data.blacklist[newChannel.id] = [];
      data.soundboard[newChannel.id] = false;
      data.incognito[newChannel.id] = false;
      await writeData(cfg.dataPath, data);

      await member.voice.setChannel(newChannel);

      const panelChannel = guild.channels.cache.get(panelChannelId);
      if (panelChannel) {
        await sendPanel(member, panelChannel);
      }
    }

    if (oldState.channelId && oldState.channel && oldState.channel.members.size === 0) {
      const data = await readData(cfg.dataPath);
      if (data.channelOwners[oldState.channelId]) {
        try {
          await oldState.channel.delete();
        } catch (error) {
          if (error.code === 10003) {
            console.log(`Le salon ${oldState.channelId} a déjà été supprimé.`);
          } else {
            console.error("Erreur lors de la suppression du salon vocal :", error);
          }
        }
        delete data.channelOwners[oldState.channelId];
        delete data.whitelist[oldState.channelId];
        delete data.blacklist[oldState.channelId];
        delete data.soundboard[oldState.channelId];
        delete data.incognito[oldState.channelId];
        await writeData(cfg.dataPath, data);
      }
    }
  });
};