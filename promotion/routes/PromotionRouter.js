// PromotionRouter.js — Routes pour les promotions
// chemin de base : /api/promotions
// Ces routes sont publiques (pas besoin d'être connecté pour voir les promos)

const express = require("express");
const { getActive, getArticlesEnPromo } = require("../controllers/PromotionController");
const router = express.Router();

// Récupérer les promotions actives (page d'accueil)
router.get("/active", getActive);

// Récupérer les articles en promo avec leur réduction (utilisé par le PromotionContext du front)
router.get("/articles", getArticlesEnPromo);

module.exports = router;
