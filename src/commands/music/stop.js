const { SlashCommandBuilder } = require('discord.js');
const musicSystem = require('../../music/system');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Stoppe la musique et vide la file'),

    async execute(interaction) {
        const distube = musicSystem.getDistube();
        if (!distube) return interaction.reply({ content: "⚠️ Le système musique n’est pas prêt.", ephemeral: true });

        const member = interaction.member;
        const channel = member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: "❌ Tu dois être dans un salon vocal !", ephemeral: true });
        }

        await interaction.deferReply();

        try {
            distube.stop(channel);
            await interaction.editReply("⏹️ Musique stoppée et file vidée !");
        } catch {
            await interaction.editReply("⚠️ Impossible d’arrêter, aucune musique en cours.");
        }
    }
};
