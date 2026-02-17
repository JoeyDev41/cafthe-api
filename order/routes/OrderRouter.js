// OrderRouter.js — Routes pour les commandes
// chemin de base : /api/orders
// Le client peut créer une commande et voir les siennes
// Les vendeurs/admins peuvent tout voir et changer les statuts

const express = require("express");
const {
  create,
  createInStore,
  getAll,
  getById,
  getMyOrders,
  updateStatus,
} = require("../controllers/OrderController");
const { verifyToken, verifyEmployeToken } = require("../../middleware/authMiddleware");
const { requireVendeur } = require("../../middleware/roleMiddleware");
const router = express.Router();

// === Routes client (e-commerce) ===

// Créer une commande en ligne
router.post("/", verifyToken, create);

// Récupérer mes commandes (page "Mon espace > Commandes")
router.get("/my", verifyToken, getMyOrders);

// === Routes dashboard (vendeur/admin) ===

// Enregistrer une vente en magasin
router.post("/in-store", verifyEmployeToken, requireVendeur, createInStore);

// Récupérer toutes les commandes (avec filtres optionnels : ?statut=&mode=&dateDebut=&dateFin=)
router.get("/", verifyEmployeToken, requireVendeur, getAll);

// Récupérer une commande par ID (avec ses articles)
router.get("/:id", verifyEmployeToken, requireVendeur, getById);

// Mettre à jour le statut d'une commande
router.put("/:id/status", verifyEmployeToken, requireVendeur, updateStatus);

module.exports = router;
