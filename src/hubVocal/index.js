// src/hubVocal/index.js
const panel = require("./panel");
const handler = require("./interactionHandler");
const voiceHub = require("./voiceHub"); // <-- Ajoute cette ligne

module.exports = (client, options = {}) => {
  // options.categoryId => ID de la catégorie où créer les vocaux
  // options.dataPath => chemin du fichier de données (optionnel)
  const cfg = {
    categoryId: options.categoryId || "1411471398513414287", // <-- remplace ici si tu veux
    dataPath: options.dataPath || require("path").join(__dirname, "data.json"),
  };

  // Initialisation panel et handler
  panel(client, cfg);
  handler(client, cfg);
  voiceHub(client, cfg); // <-- Appelle le nouveau module
  // Export de la config (utile pour debug)
  client.hubVocalConfig = cfg;
};
