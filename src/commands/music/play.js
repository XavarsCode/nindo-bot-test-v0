const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicSystem = require('../../music/system');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎶 Joue une musique dans ton salon vocal')
        .addStringOption(opt => 
            opt.setName('query')
               .setDescription('Nom ou lien de la musique')
               .setRequired(true)
        ),

    async execute(interaction) {
        const distube = musicSystem.getDistube();
        if (!distube) return interaction.reply({ content: "⚠️ Le système musique n’est pas prêt.", ephemeral: true });

        const member = interaction.member;
        const channel = member.voice.channel;
        if (!channel) return interaction.reply({ content: "❌ Tu dois être dans un salon vocal !", ephemeral: true });

        const query = interaction.options.getString('query');
        await interaction.deferReply();

        try {
            await distube.play(channel, query, { member, textChannel: interaction.channel });

            const embed = new EmbedBuilder()
                .setTitle('🔎 Lecture / ajout')
                .setDescription(`**${query}** a été ajoutée à la file d’attente.`)
                .setColor('Random')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);

            if (err.errorCode === 'NO_RESULT') {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Musique introuvable')
                    .setDescription(`Aucune musique trouvée pour : **${query}**`)
                    .setColor('Red')
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Erreur')
                    .setDescription('Une erreur est survenue lors de la lecture.')
                    .setColor('Red')
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            }
        }
    }
};
