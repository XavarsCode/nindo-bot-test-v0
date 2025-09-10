// src/commands/utility/stats.js - Commande pour voir les statistiques
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config'); // remonte 3 niveaux vers la racine
const { createStatsEmbed } = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Voir les statistiques du serveur')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type de statistiques')
                .addChoices(
                    { name: 'Générales', value: 'general' },
                    { name: 'Whitelist', value: 'whitelist' },
                    { name: 'Fiches RP', value: 'fiches' }
                )
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('détaillé')
                .setDescription('Afficher les statistiques détaillées (Staff uniquement)')
                .setRequired(false)
        ),

    async execute(interaction, bot) {
        await interaction.deferReply({ ephemeral: true });

        const type = interaction.options.getString('type') || 'general';
        const detailed = interaction.options.getBoolean('détaillé') || false;
        const isStaff = interaction.member.roles.cache.some(role => role.name === config.STAFF_ROLE);

        if (detailed && !isStaff) {
            await interaction.editReply({ 
                content: '❌ Seul le staff peut voir les statistiques détaillées.' 
            });
            return;
        }

        try {
            let embed;

            switch (type) {
                case 'whitelist':
                    embed = await this.createWLStatsEmbed(bot, detailed);
                    break;
                case 'fiches':
                    embed = await this.createFicheStatsEmbed(bot, detailed);
                    break;
                case 'general':
                default:
                    embed = await this.createGeneralStatsEmbed(bot, detailed);
                    break;
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.error('❌ Erreur stats:', error);
            await interaction.editReply({ 
                content: '❌ Une erreur est survenue lors de la récupération des statistiques.' 
            });
        }
    },

    async createGeneralStatsEmbed(bot, detailed) {
        const wlStats = await bot.database.getWLStats();
        const ficheStats = await bot.database.getFicheStats();
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques Générales')
            .setColor(config.COLORS.INFO)
            .setTimestamp();

        const wlTotal = wlStats.total || 0;
        const wlAccepted = wlStats.accepted || 0;
        const wlRefused = wlStats.refused || 0;
        const wlPending = wlStats.pending || 0;
        const wlAcceptRate = wlTotal > 0 ? ((wlAccepted / wlTotal) * 100).toFixed(1) : '0.0';

        embed.addFields({
            name: '🎙️ Whitelist',
            value: `**Total:** ${wlTotal}\n✅ **Acceptées:** ${wlAccepted}\n❌ **Refusées:** ${wlRefused}\n⏳ **En attente:** ${wlPending}\n📈 **Taux d'acceptation:** ${wlAcceptRate}%`,
            inline: true
        });

        const ficheTotal = ficheStats.total || 0;
        const ficheAccepted = ficheStats.accepted || 0;
        const ficheRefused = ficheStats.refused || 0;
        const fichePending = ficheStats.pending || 0;
        const ficheAcceptRate = ficheTotal > 0 ? ((ficheAccepted / ficheTotal) * 100).toFixed(1) : '0.0';

        embed.addFields({
            name: '📑 Fiches RP',
            value: `**Total:** ${ficheTotal}\n✅ **Acceptées:** ${ficheAccepted}\n❌ **Refusées:** ${ficheRefused}\n⏳ **En attente:** ${fichePending}\n📈 **Taux d'acceptation:** ${ficheAcceptRate}%`,
            inline: true
        });

        embed.addFields({
            name: '🌐 Global',
            value: `**Demandes totales:** ${wlTotal + ficheTotal}\n**En cours de traitement:** ${wlPending + fichePending}`,
            inline: false
        });

        if (detailed) {
            const recentActivity = await this.getRecentActivity(bot);
            if (recentActivity.length > 0) {
                embed.addFields({
                    name: '🕐 Activité récente (7 derniers jours)',
                    value: recentActivity.slice(0, 5).map(activity => `• ${activity}`).join('\n'),
                    inline: false
                });
            }
        }

        return embed;
    },

    async createWLStatsEmbed(bot, detailed) {
        const stats = await bot.database.getWLStats();
        const embed = new EmbedBuilder()
            .setTitle('🎙️ Statistiques Whitelist')
            .setColor(config.COLORS.INFO)
            .setTimestamp();

        const total = stats.total || 0;
        const accepted = stats.accepted || 0;
        const refused = stats.refused || 0;
        const pending = stats.pending || 0;

        embed.addFields(
            { name: '📊 Total', value: total.toString(), inline: true },
            { name: '✅ Acceptées', value: accepted.toString(), inline: true },
            { name: '❌ Refusées', value: refused.toString(), inline: true },
            { name: '⏳ En attente', value: pending.toString(), inline: true },
            { name: '📈 Taux d\'acceptation', value: total > 0 ? `${((accepted / total) * 100).toFixed(1)}%` : '0.0%', inline: true },
            { name: '\u200b', value: '\u200b', inline: true }
        );

        if (detailed) {
            const recentWL = await this.getRecentWL(bot);
            if (recentWL.length > 0) {
                embed.addFields({
                    name: '🕐 Dernières demandes',
                    value: recentWL.slice(0, 5).map(wl => 
                        `• **${wl.username}** - ${wl.status === 'pending' ? '⏳' : wl.status === 'accepted' ? '✅' : '❌'} (\`${wl.id}\`)`
                    ).join('\n'),
                    inline: false
                });
            }
        }

        return embed;
    },

    async createFicheStatsEmbed(bot, detailed) {
        const stats = await bot.database.getFicheStats();
        const embed = new EmbedBuilder()
            .setTitle('📑 Statistiques Fiches RP')
            .setColor(config.COLORS.INFO)
            .setTimestamp();

        const total = stats.total || 0;
        const accepted = stats.accepted || 0;
        const refused = stats.refused || 0;
        const pending = stats.pending || 0;

        embed.addFields(
            { name: '📊 Total', value: total.toString(), inline: true },
            { name: '✅ Acceptées', value: accepted.toString(), inline: true },
            { name: '❌ Refusées', value: refused.toString(), inline: true },
            { name: '⏳ En attente', value: pending.toString(), inline: true },
            { name: '📈 Taux d\'acceptation', value: total > 0 ? `${((accepted / total) * 100).toFixed(1)}%` : '0.0%', inline: true },
            { name: '\u200b', value: '\u200b', inline: true }
        );

        if (detailed) {
            const popularNames = await this.getPopularCharacterNames(bot);
            if (popularNames.length > 0) {
                embed.addFields({
                    name: '👑 Noms de personnages populaires',
                    value: popularNames.slice(0, 5).map((name, index) => 
                        `${index + 1}. **${name.prenom_nom}** (${name.count} fois)`
                    ).join('\n'),
                    inline: false
                });
            }

            const recentFiches = await this.getRecentFiches(bot);
            if (recentFiches.length > 0) {
                embed.addFields({
                    name: '🕐 Dernières fiches',
                    value: recentFiches.slice(0, 5).map(fiche => 
                        `• **${fiche.prenom_nom}** par ${fiche.username} - ${fiche.status === 'pending' ? '⏳' : fiche.status === 'accepted' ? '✅' : '❌'}`
                    ).join('\n'),
                    inline: false
                });
            }
        }

        return embed;
    },

    async getRecentActivity(bot) {
        return new Promise((resolve, reject) => {
            bot.database.db.all(`
                SELECT 'WL' as type, username, status, updated_at FROM whitelist 
                WHERE updated_at >= datetime('now', '-7 days')
                UNION ALL
                SELECT 'Fiche' as type, username, status, updated_at FROM fiches_rp 
                WHERE updated_at >= datetime('now', '-7 days')
                ORDER BY updated_at DESC
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    const activity = rows.map(row => {
                        const date = new Date(row.updated_at).toLocaleDateString('fr-FR');
                        const statusEmoji = row.status === 'accepted' ? '✅' : row.status === 'refused' ? '❌' : '⏳';
                        return `${row.type} de **${row.username}** ${statusEmoji} (${date})`;
                    });
                    resolve(activity);
                }
            });
        });
    },

    async getRecentWL(bot) {
        return new Promise((resolve, reject) => {
            bot.database.db.all(`
                SELECT * FROM whitelist 
                ORDER BY created_at DESC 
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    async getRecentFiches(bot) {
        return new Promise((resolve, reject) => {
            bot.database.db.all(`
                SELECT * FROM fiches_rp 
                ORDER BY created_at DESC 
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    async getPopularCharacterNames(bot) {
        return new Promise((resolve, reject) => {
            bot.database.db.all(`
                SELECT prenom_nom, COUNT(*) as count 
                FROM fiches_rp 
                WHERE status = 'accepted'
                GROUP BY LOWER(prenom_nom) 
                HAVING count > 1
                ORDER BY count DESC 
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
};
