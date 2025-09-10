const { SlashCommandBuilder, codeBlock } = require('discord.js')
const { CurrencyShop } = require('../../../dbObjects.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Afficher tous les articles disponibles'),
  async execute(interaction) {
    const items = await CurrencyShop.findAll()
    if (!items.length) return interaction.reply('La boutique est vide.')

    return interaction.reply(codeBlock(items.map(i => `${i.name}: ${i.cost}Ryo`).join('\n')))
  }
}
