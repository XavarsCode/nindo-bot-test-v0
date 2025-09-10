const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// ID du canal où le message doit être envoyé
const targetChannelId = '1411471440359854192';

const staffTeams = {
    'Fondateurs': ['1411471172045901954', '1411471172855529472'],
    'Équipe de Gestion': ['1411471174600495276', '1411471175468585051', '1411471176366031135', '1411471177548955739', '1411471178358591579'],
    'Équipe de Modération': ['1411471180623380560', '1411471181395132540', '1411471182519209984', '1411471183416787174', '1411471184175825021'],
    'Équipe Animation': ['1411471186507857990', '1411471187665748090', '1411471188735168665', '1411471189242548439'],
    'Ancien Staff': ['1411471196503146557'],
};

// Fonction pour générer l'embed de présentation
const createInfoEmbed = () => {
    return new EmbedBuilder()
        .setColor('#FFC0CB')
        .setTitle('Informations du serveur')
        .setDescription('Bienvenue dans le salon ⁠🏤・informations !\n'
                      + 'Ici, tu peux retrouver tout ce qu\'il faut savoir sur notre serveur : le Staff, les salons, les rôles à choisir, tout est indiqué ici !\n\n'
                      + '➜ Utilise le menu déroulant pour pouvoir choisir ce que tu souhaites savoir !');
};

// Fonction pour générer le sélecteur
const createStaffSelector = () => {
    const options = Object.keys(staffTeams).map(teamName => ({
        label: teamName,
        value: `staff_${teamName.replace(/\s/g, '_')}` // Les valeurs ne peuvent pas contenir d'espaces
    }));

    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('staff_selector')
                .setPlaceholder('Choisis un pôle du Staff')
                .addOptions(options)
        );
};

// Fonction pour générer l'embed de l'équipe sélectionnée
const createTeamEmbed = async (guild, teamName) => {
    const roleIds = staffTeams[teamName];
    const teamMembers = new Set();
    const members = await guild.members.fetch();
    const embedColor = '#FFC0CB';

    const membersWithRoles = members.filter(member => member.roles.cache.some(role => roleIds.includes(role.id)));
    membersWithRoles.forEach(member => teamMembers.add(member));

    const memberList = [...teamMembers]
        .sort((a, b) => a.user.username.localeCompare(b.user.username))
        .map(member => `➜ ${member} (__${member.user.username}__ | \`${member.user.id}\`)`).join('\n') || 'Aucun membre.';

    return new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`__Pôle ${teamName}__`)
        .setDescription(memberList);
};

// Fonction pour envoyer le message initial
const sendInfoMessage = async (interaction) => {
    const channel = await interaction.client.channels.fetch(targetChannelId);
    if (!channel) {
        return console.error(`Impossible de trouver le canal avec l'ID ${targetChannelId}`);
    }

    const infoEmbed = createInfoEmbed();
    const staffSelector = createStaffSelector();

    await channel.send({ embeds: [infoEmbed], components: [staffSelector] });
};

// Gère l'interaction avec le sélecteur
const handleInteraction = async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'staff_selector') return;

    await interaction.deferReply({ ephemeral: true });
    
    const selectedTeam = interaction.values[0].replace('staff_', '').replace(/_/g, ' ');

    try {
        const teamEmbed = await createTeamEmbed(interaction.guild, selectedTeam);
        await interaction.editReply({ embeds: [teamEmbed], ephemeral: true });
    } catch (error) {
        console.error('Erreur lors du traitement de la sélection du staff :', error);
        await interaction.editReply({ content: 'Une erreur est survenue lors de la récupération de l\'équipe.', ephemeral: true });
    }
};

module.exports = {
    sendInfoMessage,
    handleInteraction
};