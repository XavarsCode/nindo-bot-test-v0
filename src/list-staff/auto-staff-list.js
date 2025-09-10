const { EmbedBuilder } = require('discord.js');

module.exports = async (client) => {
    // ID du canal où le message doit être affiché
    const staffChannelId = '1411471440359854192';

    // ID du message que le bot doit éditer
    // Laissez null la première fois pour créer un nouveau message
    let staffMessageId = null;

    // Définissez la structure de vos équipes en utilisant les IDs des rôles
    const staffTeams = {
        'Fondateurs': ['1411471172045901954', '1411471172855529472'],
        'Équipe de Gestion': ['1411471174600495276', '1411471175468585051', '1411471176366031135', '1411471177548955739', '1411471178358591579'],
        'Équipe de Modération': ['1411471180623380560', '1411471181395132540', '1411471182519209984', '1411471183416787174', '1411471184175825021'],
        'Équipe Animation': ['1411471186507857990', '1411471187665748090', '1411471188735168665', '1411471189242548439'],
        'Ancien Staff': ['1411471196503146557'],
    };

    const updateStaffList = async () => {
        try {
            const channel = await client.channels.fetch(staffChannelId);
            if (!channel) {
                return console.error(`Impossible de trouver le canal avec l'ID ${staffChannelId}`);
            }

            const members = await channel.guild.members.fetch();
            const embeds = [];
            const embedColor = '#FFC0CB';
            const MAX_EMBED_FIELDS = 25;

            let currentEmbed = new EmbedBuilder()
                .setTitle(' <:emoji_coeur:1411473138356160555> **__Équipe du serveur__** <:emoji_etoile:1411473138356160555>')
                .setColor(embedColor);

            let staffFound = false;
            let fieldsInCurrentEmbed = 0;

            for (const teamName in staffTeams) {
                const roleIds = staffTeams[teamName];
                const teamMembers = new Set();
                const membersWithRoles = members.filter(member => member.roles.cache.some(role => roleIds.includes(role.id)));
                membersWithRoles.forEach(member => teamMembers.add(member));

                if (teamMembers.size > 0) {
                    staffFound = true;
                    const memberList = [...teamMembers]
                        .sort((a, b) => a.user.username.localeCompare(b.user.username))
                        .map(member => `<:emoji_membre:1411473138356160555> ${member}`).join('\n');

                    if (fieldsInCurrentEmbed >= MAX_EMBED_FIELDS) {
                        embeds.push(currentEmbed);
                        currentEmbed = new EmbedBuilder()
                            .setTitle(' <:emoji_coeur:1411473138356160555> **__Équipe du serveur (suite)__** <:emoji_etoile:1411473138356160555>')
                            .setColor(embedColor);
                        fieldsInCurrentEmbed = 0;
                    }

                    currentEmbed.addFields({
                        name: `**${teamName}**`,
                        value: memberList,
                        inline: false
                    });
                    fieldsInCurrentEmbed++;
                }
            }

            if (!staffFound) {
                currentEmbed.setDescription('Actuellement, aucun membre du staff n\'est listé.');
            }

            embeds.push(currentEmbed);

            if (staffMessageId) {
                const message = await channel.messages.fetch(staffMessageId);
                await message.edit({ embeds: embeds });
                console.log(`Le message de l'équipe a été mis à jour dans le canal ${channel.name}.`);
            } else {
                const newMessage = await channel.send({ embeds: embeds });
                staffMessageId = newMessage.id;
                console.log(`Nouveau message de l'équipe envoyé. L'ID du message est : ${staffMessageId}.`);
            }

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la liste du staff :', error);
        }
    };

    // Exécute la fonction une fois au démarrage
    updateStaffList();
    // Planifie l'exécution toutes les 15 minutes (900000 millisecondes)
    setInterval(updateStaffList, 900000);
};