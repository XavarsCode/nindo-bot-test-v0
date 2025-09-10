// src/hubVocal/interactionHandler.js
const { PermissionsBitField } = require("discord.js");
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

function isOwner(data, channelId, userId) {
  return data.channelOwners[channelId] === userId;
}

function waitForNextMessage(client, channel, userId, timeout = 30000) {
  return new Promise((resolve) => {
    const collector = channel.createMessageCollector({
      filter: (m) => m.author.id === userId,
      max: 1,
      time: timeout,
    });
    collector.on("collect", (m) => resolve(m));
    collector.on("end", (collected) => {
      if (collected.size === 0) resolve(null);
    });
  });
}

module.exports = (client, cfg) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu() && !interaction.isChatInputCommand()) return;

    if (interaction.isChatInputCommand() && interaction.commandName === "vocal") {
      // Logique pour la commande /vocal si tu veux la garder
      // (sinon, cette partie est gérée par voiceHub.js)
    }

    if (interaction.isStringSelectMenu()) {
      const selected = interaction.values[0];
      const data = await readData(cfg.dataPath);

      // Si le salon vocal n'existe plus, on ne fait rien
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return interaction.reply({
          content: "❌ Tu dois être dans un salon vocal pour utiliser ce menu !",
          ephemeral: true,
        });
      }

      // Vérifie si l'utilisateur est le propriétaire du salon
      if (!isOwner(data, voiceChannel.id, interaction.user.id)) {
        return interaction.reply({
          content: "❌ Tu n'es pas le propriétaire de ce salon.",
          ephemeral: true,
        });
      }

      switch (selected) {
        case "open":
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: true });
          return interaction.reply({ content: "🔓 Le salon est maintenant ouvert.", ephemeral: true });

        case "close":
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
          return interaction.reply({ content: "🔒 Le salon est maintenant fermé.", ephemeral: true });

        case "invite":
          await interaction.reply({ content: "➡️ Mentionne l'utilisateur que tu veux inviter :", ephemeral: true });
          const inviteMsg = await waitForNextMessage(client, interaction.channel, interaction.user.id);
          if (!inviteMsg || !inviteMsg.mentions.users.first()) {
            return interaction.followUp({ content: "❌ Mention invalide ou timeout.", ephemeral: true });
          }
          const invitedUser = inviteMsg.mentions.users.first();
          await voiceChannel.permissionOverwrites.edit(invitedUser.id, { Connect: true });
          return interaction.followUp({ content: `✅ <@${invitedUser.id}> a été invité.e !`, ephemeral: true });

        case "rename":
          await interaction.reply({ content: "➡️ Quel est le nouveau nom du salon ? (30s)", ephemeral: true });
          const renameMsg = await waitForNextMessage(client, interaction.channel, interaction.user.id);
          if (!renameMsg || !renameMsg.content) {
            return interaction.followUp({ content: "❌ Nom invalide ou timeout.", ephemeral: true });
          }
          await voiceChannel.setName(renameMsg.content);
          return interaction.followUp({ content: `✅ Le salon a été renommé en \`${renameMsg.content}\`.`, ephemeral: true });

        case "limit":
          await interaction.reply({ content: "➡️ Quelle est la nouvelle limite ? (0-99)", ephemeral: true });
          const limitMsg = await waitForNextMessage(client, interaction.channel, interaction.user.id);
          const limit = parseInt(limitMsg.content);
          if (isNaN(limit) || limit < 0 || limit > 99) {
            return interaction.followUp({ content: "❌ Limite invalide. (doit être un nombre entre 0 et 99)", ephemeral: true });
          }
          await voiceChannel.setUserLimit(limit);
          return interaction.followUp({ content: `✅ La limite du salon est maintenant de ${limit} membres.`, ephemeral: true });

        case "kick":
          await interaction.reply({ content: "➡️ Mentionne l'utilisateur que tu veux expulser :", ephemeral: true });
          const kickMsg = await waitForNextMessage(client, interaction.channel, interaction.user.id);
          if (!kickMsg || !kickMsg.mentions.users.first()) {
            return interaction.followUp({ content: "❌ Mention invalide ou timeout.", ephemeral: true });
          }
          const kickedUser = kickMsg.mentions.users.first();
          const memberToKick = voiceChannel.members.get(kickedUser.id);
          if (!memberToKick) {
            return interaction.followUp({ content: "❌ Cet utilisateur n'est pas dans le salon.", ephemeral: true });
          }
          await memberToKick.voice.setChannel(null);
          return interaction.followUp({ content: `✅ ${kickedUser.tag} a été expulsé.e du salon.`, ephemeral: true });
      }
    }
  });
};