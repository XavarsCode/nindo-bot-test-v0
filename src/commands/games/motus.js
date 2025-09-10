const { SlashCommandBuilder } = require('discord.js');

const mots = ['chat', 'chien', 'dragon', 'nindo', 'lune'];
const parties = new Map();

function afficherMot(mot, lettresTrouvees) {
    return mot.split('').map(l => lettresTrouvees.includes(l) ? l : '_').join(' ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('motus')
        .setDescription('Joue à deviner un mot secret !')
        .addStringOption(option =>
            option.setName('essai')
                .setDescription('Une lettre ou un mot entier')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const joueur = interaction.user.id;
            const essai = interaction.options.getString('essai').toLowerCase();
            if (!parties.has(joueur) || parties.get(joueur).trouve) {
                const motChoisi = mots[Math.floor(Math.random() * mots.length)];
                parties.set(joueur, { mot: motChoisi, lettresTrouvees: [], trouve: false });
            }
            const partie = parties.get(joueur);
            let message = '';
            if (essai.length === 1) {
                if (partie.mot.includes(essai)) {
                    if (!partie.lettresTrouvees.includes(essai)) partie.lettresTrouvees.push(essai);
                    message = `✅ La lettre **${essai}** est dans le mot !`;
                } else {
                    message = `❌ La lettre **${essai}** n'est pas dans le mot.`;
                }
            } else {
                if (essai === partie.mot) {
                    partie.trouve = true;
                    message = `🎉 Bravo ! Le mot était bien **${partie.mot}** !`;
                } else {
                    message = `❌ Mauvaise réponse ! Le mot n'est pas **${essai}**.`;
                }
            }
            const motAffiche = afficherMot(partie.mot, partie.lettresTrouvees);
            await interaction.editReply(`${message}\nMot actuel : ${motAffiche}`);
        } catch (error) {
            console.error(error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erreur lors de l’exécution !', ephemeral: true });
            }
        }
    }
};
