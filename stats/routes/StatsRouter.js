// StatsRouter.js — Routes pour les statistiques du dashboard
// chemin de base : /api/stats
// Toutes les routes sont protégées : il faut être vendeur ou admin

const express = require("express");
const {
  getRevenue,
  getTopProducts,
  getSalesByCategory,
  getClientStats,
  getDashboard,
} = require("../controllers/StatsController");
const { verifyEmployeToken } = require("../../middleware/authMiddleware");
const { requireVendeur } = require("../../middleware/roleMiddleware");
const router = express.Router();

// Résumé complet du dashboard (CA jour/mois, commandes en attente, stock, etc.)
router.get("/dashboard", verifyEmployeToken, requireVendeur, getDashboard);

// Chiffre d'affaires par période (?periode=jour|semaine|mois|annee)
router.get("/revenue", verifyEmployeToken, requireVendeur, getRevenue);

// Top 10 des produits les plus vendus
router.get("/top-products", verifyEmployeToken, requireVendeur, getTopProducts);

// Répartition des ventes par catégorie
router.get("/categories", verifyEmployeToken, requireVendeur, getSalesByCategory);

// Statistiques clients (total + évolution mensuelle)
router.get("/clients", verifyEmployeToken, requireVendeur, getClientStats);

module.exports = router;
