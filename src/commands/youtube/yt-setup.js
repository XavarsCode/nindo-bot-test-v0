const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yt-setup')
        .setDescription('Configurer les notifications YouTube')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // admins only
        .addStringOption(option =>
            option.setName('chaine')
                .setDescription('Lien de la chaîne YouTube')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Salon où envoyer les notifications')
                .setRequired(true)),

    async execute(interaction) {
        const channelLink = interaction.options.getString('chaine');
        const targetChannel = interaction.options.getChannel('salon');

        // Ici tu stockes en DB ou fichier JSON
        // Exemple rapide :
        const fs = require('fs');
        let config = {};
        if (fs.existsSync('./yt-config.json')) {
            config = JSON.parse(fs.readFileSync('./yt-config.json', 'utf8'));
        }
        config[interaction.guild.id] = {
            chaine: channelLink,
            salon: targetChannel.id
        };
        fs.writeFileSync('./yt-config.json', JSON.stringify(config, null, 2));

        await interaction.reply({ content: `✅ Notifications YouTube activées pour ${channelLink} dans ${targetChannel}`, ephemeral: true });
    }
};
