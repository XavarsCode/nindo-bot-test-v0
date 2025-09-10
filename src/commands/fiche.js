// commands/fiche.js - Commande /fiche complète
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');
const { createFicheEmbed, createFicheListEmbed } = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fiche')
        .setDescription('Gestion des fiches RP')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Créer une nouvelle fiche RP')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Voir une fiche RP')
                .addUserOption(option =>
                    option
                        .setName('utilisateur')
                        .setDescription('L\'utilisateur dont vous voulez voir la fiche (optionnel)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('ID de la fiche à voir (optionnel)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lister les fiches RP')
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Filtrer par statut')
                        .addChoices(
                            { name: 'En attente', value: 'pending' },
                            { name: 'Acceptées', value: 'accepted' },
                            { name: 'Refusées', value: 'refused' },
                            { name: 'Toutes', value: 'all' }
                        )
                        .setRequired(false)
                )
                .addUserOption(option =>
                    option
                        .setName('utilisateur')
                        .setDescription('Filtrer par utilisateur')
                        .setRequired(false)
                )
        ),

    async execute(interaction, bot) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await this.handleCreate(interaction, bot);
                break;
            case 'view':
                await this.handleView(interaction, bot);
                break;
            case 'list':
                await this.handleList(interaction, bot);
                break;
        }
    },

    async handleCreate(interaction, bot) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.user;

        try {
            // Vérifier si l'utilisateur a déjà une fiche en cours
            const existingFiches = await bot.database.getFichesByUser(user.id);
            const pendingFiche = existingFiches.find(fiche => fiche.status === 'pending');

            if (pendingFiche) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Fiche en cours')
                    .setDescription(`Vous avez déjà une fiche en cours de validation: \`${pendingFiche.id}\`\nVeuillez attendre la réponse du staff avant de créer une nouvelle fiche.`)
                    .setColor(config.COLORS.WARNING);

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const dmChannel = await user.createDM();
            const filter = m => m.author.id === user.id;

            const questions = [
                { 
                    key: 'prenomNom', 
                    title: '📛 Prénom & Nom', 
                    description: 'Quel est le prénom et nom de votre personnage ?',
                    placeholder: 'Ex: Naruto Uzumaki'
                },
                { 
                    key: 'clanOrigine', 
                    title: '🏛️ Clan / Origine', 
                    description: 'De quel clan ou origine vient votre personnage ?',
                    placeholder: 'Ex: Clan Uzumaki, Village de Konoha'
                },
                { 
                    key: 'age', 
                    title: '🎂 Âge', 
                    description: 'Quel est l\'âge de votre personnage ? (nombre uniquement)',
                    isNumber: true,
                    min: 1,
                    max: 100
                },
                { 
                    key: 'genre', 
                    title: '⚧️ Genre', 
                    description: 'Quel est le genre de votre personnage ?',
                    placeholder: 'Ex: Masculin, Féminin, Non-binaire'
                },
                { 
                    key: 'occupation', 
                    title: '💼 Occupation', 
                    description: 'Quelle est l\'occupation de votre personnage ?',
                    placeholder: 'Ex: Ninja, Marchand, Étudiant'
                },
                { 
                    key: 'bloodline', 
                    title: '🩸 Bloodline', 
                    description: 'Quelle est la bloodline de votre personnage ?',
                    placeholder: 'Ex: Sharingan, Byakugan, Aucune'
                },
                { 
                    key: 'elements', 
                    title: '⚡ Éléments', 
                    description: 'Quels sont les éléments de votre personnage ?',
                    placeholder: 'Ex: Feu, Eau, Vent'
                },
                { 
                    key: 'histoire', 
                    title: '📖 Histoire', 
                    description: `Racontez l'histoire de votre personnage.\n**Minimum ${config.LIMITS.HISTOIRE_MIN_LINES} lignes obligatoires**`,
                    minLines: config.LIMITS.HISTOIRE_MIN_LINES
                }
            ];

            const answers = {};

            // Envoyer message d'intro en DM
            const introEmbed = new EmbedBuilder()
                .setTitle('📑 Création de Fiche RP')
                .setDescription(`Bonjour ${user.username} !\n\nJe vais vous poser ${questions.length} questions pour créer votre fiche RP.\n\n**⏱️ Vous avez ${config.LIMITS.FICHE_TIMEOUT / 60000} minutes pour répondre à chaque question.**`)
                .setColor(config.COLORS.INFO)
                .setFooter({ text: 'Vous pouvez annuler à tout moment en tapant "annuler"' });

            await dmChannel.send({ embeds: [introEmbed] });

            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                
                const questionEmbed = new EmbedBuilder()
                    .setTitle(`${question.title} (${i + 1}/${questions.length})`)
                    .setDescription(question.description)
                    .setColor(config.COLORS.INFO);

                if (question.placeholder) {
                    questionEmbed.addFields({ name: '💡 Exemple', value: question.placeholder, inline: false });
                }

                await dmChannel.send({ embeds: [questionEmbed] });

                const collected = await dmChannel.awaitMessages({ 
                    filter, 
                    max: 1, 
                    time: config.LIMITS.FICHE_TIMEOUT 
                });

                const response = collected.first();

                if (!response) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('⏰ Temps écoulé')
                        .setDescription('Vous avez mis trop de temps à répondre. Veuillez relancer la commande `/fiche create`.')
                        .setColor(config.COLORS.ERROR);

                    await dmChannel.send({ embeds: [timeoutEmbed] });
                    await interaction.editReply({ content: '❌ Création de fiche annulée (timeout).' });
                    return;
                }

                // Vérifier si annulation
                if (response.content.toLowerCase() === 'annuler') {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle('❌ Création annulée')
                        .setDescription('Création de fiche RP annulée.')
                        .setColor(config.COLORS.ERROR);

                    await dmChannel.send({ embeds: [cancelEmbed] });
                    await interaction.editReply({ content: '❌ Création de fiche annulée.' });
                    return;
                }

                let value = response.content.trim();

                // Validation selon le type
                if (question.isNumber) {
                    const num = parseInt(value);
                    if (isNaN(num) || (question.min && num < question.min) || (question.max && num > question.max)) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ Valeur invalide')
                            .setDescription(`Veuillez entrer un nombre valide${question.min ? ` entre ${question.min}` : ''}${question.max ? ` et ${question.max}` : ''}.`)
                            .setColor(config.COLORS.ERROR);

                        await dmChannel.send({ embeds: [errorEmbed] });
                        i--; // Recommencer cette question
                        continue;
                    }
                    value = num;
                }

                if (question.minLines) {
                    const lines = value.split('\n').filter(line => line.trim().length > 0).length;
                    if (lines < question.minLines) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ Histoire trop courte')
                            .setDescription(`L'histoire doit faire au moins ${question.minLines} lignes non vides.\nActuellement: ${lines} lignes.`)
                            .setColor(config.COLORS.ERROR);

                        await dmChannel.send({ embeds: [errorEmbed] });
                        i--; // Recommencer cette question
                        continue;
                    }
                }

                answers[question.key] = value;

                // Confirmation de la réponse
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('✅ Réponse enregistrée')
                    .setDescription(`**${question.title}:** ${question.isNumber ? value : value.length > 100 ? value.substring(0, 100) + '...' : value}`)
                    .setColor(config.COLORS.SUCCESS);

                await dmChannel.send({ embeds: [confirmEmbed] });
            }

            // Créer la fiche en base de données
            const ficheId = await bot.database.createFicheRP({
                userId: user.id,
                username: user.username,
                ...answers
            });

            // Créer l'embed de fiche pour le staff
            const ficheEmbed = createFicheEmbed(answers, user, ficheId, 'pending');

            // Envoyer dans le salon staff
            const guild = interaction.guild;
            const staffChannel = guild.channels.cache.find(ch => ch.name === config.FICHES_PENDING_CHANNEL.replace('#', ''));
            
            if (staffChannel) {
                await staffChannel.send(ficheEmbed);
            } else {
                logger.warn(`⚠️ Salon ${config.FICHES_PENDING_CHANNEL} introuvable`);
            }

            // Confirmation à l'utilisateur
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Fiche RP créée avec succès!')
                .setDescription(`Votre fiche RP a été créée avec l'ID: \`${ficheId}\`\n\n**📋 Résumé de votre fiche:**`)
                .addFields(
                    { name: '📛 Personnage', value: answers.prenomNom, inline: true },
                    { name: '🏛️ Origine', value: answers.clanOrigine, inline: true },
                    { name: '🎂 Âge', value: answers.age.toString(), inline: true },
                    { name: '⚧️ Genre', value: answers.genre, inline: true },
                    { name: '💼 Occupation', value: answers.occupation, inline: true },
                    { name: '🩸 Bloodline', value: answers.bloodline, inline: true },
                    { name: '⚡ Éléments', value: answers.elements, inline: false }
                )
                .setColor(config.COLORS.SUCCESS)
                .setFooter({ text: 'Votre fiche est maintenant en attente de validation par le staff' });

            await dmChannel.send({ embeds: [successEmbed] });
            await interaction.editReply({ content: '✅ Votre fiche RP a été créée avec succès! Vérifiez vos MPs pour les détails.' });

        } catch (error) {
            logger.error('❌ Erreur création fiche:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la création de votre fiche. Veuillez réessayer.' });
        }
    },

    async handleView(interaction, bot) {
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('utilisateur');
        const ficheId = interaction.options.getString('id');
        
        try {
            let fiche = null;
            
            if (ficheId) {
                // Recherche par ID
                fiche = await bot.database.getFicheRP(ficheId);
                
                if (!fiche) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Fiche introuvable')
                        .setDescription(`Aucune fiche trouvée avec l'ID: \`${ficheId}\``)
                        .setColor(config.COLORS.ERROR);
                    
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
            } else {
                // Recherche par utilisateur (par défaut l'auteur de la commande)
                const userId = targetUser ? targetUser.id : interaction.user.id;
                const username = targetUser ? targetUser.username : interaction.user.username;
                
                const fiches = await bot.database.getFichesByUser(userId);
                
                if (fiches.length === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Aucune fiche')
                        .setDescription(`${targetUser ? `**${username}**` : 'Vous'} n'${targetUser ? 'a' : 'avez'} aucune fiche RP.`)
                        .setColor(config.COLORS.WARNING);
                    
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
                
                if (fiches.length === 1) {
                    fiche = fiches[0];
                } else {
                    // Plusieurs fiches, afficher la liste
                    const listEmbed = createFicheListEmbed(fiches, `Fiches de ${username}`);
                    await interaction.editReply({ embeds: listEmbed });
                    return;
                }
            }

            // Vérifier les permissions pour voir la fiche
            const isOwner = fiche.user_id === interaction.user.id;
            const isStaff = interaction.member.roles.cache.some(role => role.name === config.STAFF_ROLE);
            const isValidated = fiche.status === 'accepted';

            if (!isOwner && !isStaff && !isValidated) {
                const embed = new EmbedBuilder()
                    .setTitle('🔒 Accès refusé')
                    .setDescription('Vous ne pouvez voir que vos propres fiches ou les fiches validées.')
                    .setColor(config.COLORS.ERROR);
                
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Créer l'embed de la fiche
            const ficheEmbed = createFicheEmbed({
                prenomNom: fiche.prenom_nom,
                clanOrigine: fiche.clan_origine,
                age: fiche.age,
                genre: fiche.genre,
                occupation: fiche.occupation,
                bloodline: fiche.bloodline,
                elements: fiche.elements,
                histoire: fiche.histoire
            }, { id: fiche.user_id, username: fiche.username }, fiche.id, fiche.status, false);

            await interaction.editReply({ embeds: ficheEmbed.embeds });

        } catch (error) {
            logger.error('❌ Erreur affichage fiche:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'affichage de la fiche.' });
        }
    },

    async handleList(interaction, bot) {
        await interaction.deferReply({ ephemeral: true });

        const status = interaction.options.getString('status') || 'accepted';
        const targetUser = interaction.options.getUser('utilisateur');
        
        // Vérifier les permissions
        const isStaff = interaction.member.roles.cache.some(role => role.name === config.STAFF_ROLE);
        
        if (!isStaff && (status !== 'accepted' || targetUser)) {
            const embed = new EmbedBuilder()
                .setTitle('🔒 Accès refusé')
                .setDescription('Seul le staff peut voir les fiches non-validées ou filtrer par utilisateur.')
                .setColor(config.COLORS.ERROR);
            
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        try {
            let fiches = [];
            let title = '';

            if (targetUser) {
                fiches = await bot.database.getFichesByUser(targetUser.id);
                if (status !== 'all') {
                    fiches = fiches.filter(fiche => fiche.status === status);
                }
                title = `Fiches de ${targetUser.username}`;
            } else {
                if (status === 'all') {
                    // Pour le staff uniquement
                    const allStatuses = ['pending', 'accepted', 'refused'];
                    for (const s of allStatuses) {
                        const statusFiches = await this.getFichesByStatus(bot.database, s);
                        fiches.push(...statusFiches);
                    }
                } else if (status === 'accepted') {
                    fiches = await bot.database.getAllValidatedFiches();
                } else {
                    fiches = await this.getFichesByStatus(bot.database, status);
                }
                
                const statusText = {
                    'pending': 'en attente',
                    'accepted': 'acceptées',
                    'refused': 'refusées',
                    'all': 'toutes'
                };
                title = `Fiches ${statusText[status]}`;
            }

            if (fiches.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📄 Aucune fiche')
                    .setDescription(`Aucune fiche trouvée${targetUser ? ` pour ${targetUser.username}` : ''}.`)
                    .setColor(config.COLORS.WARNING);
                
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const listEmbed = createFicheListEmbed(fiches, title, true);
            await interaction.editReply({ embeds: listEmbed });

        } catch (error) {
            logger.error('❌ Erreur liste fiches:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la récupération des fiches.' });
        }
    },

    async getFichesByStatus(database, status) {
        return new Promise((resolve, reject) => {
            database.db.all(`
                SELECT * FROM fiches_rp 
                WHERE status = ? 
                ORDER BY created_at DESC
            `, [status], (err, rows) => {
                if (err) {
                    logger.error('❌ Erreur lecture fiches par status:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }
};