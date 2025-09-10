const { SlashCommandBuilder } = require('discord.js');
const musicSystem = require('../../music/system');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Passe à la musique suivante'),

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
            await distube.skip(channel);
            await interaction.editReply("⏭️ Musique passée !");
        } catch {
            await interaction.editReply("⚠️ Impossible de passer, il n’y a pas de musique suivante.");
        }
    }
};
