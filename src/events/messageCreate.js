const { addBalance } = require('../../utils/currency.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (!message.author.bot) addBalance(message.author.id, 1);
    }
};
