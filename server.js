// server.js — Point d'entrée de mon API Express
// C'est ici que je configure tout : les middlewares, les routes, et je lance le serveur
// J'utilise Express 5, cors pour les requêtes cross-origin, morgan pour les logs

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser")

// dotenv me permet de lire les variables d'environnement depuis le fichier .env
require("dotenv").config();

// Connexion au pool MySQL (voir db.js)
const db = require("./db");

// === Importation de tous mes routeurs ===
const articleRoutes = require("./article/routes/ArticleRouter");
const clientRoutes = require("./client/routes/ClientRouter");
const orderRoutes = require("./order/routes/OrderRouter");
const employeRoutes = require("./employe/routes/EmployeRouter");
const statsRoutes = require("./stats/routes/StatsRouter");
const promotionRoutes = require("./promotion/routes/PromotionRouter");

// Création de l'application Express
const app = express();

// === MIDDLEWARES ===

// express.json() permet de parser le body des requêtes en JSON
app.use(express.json());

// morgan("dev") affiche les requêtes HTTP dans la console (pratique pour débugger)
app.use(morgan("dev"));

// Sert les fichiers statiques (images des produits dans le dossier public/)
app.use(express.static("public"));

// CORS = Cross-Origin Resource Sharing
// Obligatoire sinon le navigateur bloque les requêtes du front (port 5173)
// vers l'API (port 3000) car ce n'est pas la même origine
// credentials: true permet d'envoyer les cookies (pour le JWT HttpOnly)
app.options('*', cors()); // ✅ répond aux preflight OPTIONS (Plesk/Nginx)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cafthefront.jferreira.dev-campus.fr" 
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }),
);

// cookieParser permet de lire les cookies dans req.cookies
 app.use(cookieParser());

// === ROUTES ===

// Route de test pour vérifier que l'API tourne bien
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API fonctionnelle",
  });
});

// Je branche chaque routeur sur son chemin de base
app.use("/api/articles", articleRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/employes", employeRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/promotions", promotionRoutes);

// === GESTION DES ERREURS ===

// Si aucune route ne correspond, je renvoie une 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route non trouvée",
  });
});

// === DÉMARRAGE DU SERVEUR ===
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, host, () => {
  console.log(`Serveur démarré sur http://${host}:${port}`);
});
