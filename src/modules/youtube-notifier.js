const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();

async function checkYouTube(client) {
    if (!fs.existsSync('./yt-config.json')) return;
    const config = JSON.parse(fs.readFileSync('./yt-config.json', 'utf8'));

    for (const guildId in config) {
        const { chaine, salon } = config[guildId];
        const channelId = chaine.split('channel/')[1]; // récup l'ID après /channel/
        const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);

        const lastVideo = feed.items[0]; // la dernière vidéo
        const dbPath = `./yt-last-${guildId}.json`;
        let lastId = null;

        if (fs.existsSync(dbPath)) {
            lastId = JSON.parse(fs.readFileSync(dbPath, 'utf8')).videoId;
        }

        if (lastVideo.id !== lastId) {
            const discordChannel = client.channels.cache.get(salon);
            if (discordChannel) {
                discordChannel.send({
                    embeds: [{
                        title: lastVideo.title,
                        url: lastVideo.link,
                        description: `Nouvelle vidéo ! 🎥`,
                        color: 0xff0000,
                        timestamp: new Date(lastVideo.pubDate)
                    }]
                });
            }
            fs.writeFileSync(dbPath, JSON.stringify({ videoId: lastVideo.id }));
        }
    }
}

// lancer la vérif toutes les 2 minutes
setInterval(() => {
    checkYouTube(client);
}, 120000);
