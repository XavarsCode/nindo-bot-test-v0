const { SlashCommandBuilder } = require('discord.js')
const { Users, CurrencyShop } = require('../../../dbObjects.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Acheter un article dans la boutique')
    .addStringOption(option =>
      option.setName('item')
            .setDescription('Nom de l\'article')
            .setRequired(true)
    ),
  async execute(interaction) {
    const itemName = interaction.options.getString('item')
    const item = await CurrencyShop.findOne({ where: { name: itemName } })
    if (!item) return interaction.reply('Cet article n\'existe pas.')

    const user = await Users.findOrCreate({ where: { user_id: interaction.user.id }, defaults: { balance: 0 } })
    if (user[0].balance < item.cost) return interaction.reply(`Vous n'avez pas assez de Ryo.`)

    user[0].balance -= item.cost
    await user[0].save()
    await user[0].addItem(item)

    return interaction.reply(`Vous avez acheté : ${item.name}`)
  }
}
