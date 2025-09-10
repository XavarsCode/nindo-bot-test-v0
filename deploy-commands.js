const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { clientId, guildId } = require('./config.json');

const token = process.env.DISCORD_TOKEN;

const commandes = [];
const nomsCommandes = new Map(); // Pour détecter les doublons

// Fonction récursive pour parcourir un dossier et ses sous-dossiers
function chargerCommandes(dossier) {
    if (!fs.existsSync(dossier)) return;

    const fichiers = fs.readdirSync(dossier);
    for (const fichier of fichiers) {
        const chemin = path.join(dossier, fichier);
        if (fs.statSync(chemin).isDirectory()) {
            chargerCommandes(chemin); // appel récursif
        } else if (fichier.endsWith('.js')) {
            const commande = require(chemin);
            if ('data' in commande && 'execute' in commande) {
                const nom = commande.data.name.toLowerCase();
                if (nomsCommandes.has(nom)) {
                    console.log(`❌ Doublon détecté : la commande "${nom}" est définie dans ${chemin} et ${nomsCommandes.get(nom)}`);
                } else {
                    commandes.push(commande.data.toJSON());
                    nomsCommandes.set(nom, chemin);
                }
            } else {
                console.log(`[AVERTISSEMENT] La commande dans ${chemin} n’a pas de propriété "data" ou "execute".`);
            }
        }
    }
}

// Parcourir les dossiers principaux
const dossiersPrincipaux = [
    path.join(__dirname, 'src/commands'),
    path.join(__dirname, 'src/tickets/commands')
];

for (const dossier of dossiersPrincipaux) {
    chargerCommandes(dossier);
}

// Déploiement des commandes
const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Début du rechargement de ${commandes.length} commande(s) d’application (/).`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commandes },
        );

        console.log(`Rechargement réussi de ${data.length} commande(s) d’application (/).`);
    } catch (erreur) {
        console.error(erreur);
    }
})();
