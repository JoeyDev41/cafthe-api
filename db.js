// db.js — Configuration de la connexion à MySQL
// J'utilise mysql2/promise pour pouvoir faire des requêtes avec async/await
// Un pool de connexions permet de réutiliser les connexions au lieu d'en créer une à chaque requête

const mysql = require("mysql2/promise");
require("dotenv").config();

// Création du pool de connexions MySQL
// Le pool gère automatiquement les connexions : il en crée, les réutilise et les libère
const db = mysql.createPool({
  // Paramètres de connexion depuis le fichier .env
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Si toutes les connexions sont occupées, les nouvelles requêtes attendent
  waitForConnections: true,
  // Maximum 10 connexions en parallèle
  connectionLimit: 10,

  // Keep-alive pour éviter que les connexions soient coupées par timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Timeout de connexion en millisecondes (10 secondes)
  connectTimeout: 10000,
});

// Test de connexion au démarrage de l'application
// Si ça échoue, on arrête le serveur (pas la peine de tourner sans BDD)
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connecté à la base de données MySQL");
    // On libère la connexion tout de suite, c'était juste un test
    connection.release();
  } catch (err) {
    console.error("Erreur de connexion MySQL :", err.message);
    // Code 1 = erreur, le serveur s'arrête
    process.exit(1);
  }
})();

module.exports = db;
