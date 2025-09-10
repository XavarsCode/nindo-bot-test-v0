const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-roles')
        .setDescription('Affiche la liste des rôles sur le serveur avec leurs IDs.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        // Vérifie si l'utilisateur a la permission Administrateur
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const roles = interaction.guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .filter(role => role.name !== '@everyone');

        if (roles.size === 0) {
            return interaction.editReply({ content: 'Il n\'y a aucun rôle sur ce serveur à part @everyone.' });
        }

        const messages = [];
        let currentMessage = '```Liste des rôles sur le serveur :\n\n';
        const codeBlockStart = '```';
        const codeBlockEnd = '```';

        for (const role of roles.values()) {
            const roleInfo = `- ${role.name} (ID: ${role.id})\n`;

            // Vérifie si l'ajout du rôle dépasse la limite de 2000 caractères de Discord
            if ((currentMessage + roleInfo + codeBlockEnd).length > 2000) {
                messages.push(currentMessage + codeBlockEnd);
                currentMessage = codeBlockStart + 'Liste des rôles (suite) :\n\n' + roleInfo;
            } else {
                currentMessage += roleInfo;
            }
        }

        // Ajoute le dernier morceau de message s'il reste du contenu
        if (currentMessage.length > codeBlockStart.length + codeBlockEnd.length) {
            messages.push(currentMessage + codeBlockEnd);
        }

        // Envoie le premier message en réponse à l'interaction
        await interaction.editReply({ content: messages[0] });

        // Envoie les messages suivants en tant que messages réguliers
        for (let i = 1; i < messages.length; i++) {
            await interaction.channel.send({ content: messages[i] });
        }
    },
};