// EmployeRouter.js — Routes pour les employés
// chemin de base : /api/employes
// La connexion est publique, le reste est protégé
// Le CRUD des employés est réservé aux admins uniquement

const express = require("express");
const {
  login,
  getProfile,
  changePassword,
  getAll,
  create,
  update,
  remove,
} = require("../controllers/EmployeController");
const { verifyEmployeToken } = require("../../middleware/authMiddleware");
const { requireAdmin, requireVendeur } = require("../../middleware/roleMiddleware");
const router = express.Router();

// Connexion employé (page login du dashboard)
router.post("/login", login);

// === Routes protégées (employé connecté) ===

// Consulter mon profil
router.get("/profile", verifyEmployeToken, requireVendeur, getProfile);

// Changer mon mot de passe
router.put("/password", verifyEmployeToken, requireVendeur, changePassword);

// === Routes admin uniquement ===

// Lister tous les employés
router.get("/", verifyEmployeToken, requireAdmin, getAll);

// Créer un employé
router.post("/", verifyEmployeToken, requireAdmin, create);

// Modifier un employé
router.put("/:id", verifyEmployeToken, requireAdmin, update);

// Supprimer un employé
router.delete("/:id", verifyEmployeToken, requireAdmin, remove);

module.exports = router;
