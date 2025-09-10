const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YtDlpPlugin } = require('@distube/yt-dlp');

let distube;

module.exports = {
    init(client) {
        if (distube) return;

        distube = new DisTube(client, {
            emitNewSongOnly: true,
            emitAddSongWhenCreatingQueue: true,
            plugins: [
                new SpotifyPlugin(),
                new YtDlpPlugin()
            ]
        });

        // Events musique
        distube
            .on('playSong', (queue, song) => {
                queue.textChannel?.send(`🎶 Lecture : **${song.name}** - ${song.formattedDuration}`);
            })
            .on('addSong', (queue, song) => {
                queue.textChannel?.send(`✅ Ajoutée à la file : **${song.name}**`);
            })
            .on('error', (channel, err) => {
                const textChannel = channel?.textChannel || channel;
                if (textChannel && typeof textChannel.send === 'function') {
                    textChannel.send(`⚠️ Erreur : ${err.message || err}`);
                }
                console.error(err);
            })
            .on('disconnect', queue => {
                queue.textChannel?.send("💨 Déconnecté du salon vocal.");
            })
            .on('finish', queue => {
                queue.textChannel?.send("✅ Playlist terminée !");
            })
            .on('stop', queue => {
                queue.textChannel?.send("⏹️ Musique arrêtée.");
            });

        console.log('[MUSIC] Distube initialisé ✅');
    },

    getDistube() {
        return distube;
    }
};
