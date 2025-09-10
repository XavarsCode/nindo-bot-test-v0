const { EmbedBuilder } = require('discord.js');

module.exports = {
    candidatureResume(cand) {
        return new EmbedBuilder()
            .setTitle(`📋 Candidature #${cand.id}`)
            .setColor(0x3498db)
            .addFields(
                { name: "👤 Pseudo", value: cand.pseudo, inline: true },
                { name: "🎂 Âge", value: cand.age, inline: true },
                { name: "📅 Dispos", value: cand.dispos, inline: false },
                { name: "💬 Motivation", value: cand.motivation, inline: false },
                { name: "✨ Idée", value: cand.idea, inline: false }
            )
            .setFooter({ text: "Staff - Décision en attente" })
            .setTimestamp();
    },

    decisionEmbed(cand, decision, staff) {
        return new EmbedBuilder()
            .setTitle(`🎯 Décision prise pour #${cand.id}`)
            .setColor(decision === "accepté" ? 0x2ecc71 : 0xe74c3c)
            .setDescription(`Décision : **${decision}**\nStaff : ${staff}`)
            .setTimestamp();
    }
};
