// utils/embedBuilder.js - Constructeur d'embeds
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

function createFicheEmbed(data, user, ficheId, status = 'pending', withButtons = true) {
    const statusEmojis = {
        pending: '⏳',
        accepted: '✅',
        refused: '❌'
    };

    const statusTexts = {
        pending: 'En attente',
        accepted: 'Acceptée',
        refused: 'Refusée'
    };

    const statusColors = {
        pending: config.COLORS.PENDING,
        accepted: config.COLORS.SUCCESS,
        refused: config.COLORS.ERROR
    };

    const embed = new EmbedBuilder()
        .setTitle(`📑 Fiche RP - ${data.prenomNom}`)
        .setDescription(`**ID:** \`${ficheId}\`\n**Joueur:** ${user.username}\n**Statut:** ${statusEmojis[status]} ${statusTexts[status]}`)
        .addFields(
            { name: '📛 Prénom & Nom', value: data.prenomNom, inline: true },
            { name: '🏛️ Clan / Origine', value: data.clanOrigine, inline: true },
            { name: '🎂 Âge', value: data.age.toString(), inline: true },
            { name: '⚧️ Genre', value: data.genre, inline: true },
            { name: '💼 Occupation', value: data.occupation, inline: true },
            { name: '🩸 Bloodline', value: data.bloodline, inline: true },
            { name: '⚡ Éléments', value: data.elements, inline: false },
            { 
                name: '📖 Histoire', 
                value: data.histoire.length > config.LIMITS.EMBED_MAX_LENGTH ? 
                       data.histoire.substring(0, config.LIMITS.EMBED_MAX_LENGTH - 3) + '...' : 
                       data.histoire, 
                inline: false 
            }
        )
        .setColor(statusColors[status])
        .setTimestamp();

    const components = [];

    if (withButtons && status === 'pending') {
        const acceptButton = new ButtonBuilder()
            .setCustomId(`fiche_accept_${ficheId}`)
            .setLabel('Accepter')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const refuseButton = new ButtonBuilder()
            .setCustomId(`fiche_refuse_${ficheId}`)
            .setLabel('Refuser')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const editButton = new ButtonBuilder()
            .setCustomId(`fiche_edit_${ficheId}`)
            .setLabel('Demander correction')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄');

        const row = new ActionRowBuilder().addComponents(acceptButton, refuseButton, editButton);
        components.push(row);
    }

    return { embeds: [embed], components };
}

function createFicheListEmbed(fiches, title, showStatus = false) {
    const embed = new EmbedBuilder()
        .setTitle(`📋 ${title}`)
        .setColor(config.COLORS.INFO)
        .setTimestamp();

    if (fiches.length === 0) {
        embed.setDescription('Aucune fiche trouvée.');
        return [embed];
    }

    const statusEmojis = {
        pending: '⏳',
        accepted: '✅',
        refused: '❌'
    };

    // Limiter à 25 fiches max (limite Discord)
    const displayFiches = fiches.slice(0, 25);
    
    displayFiches.forEach((fiche, index) => {
        const statusText = showStatus ? ` ${statusEmojis[fiche.status]}` : '';
        const dateText = new Date(fiche.created_at).toLocaleDateString('fr-FR');
        
        embed.addFields({
            name: `${index + 1}. ${fiche.prenom_nom}${statusText}`,
            value: `**ID:** \`${fiche.id}\`\n**Joueur:** ${fiche.username}\n**Créée le:** ${dateText}`,
            inline: true
        });
    });

    if (fiches.length > 25) {
        embed.setFooter({ text: `Affichage des 25 premières fiches sur ${fiches.length} total` });
    } else {
        embed.setFooter({ text: `${fiches.length} fiche${fiches.length > 1 ? 's' : ''} trouvée${fiches.length > 1 ? 's' : ''}` });
    }

    return [embed];
}

function createWLRequestEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('🎙️ Demande de Whitelist')
        .setDescription('Cliquez sur le bouton ci-dessous pour faire votre demande de whitelist.\n\n**Processus:**\n1️⃣ Questions en MP\n2️⃣ Prise de RDV\n3️⃣ Entretien vocal\n4️⃣ Résultat')
        .setColor(config.COLORS.INFO)
        .setFooter({ text: 'Système Whitelist v2' });

    const button = new ButtonBuilder()
        .setCustomId('wl_request')
        .setLabel('Faire ma demande WL')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫');

    const row = new ActionRowBuilder().addComponents(button);
    return { embeds: [embed], components: [row] };
}

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

    const acceptButton = new ButtonBuilder()
        .setCustomId(`wl_accept_${wlData.id}`)
        .setLabel('Accepter')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

    const refuseButton = new ButtonBuilder()
        .setCustomId(`wl_refuse_${wlData.id}`)
        .setLabel('Refuser')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');

    const notesButton = new ButtonBuilder()
        .setCustomId(`wl_notes_${wlData.id}`)
        .setLabel('Ajouter des remarques')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝');

    const readyButton = new ButtonBuilder()
        .setCustomId('wl_ready')
        .setLabel('Prêt à Whitelist')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⏳');

    const row1 = new ActionRowBuilder().addComponents(acceptButton, refuseButton, notesButton);
    const row2 = new ActionRowBuilder().addComponents(readyButton);
    
    return { embeds: [embed], components: [row1, row2] };
}

function createStatsEmbed(wlStats, ficheStats) {
    const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques du Serveur')
        .setColor(config.COLORS.INFO)
        .setTimestamp();

    // Stats Whitelist
    const wlTotal = wlStats.total || 0;
    const wlAccepted = wlStats.accepted || 0;
    const wlRefused = wlStats.refused || 0;
    const wlPending = wlStats.pending || 0;
    const wlAcceptRate = wlTotal > 0 ? ((wlAccepted / wlTotal) * 100).toFixed(1) : '0';

    embed.addFields({
        name: '🎙️ Whitelist',
        value: `**Total:** ${wlTotal}\n✅ **Acceptées:** ${wlAccepted}\n❌ **Refusées:** ${wlRefused}\n⏳ **En attente:** ${wlPending}\n📈 **Taux d'acceptation:** ${wlAcceptRate}%`,
        inline: true
    });

    // Stats Fiches RP
    const ficheTotal = ficheStats.total || 0;
    const ficheAccepted = ficheStats.accepted || 0;
    const ficheRefused = ficheStats.refused || 0;
    const fichePending = ficheStats.pending || 0;
    const ficheAcceptRate = ficheTotal > 0 ? ((ficheAccepted / ficheTotal) * 100).toFixed(1) : '0';

    embed.addFields({
        name: '📑 Fiches RP',
        value: `**Total:** ${ficheTotal}\n✅ **Acceptées:** ${ficheAccepted}\n❌ **Refusées:** ${ficheRefused}\n⏳ **En attente:** ${fichePending}\n📈 **Taux d'acceptation:** ${ficheAcceptRate}%`,
        inline: true
    });

    return [embed];
}

module.exports = {
    createFicheEmbed,
    createFicheListEmbed,
    createWLRequestEmbed,
    createWLReportEmbed,
    createStatsEmbed
};