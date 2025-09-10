const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recrutement')
        .setDescription('Publier l’annonce de recrutement staff')
        .setDefaultMemberPermissions(0), // réservé admin

    async execute(interaction) {
        const embed = {
            title: "📢 Recrutement Staff",
            description: "Tu veux rejoindre le staff du serveur ? Clique sur le bouton ci-dessous pour postuler !",
            color: 0x2ecc71,
            footer: { text: "Nindo" }
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('postuler_staff')
                .setLabel('📩 Postuler')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
