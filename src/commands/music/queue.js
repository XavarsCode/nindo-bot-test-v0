const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicSystem = require('../../music/system');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📜 Affiche la file d’attente des musiques'),

    async execute(interaction) {
        const distube = musicSystem.getDistube();
        if (!distube) return interaction.reply({ content: "⚠️ Le système musique n’est pas prêt.", ephemeral: true });

        const member = interaction.member;
        const channel = member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: "❌ Tu dois être dans un salon vocal !", ephemeral: true });
        }

        await interaction.deferReply();

        const queue = distube.getQueue(channel);
        if (!queue) return interaction.editReply("📭 La file d’attente est vide !");

        const songs = queue.songs
            .map((s, i) => `${i === 0 ? "▶️" : `${i}.`} **${s.name}** \`[${s.formattedDuration}]\``)
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor("#2f3136")
            .setTitle("🎶 File d’attente actuelle")
            .setDescription(songs.length > 0 ? songs : "📭 Aucune musique dans la file.")
            .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
