// handlers/buttonHandler.js - Version corrigée avec logger avancé
const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');

async function handle(interaction, bot) {
    const customId = interaction.customId;
    
    logger.discord('buttonInteraction', {
        user: interaction.user,
        guild: interaction.guild,
        customId: customId,
        channel: interaction.channel
    });

    try {
        // Whitelist buttons
        if (customId === 'wl_request') {
            await handleWLRequest(interaction, bot);
        } else if (customId === 'wl_ready') {
            await handleWLReady(interaction, bot);
        } else if (customId.startsWith('wl_accept_')) {
            await handleWLAccept(interaction, bot);
        } else if (customId.startsWith('wl_refuse_')) {
            await handleWLRefuse(interaction, bot);
        } else if (customId.startsWith('wl_notes_')) {
            await handleWLNotes(interaction, bot);
        }
        
        // Fiche RP buttons
        else if (customId.startsWith('fiche_accept_')) {
            await handleFicheAccept(interaction, bot);
        } else if (customId.startsWith('fiche_refuse_')) {
            await handleFicheRefuse(interaction, bot);
        } else if (customId.startsWith('fiche_edit_')) {
            await handleFicheEdit(interaction, bot);
        }
        
        else {
            logger.warn(`Bouton non géré: ${customId}`, { customId, userId: interaction.user.id });
        }
        
    } catch (error) {
        logger.error(`Erreur dans buttonHandler pour ${customId}`, error, { critical: true });
        
        // Réponse d'erreur sécurisée
        const errorMessage = '❌ Une erreur est survenue lors du traitement de cette action.';
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            } else if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            }
        } catch (replyError) {
            logger.error('Erreur lors de l\'envoi du message d\'erreur', replyError);
        }
    }
}

// ==================== WHITELIST HANDLERS ====================

