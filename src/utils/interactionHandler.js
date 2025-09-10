// src/utils/interactionHandler.js

const { updateWLStatus, addRPApplication, updateRPStatus } = require('../database/models.js');
const { createWLCard, createRPCard } = require('./embedBuilder.js');
const { staffRoleId, wlRoleId, rpRoleId, staffChannelId } = require('../../config.json');
const { InteractionType } = require('discord.js');

async function handleButtons(interaction) {
    // Vérifier si interaction.customId existe avant de l'utiliser
    if (!interaction.customId) {
        return;
    }
    
    if (!interaction.member.roles.cache.has(staffRoleId)) {
        await interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser ces boutons.', ephemeral: true });
        return;
    }

    const [action, type, id] = interaction.customId.split('_');
    if (type !== 'wl' && type !== 'rp') return;

    try {
        let newStatus;
        if (action === 'validate') newStatus = 'Validé';
        else if (action === 'reject') newStatus = 'Refusé';
        else if (action === 'reopen') newStatus = 'Repris';

        const user = await interaction.guild.members.fetch(id);
        
        if (type === 'wl') {
            await updateWLStatus(id, newStatus, interaction.user.id);
            const updatedWLCard = createWLCard(user, id, newStatus);
            await interaction.update({ embeds: [updatedWLCard.embed], components: [] });
            if (newStatus === 'Validé' && user) {
                await user.roles.add(wlRoleId);
                await user.send(`Félicitations, votre candidature à la Whitelist a été acceptée !`);
            }
        } else if (type === 'rp') {
            await updateRPStatus(id, newStatus, interaction.user.id);
            const rpData = await getRPApplicationById(id); // Ceci est une fonction à implémenter dans models.js si vous voulez un historique
            const updatedRPCard = createRPCard(user, id, rpData, newStatus);
            await interaction.update({ embeds: [updatedRPCard.embed], components: [] });
            if (newStatus === 'Validé' && user) {
                await user.roles.add(rpRoleId);
                await user.send(`Félicitations, votre fiche RP a été validée !`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la gestion du bouton:', error);
        await interaction.reply({ content: 'Une erreur est survenue lors du traitement de l\'action.', ephemeral: true });
    }
}

async function handleRPModalSubmit(interaction) {
    if (interaction.customId === 'rpModal') {
        const formData = {
            pseudoIG: interaction.fields.getTextInputValue('pseudoIG'),
            clan: interaction.fields.getTextInputValue('clan'),
            rang: interaction.fields.getTextInputValue('rang'),
            histoire: interaction.fields.getTextInputValue('histoire'),
        };

        try {
            const rpId = await addRPApplication(interaction.user.id, formData);

            const rpCard = createRPCard(interaction.member, rpId, formData, 'En attente');
            const staffChannel = await interaction.client.channels.fetch(staffChannelId);
            if (staffChannel) {
                await staffChannel.send({ embeds: [rpCard.embed], components: [rpCard.buttons] });
            }

            await interaction.reply({ content: 'Votre fiche de personnage a été soumise avec succès et est en attente de validation.', ephemeral: true });

        } catch (error) {
            console.error('Erreur lors de la soumission de la modale RP:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la soumission de votre fiche.', ephemeral: true });
        }
    }
}

module.exports = {
    handleButtons,
    handleRPModalSubmit
};