const { SlashCommandBuilder, ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription("Envoie un message sous l'apparence du bot")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('texte')
				.setDescription('Le message à envoyer')
				.setMaxLength(2000)
				.setRequired(true))
		.addChannelOption(option =>
			option.setName('salon')
				.setDescription("Le salon où envoyer le message (Si non rempli, le message sera envoyé ici)")
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption(option =>
			option.setName('embed')
				.setDescription("Envoyer sous forme d'embed")),

	async execute(interaction) {
		const texte = interaction.options.getString('texte');
		const channel = interaction.options.getChannel('salon') ?? interaction.channel;
		const useEmbed = interaction.options.getBoolean('embed') ?? false;

		if (!texte || texte.trim() === '') {
			return interaction.reply({ content: '❌ Vous devez fournir un message !', ephemeral: true });
		}

		if (useEmbed) {
			const embed = new EmbedBuilder()
				.setDescription(texte)
				.setColor('Random');
			await channel.send({ embeds: [embed] });
		} else {
			await channel.send(texte);
		}

		await interaction.reply({ 
			content: `✅ Message envoyé dans ${channel}`, 
			flags: MessageFlags.Ephemeral 
		});
	},
};
