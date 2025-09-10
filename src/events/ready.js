const { ActivityType } = require('discord.js');
const { loadBalances } = require('../../utils/currency.js');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        await loadBalances();
        console.log(`Prêt ! Connecté en tant que ${client.user.tag}`);

        const activities = [
            { name: 'les Ryo qui défilent', type: ActivityType.Watching },
            { name: 'Nindo sur YouTube', type: ActivityType.Streaming, url: 'https://www.youtube.com/channel/UCYIWj0QIvVNVZbfN1FduVUg' },
            { name: 'ses DM', type: ActivityType.Watching },
            { name: 'la v0', type: ActivityType.Playing },
            { name: '/fiche create pour créer votre fiche RP', type: ActivityType.Playing }
        ];

        let i = 0;
        setInterval(() => {
            const activity = activities[i];
            client.user.setActivity(activity.name, { type: activity.type, url: activity.url });
            i = (i + 1) % activities.length;
        }, 15000);
    }
};
