const { Users } = require('../dbObjects.js');
const currency = new Map();

async function addBalance(id, amount) {
    const user = currency.get(id);
    if (user) {
        user.balance += Number(amount);
        return user.save();
    }
    const newUser = await Users.create({ user_id: id, balance: amount });
    currency.set(id, newUser);
    return newUser;
}

function getBalance(id) {
    const user = currency.get(id);
    return user ? user.balance : 0;
}

async function loadBalances() {
    const storedBalances = await Users.findAll();
    storedBalances.forEach(b => currency.set(b.user_id, b));
}

module.exports = { addBalance, getBalance, loadBalances, currency };
