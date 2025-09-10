const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Donne des informations a propos de ce serveur'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		await interaction.reply(`Ce serveur est ${interaction.guild.name} et a ${interaction.guild.memberCount} membres.`);
	},
};