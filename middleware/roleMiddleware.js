// roleMiddleware.js — Middleware de vérification des rôles
// Utilisé après verifyEmployeToken pour restreindre l'accès selon le rôle
// Par exemple, certaines routes sont réservées aux admins, d'autres aux vendeurs aussi

// Fonction qui retourne un middleware vérifiant que l'employé a le bon rôle
// J'utilise le rest operator (...roles) pour pouvoir passer plusieurs rôles autorisés
const requireRole = (...roles) => {
  return (req, res, next) => {
    // req.employe est défini par le middleware verifyEmployeToken
    if (!req.employe) {
      return res.status(403).json({
        message: "Accès refusé : authentification employé requise",
      });
    }

    // On vérifie que le rôle de l'employé fait partie des rôles autorisés
    if (!roles.includes(req.employe.role)) {
      return res.status(403).json({
        message: "Accès refusé : droits insuffisants",
      });
    }

    next();
  };
};

// Raccourci : uniquement admin
const requireAdmin = requireRole("admin");

// Raccourci : admin ou vendeur
const requireVendeur = requireRole("admin", "vendeur");

module.exports = { requireRole, requireAdmin, requireVendeur };
