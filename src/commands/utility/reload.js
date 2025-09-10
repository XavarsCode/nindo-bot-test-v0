const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Rafraichir une commande')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('La commande a recharger.')
                .setRequired(true)),
    async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({ content: `❌ There is no command with name \`${commandName}\`!`, ephemeral: true });
        }

        // Parcourir le dossier commands pour trouver le vrai chemin
        const commandFilePath = findCommandFile(path.join(__dirname, '..'), commandName);
        if (!commandFilePath) {
            return interaction.reply({ content: `❌ Impossible de trouver le fichier de la commande \`${commandName}\`!`, ephemeral: true });
        }

        try {
            delete require.cache[require.resolve(commandFilePath)];
            const newCommand = require(commandFilePath);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply({ content: `✅ Command \`${newCommand.data.name}\` was reloaded!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `⚠️ Error while reloading command \`${commandName}\`:\n\`${error.message}\``,
                ephemeral: true
            });
        }
    },
};

// Fonction récursive pour retrouver le fichier d'une commande
function findCommandFile(dir, commandName) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const result = findCommandFile(fullPath, commandName);
            if (result) return result;
        } else if (file.endsWith('.js')) {
            const cmd = require(fullPath);
            if (cmd?.data?.name?.toLowerCase() === commandName) return fullPath;
        }
    }
    return null;
}
