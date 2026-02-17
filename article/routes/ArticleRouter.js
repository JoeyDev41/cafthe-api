// ArticleRouter.js — Routes pour les articles
// chemin de base : /api/articles
// Les routes GET sont publiques (tout le monde peut voir les produits)
// Les routes POST/PUT/DELETE sont protégées (réservées aux employés vendeur/admin)

const express = require("express");
const {
  getAll,
  getById,
  getByCategory,
  search,
  create,
  update,
  remove,
} = require("../controllers/ArticleController");
const { verifyEmployeToken } = require("../../middleware/authMiddleware");
const { requireVendeur } = require("../../middleware/roleMiddleware");
const router = express.Router();

// === Routes publiques (e-commerce) ===

// Recherche avec filtres : /api/articles/search?search=&categorie=&prixMin=&prixMax=&tri=&ordre=&page=&limite=
// Important : cette route doit être AVANT /:id sinon "search" serait interprété comme un id
router.get("/search", search);

// Récupérer tous les articles
router.get("/", getAll);

// Récupérer les articles d'une catégorie
router.get("/categorie/:categorie", getByCategory);

// Récupérer un article par son ID
router.get("/:id", getById);

// === Routes protégées (dashboard vendeur/admin) ===
// Les middlewares vérifient le token employé puis le rôle

// Créer un article
router.post("/", verifyEmployeToken, requireVendeur, create);

// Modifier un article
router.put("/:id", verifyEmployeToken, requireVendeur, update);

// Supprimer un article
router.delete("/:id", verifyEmployeToken, requireVendeur, remove);

module.exports = router;
