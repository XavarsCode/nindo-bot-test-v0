const { SlashCommandBuilder } = require('discord.js')
const { Users } = require('../../../dbObjects.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Afficher l\'inventaire d\'un utilisateur')
    .addUserOption(option =>
      option.setName('user')
            .setDescription('Utilisateur à consulter')
            .setRequired(false)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user
    const user = await Users.findOne({ where: { user_id: target.id } })
    if (!user) return interaction.reply(`${target.tag} n'existe pas.`)
    
    const items = await user.getItems()
    if (!items.length) return interaction.reply(`${target.tag} n'a rien !`)

    return interaction.reply(`${target.tag} possède : ${items.map(i => `${i.amount} ${i.item.name}`).join(', ')}`)
  }
}
