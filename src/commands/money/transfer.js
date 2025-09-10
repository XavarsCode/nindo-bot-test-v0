const { SlashCommandBuilder } = require('discord.js')
const { Users } = require('../../../dbObjects.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transférer des 💰 à un autre utilisateur')
    .addUserOption(option =>
      option.setName('user')
            .setDescription('Utilisateur destinataire')
            .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
            .setDescription('Montant à transférer')
            .setRequired(true)
    ),
  async execute(interaction) {
    const transferTarget = interaction.options.getUser('user')
    const transferAmount = interaction.options.getInteger('amount')

    const sender = await Users.findOne({ where: { user_id: interaction.user.id } })
    if (!sender || sender.balance < transferAmount) 
      return interaction.reply(`Vous n'avez pas assez de Ryo.`)
    if (transferAmount <= 0) return interaction.reply('Montant invalide.')

    const receiver = await Users.findOrCreate({ where: { user_id: transferTarget.id }, defaults: { balance: 0 } })
    
    sender.balance -= transferAmount
    await sender.save()

    receiver[0].balance += transferAmount
    await receiver[0].save()

    return interaction.reply(`Vous avez transféré ${transferAmount}Ryo à ${transferTarget.tag}.`)
  }
}
