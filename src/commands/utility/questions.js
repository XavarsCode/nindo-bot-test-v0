const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('questions')
        .setDescription('Réponses automatiques sans ticket')
        .addStringOption(option =>
            option.setName('categorie')
                .setDescription('Choisir une catégorie')
                .setRequired(true)
                .addChoices(
                    { name: 'Informations Générales', value: 'general' },
                    { name: 'Clans et Kekkei Genkai', value: 'clans' },
                    { name: 'Système de Jutsu', value: 'jutsu' },
                    { name: 'Grades et Progression', value: 'grades' },
                    { name: 'Villages et Organisations', value: 'villages' },
                    { name: 'Missions et Événements', value: 'missions' },
                    { name: 'Économie et Commerce', value: 'economie' }
                )
        )
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Utilisateur à mentionner (optionnel)')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const roleId = '1411471195072630935'
            if (!interaction.member.roles.cache.has(roleId)) {
                return await interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true })
            }

            await interaction.deferReply()

            const targetUser = interaction.options.getUser('utilisateur')
            const selectedCategory = interaction.options.getString('categorie')
            const mentionText = targetUser ? `${targetUser}` : ''

            const embeds = {
                general: new EmbedBuilder()
                    .setColor('#FF6B35')
                    .setTitle('Informations Générales - Serveur Nindo RP')
                    .addFields(
                        { name: 'Qu\'est-ce que Nindo RP ?', value: 'Nindo RP est un serveur de roleplay basé sur l\'univers de Shindo Life. Incarnez un ninja et vivez votre propre histoire dans un monde riche et interactif.', inline: false },
                        { name: 'Règles principales', value: '• Respectez le roleplay en permanence\n• Pas de metagaming ou powergaming\n• Respectez les autres joueurs\n• Suivez les règles spécifiques à chaque zone', inline: false },
                        { name: 'Comment commencer ?', value: '1. Lisez le règlement complet\n2. Créez votre fiche personnage\n3. Choisissez votre village de départ\n4. Commencez votre aventure ninja', inline: false },
                        { name: 'Besoin d\'aide ?', value: 'N\'hésitez pas à contacter un membre du staff via un ticket ou en MP pour toute question supplémentaire.', inline: false }
                    )
                    .setFooter({ text: 'Serveur Nindo RP • Informations Générales' })
                    .setTimestamp()
            }

            await interaction.editReply({ content: mentionText || null, embeds: [embeds[selectedCategory]] })

        } catch (error) {
            if (error.code === 10062 || error.code === 40060) return
            if (interaction.deferred && !interaction.replied) {
                try {
                    await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'exécution de la commande.' })
                } catch (e) {
                    console.error('Impossible de répondre à l\'interaction:', e)
                }
            }
        }
    }
}
