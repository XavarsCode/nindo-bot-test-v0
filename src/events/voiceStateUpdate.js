// src/events/voiceStateUpdate.js

const { Events, ChannelType } = require('discord.js');
const { createWLCard } = require('../utils/embedBuilder.js');
const { wlChannelId, staffChannelId } = require('../../config.json');
const { addWLApplication } = require('../database/models.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
        if (newState.member.user.bot || oldState.channelId || !newState.channelId) return;
        
        if (newState.channelId === wlChannelId) {
            const member = newState.member;
            console.log(`[WL] ${member.user.tag} a rejoint le salon de Whitelist.`);

            const wlId = await addWLApplication(member.id);
            if (!wlId) {
                console.error('Erreur: Impossible de créer une fiche WL dans la DB.');
                return;
            }

            const wlEmbed = createWLCard(member, wlId, 'En attente');
            
            const staffChannel = await client.channels.fetch(staffChannelId);
            if (staffChannel && staffChannel.type === ChannelType.GuildText) {
                await staffChannel.send({ embeds: [wlEmbed.embed], components: [wlEmbed.buttons] });
            }
        }
    },
};