const { SlashCommandBuilder, codeBlock } = require('discord.js')
const { Users } = require('../../../dbObjects.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Afficher le classement des 10 meilleurs utilisateurs'),
  async execute(interaction) {
    const users = await Users.findAll({ order: [['balance', 'DESC']], limit: 10 })
    if (!users.length) return interaction.reply('Pas de données.')

    return interaction.reply(codeBlock(users.map((u, i) => `(${i+1}) ${u.user_id}: ${u.balance}Ryo`).join('\n')))
  }
}
