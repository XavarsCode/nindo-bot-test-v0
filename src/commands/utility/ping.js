const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Donne le ping du bot ! '),
    async execute(interaction) {

        await interaction.reply(`🏓 Pong ! Ping : \`${interaction.client.ws.ping}ms\``);
    },
};
