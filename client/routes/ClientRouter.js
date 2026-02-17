// ClientRouter.js — Routes pour les clients
// chemin de base : /api/clients
// Routes publiques : inscription et connexion
// Routes protégées (token client) : profil, adresses, mot de passe
// Routes dashboard (token employé) : liste et détail des clients

const express = require("express");
const router = express.Router();
const {register, login, getMe, logout, deleteAccount} = require("../controllers/ClientControllers");

const {
  getProfile,
  updateProfile,
  changePassword,
  getAll,
  getClientById,
} = require("../controllers/ClientControllers");
const { verifyToken, verifyEmployeToken } = require("../../middleware/authMiddleware");
const { requireVendeur } = require("../../middleware/roleMiddleware");

// Vérification de session (le front appelle cette route au chargement pour savoir si le client est connecté)
router.get("/me", verifyToken, getMe)

// Déconnexion (supprime le cookie token)
router.post("/logout", logout)

// === Routes publiques ===

// Inscription d'un nouveau client
router.post("/register", register);

// Connexion client
router.post("/login", login);

// Suppression de compte (anonymisation RGPD)
router.delete("/account", verifyToken, deleteAccount);

// === Routes client connecté (protégées par verifyToken) ===

// Consulter mon profil
router.get("/profile", verifyToken, getProfile);

// Modifier mon profil (nom, prénom, téléphone, adresses)
router.put("/profile", verifyToken, updateProfile);

// Changer mon mot de passe
router.put("/password", verifyToken, changePassword);

// === Routes dashboard (réservées aux vendeurs/admins) ===

// Liste des clients (avec recherche optionnelle via ?search=)
router.get("/", verifyEmployeToken, requireVendeur, getAll);

// Détail d'un client par ID
router.get("/:id", verifyEmployeToken, requireVendeur, getClientById);

module.exports = router;
