const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("./database");
const embeds = require("./embeds");
const utils = require("./utils");

module.exports = {
    async handleButton(interaction) {
        if (interaction.customId === "postuler_staff") {
            const modal = new ModalBuilder()
                .setCustomId("candidature_modal")
                .setTitle("Formulaire de recrutement");

            const pseudo = new TextInputBuilder()
                .setCustomId("pseudo")
                .setLabel("Ton pseudo Discord")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const age = new TextInputBuilder()
                .setCustomId("age")
                .setLabel("Ton âge")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const motivation = new TextInputBuilder()
                .setCustomId("motivation")
                .setLabel("Pourquoi veux-tu rejoindre le staff ?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const dispos = new TextInputBuilder()
                .setCustomId("dispos")
                .setLabel("Disponibilités (jours/heures)")
                .setStyle(TextInputStyle.Paragraph);

            const idea = new TextInputBuilder()
                .setCustomId("idea")
                .setLabel("Une idée pour améliorer le serveur ?")
                .setStyle(TextInputStyle.Paragraph);

            modal.addComponents(
                new ActionRowBuilder().addComponents(pseudo),
                new ActionRowBuilder().addComponents(age),
                new ActionRowBuilder().addComponents(motivation),
                new ActionRowBuilder().addComponents(dispos),
                new ActionRowBuilder().addComponents(idea)
            );

            await interaction.showModal(modal);
        }
    },

    async handleModal(interaction, client) {
        if (interaction.customId === "candidature_modal") {
            const cand = {
                id: utils.generateId(),
                userId: interaction.user.id,
                pseudo: interaction.fields.getTextInputValue("pseudo"),
                age: interaction.fields.getTextInputValue("age"),
                motivation: interaction.fields.getTextInputValue("motivation"),
                dispos: interaction.fields.getTextInputValue("dispos"),
                idea: interaction.fields.getTextInputValue("idea"),
            };

            db.addCandidature(cand);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`accept_${cand.id}`).setLabel("✅ Accepter").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`refuse_${cand.id}`).setLabel("❌ Refuser").setStyle(ButtonStyle.Danger)
            );

            const staffChannel = client.channels.cache.find(c => c.name === "candidatures-staff");
            if (staffChannel) {
                staffChannel.send({ embeds: [embeds.candidatureResume(cand)], components: [row] });
            }

            await interaction.reply({ content: "📨 Ta candidature a été envoyée au staff !", ephemeral: true });
        }
    },

    async handleDecision(interaction) {
        const [action, id] = interaction.customId.split("_");

        db.getCandidature(id, async (cand) => {
            if (!cand) return interaction.reply({ content: "❌ Candidature introuvable.", ephemeral: true });

            if (action === "accept") {
                db.updateStatus(id, "accepté");
                await interaction.update({ embeds: [embeds.decisionEmbed(cand, "accepté", interaction.user.username)], components: [] });
                interaction.client.users.send(cand.userId, "🎉 Félicitations ! Ta candidature staff a été **acceptée** !");
            } else if (action === "refuse") {
                db.updateStatus(id, "refusé");
                await interaction.update({ embeds: [embeds.decisionEmbed(cand, "refusé", interaction.user.username)], components: [] });
                interaction.client.users.send(cand.userId, "😔 Ta candidature staff a été **refusée**. Merci d’avoir tenté !");
            }
        });
    }
};
