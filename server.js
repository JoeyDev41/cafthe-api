const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Permet de charger les variables d'env depuis .env
require("dotenv").config();

// Connexion à la bdd (bases de données)
const db = require("./db");

// === Importation des routes ===
const articleRoutes = require("./article/routes/ArticleRouter");

// Création de l'application Express
const app = express();

// MIDDLEWARES
// Parser les JSON
app.use(express.json());

// Logger de requêtes HTTP dans la console
app.use(morgan("dev"));

// Permet les requêtes cross-origin (qui viennent du front)
// CORS = Cross-Origin Ressource Sharing
// OBLIGATOIRE sinon le navigateur bloque les requêtes

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// ROUTES

// Route de test pour vérifier que l'api fonctionne
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API fonctionnelle",
  });
});

// Routes de l'API
app.use("/api/articles", articleRoutes);

// GESTIONS DES ERREURS
// Routes 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route non trouvée",
  });
});

// DÉMARRAGE DU SERVEUR
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, host, () => {
  console.log(`Serveur démarré sur http://${host}:${port}`);
});
