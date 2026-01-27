const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Permet de charger les variables d'env depuis.env
require("dotenv").config();

// Connexion a la bdd
const db = require("./db");

// Importation des routes

// ... à venir

// Création de l'application Express
const app = express();

// Middleware
// Parser le Json
app.use(express.json());

// Logger de requête http dans la console
app.use(morgan("dev"));

// Permet les requêtes cross-origin (qui viennent du front)
// CORS = cross-Origin ressource sharing
// OBLIGATOIRE sinon le navigateur bloque les requêtes

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// Routes

// Routes de test pour vérfier que l' api fonctionne
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API fonctionnelle",
  });
});

//Routes de l'API
// ... à venir

// GESTION DES ERREURS
// Routes 404
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route non trouvée",
  });
});

// Démarrage serveur
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, host, () => {
  console.log(`Serveur démarré sur http://${host}:${port}`);
});
