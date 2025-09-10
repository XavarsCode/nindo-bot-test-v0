const { SlashCommandBuilder } = require('discord.js')
const { Users } = require('../../../dbObjects.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Afficher le solde d\'un utilisateur')
    .addUserOption(option =>
      option.setName('user')
            .setDescription('Utilisateur à consulter')
            .setRequired(false)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user
    const user = await Users.findOne({ where: { user_id: target.id } })
    const balance = user ? user.balance : 0
    return interaction.reply(`${target.tag} possède ${balance} Ryo`)
  }
}