async function handleWLRequest(interaction, bot) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.user;
    
    logger.info(`Demande WL initiée par ${user.username} (${user.id})`);
    
    try {
        // Vérifier si l'utilisateur a déjà une demande en cours
        const existingWL = await new Promise((resolve, reject) => {
            bot.database.db.get(
                "SELECT * FROM whitelist WHERE user_id = ? AND status = 'pending'", 
                [user.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingWL) {
            logger.info(`Demande WL rejetée - déjà en cours: ${existingWL.id}`, { userId: user.id, existingId: existingWL.id });
            
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Demande existante')
                .setDescription(`Vous avez déjà une demande de whitelist en cours: \`${existingWL.id}\``)
                .setColor(config.COLORS.WARNING);

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const dmChannel = await user.createDM();
        const filter = m => m.author.id === user.id;

        logger.debug('Canal DM créé, début des questions WL', { userId: user.id });

        // Intro
        const introEmbed = new EmbedBuilder()
            .setTitle('🎙️ Demande de Whitelist')
            .setDescription(`Bonjour ${user.username} !\n\nJe vais vous poser quelques questions pour votre demande de whitelist.\n\n**⏱️ Vous avez ${config.LIMITS.DM_TIMEOUT / 60000} minutes pour répondre à chaque question.**`)
            .setColor(config.COLORS.INFO);

        await dmChannel.send({ embeds: [introEmbed] });

        // Question 1: Disponibilités
        logger.debug('Question 1/3: Disponibilités', { userId: user.id });
        const availabilityEmbed = new EmbedBuilder()
            .setTitle('📅 Vos disponibilités (1/3)')
            .setDescription('Veuillez indiquer vos disponibilités pour l\'entretien whitelist.\n\n**Exemple:** "Lundi 20h, Mardi 18h, Mercredi après 19h"')
            .setColor(config.COLORS.INFO);

        await dmChannel.send({ embeds: [availabilityEmbed] });

        const availabilityCollected = await dmChannel.awaitMessages({ 
            filter, 
            max: 1, 
            time: config.LIMITS.DM_TIMEOUT 
        });

        if (!availabilityCollected.first()) {
            logger.warn('Timeout question disponibilités', { userId: user.id });
            await dmChannel.send('❌ Temps écoulé. Veuillez refaire votre demande.');
            await interaction.editReply({ content: '❌ Demande annulée (timeout).' });
            return;
        }

        const availability = availabilityCollected.first().content;
        logger.debug('Réponse disponibilités reçue', { userId: user.id, length: availability.length });

        // Question 2: Pseudo Roblox
        logger.debug('Question 2/3: Pseudo Roblox', { userId: user.id });
        const robloxEmbed = new EmbedBuilder()
            .setTitle('🎮 Pseudo Roblox (2/3)')
            .setDescription('Quel est votre pseudo Roblox ?')
            .setColor(config.COLORS.INFO);

        await dmChannel.send({ embeds: [robloxEmbed] });

        const robloxCollected = await dmChannel.awaitMessages({ 
            filter, 
            max: 1, 
            time: config.LIMITS.DM_TIMEOUT 
        });

        if (!robloxCollected.first()) {
            logger.warn('Timeout question pseudo Roblox', { userId: user.id });
            await dmChannel.send('❌ Temps écoulé. Veuillez refaire votre demande.');
            await interaction.editReply({ content: '❌ Demande annulée (timeout).' });
            return;
        }

        const robloxPseudo = robloxCollected.first().content;
        logger.debug('Réponse pseudo Roblox reçue', { userId: user.id, pseudo: robloxPseudo });

        // Question 3: Âge (optionnel)
        logger.debug('Question 3/3: Âge (optionnel)', { userId: user.id });
        const ageEmbed = new EmbedBuilder()
            .setTitle('🎂 Âge - Optionnel (3/3)')
            .setDescription('Quel est votre âge ? (Tapez "skip" pour passer cette question)')
            .setColor(config.COLORS.INFO);

        await dmChannel.send({ embeds: [ageEmbed] });

        const ageCollected = await dmChannel.awaitMessages({ 
            filter, 
            max: 1, 
            time: config.LIMITS.DM_TIMEOUT 
        });

        if (!ageCollected.first()) {
            logger.warn('Timeout question âge', { userId: user.id });
            await dmChannel.send('❌ Temps écoulé. Veuillez refaire votre demande.');
            await interaction.editReply({ content: '❌ Demande annulée (timeout).' });
            return;
        }

        const ageInput = ageCollected.first().content;
        const age = (ageInput && ageInput.toLowerCase() !== 'skip') ? parseInt(ageInput) : null;
        
        logger.debug('Réponse âge reçue', { userId: user.id, age: age });

        // Créer la demande en base
        const appointmentTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        logger.debug('Création demande WL en base', { userId: user.id });
        const wlId = await bot.database.createWL({
            userId: user.id,
            username: user.username,
            robloxPseudo,
            age,
            availability,
            appointmentTime
        });

        logger.success(`Demande WL créée: ${wlId}`, { 
            wlId, 
            userId: user.id, 
            username: user.username,
            robloxPseudo,
            age 
        });

        // Embed de confirmation
        const confirmEmbed = new EmbedBuilder()
            .setTitle('✅ Demande enregistrée')
            .setDescription(`Votre demande de whitelist a été enregistrée avec l'ID: \`${wlId}\``)
            .addFields(
                { name: '📅 Disponibilités', value: availability, inline: false },
                { name: '🎮 Pseudo Roblox', value: robloxPseudo, inline: true },
                { name: '🎂 Âge', value: age ? age.toString() : 'Non renseigné', inline: true }
            )
            .setColor(config.COLORS.SUCCESS)
            .setFooter({ text: 'Vous serez contacté pour votre entretien' });

        await dmChannel.send({ embeds: [confirmEmbed] });

        // Envoyer dans le salon staff
        const guild = interaction.guild;
        const staffChannel = guild.channels.cache.get(config.WL_LOGS_CHANNEL);
        
        if (staffChannel) {
            logger.debug(`Envoi embed staff dans salon ${staffChannel.name}`, { channelId: staffChannel.id });
            
            const wlData = await bot.database.getWL(wlId);
            const staffEmbed = createWLReportEmbed(wlData, null);
            await staffChannel.send(staffEmbed);
            
            logger.success('Embed staff envoyé', { channelId: staffChannel.id, wlId });
        } else {
            logger.error(`Salon WL_LOGS_CHANNEL introuvable`, { 
                configChannelId: config.WL_LOGS_CHANNEL,
                availableChannels: guild.channels.cache.map(c => ({ id: c.id, name: c.name }))
            }, { critical: true });
        }

        await interaction.editReply({ content: '✅ Votre demande a été envoyée en MP!' });

    } catch (error) {
        logger.error('Erreur dans handleWLRequest', error, { 
            critical: true, 
            memory: true,
            userId: user.id,
            username: user.username
        });
        await interaction.editReply({ content: '❌ Une erreur est survenue. Veuillez réessayer.' });
    }
}

async function handleWLReady(interaction, bot) {
    await interaction.deferUpdate();
    const member = interaction.member;
    
    logger.info(`WL Ready demandé par ${member.user.username}`, { userId: member.user.id });
    
    // Vérifier permissions - utiliser nom de rôle au lieu d'ID pour compatibilité
    const hasStaffRole = config.STAFF_ROLE_ID ? 
        member.roles.cache.has(config.STAFF_ROLE_ID) :
        member.roles.cache.some(role => role.name === (config.STAFF_ROLE || 'Staff'));
    
    if (!hasStaffRole) {
        logger.warn('Accès refusé WL Ready - pas staff', { userId: member.user.id });
        await interaction.followUp({ content: '❌ Seul le staff peut utiliser cette fonction.', ephemeral: true });
        return;
    }

    // Trouver une vocal WL libre
    let availableChannel = null;
    for (const channelId of config.WL_VOCAL_CHANNELS) {
        const channel = interaction.guild.channels.cache.get(channelId);
        if (channel && channel.members.size === 0) {
            availableChannel = channel;
            break;
        }
    }

    if (!availableChannel) {
        logger.warn('Aucune vocal WL libre', { 
            vocalChannels: config.WL_VOCAL_CHANNELS,
            occupancy: config.WL_VOCAL_CHANNELS.map(id => {
                const ch = interaction.guild.channels.cache.get(id);
                return { id, name: ch?.name, members: ch?.members.size || 0 };
            })
        });
        await interaction.followUp({ content: '❌ Toutes les salles de whitelist sont occupées.', ephemeral: true });
        return;
    }

    // Déplacer les membres de la salle d'attente
    const waitingRoom = interaction.guild.channels.cache.get(config.WL_WAITING_ROOM);
    if (waitingRoom && waitingRoom.members.size > 0) {
        const memberToMove = waitingRoom.members.first();
        
        logger.info(`Déplacement ${memberToMove.user.username} vers ${availableChannel.name}`, {
            fromChannel: waitingRoom.name,
            toChannel: availableChannel.name,
            movedUserId: memberToMove.user.id,
            staffId: member.user.id
        });
        
        await memberToMove.voice.setChannel(availableChannel);
        
        const embed = new EmbedBuilder()
            .setTitle('🎙️ Whitelist en cours')
            .setDescription(`${memberToMove.user.username} a été déplacé vers ${availableChannel.name}`)
            .setColor(config.COLORS.SUCCESS)
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
    } else {
        logger.warn('Aucun joueur en salle d\'attente', { 
            waitingRoomId: config.WL_WAITING_ROOM,
            waitingRoomExists: !!waitingRoom,
            waitingRoomMembers: waitingRoom?.members.size || 0
        });
        await interaction.followUp({ content: '❌ Aucun joueur en attente.', ephemeral: true });
    }
}

async function handleWLAccept(interaction, bot) {
    const wlId = interaction.customId.replace('wl_accept_', '');
    await interaction.deferUpdate();

    logger.info(`WL acceptée: ${wlId}`, { wlId, staffId: interaction.user.id, staff: interaction.user.username });

    await bot.database.updateWLStatus(wlId, 'accepted', interaction.user.id, interaction.user.username);

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(config.COLORS.SUCCESS);
        
    const fields = embed.data.fields;
    const statusFieldIndex = fields.findIndex(field => field.name === '📝 Statut');
    if (statusFieldIndex !== -1) {
        fields[statusFieldIndex].value = '✅ Accepté';
    }

    await interaction.editReply({ embeds: [embed], components: [] });
    
    logger.success(`WL ${wlId} acceptée avec succès`, { wlId, staffId: interaction.user.id });
}

async function handleWLRefuse(interaction, bot) {
    const wlId = interaction.customId.replace('wl_refuse_', '');
    await interaction.deferUpdate();

    logger.info(`WL refusée: ${wlId}`, { wlId, staffId: interaction.user.id, staff: interaction.user.username });

    await bot.database.updateWLStatus(wlId, 'refused', interaction.user.id, interaction.user.username);

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(config.COLORS.ERROR);
        
    const fields = embed.data.fields;
    const statusFieldIndex = fields.findIndex(field => field.name === '📝 Statut');
    if (statusFieldIndex !== -1) {
        fields[statusFieldIndex].value = '❌ Refusé';
    }

    await interaction.editReply({ embeds: [embed], components: [] });
    
    logger.success(`WL ${wlId} refusée avec succès`, { wlId, staffId: interaction.user.id });
}

async function handleWLNotes(interaction, bot) {
    const wlId = interaction.customId.replace('wl_notes_', '');
    
    logger.info(`Ajout de notes WL: ${wlId}`, { wlId, staffId: interaction.user.id });
    
    const modal = new ModalBuilder()
        .setCustomId(`wl_notes_modal_${wlId}`)
        .setTitle('Ajouter des remarques');

    const notesInput = new TextInputBuilder()
        .setCustomId('notes')
        .setLabel('Remarques')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ajoutez vos remarques ici...')
        .setRequired(false)
        .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(notesInput));
    await interaction.showModal(modal);
}

// ==================== FICHE RP HANDLERS ====================

async function handleFicheAccept(interaction, bot) {
    const ficheId = interaction.customId.replace('fiche_accept_', '');
    await interaction.deferUpdate();

    logger.info(`Fiche acceptée: ${ficheId}`, { ficheId, staffId: interaction.user.id, staff: interaction.user.username });

    // Vérifier permissions staff
    const hasStaffRole = config.STAFF_ROLE_ID ? 
        interaction.member.roles.cache.has(config.STAFF_ROLE_ID) :
        interaction.member.roles.cache.some(role => role.name === (config.STAFF_ROLE || 'Staff'));
    
    if (!hasStaffRole) {
        logger.warn('Accès refusé fiche accept - pas staff', { userId: interaction.user.id, ficheId });
        await interaction.followUp({ content: '❌ Seul le staff peut valider les fiches.', ephemeral: true });
        return;
    }

    await bot.database.updateFicheRPStatus(ficheId, 'accepted', interaction.user.id, interaction.user.username);

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(config.COLORS.SUCCESS)
        .setFooter({ text: `✅ Acceptée par ${interaction.user.username} le ${new Date().toLocaleDateString('fr-FR')}` });

    await interaction.editReply({ embeds: [embed], components: [] });

    // Archiver dans le salon validé
    const guild = interaction.guild;
    const validatedChannel = guild.channels.cache.get(config.FICHES_VALIDATED_CHANNEL);
    if (validatedChannel) {
        await validatedChannel.send({ embeds: [embed] });
        logger.success(`Fiche ${ficheId} archivée dans ${validatedChannel.name}`, { ficheId, channelId: validatedChannel.id });
    } else {
        logger.error(`Salon FICHES_VALIDATED_CHANNEL introuvable`, { 
            configChannelId: config.FICHES_VALIDATED_CHANNEL,
            ficheId 
        });
    }

    // Notifier l'utilisateur en MP
    try {
        const ficheData = await bot.database.getFicheRP(ficheId);
        const user = await interaction.client.users.fetch(ficheData.user_id);
        
        const notifyEmbed = new EmbedBuilder()
            .setTitle('✅ Fiche RP Acceptée!')
            .setDescription(`Votre fiche RP **${ficheData.prenom_nom}** (\`${ficheId}\`) a été acceptée par le staff!`)
            .setColor(config.COLORS.SUCCESS)
            .setTimestamp();

        await user.send({ embeds: [notifyEmbed] });
        logger.success(`Notification MP envoyée pour fiche ${ficheId}`, { ficheId, userId: user.id });
    } catch (error) {
        logger.warn(`Impossible de notifier l'utilisateur pour fiche ${ficheId}`, error, { ficheId });
    }
}

async function handleFicheRefuse(interaction, bot) {
    const ficheId = interaction.customId.replace('fiche_refuse_', '');
    
    logger.info(`Fiche refusée: ${ficheId}`, { ficheId, staffId: interaction.user.id });
    
    // Vérifier permissions staff
    const hasStaffRole = config.STAFF_ROLE_ID ? 
        interaction.member.roles.cache.has(config.STAFF_ROLE_ID) :
        interaction.member.roles.cache.some(role => role.name === (config.STAFF_ROLE || 'Staff'));
    
    if (!hasStaffRole) {
        logger.warn('Accès refusé fiche refuse - pas staff', { userId: interaction.user.id, ficheId });
        await interaction.reply({ content: '❌ Seul le staff peut refuser les fiches.', ephemeral: true });
        return;
    }
    
    const modal = new ModalBuilder()
        .setCustomId(`fiche_refuse_modal_${ficheId}`)
        .setTitle('Motif du refus');

    const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Raison du refus (obligatoire)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Expliquez pourquoi la fiche est refusée...')
        .setRequired(true)
        .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
    await interaction.showModal(modal);
}

async function handleFicheEdit(interaction, bot) {
    const ficheId = interaction.customId.replace('fiche_edit_', '');
    await interaction.deferUpdate();

    logger.info(`Fiche correction demandée: ${ficheId}`, { ficheId, staffId: interaction.user.id });

    // Vérifier permissions staff
    const hasStaffRole = config.STAFF_ROLE_ID ? 
        interaction.member.roles.cache.has(config.STAFF_ROLE_ID) :
        interaction.member.roles.cache.some(role => role.name === (config.STAFF_ROLE || 'Staff'));
    
    if (!hasStaffRole) {
        logger.warn('Accès refusé fiche edit - pas staff', { userId: interaction.user.id, ficheId });
        await interaction.followUp({ content: '❌ Seul le staff peut demander des corrections.', ephemeral: true });
        return;
    }

    await interaction.followUp({ 
        content: '🔄 Fonction de correction en cours de développement.\nPour l\'instant, utilisez le bouton "Refuser" avec des instructions de correction.', 
        ephemeral: true 
    });
}

// Fonction pour créer l'embed WL (fallback si l'import échoue)
function createWLReportEmbed(wlData, staff) {
    const embed = new EmbedBuilder()
        .setTitle(`📋 Compte-rendu Whitelist - ${wlData.id}`)
        .addFields(
            { name: '👤 Joueur', value: wlData.username, inline: true },
            { name: '👨‍💼 Staff', value: staff ? staff.username : 'Aucun', inline: true },
            { name: '🎮 Pseudo Roblox', value: wlData.roblox_pseudo || 'Non renseigné', inline: true },
            { name: '📅 Disponibilités', value: wlData.availability || 'Non renseignées', inline: false },
            { name: '🎂 Âge', value: wlData.age ? wlData.age.toString() : 'Non renseigné', inline: true },
            { name: '📝 Statut', value: '⏳ En attente', inline: true }
        )
        .setColor(config.COLORS.PENDING)
        .setTimestamp();

    return { embeds: [embed], components: [] };
}

module.exports = { handle };