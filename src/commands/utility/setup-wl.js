// commands/setup-wl.js - Version avec gestion d'erreurs robuste
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-wl')
        .setDescription('Créer l\'embed permanent de demande de whitelist (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, bot) {
        try {
            // Double vérification des permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ 
                    content: '❌ Seuls les administrateurs peuvent utiliser cette commande.', 
                    ephemeral: true 
                });
            }

            // Créer l'embed directement ici pour éviter les problèmes d'import
            const embed = new EmbedBuilder()
                .setTitle('🎙️ Demande de Whitelist')
                .setDescription('Cliquez sur le bouton ci-dessous pour faire votre demande de whitelist.\n\n**Processus:**\n1️⃣ Questions en MP\n2️⃣ Prise de RDV\n3️⃣ Entretien vocal\n4️⃣ Résultat')
                .setColor('#0099ff')
                .setFooter({ text: 'Système Whitelist v2' });

            const button = new ButtonBuilder()
                .setCustomId('wl_request')
                .setLabel('Faire ma demande WL')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫');

            const row = new ActionRowBuilder().addComponents(button);

            // Répondre d'abord
            await interaction.reply({
                content: '✅ Embed de demande de whitelist créé ci-dessous:',
                ephemeral: true
            });

            // Puis envoyer l'embed dans le salon
            await interaction.followUp({
                embeds: [embed],
                components: [row]
            });

            console.log(`✅ Setup WL créé par ${interaction.user.username} dans ${interaction.channel.name}`);

        } catch (error) {
            console.error('❌ Erreur setup WL:', error);
            
            // Gestion d'erreur sécurisée
            const errorMessage = '❌ Une erreur est survenue lors de la création de l\'embed.';
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                } else if (interaction.deferred) {
                    await interaction.editReply({ content: errorMessage });
                } else {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                }
            } catch (replyError) {
                console.error('❌ Erreur lors de l\'envoi du message d\'erreur:', replyError);
            }
        }
    },
};